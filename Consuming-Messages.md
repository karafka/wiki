Consumers should inherit from the **ApplicationConsumer**. You need to define a ```#consume``` method that will execute your business logic code against a batch of messages.

Karafka fetches and consumes messages in batches by default.

## Consuming Messages

Karafka framework has a long-running server process responsible for fetching and consuming messages.

To start the Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

### In Batches

Data fetched from Kafka is accessible using the `#messages` method. The returned object is an enumerable containing received data and additional information that can be useful during the processing.

To access the payload of your messages, you can use the `#payload` method available for each received message:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    # Print all the payloads one after another
    messages.each do |message|
      puts message.payload
    end
  end
end
```

You can also access all the payloads together to elevate things like batch DB operations available for some of the ORMs:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    # Insert all the events at once with a single query
    Event.insert_all messages.payloads
  end
end
```

### One At a Time

While we encourage you to process data in batches to elevate in-memory computation and many DBs batch APIs, you may want to process messages one at a time.

You can achieve this by defining a base consumer with such a capability:

```ruby
class SingleMessageBaseConsumer < Karafka::BaseConsumer
  attr_reader :message

  def consume
    messages.each do |message|
      @message = message
      consume_one
    
      mark_as_consumed(message)
    end
  end
end

class Consumer < SingleMessageBaseConsumer
  def consume_one
    puts "I received following message: #{message.payload}"
  end
end
```

### Accessing Topic Details

If, in any case, your logic is dependent on some routing details, you can access them from the consumer using the ```#topic``` method. You could use it, for example, in case you want to perform a different logic within a single consumer based on the topic from which your messages come:

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    send(:"topic_#{topic.name}")
  end

  def topic_a
    # do something
  end

  def topic_b
    # do something else if it's a "b" topic
  end
end
```

If you're interested in all the details that are stored in the topic, you can extract all of them at once, by using the ```#to_h``` method:

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    puts topic.to_h #=> { name: 'x', ... }
  end
end
```

## Consuming From Earliest or Latest Offset

Karafka, by default, will start consuming messages from the earliest it can reach. You can, however configure it to start consuming from the latest message by setting the `initial_offset` value:


```ruby
# This will start from the earliest (default)
class KarafkaApp < Karafka::App
  setup do |config|
    config.initial_offset = 'earliest'
  end
end

# This will make Karafka start consuming from the latest message on a given topic
class KarafkaApp < Karafka::App
  setup do |config|
    config.initial_offset = 'latest'
  end
end
```

!!! note ""

    This setting applies only to the first execution of a Karafka process. All following executions will pick up from the last offset where the process ended previously.

## Detecting Revocation Midway

When working with a distributed system like Kafka, partitions of a topic can be distributed among different consumers in a consumer group for processing. However, there might be cases where a partition needs to be taken away from a consumer and reassigned to another consumer. This is referred to as a partition revocation.

Partition revocation can be voluntary, where the consumer willingly gives up the partition after it is done processing the current batch, or it can be involuntary. An involuntary partition revocation is typically due to a rebalance triggered by consumer group changes or a failure in the consumer, which causes it to become unresponsive. It is important to remember that involuntary revocations can occur during data processing. You may not want to continue processing messages when you know the partition has been taken away. This is where the `#revoked?` method is beneficial.

By monitoring the status of the `#revoked?` method, your application can detect that your process no longer owns a partition you are operating on. In such scenarios, you can choose to stop any ongoing, expensive processing. This can help you save resources and limit the number of potential reprocessings.

```ruby
def consume
  messages.each do |message|
    Message.create!(message)

    mark_as_consumed(message)

    return if revoked?
  end
end
```

It is worth, however, keeping in mind that under normal operating conditions, Karafka will complete all ongoing processing before a rebalance occurs. This includes finishing the processing of all messages already fetched. Karafka has built-in mechanisms to handle voluntary partition revocations and rebalances, ensuring that no messages are lost or unprocessed during such events. Hence `#revoked?` is especially useful for involuntary revocations.

In most cases, especially if you do not use [Long-Running Jobs](Pro-Long-Running-Jobs), the Karafka default [offset management](Offset-management) strategy should be more than enough. It ensures that after batch processing as well as upon rebalances, before partition reassignment, all the offsets are committed. In a healthy system with stable deployment procedures and without frequent short-lived consumer generations, the number of re-processings should be close to zero.

!!! note ""

    You do **not** need to mark the message as consumed for the `#revoked?` method result to change.

!!! note ""

    When using the [Long-Running Jobs](Pro-Long-Running-Jobs) feature, `#revoked?` result also changes independently from marking messages.

## Consumer Persistence

Karafka consumer instances are persistent by default. This means that a single consumer instance will "live" as long as a given process instance consumes a given topic partition. This means you can elevate in-memory processing and buffering to achieve better performance.

Karafka consumer instance for a given topic partition will be re-created in case a given partition is lost and re-assigned.

!!! note ""

    If you decide to utilize such techniques, you may be better with manual offset management.


```ruby
# A consumer that will buffer messages in memory until it reaches 1000 of them. Then it will flush
# and commit the offset.
class EventsConsumer < ApplicationConsumer
  # Flush every 1000 messages
  MAX_BUFFER_SIZE = 1_000

  def initialize
    @buffer = []
  end

  def consume
    # Print all the payloads one after another
    @buffer += messages.payloads

    return if @buffer.size < MAX_BUFFER_SIZE

    flush
  end

  private

  def flush
    Event.insert_all @buffer

    mark_as_consumed @buffer.last

    @buffer.clear!
  end
end
```

## Shutdown and Partition Revocation Handlers

Karafka consumer, aside from the `#consume` method, allows you to define two additional methods that you can use to free any resources that you may be using upon certain events. Those are:

- `#revoked` - will be executed when there is a rebalance resulting in the given partition being revoked from the current process.
- `#shutdown` - will be executed when the Karafka process is being shutdown.

```ruby
class LogsConsumer < ApplicationConsumer
  def initialize
    @log = File.open('log.txt', 'a')
  end

  def consume
    messages.each do |message|
      @log << message.raw_payload
    end
  end

  def shutdown
    @log.close
  end

  def revoked
    @log.close
  end
end
```

Please note that when using `#shutdown` with the filtering API or [Delayed Topics](Pro-Delayed-Topics), there are scenarios where `#shutdown` and `#revoked` may be invoked without prior `#consume` running and the `#messages` batch may be empty.

## `enable.partition.eof` Early Yield

In typical Karafka consumption scenarios, when a consumer reaches the end of a partition, it might still wait for new messages to arrive. This behavior is governed by settings such as `max_wait_time` or `max_messages`, which dictate how long a consumer should wait for new data before timing out or moving on. While this can benefit continuous data streams, it may introduce unnecessary latency in scenarios where real-time data processing and responsiveness are critical.

The `enable.partition.eof` configuration option changes how Karafka responds when the end of a partition is reached during message consumption. By default, when Karafka encounters the end of a partition, it waits for more messages until either `max_wait_time` or `max_messages` limits are reached. However, if `enable.partition.eof` is set for a subscription group to `true`, Karafka will immediately delegate already accumulated messages (if any) for processing, even if neither `max_wait_time` nor `max_messages` has been reached.

### Benefits of Early Yield

- **Reduced Latency**: Immediate message yielding upon reaching the end of a partition can significantly reduce latency. This is particularly beneficial in environments where data must be processed and acted upon quickly.

- **Increased Responsiveness**: Systems that require high responsiveness will benefit from not having to wait for the timeout conditions (`max_wait_time` or `max_messages`) to be met, allowing subsequent processing steps to commence without delay.

- **Efficient Resource Utilization**: By avoiding unnecessary waiting times, system resources can be better utilized for processing rather than idling, potentially leading to cost optimizations and improved throughput.

### Downsides of Early Yield

- **Potential for Increased CPU Usage**: In highly active systems where new messages are frequently published, constantly checking for the end of partition could lead to increased CPU utilization. This is because the system needs to manage and check state transitions more frequently.

- **Complexity in Batch Processing**: For applications that are optimized for batch processing, this setting might disrupt the batching logic, as messages could be processed in smaller batches, potentially leading to inefficiencies.

### Configuring `enable.partition.eof`

The `enable.partition.eof` is one of the `kafka` scoped options and can be set for all subscription groups or on a per-subscription group basis, depending on your use case.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_application'

    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'enable.partition.eof': true
    }
  end

  # You can also do it per topics in a subscription group
  routes.draw do
    subscription_group :fast do
      topic 'events' do
        consumer EventsConsumer
        kafka(
          'bootstrap.servers': '127.0.0.1:9092',
          'enable.partition.eof': true
        )
      end
    end
  end
end
```

This configuration ensures that as soon as the end of a partition is reached, any accumulated messages are immediately processed, enhancing the system's responsiveness and efficiency.

## Inline API Based Consumption

Karafka Pro provides the [Iterator API](Pro-Iterator-API) that allows you to subscribe to topics and to perform lookups from Rake tasks, custom scripts, Rails console, or any other Ruby processes.

```ruby
# Note: you still need to configure your settings using `karafka.rb`

# Select all the events of user with id 5 from last 10 000 messages of
# each partition of the topic `users_events`

user_5_events = []

iterator = ::Karafka::Pro::Iterator.new(
  { 'users_events' => -1000 }
)

iterator.each do |message|
  # Cast to integer because headers are always string
  next unless message.headers['user-id'].to_i == 5

  user_5_events << message
end

puts "There were #{user_5_events.count} messages"
```

You can read more about it [here](Pro-Iterator-API).

## Avoiding Unintentional Overwriting of the Consumer Instance Variables

When working with Karafka consumers, it is crucial to be aware of and avoid unintentionally overwriting certain instance variables used by the consumer instances. Overwriting these variables can lead to critical processing errors and result in issues such as `worker.process.error` visible in the web UI. Below are the primary instance variables used in consumers that you need to be cautious about:

- `@id`: Represents the ID of the current consumer.
- `@messages`: Stores the messages for the topic to which a given consumer is subscribed.
- `@client`: Refers to the Kafka connection client.
- `@coordinator`: Handles coordination of message processing.
- `@producer`: Holds the instance of the producer.

Accidentally overwriting any of these instance variables can disrupt the normal functioning of the consumer, leading to:

- Inability to correctly process or retrieve messages.
- Loss of connection to the Kafka server.
- Failure in coordinating message processing.
- Inability to produce messages properly.

Such disruptions often manifest as "worker.process.error" in the web UI, indicating critical processing failures.
