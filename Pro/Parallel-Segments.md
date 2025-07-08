# Parallel Segments

Parallel Segments are a feature in Karafka that enables you to process data from a single topic partition across multiple processes simultaneously. This approach allows you to achieve horizontal scaling for CPU-intensive workloads that cannot be effectively parallelized using Virtual Partitions alone.

Unlike Virtual Partitions, which operate within a single consumer group and are optimized for IO-bound operations, Parallel Segments create multiple independent consumer groups that each process a subset of messages from the same topic partition. This makes it particularly effective for CPU-intensive processing scenarios where the computational overhead is the primary bottleneck, as well as in cases where data clustering makes Virtual Partitions ineffective.

## How Parallel Segments Work

Parallel Segments operate by splitting a single consumer group into multiple sub-groups, each identified by a unique segment ID. Each sub-group processes only the messages assigned to it based on a partitioning strategy you define. This allows multiple processes to work on different segments of the same partition's data simultaneously.

The key difference from Virtual Partitions is that each consumer group in the Parallel Segments setup maintains its connection to Kafka and downloads all messages from the topic partition. A filtering mechanism then determines which messages each segment should process based on your partitioning logic. 

## When to Use Parallel Segments

Parallel Segments are most beneficial in the following scenarios:

- **CPU-Intensive Processing**: When your message processing is primarily CPU-bound rather than IO-bound, and you need to distribute computational load across multiple processes
- **Complex Computations**: For workloads involving heavy mathematical calculations, data transformations, or algorithms that require significant CPU resources
- **High-Volume Processing**: When you need to process large volumes of messages and have multiple CPU cores or machines available
- **Grouped Message Processing**: When your batches contain large groups of messages with the same key (e.g., `user_id`, `session_id`) that cannot be effectively distributed via Virtual Partitions. Parallel Segments excel at filtering and processing these grouped messages at the consumer group level

## Basic Configuration

To enable Parallel Segments, you configure them at the consumer group level using the `parallel_segments` method:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Your configuration
  end

  routes.draw do
    consumer_group :analytics do
      parallel_segments(
        count: 4,
        partitioner: ->(message) { message.headers['user_id'] }
      )

      topic :user_events do
        consumer UserEventsConsumer
      end
    end
  end
end
```

!!! tip "Migration from Existing Consumer Groups"

    Parallel Segments are **not** plug-and-play when migrating from an existing consumer group to a parallel segments setup. If you're converting an existing consumer group to use parallel segments, you must use the CLI `distribute` command to ensure that the parallel segments start processing from the correct offsets for each topic and partition.

    Without running the distribution command, the parallel segment consumer groups will start from the beginning of each topic (or from the latest offset, depending on your configuration), potentially causing message reprocessing or missing messages.

    This CLI step is only required for migrations. If you're creating a new consumer group with parallel segments enabled from the start, no additional setup is needed.

## Configuration Options

The `parallel_segments` method accepts the following options:

<table>
    <tr>
        <th>Parameter</th>
        <th>Type</th>
        <th>Default</th>
        <th>Description</th>
    </tr>
    <tr>
        <td><code>count</code></td>
        <td>Integer</td>
        <td>1</td>
        <td>Number of parallel consumer groups to create. Must be at least 1. Setting to 1 disables parallel segments.</td>
    </tr>
    <tr>
        <td><code>partitioner</code></td>
        <td><code>#call</code></td>
        <td>nil</td>
        <td>A callable that determines which segment a message should be assigned to. Must respond to <code>#call</code> and accept a message as argument.</td>
    </tr>
    <tr>
        <td><code>reducer</code></td>
        <td><code>#call</code></td>
        <td>Auto-generated</td>
        <td>A callable that maps the partitioner result to a segment ID (0 to count-1). If not provided, defaults to <code>->(key) { key.to_s.sum % count }</code>.</td>
    </tr>
    <tr>
        <td><code>merge_key</code></td>
        <td>String</td>
        <td><code>-parallel-</code></td>
        <td>The string used to generate unique consumer group names for each segment.</td>
    </tr>
</table>

## Partitioning Strategies

The effectiveness of Parallel Segments depends heavily on your partitioning strategy. Since Parallel Segments work by filtering messages at the consumer group level prior to work delegation, choosing an optimal partitioner is crucial for both performance and proper data distribution.

!!! warning "All-at-Once Deployment Required for Partitioner/Reducer Changes"

   Any modifications to the `partitioner` or `reducer` configuration **must** be deployed using a non-rolling (full restart) deployment strategy. These components are critical to message routing logic, and changing them during a rolling deployment can lead to serious data consistency issues.

   **Potential Issues with Rolling Deployments:**

   - **Double Processing**: Messages may be processed by both old and new segment assignments
   - **Missing Data**: Some messages may not be processed by any segment during the transition
   - **Inconsistent State**: Different consumer instances using different routing logic simultaneously

   **Safe Deployment Process:**

   1. Stop all consumer processes for the affected consumer group
   1. Wait for all in-flight processing to complete
   1. Deploy the updated partitioner/reducer configuration
   1. Start all consumer processes with the new configuration

   This ensures all parallel segments use consistent message routing logic from the moment processing resumes.

### Performance Considerations

Parallel Segments work the best, when messages can be filtered prior to deserialization, which minimizes CPU overhead during the filtering process. To maximize this benefit, your partitioner should ideally use data that doesn't require payload deserialization.

#### Using Message Headers (Recommended)

The most efficient approach is to use Kafka message headers, which are available without triggering Karafka's lazy deserialization:

```ruby
consumer_group :user_analytics do
  parallel_segments(
    count: 4,
    # Efficient - uses headers, no deserialization required
    partitioner: ->(message) { message.headers['user_id'] }
  )

  topic :user_events do
    consumer UserEventsConsumer
  end
end
```

#### Using Message Key

The message key is another efficient option as it's readily available:

```ruby
consumer_group :order_processing do
  parallel_segments(
    count: 3,
    # Efficient - message key is immediately available
    partitioner: ->(message) { message.key }
  )

  topic :orders do
    consumer OrderProcessor
  end
end
```

#### Avoiding Payload-Based Partitioning

While possible, using the message payload for partitioning defeats part of the performance benefits of Parallel Segments since it forces deserialization in the main thread:

```ruby
consumer_group :analytics do
  parallel_segments(
    count: 4,
    # Inefficient - forces deserialization before filtering
    partitioner: ->(message) { message.payload['user_id'] }
  )

  topic :user_events do
    consumer UserEventsConsumer
  end
end
```

### Testing and Validating Distribution

It's crucial to test your partitioning strategy because the combination of your partitioner and the reducer may not distribute data evenly.

#### Understanding the Default Reducer

Parallel Segments use a two-step process:

1. **Partitioner**: Extracts a partition key from each message
2. **Reducer**: Maps the partition key to a segment ID (0 to count-1)

The default reducer is: `->(partition_key) { partition_key.to_s.sum % count }`

This can lead to sub-optimal behaviours where different partition keys map to the same segment.

#### Example of Reducer Collision

```ruby
# With segment count = 5, the default reducer may cause collisions:
consumer_group :analytics do
  parallel_segments(
    count: 5,
    partitioner: ->(message) { message.headers['user_id'] }
  )

  topic :user_events do
    consumer UserEventsConsumer
  end
end

# User IDs and their segment assignments with default reducer:
# user_id "0" -> "0".sum = 48 -> 48 % 5 = 3 (segment 3)
# user_id "5" -> "5".sum = 53 -> 53 % 5 = 3 (segment 3) ← collision!
# user_id "14" -> "14".sum = 101 -> 101 % 5 = 1 (segment 1)
# user_id "23" -> "23".sum = 101 -> 101 % 5 = 1 (segment 1) ← collision!
```

This means that despite configuring 5 segments, the data will only utilize 2 segments, leaving the remaining 3 segments idle as long as no other user IDs are present.

#### Custom Reducer for Better Distribution

If the default reducer doesn't provide good distribution, implement a custom one:

```ruby
consumer_group :analytics do
  parallel_segments(
    count: 5,
    partitioner: ->(message) { message.headers['user_id'] },
    # Custom reducer using hash for better distribution
    reducer: ->(partition_key) { Digest::MD5.hexdigest(partition_key.to_s).to_i(16) % 5 }
  )

  topic :user_events do
    consumer UserEventsConsumer
  end
end
```

### Best Practices

1. **Prefer Headers Over Payload**: Always use message headers or keys when possible to avoid forced deserialization
2. **Test Distribution**: Validate that your partitioner and reducer combination provides even distribution
3. **Consider Data Relationships**: Ensure related messages are routed to the same segment
4. **Monitor Segment Load**: Use logging to verify segments are receiving balanced workloads
5. **Start Simple**: Begin with straightforward partitioning strategies and optimize based on observed performance

## Partitioning Error Handling

Parallel Segments include error handling for partitioning and reduction operations:

If your partitioner or reducer throws an exception, Karafka will:

1. Emit an error event via `error.occurred` with type `parallel_segments.partitioner.error`
2. Assign the problematic message to a fallback segment (typically segment 0)
3. Continue processing other messages

If you do not want this automatic error recovery behavior, you need to catch and handle exceptions within your partitioner or reducer code. By handling errors yourself, you can control whether to fail fast, use alternative logic, or implement custom fallback strategies instead of relying on Karafka's default error handling.

## Consumer Group Naming

When you define a consumer group with Parallel Segments, Karafka automatically creates multiple consumer groups with unique names. For example:

```ruby
consumer_group :analytics do
  parallel_segments(count: 3)
  # ... topics
end
```

This creates three consumer groups:

- `analytics-parallel-0`
- `analytics-parallel-1`
- `analytics-parallel-2`

Each group processes only the messages assigned to its segment ID.

## Accessing Segment Information

You can access segment information within your consumer:

```ruby
class MyConsumer < ApplicationConsumer
  def consume
    segment_id = consumer_group.segment_id
    original_group = consumer_group.segment_origin
    
    Karafka.logger.info(
      "Processing #{messages.count} messages in segment #{segment_id} " \
      "of group #{original_group}"
    )
    
    messages.each do |message|
      process_message(message)
    end
  end
end
```

## Parallel Segments vs Virtual Partitions

While both features aim to increase parallelization, they operate at different layers and solve different problems:

### Operational Differences

- **Virtual Partitions**: Distribute messages from a single batch across multiple threads within the same consumer group. They excel at IO-bound workloads where each message or sub-batches can be processed independently

- **Parallel Segments**: Filter and distribute messages across multiple consumer groups before batch processing. They excel at CPU-bound workloads and scenarios where batches contain large groups of related messages

### When Parallel Segments Excel

Parallel Segments are particularly effective when dealing with batches that contain large groups of messages with the same key (e.g., `user_id`, `session_id`, `order_id`). Virtual Partitions may struggle to distribute such batches effectively since they cannot split groups of related messages that need to be processed together.

For example, if a batch contains 1000 messages where 800 belong to user_id `123` and 200 belong to user_id `456`, Virtual Partitions cannot effectively parallelize this work since the messages with the same `user_id` should be processed together. Even with `max_messages` set to 100, Virtual Partitions would still struggle because they cannot split the grouped messages across virtual partitions - each virtual partition would end up processing messages from the same user anyway, effectively removing any option for Virtual Partitions to parallelize the work. Parallel Segments solve this by filtering at the consumer group level - one segment processes all messages for user `123` while another processes messages for user `456`.

### Combining Both Features

Since Parallel Segments and Virtual Partitions operate at different layers, they can work together effectively:

- **First Layer (Parallel Segments)**: Filter and distribute messages across consumer groups based on logical grouping

- **Second Layer (Virtual Partitions)**: Further parallelize the filtered messages within each consumer group across multiple threads

This combination allows you to handle both grouped message scenarios and achieve fine-grained parallelization within each group.

## CLI

Karafka provides CLI commands to help you manage Parallel Segments consumer groups, particularly when migrating from regular consumer groups or when you need to collapse segments back to a single group.

### Available Commands

The Parallel Segments CLI provides three main commands:

<table>
 <thead>
   <tr>
     <th>Command</th>
     <th>Description</th>
     <th>Use Case</th>
   </tr>
 </thead>
 <tbody>
   <tr>
     <td><code>karafka parallel_segments distribute</code></td>
     <td>Distribute offsets from original consumer group to parallel segments</td>
     <td>Initial setup to enable parallel processing<br>• Moving from single consumer group to multiple segments<br>• Starting parallel processing for the first time</td>
   </tr>
   <tr>
     <td><code>karafka parallel_segments collapse</code></td>
     <td>Collapse parallel segments back to original consumer group</td>
     <td>Shutting down parallel processing<br>• Consolidating back to single consumer group<br>• Maintenance or troubleshooting scenarios</td>
   </tr>
   <tr>
     <td><code>karafka parallel_segments reset</code></td>
     <td>Reset (collapse then distribute) parallel segments</td>
     <td>Restarting parallel processing from scratch<br>• Fixing offset inconsistencies<br>• Reconfiguring segment distribution</td>
   </tr>
 </tbody>
</table>

### Command Options

All commands support the following options:

<table>
    <thead>
        <tr>
            <th>Option</th>
            <th>Description</th>
            <th>Example</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>--groups</code> or <code>--consumer_groups</code></td>
            <td>Names of consumer groups to operate on. If not provided, operates on all parallel segments groups.</td>
            <td><code>--groups analytics order_processing</code></td>
        </tr>
        <tr>
            <td><code>--force</code></td>
            <td>Force the operation even when conflicts are detected.</td>
            <td><code>--force</code></td>
        </tr>
    </tbody>
</table>

### Distribute Command

The `distribute` command helps you migrate from a regular consumer group to parallel segments by distributing the original consumer group's offsets across the parallel segment consumer groups.

```bash
# Distribute offsets for all parallel segments consumer groups
karafka parallel_segments distribute

# Distribute offsets for specific consumer groups only
karafka parallel_segments distribute --groups analytics order_processing

# Force distribution even if parallel segments already have offsets
karafka parallel_segments distribute --force
```

#### How Distribution Works

1. **Offset Collection**: Collects committed offsets from the original consumer group
2. **Validation**: Checks that parallel segment groups don't already have offsets (unless `--force` is used)
3. **Distribution**: Applies the original consumer group's offsets to all parallel segment groups
4. **Preservation**: Keeps the original consumer group intact as a backup

#### Example Migration Workflow

```ruby
# Original configuration
consumer_group :analytics do
  topic :user_events do
    consumer UserEventsConsumer
  end
end

# New configuration with parallel segments
consumer_group :analytics do
  parallel_segments(
    count: 4,
    partitioner: ->(message) { message.headers['user_id'] }
  )

  topic :user_events do
    consumer UserEventsConsumer
  end
end
```

After updating your configuration, run the distribution command:

```bash
karafka parallel_segments distribute --groups analytics
```

This will:
- Create consumer groups: `analytics-parallel-0`, `analytics-parallel-1`, `analytics-parallel-2`, `analytics-parallel-3`
- Set their offsets to match the original `analytics` consumer group
- Allow seamless continuation of processing from where the original group left off

### Collapse Command

The `collapse` command consolidates parallel segments back to the original consumer group by taking the lowest committed offset from all segments.

```bash
# Collapse all parallel segments consumer groups
karafka parallel_segments collapse

# Collapse specific consumer groups only
karafka parallel_segments collapse --groups analytics

# Force collapse even when offsets are inconsistent
karafka parallel_segments collapse --force
```

#### How Collapse Works

1. **Offset Collection**: Gathers committed offsets from all parallel segment groups
2. **Validation**: Ensures offsets are consistent across segments (unless `--force` is used)
3. **Lowest Offset Selection**: Selects the lowest committed offset for each topic partition
4. **Application**: Sets the original consumer group's offset to the lowest offset found

#### Important Considerations

- **Potential Reprocessing**: Using the lowest offset may cause some messages to be reprocessed
- **Offset Consistency**: Without `--force`, the command will fail if parallel segments have inconsistent offsets
- **Group Preservation**: Parallel segment groups are not automatically removed after collapse

### Reset Command

The `reset` command performs a complete reset by first collapsing parallel segments and then redistributing offsets:

```bash
# Reset parallel segments (collapse then distribute)
karafka parallel_segments reset --groups analytics
```

This is equivalent to running:

```bash
karafka parallel_segments collapse --groups analytics
karafka parallel_segments distribute --groups analytics
```

### Validation and Safety

The CLI commands include several safety mechanisms:

#### Offset Validation

```bash
# This will fail if parallel segments already have offsets
karafka parallel_segments distribute --groups analytics

# Error output:
# Parallel segment analytics-parallel-0 already has offset 1000 set for user_events#0
```

#### Consistency Checks

```bash
# This will fail if parallel segments have inconsistent offsets
karafka parallel_segments collapse --groups analytics

# Error output:
# Inconclusive offsets for user_events#0: 1000, 1050, 1100
# Parallel segments for analytics have inconclusive offsets
```

#### Force Override

Use `--force` to bypass safety checks:

```bash
# Force distribution even with existing offsets
karafka parallel_segments distribute --groups analytics --force

# Force collapse with inconsistent offsets (uses lowest)
karafka parallel_segments collapse --groups analytics --force
```

### Best Practices for CLI Usage

#### Migration Strategy

1. **Test First**: Always test the migration process in a non-production environment
2. **Backup Offsets**: Document current offsets before running any commands
3. **Monitor Progress**: Watch consumer lag and processing rates after migration
4. **Gradual Rollout**: Consider migrating one consumer group at a time

#### Monitoring After Migration

```ruby
class MyConsumer < ApplicationConsumer
  def consume
    # Log segment information for monitoring
    Karafka.logger.info(
      "Segment #{consumer_group.segment_id} processing #{messages.count} messages"
    )
    
    messages.each do |message|
      process_message(message)
    end
  end
end
```

#### Cleanup Strategy

After successful migration and operation, you may want to clean up:

```bash
# Remove original consumer group (optional)
# Note: This requires using Kafka's admin tools or Karafka's Admin API
# The CLI does not automatically remove consumer groups
```

## Bandwidth Considerations

The primary trade-off with Parallel Segments is network bandwidth usage. Since each consumer group downloads all messages from the topic partition, network traffic is multiplied by the number of segments. Consider this when:

- Using cloud-based Kafka services where you pay for network transfer
- Processing high-volume topics with large messages
- Operating in bandwidth-constrained environments

## Combining with Other Features

### Parallel Segments with Virtual Partitions

While not commonly needed, you can combine Parallel Segments with Virtual Partitions for extremely high-throughput scenarios:

```ruby
consumer_group :high_throughput do
  parallel_segments(
    count: 2,
    partitioner: ->(message) { message.headers['category'] }
  )

  topic :high_volume_data do
    consumer HighVolumeConsumer
    
    virtual_partitions(
      partitioner: ->(message) { message.headers['user_id'] },
      max_partitions: 4
    )
  end
end
```

### Parallel Segments with Dead Letter Queue

Parallel Segments work seamlessly with Dead Letter Queue:

```ruby
consumer_group :resilient_processing do
  parallel_segments(
    count: 3,
    partitioner: ->(message) { message.headers['type'] }
  )

  topic :risky_data do
    consumer RiskyDataConsumer
    
    dead_letter_queue(
      topic: 'failed_messages',
      max_retries: 3
    )
  end
end
```

## Conclusion

Parallel Segments provide a way to scale CPU-intensive message processing in Karafka. By distributing work across multiple consumer groups, you can achieve horizontal scaling for computationally heavy workloads while maintaining message ordering guarantees within each segment.

While the trade-off in network bandwidth usage is important to consider, the performance gains for certain workloads often justify this cost. Combined with Karafka's other features like Virtual Partitions, Dead Letter Queue, and monitoring, Parallel Segments offer a robust solution for high-throughput, CPU-intensive message processing scenarios.

Remember to leverage the CLI commands for smooth migrations and ongoing management of your parallel segments deployment. The safety mechanisms built into these commands help prevent common pitfalls and ensure reliable operation of your parallel processing infrastructure.
