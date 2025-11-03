# WaterDrop Configuration

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

| Option                                      | Description                                                                    |
|---------------------------------------------|--------------------------------------------------------------------------------|
| `id`                                        | id of the producer for instrumentation and logging                             |
| `logger`                                    | Logger that we want to use                                                     |
| `client_class`                              | Client class for creating the underlying client used to dispatch messages      |
| `deliver`                                   | Should we send messages to Kafka or just fake the delivery                     |
| `max_wait_timeout`                          | Waits that long for the delivery report or raises an error                     |
| `wait_on_queue_full`                        | Should be wait on queue full or raise an error when that happens               |
| `wait_backoff_on_queue_full`                | Waits that long before retry when queue is full                                |
| `wait_timeout_on_queue_full`                | If back-offs and attempts that that much time, error won't be retried more     |
| `wait_backoff_on_transaction_command`       | How long to wait before retrying a retryable transaction related error         |
| `max_attempts_on_transaction_command`       | How many times to retry a retryable transaction related error before giving up |
| `reload_on_idempotent_fatal_error`          | Automatically reload producer after fatal errors on idempotent producers       |
| `wait_backoff_on_idempotent_fatal_error`    | Time to wait (ms) before retrying after an idempotent fatal error reload       |
| `max_attempts_on_idempotent_fatal_error`    | Maximum number of reload attempts for idempotent fatal errors                  |
| `reload_on_transaction_fatal_error`         | Automatically reload producer after fatal errors in transactions               |
| `wait_backoff_on_transaction_fatal_error`   | Time to wait (ms) before continuing after a transactional fatal error reload   |
| `max_attempts_on_transaction_fatal_error`   | Maximum number of reload attempts for transactional fatal errors               |
| `instrument_on_wait_queue_full`             | Should we instrument when `queue_full` occurs                                  |

!!! info

    Full list of the root configuration options is available [here](https://github.com/karafka/waterdrop/blob/master/lib/waterdrop/config.rb#L25).

## Kafka configuration options

You can create producers with different `kafka` settings. Full list of the Kafka configuration options is available [here](Librdkafka-Configuration).

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

You can read more about idempotence and acknowledgements settings [here](WaterDrop-Idempotence-and-Acknowledgements).

### Fatal Error Recovery for Idempotent Producers

When working with idempotent producers, certain fatal errors may occur that prevent the producer from continuing to operate correctly. WaterDrop provides automatic recovery mechanisms to reload the producer when such errors occur.

By default, idempotent fatal error recovery is **disabled**. You can enable it by setting the `reload_on_idempotent_fatal_error` configuration option:

```ruby
WaterDrop::Producer.new do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'enable.idempotence': true
  }

  # Enable automatic reload on idempotent fatal errors
  config.reload_on_idempotent_fatal_error = true
  # Wait 10 seconds before retrying after a fatal error
  config.wait_backoff_on_idempotent_fatal_error = 10_000
  # Maximum 3 reload attempts before giving up
  config.max_attempts_on_idempotent_fatal_error = 3
end
```

When enabled, WaterDrop will:

1. Detect fatal errors that prevent the idempotent producer from continuing
1. Automatically reload the underlying librdkafka producer client
1. Wait for the configured backoff period before retrying the operation
1. Track reload attempts to prevent infinite loops

The reload mechanism helps ensure that transient fatal errors don't permanently disable your producer, improving the overall resilience of your application.

!!! warning "Producer Client Reload Impact"

    Fatal error recovery involves reloading the entire producer client, which may result in a brief interruption of message production. Any messages in the internal buffer that were not yet delivered may be lost unless they are part of a transaction. However, the producer will always emit notification events for messages that are dropped during reload, and the Labeling API can be used to track and identify which messages were not delivered. Ensure your application can tolerate this behavior before enabling this feature.

!!! note "Transactional Producer Support"

    For transactional producers, similar configuration options are available with different defaults. See the [Transactional Producer documentation](WaterDrop-Transactions) for more details.

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

```shell
apt-get install -y libzstd-dev
```

## Message Size Validation

When working with WaterDrop, it's essential to know the various checks and validations to ensure the integrity and feasibility of producing messages. This section explains the message size validation process in WaterDrop, librdkafka, and Kafka.

There are three primary parameters to consider:

1. **WaterDrop `max_payload_size`**: this value checks only the payload size during client-side message validation.

1. **librdkafka `message.max.bytes`**: This is a configuration value determining the maximum size of a message. Maximum Kafka protocol request message size. Due to differing framing overhead between protocol versions, the producer cannot reliably enforce a strict max message limit at production time and may exceed the maximum size by one message in protocol `ProduceRequests`. The broker will enforce the topic's `max.message.bytes` limit automatically.

1. **Broker max.message.bytes**: is a broker-level configuration in Apache Kafka that determines the maximum size of a message the broker will accept. If a producer attempts to send a message larger than this specified size, the broker will reject it. 

### Validation Flow

1. **WaterDrop Client-Side Validation**:

    - Before a message reaches librdkafka, WaterDrop checks the `max_payload_size` to ensure the message payload is within permissible limits.

    - It's worth noting that this validation only concerns the payload and not additional elements like metadata, headers, and key.

1. **librdkafka Validation**:

    - librdkafka, before publishing, validates the **uncompressed** size of the message.

    - This check ensures that the message size adheres to configured standards even before compression.

1. **Broker-Side Validation**:

    - After the message is dispatched, the broker then validates the **compressed** size.

    - The distinction between compressed and uncompressed size is essential because of the potential compression ratios achievable with different compression algorithms.

Below you can find examples where each of the validations layers fails:

1. WaterDrop raising the `WaterDrop::Errors::MessageInvalidError` because of the payload being too big (1MB):

    ```ruby
    # Topic limit 1MB
    # Payload too big
    producer.produce_async(topic: 'test', payload: '1' * 1024 * 1024)
    # {:payload=>"is more than `max_payload_size` config value"}
    ```

1. librdkafka raising an error because of the message being too large:

    ```ruby
    # Topic limit 1MB
    # Small payload
    # Large headers
    # message.max.bytes: 10 000
    Karafka.producer.produce_sync(
      topic: 'test',
      payload: '1',
      key: '1',
      headers: { rand.to_s => '1' * 1024 * 1024 }
    )

    # Error occurred: #<Rdkafka::RdkafkaError: Broker:
    #     Message size too large (msg_size_too_large)> - message.produce_sync
    # `rescue in produce_async': #<Rdkafka::RdkafkaError:
    #     Broker: Message size too large (msg_size_too_large)> (WaterDrop::Errors::ProduceError)
    ```

1. librdkafka raising an error received from the broker

    ```ruby
    # Topic limit 1MB
    # Small payload
    # Large headers
    # message.max.bytes: 10MB

    Karafka.producer.produce_sync(
      topic: 'test',
      payload: '1',
      key: '1',
      headers: { rand.to_s => '1' * 1024 * 1024 * 10 }
    )

    # Error occurred: #<Rdkafka::RdkafkaError: Broker:
    #     Message size too large (msg_size_too_large)> - message.produce_sync
    # `rescue in produce_async': #<Rdkafka::RdkafkaError:
    #     Broker: Message size too large (msg_size_too_large)> (WaterDrop::Errors::ProduceError)
    ```

!!! note

    The `msg_size_too_large error` can arise from:

    - Local Validation by librdkafka: Before reaching the Kafka broker, if a message size exceeds the library's limit.

    - Kafka Broker Rejection: If the broker finds the message too big based on its configuration.

    Both scenarios produce the same `msg_size_too_large` error code, making them indistinguishable in code.

    When addressing this error, check message size settings in both librdkafka and the Kafka broker.

### Adjusting Validation Parameters

1. **Disabling max_payload_size**:

    - If you don't use dummy or buffered clients for testing, it's possible to turn off `max_payload_size`.

    - This can be done by setting it to a high value and bypassing this validation step.

    - However, librdkafka will still validate the uncompressed size of the entire message, including headers, metadata, and key.

1. **Interpreting Validation Errors**:

    - A discrepancy between `max_payload_size` and `message.max.bytes` may arise due to the additional size from metadata, headers, and keys.

    - Hence, it's possible to bypass WaterDrop's validation but fail on librdkafka's end.

### Conclusion

Understanding the nuances of message size validation is crucial to ensure smooth message production. While it may seem complex at first, being mindful of the distinctions between uncompressed and compressed sizes and client-side and broker-side validations can prevent potential pitfalls and disruptions in your Kafka workflows.

---

## See Also

- [WaterDrop Getting Started](WaterDrop-Getting-Started) - Quick start guide for WaterDrop producer
- [Librdkafka Configuration](Librdkafka-Configuration) - Complete librdkafka configuration reference
- [Multi Cluster Setup](Multi-Cluster-Setup) - Configure and manage multiple Kafka clusters
- [WaterDrop Variants](WaterDrop-Variants) - Different producer variants and their use cases
