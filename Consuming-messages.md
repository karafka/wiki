Consumers should inherit from the **ApplicationConsumer**. You need to define a ```#consume``` method that will execute your business logic code against a batch of messages.

Karafka fetches and consumes messages in batches by default.

## Consuming messages

Karafka framework has a long-running server process responsible for fetching and consuming messages.

To start the Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

### In batches

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

### One at a time

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

### Accessing topic details

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

## Consuming from earliest or latest offset

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

**Note**: This setting applies only to the first execution of a Karafka process. All following executions will pick up from the last offset where the process ended previously.


## Detecting revocation midway

Karafka will invoke a consumer method called `#revoked` (if defined) each time a partition is revoked. It may happen, though, that the revocation occurs during the processing.

Both `#mark_as_consumed` and `#mark_as_consumed!` return a boolean result that indicates whether the given topic partition is still owned by the consumer and set its revocation state. You can use this result to terminate processing early midway.

Once you mark the message as consumed, you can also use the `#revoked?` to check the revocation state.

```ruby
def consume
  messages.each do |message|
    Message.create!(message)

    mark_as_consumed(message)

    return if revoked?
  end
end
```

**Note**: You need to mark the message as consumed for the `#revoked?` method result to change.

**Note**: When using the [Long-Running Jobs](Pro-Long-Running-Jobs) feature, `#revoked?` result changes independently from marking messages.

## Consumer persistence

Karafka consumer instances are persistent by default. This means that a single consumer instance will "live" as long as a given process instance consumes a given topic partition. This means you can elevate in-memory processing and buffering to achieve better performance.

Karafka consumer instance for a given topic partition will be re-created in case a given partition is lost and re-assigned.

**Note**: if you decide to utilize such techniques, you may be better with manual offset management.


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

## Shutdown and partition revocation handlers

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
