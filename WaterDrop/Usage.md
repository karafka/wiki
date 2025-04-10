# WaterDrop Usage

To send Kafka messages, just create a producer and use it:

```ruby
producer = WaterDrop::Producer.new

producer.setup do |config|
  config.kafka = { 'bootstrap.servers': 'localhost:9092' }
end

producer.produce_sync(topic: 'my-topic', payload: 'my message')

# or for async
producer.produce_async(topic: 'my-topic', payload: 'my message')

# or in batches
producer.produce_many_sync(
  [
    { topic: 'my-topic', payload: 'my message'},
    { topic: 'my-topic', payload: 'my message'}
  ]
)

# both sync and async
producer.produce_many_async(
  [
    { topic: 'my-topic', payload: 'my message'},
    { topic: 'my-topic', payload: 'my message'}
  ]
)

# Don't forget to close the producer once you're done to flush the internal buffers, etc
producer.close
```

Each message that you want to publish, will have its value checked.

Here are all the things you can provide in the message hash:

| Option          | Required | Value type    | Description                                              |
|-----------------|----------|---------------|----------------------------------------------------------|
| `topic`         | true     | String        | The Kafka topic that should be written to                |
| `payload`       | true     | String        | Data you want to send to Kafka                           |
| `key`           | false    | String        | The key that should be set in the Kafka message          |
| `partition`     | false    | Integer       | A specific partition number that should be written to    |
| `partition_key` | false    | String        | Key to indicate the destination partition of the message |
| `timestamp`     | false    | Time, Integer | The timestamp that should be set on the message          |
| `headers`       | false    | Hash          | Headers for the message                                  |
| `label`         | false    | Object        | Anything you want to use as a label                      |

Keep in mind, that message you want to send should be either binary or stringified (to_s, to_json, etc).

## Delivery Results

When dispatching messages using WaterDrop, you can choose between receiving a delivery report or a delivery handle, depending on whether you perform synchronous or asynchronous dispatches.

### Delivery Reports

For synchronous dispatches, WaterDrop returns a delivery report, which provides immediate feedback about the message delivery status. When you use synchronous dispatch, the execution of your program will wait until the Kafka broker has acknowledged the message.

```ruby
report = producer.produce_sync(topic: 'my_topic', payload: 'my_payload')

puts "This sent message has an offset #{report.offset} on partition #{report.partition}"
puts "This sent message was sent to #{report.topic_name} topic"
```

### Delivery Handles

In contrast, WaterDrop returns a delivery handle for asynchronous dispatches. When you dispatch messages asynchronously, WaterDrop will send the message without blocking your program's execution, allowing you to continue processing other tasks while the message is being sent. The key feature of the delivery handle is its `#wait` method. The `#wait` method allows you to pause your program's execution until the message is either successfully dispatched or an error occurs during delivery.

```ruby
handle = producer.produce_async(
  topic: 'my_topic',
  payload: 'my_payload',
  label: 'unique-id'
)

report = handle.wait

puts "This sent message has an offset #{report.offset} on partition #{report.partition}"
puts "This sent message was sent to #{report.topic_name} topic"
puts "This sent message had a following label: #{report.label}"
```

If an error does occur during delivery, the `#wait` method will raise an appropriate error with detailed information about the failure, allowing you to handle errors in your application logic.

However, there might be scenarios where you want to wait for the message to be delivered but do not want to raise an exception if an error occurs. In such cases, the `#wait` method also accepts a `raise_response_error` flag that you can set to `false`.

```ruby
handle = producer.produce_async(topic: 'my_topic', payload: 'my_payload')
report = handle.wait(raise_response_error: false)

if report.error
  puts "Following issue occurred #{report.error}"
else
  puts "This sent message has an offset #{report.offset} on partition #{report.partition}"
  puts "This sent message was sent to #{report.topic_name} topic"
end
```

- If `raise_response_error` is set to `true` (the default behavior), the `#wait` method will raise an exception if there is a delivery error.

- If `raise_response_error` is set to false, the `#wait` method will still wait for the delivery but will not raise an exception upon failure. Instead, it will return the appropriate error along with failure details, allowing you to handle the error as needed without interrupting the program's flow or will return the delivery report upon successful delivery.

This flexibility in handling delivery reports and delivery handles in both synchronous and asynchronous scenarios makes WaterDrop a powerful choice for managing Kafka message production while accommodating different use cases and error-handling strategies.

## Labeling

Labeling refers to categorizing and tagging messages before sending them to Kafka. This can help instrument and debug messages more quickly. For a comprehensive guide on implementing and utilizing labeling, please visit [this](https://karafka.io/docs/WaterDrop-Labeling) dedicated wiki page.

## Error Handling

WaterDrop's error handling is a complex feature with its dedicated documentation. Please visit the [Error Handling](WaterDrop-Error-Handling) documentation page for detailed information and guidance.

## Transactions

Transactions in WaterDrop have a dedicated documentation page to provide in-depth information and guidelines. Please refer to [this](https://karafka.io/docs/WaterDrop-Transactions) documentation page for a comprehensive understanding of transactions and related nuances.

## Usage Across the Application and with Ruby on Rails

If you plan to both produce and consume messages using Kafka, you should install and use [Karafka](https://github.com/karafka/karafka). It integrates automatically with Ruby on Rails applications and auto-configures WaterDrop producer to make it accessible via `Karafka#producer` method:

```ruby
event = Events.last
Karafka.producer.produce_async(topic: 'events', payload: event.to_json)
```

If you want to only produce messages from within your application without consuming with Karafka, since WaterDrop is thread-safe you can create a single instance in an initializer like so:

```ruby
KAFKA_PRODUCER = WaterDrop::Producer.new

KAFKA_PRODUCER.setup do |config|
  config.kafka = { 'bootstrap.servers': 'localhost:9092' }
end

# And just dispatch messages
KAFKA_PRODUCER.produce_sync(topic: 'my-topic', payload: 'my message')
```

## Usage With a Connection-Pool

While WaterDrop is thread-safe, there is no problem in using it with a connection pool inside high-intensity applications. The only thing worth keeping in mind, is that WaterDrop instances should be shutdown before the application is closed.

```ruby
KAFKA_PRODUCERS_CP = ConnectionPool.new do
  producer = WaterDrop::Producer.new do |config|
    config.kafka = { 'bootstrap.servers': 'localhost:9092' }
  end

  logger = WaterDrop::Instrumentation::LoggerListener.new(
    MyApp.logger,
    log_messages: false
  )

  # Subscribe any listeners you want
  producer.monitor.subscribe(logger)

  # Make sure to subscribe the all Web UI listeners if you use Web UI
  # Otherwise information from this producer will not be sent to the
  # Karafka Web UI
  ::Karafka::Web.config.tracking.producers.listeners.each do |listener|
    producer.monitor.subscribe(listener)
  end

  producer
end

KAFKA_PRODUCERS_CP.with do |producer|
  producer.produce_async(topic: 'my-topic', payload: 'my message')
end

KAFKA_PRODUCERS_CP.shutdown { |producer| producer.close }
```

## Buffering

WaterDrop producers support buffering messages in their internal buffers and on the `rdkafka` level via `queue.buffering.*` set of settings.

This means that depending on your use case, you can achieve both granular buffering and flushing control when needed with context awareness and periodic and size-based flushing functionalities.

### Buffering Messages Based on the Application Logic

```ruby
producer = WaterDrop::Producer.new

producer.setup do |config|
  config.kafka = { 'bootstrap.servers': 'localhost:9092' }
end

# Simulating some events states of a transaction - notice, that the messages will be flushed to
# kafka only upon arrival of the `finished` state.
%w[
  started
  processed
  finished
].each do |state|
  producer.buffer(topic: 'events', payload: state)

  puts "The messages buffer size #{producer.messages.size}"
  producer.flush_sync if state == 'finished'
  puts "The messages buffer size #{producer.messages.size}"
end

producer.close
```

### Using rdkafka Buffers to Achieve Periodic Auto-Flushing

```ruby
producer = WaterDrop::Producer.new

producer.setup do |config|
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    # Accumulate messages for at most 10 seconds
    'queue.buffering.max.ms': 10_000
  }
end

# WaterDrop will flush messages minimum once every 10 seconds
30.times do |i|
  producer.produce_async(topic: 'events', payload: i.to_s)
  sleep(1)
end

producer.close
```

## Shutdown

Properly shutting down WaterDrop producers is crucial to ensure graceful handling and prevent potential resource leaks causing VM crashes. This section explains how to close WaterDrop producers and the implications of doing so.

It is essential to close the WaterDrop producer before exiting the Ruby process. Closing the producer allows it to release resources, complete ongoing operations, and ensure that all messages are either successfully delivered to the Kafka cluster or purged due to exceeding the `message.timeout.ms` value.

The `#close` method is used to shut down the producer. It is important to note that `#close` is a blocking operation, meaning it will block the execution of your program until all the necessary resources are cleaned up. Therefore, it is not recommended to start the `#close` operation in a separate thread and not wait for it to finish, as this may lead to unexpected behavior.

Here is an example of how to use #close to shut down a producer:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.kafka = { 'bootstrap.servers': 'localhost:9092' }
end

producer.close
```

In specific scenarios, such as working with unstable Kafka clusters or when you need to finalize your application fast, disregarding the risk of potential data loss, you may use the `#close!` method.

The `#close!` method attempts to wait until a specified `max_wait_timeout` (default is `60` seconds) for any pending operations to complete. However, if the producer cannot be shut down gracefully within this timeframe, it will forcefully purge the dispatch queue and cancel all outgoing requests. This effectively prevents the closing procedure from blocking for an extensive period, ensuring that your application can exit more quickly.

```ruby
producer = WaterDrop::Producer.new do |config|
  config.kafka = { 'bootstrap.servers': 'localhost:9092' }
end

producer.close!
```

While `#close!` can be helpful when you want to finalize your application quickly, be aware that it may result in messages not being successfully delivered or acknowledged, potentially leading to data loss. Therefore, use `#close!` with caution and only when you understand the implications of potentially losing undelivered messages.

### Closing Producer Used in Karafka

When you shut down Karafka consumer, the `Karafka.producer` WaterDrop instance automatically closes. There's no need to close it yourself. If you're using multiple producers or a more advanced setup, you can use the `app.stopped` event during shutdown to handle them.

### Closing Producer Used in Puma (Single Mode)

```ruby
# config/puma.rb 

# There is no `on_worker_shutdown` equivalent for single mode
@config.options[:events].on_stopped do
  MY_PRODUCER.close
end
```

### Closing Producer Used in Puma (Cluster Mode)

```ruby
# config/puma.rb 

on_worker_shutdown do
  MY_PRODUCER.close
end
```

### Closing Producer Used in Sidekiq

```ruby
# config/initializers/sidekiq.rb

Sidekiq.configure_server do |config|
  # You can use :shutdown for older Sidekiq versions if
  # :exit is not available
  config.on(:exit) do
    MY_PRODUCER.close
  end
end
```

### Closing Producer Used in Passenger

```ruby
PhusionPassenger.on_event(:stopping_worker_process) do
  MY_PRODUCER.close
end
```

### Closing Producer Used in a Rake Task

In case of rake tasks, just invoke `MY_PRODUCER.close` at the end of your rake task:

```ruby
desc 'My example rake task that sends all users data to Kafka'
task send_users: :environment do
  User.find_each do |user|
    MY_PRODUCER.producer.produce_async(
      topic: 'users',
      payload: user.to_json,
      key: user.id
    )
  end

  # Make sure, that the producer is always closed before finishing
  # any rake task
  MY_PRODUCER.close
end
```

### Closing Producer in any Ruby Process

While integrating WaterDrop producers into your Ruby applications, it's essential to ensure that resources are managed correctly, especially when terminating processes. We generally recommend utilizing hooks specific to the environment or framework within which the producer operates. These hooks ensure graceful shutdowns and resource cleanup tailored to the application's lifecycle.

However, there might be scenarios where such specific hooks are not available or suitable. In these cases, Ruby's `at_exit` hook can be employed as a universal fallback to close the producer before the Ruby process exits. Here's a basic example of using at_exit with a WaterDrop producer:

```ruby
at_exit do
  MY_PRODUCER.close
end
```

## Forking and Potential Memory Problems

If you work with forked processes, make sure you **don't** use the producer before the fork. You can easily configure the producer and then fork and use it.

To tackle this [obstacle](https://github.com/appsignal/rdkafka-ruby/issues/15) related to rdkafka, WaterDrop adds finalizer to each of the producers to close the rdkafka client before the Ruby process is shutdown. Due to the [nature of the finalizers](https://www.mikeperham.com/2010/02/24/the-trouble-with-ruby-finalizers/), this implementation prevents producers from being GCed (except upon VM shutdown) and can cause memory leaks if you don't use persistent/long-lived producers in a long-running process or if you don't use the `#close` method of a producer when it is no longer needed. Creating a producer instance for each message is anyhow a rather bad idea, so we recommend not to.
