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
handle = producer.produce_async(topic: 'my_topic', payload: 'my_payload')

report = handle.wait

puts "This sent message has an offset #{report.offset} on partition #{report.partition}"
puts "This sent message was sent to #{report.topic_name} topic"
```

If an error does occur during delivery, the `#wait` method will raise an appropriate error with detailed information about the failure, allowing you to handle errors in your application logic.

However, there might be scenarios where you want to wait for the message to be delivered but do not want to raise an exception if an error occurs. In such cases, the `#wait` method also accepts a `raise_response_error` flag that you can set to `false`.

```ruby
handle = producer.produce_async(topic: 'my_topic', payload: 'my_payload')
report = handle.wait(raise_response_error: false)

if report.error
  puts "Delivery failed due to #{report.error}"
else
  puts "This sent message has an offset #{report.offset} on partition #{report.partition}"
  puts "This sent message was sent to #{report.topic_name} topic"
end
```

- If `raise_response_error` is set to `true` (the default behavior), the `#wait` method will raise an exception if there is a delivery error.

- If `raise_response_error` is set to false, the `#wait` method will still wait for the delivery but will not raise an exception upon failure. Instead, it will return the appropriate error along with failure details, allowing you to handle the error as needed without interrupting the program's flow or will return the delivery report upon successful delivery.

This flexibility in handling delivery reports and delivery handles in both synchronous and asynchronous scenarios makes WaterDrop a powerful choice for managing Kafka message production while accommodating different use cases and error-handling strategies.

## Usage across the application and with Ruby on Rails

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

## Usage with a connection-pool

While WaterDrop is thread-safe, there is no problem in using it with a connection pool inside high-intensity applications. The only thing worth keeping in mind, is that WaterDrop instances should be shutdown before the application is closed.

```ruby
KAFKA_PRODUCERS_CP = ConnectionPool.new do
  WaterDrop::Producer.new do |config|
    config.kafka = { 'bootstrap.servers': 'localhost:9092' }
  end
end

KAFKA_PRODUCERS_CP.with do |producer|
  producer.produce_async(topic: 'my-topic', payload: 'my message')
end

KAFKA_PRODUCERS_CP.shutdown { |producer| producer.close }
```

## Buffering

WaterDrop producers support buffering messages in their internal buffers and on the `rdkafka` level via `queue.buffering.*` set of settings.

This means that depending on your use case, you can achieve both granular buffering and flushing control when needed with context awareness and periodic and size-based flushing functionalities.

### Buffering messages based on the application logic

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

### Using rdkafka buffers to achieve periodic auto-flushing

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
