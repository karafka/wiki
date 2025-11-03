# Offset Metadata Storage

Offset Metadata Storage is a feature within the Karafka framework allowing the addition of metadata to offsets. At its core, Offset Metadata Storage enables developers to attach custom metadata to message offsets when they are committed to the Kafka broker. This metadata, essentially a form of annotation or additional data, can then be retrieved and used for many purposes, enhancing message processing systems' capability, traceability, and intelligence.

In traditional Kafka consumption, a message's offset indicates its position within a partition. While this is crucial for ensuring messages are processed in order, and no message is missed or duplicated, the standard offset mechanism doesn't provide context or additional information about the processing state or the nature of the message. Offset Metadata Storage fills this gap by allowing developers to store custom, context-rich data alongside these offsets.

This feature can be compelling in complex processing scenarios where understanding the state or history of a message's processing is crucial. For instance, in a distributed system where messages undergo multiple stages of processing, Offset Metadata Storage can be used to attach processing stage information, timestamps, or identifiers of the services that have already processed the message. This additional layer of information opens up new possibilities for monitoring, debugging, and orchestrating complex message flows.

## Enabling Offset Metadata Storage

This feature is always enabled, ensuring you can leverage Offset Metadata Storage's benefits without additional setup. However, the behavior of Offset Metadata Storage can be fine-tuned using specific settings that control its caching and deserialization behavior. You can alter this feature behavior in the routing, similar to other features:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer
      offset_metadata(
        deserializer: JsonOffsetMetadataDeserializer.new
      )
    end
  end
end
```

If you plan to use same offset metadata deserializer throughout the whole system, we recommend using the `#defaults` API:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    defaults do
      offset_metadata(
        deserializer: JsonOffsetMetadataDeserializer.new
      )
    end

    topic :orders_states do
      consumer OrdersStatesConsumer
    end

    topic :users_actions do
      consumer UsersActionsConsumer
    end
  end
end
```

The following configuration options are available for `#offset_metadata`:

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Type</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>cache</code></td>
      <td>Boolean</td>
      <td><code>true</code></td>
      <td>
        Determines whether the metadata should be cached until a rebalance occurs. When set to <code>true</code>, the metadata will be cached, reducing the need to fetch or compute it until the consumer group rebalances repeatedly.
      </td>
    </tr>
    <tr>
      <td><code>deserializer</code></td>
      <td>Object (Proc, Lambda, or any object responding to <code>#call</code>)</td>
      <td>String deserializer</td>
      <td>Specifies the deserializer that will process the raw metadata data. This deserializer should be an object that responds to the <code>#call</code> method. It receives the raw metadata and is responsible for returning the deserialized metadata. This setting is crucial when interpreting or processing the offset metadata in a specific format or structure.</td>
    </tr>
  </tbody>
</table>

## Working with Offsets Metadata

### Writing Offset Metadata Alongside Marking

Writing offset metadata is a straightforward process that can be achieved by passing a second string type argument to the `#mark_as_consumed` or `#mark_as_consumed!` method. This string can represent serialized data (like JSON) that contains the metadata you want to store or any other plain-text-based information:

For instance, you can store the process identifier and processing details as part of its metadata like this:

```ruby
def consume
  messages.each do |message|
    EventsStore.call(message)
    @aggregator.mark(message)

    mark_as_consumed(
      message,
      # Make sure that this argument is a string and in case of a JSON, do not
      # forget to define a custom deserializer
      {
        process_id: Process.uid,
        aggregated_state: @aggregator.to_h, 
      }.to_json
    )
  end
end
```

In this example, `#mark_as_consumed!` marks a message as consumed and simultaneously stores its offset within the metadata. In this case, the metadata is a JSON string representing a hash with details that can be later used in a process that would receive this partition after the reassignment.

### Storing Offset Metadata for the Upcoming Marking

Automatic flows in Karafka refer to scenarios where offset marking is not explicitly invoked by the user but is handled internally by the system. This could be the case when automatic offset management is enabled or when certain features like the Dead Letter Queue (DLQ) are enabled. The system may implicitly use marking methods like `#mark_as_consumed` or `#mark_as_consumed!` without direct user intervention.

The main challenge in automatic flows is ensuring that the relevant offset metadata is correctly associated with the message being processed, even though the user does not explicitly invoke the marking method. This is crucial for maintaining a coherent state and enabling more intelligent processing.

To address this challenge, Karafka provides the `#store_offset_metadata` method. This method allows you to store offset metadata in advance, ensuring that it will be used with the following marking, regardless of whether the marking is triggered by user-based actions or by automatic internal processes.

```ruby
def consume
  messages.each do |message|
    EventsStore.call(message)
    @aggregator.mark(message)
  end

  # Store offset metadata alongside the next automatic marking as consumed
  store_offset_metadata(
    {
      process_id: Process.uid,
      aggregated_state: @aggregator.to_h, 
    }.to_json
  )
end
```

!!! warning "Automatic Application of Stored Offset Metadata"

    Please be aware that the Karafka system will apply the stored offset metadata to the next message offset marked as consumed, regardless of whether the marking is manual or automatic, including automatic dispatches to the Dead Letter Queue (DLQ). This behavior might lead to unexpected metadata associations with messages, particularly in high-throughput or automated processing scenarios. It is highly recommended to thoroughly test and fully understand the implications of storing offset metadata in your specific use case, ensuring its application aligns with your message processing logic and does not disrupt the intended flow.

### Reading Offset Metadata

To retrieve the offset metadata, you can use the `#offset_metadata` method within your consumer. This method fetches the offset metadata and deserializes it using the configured deserializer.

```ruby
def consume
  # Use offset metadata only on the first run on the consumer
  unless @recovered
    @recovered = true

    metadata = offset_metadata

    # Do nothing if `#offset_metadata` was false. It means we have lost the assignment
    return unless metadata

    # Use the metadata from previous process to recover internal state
    @aggregator.recover(
      metadata.fetch('aggregated_state')
    )
  end

  # Rest of the processing here...
end
```

It's important to note the behavior of the `#offset_metadata` method about the `:cache` configuration option:

- If `:cache` is set to `true`, the metadata will be cached until a rebalance occurs, preventing unnecessary round trips to Kafka and ensuring better performance.

- If `:cache` is set to `false`, each invocation of the `#offset_metadata` method will make a round trip to Kafka to fetch the data. It's generally not recommended to set `:cache` to `false` unless necessary.

The primary use case for offset metadata is to pass stateful information that can be crucial during rebalances or when the assignment of partitions changes. For example, in a distributed system where multiple consumers work on different partitions, a rebalance might change the partition assignment of consumers. In such cases, the offset metadata can provide the necessary context or state information to the newly assigned consumer, allowing it to pick up the processing exactly where the previous consumer left off.

One crucial aspect is that the `#offset_metadata` method may return `false` if the given partition is no longer part of the consumer's assignment. This safety mechanism ensures that your consumer does not act on stale or irrelevant metadata. Always check the return value of `#offset_metadata` and handle the false case appropriately in your application logic.

## Offset Metadata Usage From Within Filters

Offset Metadata Storage in Karafka enhances consumer instances' capability to manage and utilize message offsets and extends this functionality beyond the scope of a single consumer. This feature is particularly beneficial when you need to access offset metadata from different application components, such as within the [Filtering API](Pro-Filtering-API), to make more context-aware decisions based on the metadata associated with specific offsets.

In scenarios where you need to retrieve offset metadata outside of the consumer instance, for instance, within Filters, to leverage the Filtering API, Karafka provides a flexible solution. This is especially useful when your processing logic requires insight into the message offsets' metadata at different stages or components of your application, not just within the consumer itself.

As long as the current process retains the assignment of the given topic partition, you can retrieve the offset metadata from places other than the consumer instance. This means that even in filters or other parts of your Karafka application, you can access the metadata associated with any offset, ensuring a seamless and cohesive processing flow.

To do so, you need to utilize the `Karafka::Pro::Processing::OffsetMetadata::Fetcher` object as follows:

```ruby
offset_metadata = Karafka::Pro::Processing::OffsetMetadata::Fetcher.find(
  # Karafka::Routing::Topic expected and NOT a string
  topic,
  # Partition id integer: 0, 1, 2, etc
  partition
)

puts offset_metadata
```

!!! warning "Proper Arguments expectations for `Fetcher#find`"

    When using the `Fetcher#find` method, passing a `Karafka::Routing::Topic` object is essential, not just a string name of the topic. This specificity is required because a single topic might be associated with multiple consumer groups, each holding distinct offset metadata. Providing a `Karafka::Routing::Topic` object ensures accurate metadata retrieval by uniquely identifying the topic within its consumer group context, preventing any mix-up in metadata due to topic name overlaps across different consumer groups.

## Interaction with Virtual Partitions

Virtual Partitions in Karafka introduce an additional layer of complexity to how work is distributed from one topic partition to multiple virtual partitions. This intricacy extends to the behavior of Offset Metadata Storage, which can be configured to operate in two distinct ways. This behavior is governed by the `offset_metadata_strategy` flag, set during the configuration of virtual partitions in routing.

When the Virtual Offset Manager is in the process of materializing an offset to store, it faces a choice regarding which metadata to use. The decision is based on the `offset_metadata_strategy` setting:

1. **Current Strategy (`:current`) / Default**: When set to current, the system uses the most recently provided metadata for the offset being materialized. This approach assumes that the latest metadata is the most relevant or accurate for the current processing state. However, it may only sometimes precisely align with the specific offset, especially in high-throughput or rapidly changing environments.

2. **Exact Strategy (`:exact`)**: Conversely, when the `offset_metadata_strategy` is set to `:exact`, the system uses the metadata associated with the exact offset being materialized. This ensures a tight coupling between an offset and its metadata, providing precision and ensuring each offset is associated with its specific contextual data. This can be particularly important in scenarios where the metadata's relevance is closely tied to the particular position within the partition.

The choice between `:current` and `:exact` strategies should be made based on the specific needs of your application and the nature of your message processing logic.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      virtual_partitions(
        partitioner: ->(message) { message.headers['order_id'] },
        max_partitions: 5,
        # Use the exact matching offset metadata strategy
        offset_metadata_strategy: :exact
      )
    end
  end
end
```

## Limitations

Offset Metadata Storage comes with certain limitations you should be aware of:

1. **Immutability of Stored Offset Metadata**: Once offset metadata is stored for a specific offset value, it cannot be updated or overwritten. This means the system retains only the first set of metadata associated with a particular offset. If your processing logic involves updating or changing metadata over time, you must design your system to accommodate this limitation.

1. **Limitations on Storing Metadata for Previous Offsets**: Storing metadata for an offset that precedes the current position is more complex. Suppose your processing logic requires you to associate metadata with a message that has already been processed (or an offset already stored); you would need to use the `#seek` method with the `reset_offset: true` parameter. This approach effectively rewinds the consumer to the desired offset, allowing you to store metadata.

1. **Offset Metadata Cache and Non-Persistent Consumers in Development**: In a development environment, the offset metadata cache may only function as expected if consumers are set to operate in a persistent mode. Non-persistent consumers may lose the context or state between runs, leading to inconsistencies or the inability to retrieve cached metadata.

1. **Usage of `#store_offset_metadata` with Non-Persistent Consumers**: Similar to the caching issue, the `#store_offset_metadata` method may face challenges if consumers are not operating in persistent mode. This method is designed to store metadata in anticipation of future marking, and its proper functioning relies on the consumer maintaining a consistent state. If the consumers are not persistent, the stored metadata might not be associated with the intended offset, leading to unexpected behavior.

Understanding and accommodating these limitations is essential for effectively leveraging the Offset Metadata Storage feature in your Karafka-based applications.

## Example Use Cases

Here are some use cases from where Karafka's offset metadata storage feature can be beneficial:

1. **Complex Event Processing**: In systems where events pass through multiple stages, offset metadata can store state or stage information, helping to orchestrate the event processing flow and ensuring each event is handled appropriately at each stage.

1. **Tracing and Debugging**: Attach unique trace IDs or log contextual information to messages as metadata, making it easier to trace the flow of specific messages through the system and debug complex distributed systems.

1. **Transactional Workflows**: In workflows that mimic transactions across distributed services, offset metadata stores transaction states or IDs, ensuring consistency and recoverability across service boundaries.

1. **Failure Recovery and Retries**: Store retry counts or error information as metadata, providing context for failure recovery mechanisms and enabling intelligent retry strategies based on the history of each message.

1. **Checkpointing in Stream Processing**: Store the latest processed offset as metadata to create a checkpoint. In case of a system failure, the processing can resume from the last checkpoint, ensuring no data loss.

1. **Rebalance Recovery**: During consumer group rebalances, use offset metadata to store context about the processing state. This allows the newly assigned consumer to resume work seamlessly without losing track of the processing state.

1. **Selective Message Replay**: Use offset metadata to mark specific offsets for replaying messages for scenarios like error recovery or reprocessing after code changes without affecting the entire message stream.

1. **Conditional Processing Flow**: Store indicators or flags as offset metadata to control the processing flow, turning on or off specific processing paths based on the offset metadata.

## Summary

Offset Metadata Storage enriches message processing by allowing custom metadata to be attached to message offsets, providing additional context for enhanced monitoring, debugging, and complex workflow orchestration. This feature supports flexible metadata access within consumer instances and across application components, ensuring precise retrieval and management of offset metadata.

## See also

- [Offset management](Offset-management) - Standard offset management
- [Pro Virtual Partitions](Pro-Virtual-Partitions) - Parallel partition processing
