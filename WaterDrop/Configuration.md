WaterDrop is a complex tool that contains multiple configuration options. To keep everything organized, all the configuration options were divided into two groups:

- WaterDrop options - options directly related to WaterDrop and its components
- Kafka driver options - options related to `librdkafka`

To apply all those configuration options, you need to create a producer instance and use the ```#setup``` method:

```ruby
producer = WaterDrop::Producer.new

producer.setup do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'request.required.acks': 1
  }
end
```

or you can do the same while initializing the producer:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'request.required.acks': 1
  }
end
```

## WaterDrop configuration options

Some of the options are:

| Option                       | Description                                                                |
|------------------------------|----------------------------------------------------------------------------|
| `id`                         | id of the producer for instrumentation and logging                         |
| `logger`                     | Logger that we want to use                                                 |
| `deliver`                    | Should we send messages to Kafka or just fake the delivery                 |
| `max_wait_timeout`           | Waits that long for the delivery report or raises an error                 |
| `wait_timeout`               | Waits that long before re-check of delivery report availability            |
| `wait_on_queue_full`         | Should be wait on queue full or raise an error when that happens           |
| `wait_backoff_on_queue_full` | Waits that long before retry when queue is full                            |
| `wait_timeout_on_queue_full` | If back-offs and attempts that that much time, error won't be retried more |

!!! info ""

    Full list of the root configuration options is available [here](https://github.com/karafka/waterdrop/blob/master/lib/waterdrop/config.rb#L25).

## Kafka configuration options

You can create producers with different `kafka` settings. Full list of the Kafka configuration options is available [here](https://karafka.io/docs/Librdkafka-Configuration/).

## Idempotence

When idempotence is enabled, the producer will ensure that messages are successfully produced exactly once and in the original production order.

To enable idempotence, you need to set the `enable.idempotence` kafka scope setting to `true`:

```ruby
WaterDrop::Producer.new do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'enable.idempotence': true
  }
end
```

The following Kafka configuration properties are adjusted automatically (if not modified by the user) when idempotence is enabled:

- `max.in.flight.requests.per.connection` set to `5`
- `retries` set to `2147483647`
- `acks` set to `all`

The idempotent producer ensures that messages are always delivered in the correct order and without duplicates. In other words, when an idempotent producer sends a message, the messaging system ensures that the message is only delivered once to the message broker and subsequently to the consumers, even if the producer tries to send the message multiple times.

## Compression

WaterDrop supports following compression types:

- `gzip`
- `zstd`
- `lz4`
- `snappy`

To use compression, set `kafka` scope `compression.codec` setting. You can also optionally indicate the `compression.level`:

```ruby
producer = WaterDrop::Producer.new

producer.setup do |config|
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'compression.codec': 'gzip',
    'compression.level': 6
  }
end
```

Keep in mind, that in order to use `zstd`, you need to install `libzstd-dev`:

```bash
apt-get install -y libzstd-dev
```
