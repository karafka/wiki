# WaterDrop Variants

WaterDrop variants can manage different configuration settings per topic using the same Kafka producer with shared TCP connections. This feature allows optimal utilization of a producer's TCP connections while enabling tailored dispatch requirements for individual topics. Variants are beneficial when working with topics with varying levels of importance or different throughput and latency requirements.

## Creating and Using Variants

To leverage variants in WaterDrop, you initialize a standard producer with default settings that apply broadly to all topics for which you intend to produce messages. Then, you can create variants of this producer with configurations specific to particular topics. These variants allow for topic-specific adjustments without needing multiple producer instances, thus conserving system resources and maintaining high performance.

Variants are created using the `#with` and `#variant` methods. It is critical in enabling topic-specific configurations through variants while using a single producer instance. The `#with` and `#variant` methods are designed to accept two types of arguments:

- `max_wait_timeout`: This is a root-scoped setting.
- `topic_config` hash: This is where all topic-specific configurations are defined. 

Attributes placed inside the `topic_config` hash during variant creation are referred to as `topic_config` scoped. Conversely, settings like `max_wait_timeout`, which reside outside the `topic_config hash`, are considered root-scoped.

Here's a simple example to demonstrate how to define and use variants with WaterDrop:

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

# Use variants like regular producers
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
      <td>Controls how long the producer waits for the dispatch result before raising an error.</td>
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

    For a more comprehensive list of configuration settings supported by librdkafka, please visit the [Librdkafka Configuration](Librdkafka-Configuration) page.

## Edge-Cases and Details

When using variants in WaterDrop, there are specific edge cases and operational nuances that you should be aware of to ensure optimal performance and behavior:

- **Buffering Behavior Across Variants**: It is crucial to understand that while `topic_config` specific settings are preserved per message, the `max_wait_timeout` applied during the flush operation will correspond to the variant that initiates the flushing. This means that messages from other variants that were buffered may be dispatched using the `max_wait_timeout` of the variant currently flushing the data. Since variants share a single producer buffer, this can affect how messages are processed.

- **Inconclusive Error Messages**: Redefining `max_wait_timeout` without aligning it with other librdkafka settings can lead to inconclusive error. This issue arises because the timeout settings may not synchronize well with other operational parameters, potentially leading to errors that are difficult to diagnose. For a deeper understanding of this issue and how it might affect your Kafka operations, refer to the [Error Handling](WaterDrop-Error-Handling) documentation.

- **Immutable acks for Idempotent and Transactional Producers**: When working with idempotent or transactional producers, it is important to note that the `acks` setting is immutable and automatically set to `all`. This configuration cannot be altered through variants, as ensuring exactly-once semantics requires a fixed acknowledgment policy. Attempting to change the acks setting for these producers will result in an error.

These details are critical in effectively managing and troubleshooting your Kafka message production environment, especially when utilizing the flexibility of variants for different topic configurations.

## Conclusion

Variants address the need for dynamic, topic-specific configurations in applications interacting with Kafka. By enabling variations per topic within a single producer, WaterDrop helps streamline resource usage and enhance message dispatch efficiency, making it an essential tool for sophisticated Kafka-based messaging systems.

## See also

- [Multi-Cluster Setup](Multi-Cluster-Setup) - For managing multiple Kafka clusters
- [Producing Messages](Producing-Messages) - For message production techniques and patterns
