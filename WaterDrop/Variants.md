# WaterDrop Variants

WaterDrop variants can manage different configuration settings per topic using the same Kafka producer with shared TCP connections. Variants are beneficial when working with topics with varying levels of importance or different throughput and latency requirements.

## Creating and Using Variants

To use variants, initialize a producer with default settings that apply to all topics you produce to. Then create variants of this producer with settings for particular topics.

You create variants with the `#with` method or its alias `#variant`. It accepts two types of arguments:

- `max_wait_timeout`: This is a root-scoped setting. Omit it to use the `max_wait_timeout` of the default variant. Setting it to `nil` raises `WaterDrop::Errors::VariantInvalidError`.
- `topic_config` hash: This hash holds all topic-specific settings. Any value other than a hash, including `nil`, raises `WaterDrop::Errors::VariantInvalidError`.

Attributes inside the `topic_config` hash are `topic_config` scoped. Settings outside it, such as `max_wait_timeout`, are root-scoped.

Here is a simple example to demonstrate how to define and use variants with WaterDrop:

```ruby
# Initialize the main producer with common settings
producer = WaterDrop::Producer.new do |config|
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'acks': '2'  # Default acknowledgment setting for medium-importance topics
  }
end

# Create variants with specific settings
low_importance = producer.with(topic_config: { acks: 1 })
high_importance = producer.with(topic_config: { acks: 'all' })

# Variants expose the same produce methods as the producer
low_importance.produce_async(topic: 'low_priority_events', payload: event.to_json)
high_importance.produce_async(topic: 'critical_events', payload: event.to_json)
```

## Configurable Settings

Variants allow you to modify several Kafka and producer-specific settings to better suit the characteristics of different topics:

<table>
  <thead>
    <tr>
      <th class="nowrap">Scope</th>
      <th class="nowrap">Attribute</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="nowrap">
        <code>root</code>
      </td>
      <td class="nowrap">
        <code>max_wait_timeout</code>
      </td>
      <td>Controls how long the producer waits for the produce result before raising an error.</td>
    </tr>
    <tr>
      <td class="nowrap">
        <code>topic_config</code>
      </td>
      <td class="nowrap">
        <code>acks</code><br/>
        <code>request.required.acks</code>
      </td>
      <td>Determines the number of broker acknowledgments required before considering a message delivery successful.</td>
    </tr>
    <tr>
      <td class="nowrap">
        <code>topic_config</code>
      </td>
      <td class="nowrap">
        <code>compression.codec</code><br/><code>compression.type</code>
      </td>
      <td>Specifies the type of codec used for compression (e.g., none, gzip, snappy, lz4, zstd).</td>
    </tr>
    <tr>
      <td class="nowrap">
        <code>topic_config</code>
      </td>
      <td class="nowrap">
        <code>compression.level</code>
      </td>
      <td>Determines the compression level for the selected codec, affecting both the compression ratio and performance.</td>
    </tr>
    <tr>
      <td class="nowrap">
        <code>topic_config</code>
      </td>
      <td class="nowrap">
        <code>delivery.timeout.ms</code><br/>
        <code>message.timeout.ms</code>
      </td>
      <td>Limits the time a produced message waits for successful delivery. A time of <code>0</code> is infinite.</td>
    </tr>
    <tr>
      <td class="nowrap">
        <code>topic_config</code>
      </td>
      <td class="nowrap">
        <code>partitioner</code>
      </td>
      <td>Defines partitioner to use for distribution across partitions within a topic.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>topic_config</code></td>
      <td class="nowrap"><code>request.timeout.ms</code></td>
      <td>The ack timeout of the producer request in milliseconds.</td>
    </tr>
  </tbody>
</table>

!!! info "Additional Configuration Attributes Details"

    For a more comprehensive list of configuration settings supported by librdkafka, visit the [librdkafka Configuration](Librdkafka-Configuration) page.

## Inspecting the Active Variant

When you call a method on a variant (such as `#produce_sync`, `#buffer`, `#flush_sync` or `#transaction`), the variant in effect is tracked per call and is fiber-local. The `#current_variant` method lets you read the variant that is active for the call currently running on the present fiber. Outside of a call on a variant, it returns the producer's default variant.

This is primarily useful for [middleware](WaterDrop-Middleware) and instrumentation listeners that run synchronously within a produce call and need to read the effective per-call settings, such as `topic_config`, `max_wait_timeout`, or whether the default variant is in use via `#default?`:

```ruby
high_importance = producer.with(topic_config: { acks: 'all' })

# Inside synchronous middleware or instrumentation running during the produce call:
variant = producer.current_variant

variant.default?         # => false when producing through a variant
variant.topic_config     # => { acks: 'all' }
variant.max_wait_timeout # => the variant's root-scoped timeout

high_importance.produce_async(topic: 'critical_events', payload: event.to_json)
```

!!! warning "Fiber-Local and Scoped to a Single Call on a Variant"

    `#current_variant` is fiber-local and scoped to a single call on a variant; it does not represent a producer-wide setting. It is not meaningful from asynchronous delivery callbacks (such as `message.acknowledged`), which run on the poller thread - a different fiber - where it always returns the default variant rather than the variant the acknowledged message was produced with.

## Edge-Cases and Details

- **Buffering Behavior Across Variants**: All variants share the [buffer](WaterDrop-Usage#buffering) of their producer. A call made directly on the producer uses the default variant. One variant adds messages with `#buffer` or `#buffer_many`, and any variant can flush them with `#flush_sync` or `#flush_async`. Each message keeps the `topic_config` of the variant that buffered it. `#flush_sync` waits for delivery with the `max_wait_timeout` of the variant that calls it.

- **Inconclusive Error Messages**: If you set `max_wait_timeout` lower than `message.timeout.ms`, `#wait` can raise a wait timeout error before the delivery result is final. By default, `max_wait_timeout` (`180_000` ms) exceeds `message.timeout.ms` (`150_000` ms). See [Error Handling](WaterDrop-Error-Handling) for details.

- **Invalid `topic_config` Values**: `#with` checks only the keys of `topic_config`. librdkafka checks the values when the variant produces a message, so an invalid value, such as `acks: 'bogus'`, raises an error on each produce through that variant, not when you create it. A message buffered through such a variant makes each `#flush_sync` or `#flush_async` fail and stop at it: that message and every message buffered after it stay in the buffer (for a transactional producer, the whole flushed batch). `#purge` discards the whole buffer. `#close` runs one more flush, which stops at that message in the same way, and then closes the producer without delivering the messages left in the buffer.

- **Immutable `acks` for Idempotent and Transactional Producers**: For idempotent producers (`enable.idempotence` set to `true` or `"true"`, see [WaterDrop Idempotence](WaterDrop-Idempotence-and-Acknowledgements#waterdrop-idempotence)) and transactional producers, `acks` is set to `all` and variants cannot change it. Creating a variant that sets `acks` or `request.required.acks` in `topic_config` for these producers raises `WaterDrop::Errors::VariantInvalidError`.

## See Also

- [Multi-Cluster Setup](Infrastructure-Multi-Cluster-Setup) - For managing multiple Kafka clusters
- [Producing Messages](Basics-Producing-Messages) - For message production techniques and patterns
