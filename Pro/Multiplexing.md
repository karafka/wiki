Karafka Multiplexing is designed to enhance the efficiency and performance of message processing in Kafka by enabling a single process to establish multiple independent connections for the same consumer group. This significantly enhances parallel processing and throughput by creating separate polling streams for different partitions.

!!! warning "Understanding Connection Impact"

    **Multiplexing may increase your total connection count.** Each `multiplexing(max: N)` setting creates up to N connections per subscription group. The formula for maximum possible connections is:

    ```
    Max Connections = Consumer Groups × Subscription Groups × Multiplexing Factor
    ```

    If connection count is a primary concern, consider the optimization strategies outlined in this document before implementing multiplexing.

Multiplexing enables more effective data handling and improves performance by dividing the workload across several connections. This approach provides:

- **Partition Isolation**: Each connection handles a subset of partitions, ensuring that lag in one doesn't halt polling of others
- **Breaking Prefetch Patterns**: Under heavy load, librdkafka tends to prefetch large batches from single partitions; multiplexing breaks this pattern for more even distribution
- **Better Work Distribution**: Processing becomes more balanced across partitions, even when data waits in internal queues

Multiplexing increases throughput and significantly enhances processing capabilities in scenarios with multi-partition lags. When a single process subscribes to multiple partitions, it can swiftly address lags in any of them, ensuring more consistent performance across your system. This advantage becomes particularly prominent in IO-intensive workloads where efficient data handling and processing are crucial.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/multiplexing/500k_lag.png" />
</p>
<p align="center">
  <small>*This example illustrates the performance difference for IO intense work, where the IO cost of processing a single message is 1ms and a total lag of 500 000 messages in five partitions.
  </small>
</p>

## Enabling Multiplexing

To enable multiplexing in Karafka, a simple yet crucial step must be taken when defining your subscription groups. By providing the `multiplex` option within your subscription group definition, you instruct Karafka to initiate multiplexing for that particular group:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    # Always establish two independent connections to this topic from every
    # single process. They will be able to poll and process data independently
    subscription_group 'events' do
      multiplexing(max: 2)

      topic :events do
        consumer EventsConsumer
      end
    end
  end
end
```

Multiplexing also works for subscription groups with multiple topics:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    # Always establish two independent connections to those topics from every
    # single process. They will be able to poll and process data independently
    subscription_group 'main' do
      multiplexing(max: 2)

      topic :events do
        consumer EventsConsumer
      end

      topic :notifications do
        consumer NotificationsConsumer
      end
    end
  end
end
```

!!! note "Proper Placement of `#multiplexing` configuration"

    The `#multiplexing` method must be used exclusively within a `#subscription_group` block. It is not suitable for routing without an explicit subscription group definition.

    ```ruby
      routes.draw do
        # This will NOT work - will raise undefined method
        multiplexing(max: 2)

        # Always define your subscription group and apply multiplexing directly on it
        subscription_group :main do
          multiplexing(max: 2)

          topic :events do
            consumer EventsConsumer
          end
        end
      end
    ```

Once you have configured multiplexing in your routing settings, no additional steps are required for it to function. Your application will start processing messages from multiple partitions simultaneously, leveraging the benefits of multiplexing immediately and seamlessly.

### Configuration API

The actual multiplexing API provides these options:

```ruby
subscription_group 'events' do
  multiplexing(
    min: 1,    # Minimum connections (for dynamic mode)
    max: 3,    # Maximum connections
    boot: 2    # Connections to start with (dynamic mode)
  )

  topic :events do
    consumer EventsConsumer
  end
end
```

The following configuration options are available:

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
      <td><code>min</code></td>
      <td>Integer, nil</td>
      <td><code>nil</code> (sets to <code>max</code>)</td>
      <td>The minimum multiplexing count. Setting this to <code>nil</code> or not setting it at all will set it to the <code>max</code> value, effectively turning off dynamic multiplexing and ensuring a stable number of multiplexed connections.</td>
    </tr>
    <tr>
      <td><code>max</code></td>
      <td>Integer</td>
      <td>1</td>
      <td>The maximum multiplexing count. This defines the upper limit for the number of connections that can be multiplexed.</td>
    </tr>
    <tr>
      <td><code>boot</code></td>
      <td>Integer, nil</td>
      <td><code>nil</code> (defaults to half of <code>max</code> or <code>min</code> if <code>min</code> is set)</td>
      <td>Specifies how many listeners should be started during the boot process by default in the dynamic mode. If not set, it picks half of <code>max</code> as long as possible. Otherwise, it goes with <code>min</code>.</td>
    </tr>
  </tbody>
</table>

## Connection Optimization Strategies

If your goal is to **minimize connection count** while maintaining performance, consider these alternatives to multiplexing:

### Optimize librdkafka Prefetch Settings

This is the most effective approach for reducing the need for multiplexing without sacrificing performance:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      # Reduce aggressive prefetching that causes imbalance
      'fetch.max.bytes' => 1_048_576,         # 1MB (default: 50MB)
      'max.partition.fetch.bytes' => 131_072,  # 128KB (default: 1MB)
      'fetch.wait.max.ms' => 200,              # Lower latency for fairness

      # Control internal queuing
      'queued.min.messages' => 10_000,         # (default: 100,000)

      # Reduce network latency
      'socket.nagle.disable' => true           # Disable Nagle algorithm
    }
  end
end
```

### Use Virtual Partitions Instead of Multiplexing

For single-partition workloads, [Virtual Partitions](Pro-Virtual-Partitions) provide parallelism **without extra connections**:

```ruby
topic :single_partition_heavy_io do
  consumer OrderProcessor

  virtual_partitions(
    partitioner: ->(message) { message.headers['user_id'] },
    max_partitions: 5  # Parallel processing WITHOUT extra connections
  )
end
```

### Consolidate Consumer Groups

Use the [Admin API](Admin-API#copying-a-consumer-group) to merge consumer groups and reduce base connection count:

```ruby
# Migrate multiple groups into one to reduce base connection count
Karafka::Admin.seek_consumer_group(
  'old-consumer-group',
  { 'topic-name' => { 0 => 1000, 1 => 2000 } }
)
```

!!! note "When to Remove Multiplexing"

    If you remove multiplexing and replace it with kafka-scope settings, be aware that using per-topic `kafka` configurations may also create multiple subscription groups, potentially negating connection savings.

## Multiplexing vs. Virtual Partitions

Deciding between Multiplexing and Virtual Partitions isn't a strict either/or scenario; in fact, they can be complementary. While Virtual Partitions parallelize single-topic processing without extra Kafka connections, Multiplexing increases throughput by allowing a consumer to handle multiple partitions. Together, they can enhance capabilities, especially in IO-intensive workloads. For instance, with a concurrency of ten, you might use two Kafka connections and virtualize each into five virtual partitions. This approach leverages both strategies for optimal performance, adapting to your application's needs, data intricacies, and anticipated load.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    subscription_group do
      multiplexing(max: 2)

      topic :events do
        consumer EventsConsumer

        virtual_partitions(
          partitioner: ->(message) { message.headers['order_id'] },
          max_partitions: 5
        )
      end
    end
  end
end
```

## Dynamic Multiplexing

Aside from fixed connections multiplexing, Karafka provides a mode called "Dynamic". Dynamic multiplexing in Karafka is designed to optimize resource utilization and enhance system efficiency. Karafka's dynamic multiplexing adjusts the number of in-process connections based on partition assignments. This assignment-based scaling ensures a balanced and efficient distribution of resources.

It is essential to know the following facts about this mode of operations:

- **Assignment-Based Scaling**: The system dynamically adjusts connections based on the distribution of partition assignments. This ensures a more effective and targeted scaling strategy, directly aligning with Kafka's data structure and flow.

- **Selective Scaling vs. Partition Assignment**: When scaling, Karafka aims to balance the load across connections by evenly distributing partitions. For example, with 20 partitions and 2 processes set with multiplexing to 2, each connection manages 5 partitions. If scaled up to 20 processes, Karafka deactivates one connection from each process as each now manages one partition, ensuring efficient resource use and performance.

- **Delayed Decision Post-Rebalance**: To ensure stability and avoid premature scaling, any decision to change the number of connections is delayed by at least one minute following the cluster state change. This delay helps accommodate transient changes in partition assignments and maintains system equilibrium.

- **Resource Preservation**: By aligning the number of active connections with the number of partitions, Karafka prevents running extra threads and connections that are not needed, conserving vital system resources such as memory and CPU.

### How Does It Work?

Here's a breakdown of how it operates when the dynamic mode is enabled:

- **Initial Connection Setup**: Upon startup, Karafka initiates `boot` connections to Kafka or if not defined, half of available connections. This initial number is based on the configuration set for the multiplexing feature, representing the starting point for the dynamic scaling process.

- **Stabilization Period**: After establishing the initial connections, Karafka enters a stabilization period. It waits for at least one minute following the last rebalance. This waiting period allows the system to stabilize and ensures that decisions to scale down are not made prematurely, which might otherwise lead to unnecessary fluctuations and inefficiencies.

- **Selective Connection Shutdown**: Once the system has stabilized, Karafka begins monitoring the usage of each connection. If it identifies a connection that is not being used (i.e., no partitions are assigned), it will shut it down to conserve resources. However, it's crucial to note that Karafka is designed always to maintain at least `min` active connections, even if no partitions are currently assigned. This ensures that a line is always open to Kafka, ready to take on assignments if the need arises quickly.

- **Adaptive Scaling Up**: If any subscription group receives multiple assignments and the system has yet to reach the `max` number of active connections, Karafka will adaptively scale up the connections, one at a time. This gradual increase helps efficiently handle the increased load while avoiding abrupt changes that could lead to instability.

- **Guaranteed Connectivity**: At no point will there be a scenario where a given consumer group is left without connections. This persistent connectivity ensures that the consumer group is always able to receive and process messages, maintaining the flow of data and the system's reliability.

Dynamic Multiplexing in Karafka is about smartly adapting to the system's needs. It scales down to conserve resources when the load is low but remains ready to scale up as soon as the demand increases. This balance ensures that resources are used efficiently without compromising the system's ability to handle incoming data effectively. 

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/multiplexing/flow.svg" />
</p>
<p align="center">
  <small>*This diagram illustrates the upscaling and downscaling flow for dynamic multiplexing. 
  </small>
</p>

!!! note "Persistent Connection in Dynamic Mode"

    Even when operating in dynamic mode, Karafka maintains a minimum of `min` active connections to Kafka at all times for each multiplexed subscription group. This ensures continuous communication and readiness to handle assignments, even when no partitions are currently assigned to it. Karafka's design guarantees that at least one line is open to Kafka, preventing complete shutdown of connections and ensuring stable, ongoing operation.

!!! note "Controlled Connection Adjustments"

    Karafka uses a controlled approach to connection adjustments to maintain system stability when using Dynamic Multiplexing. Karafka will perform at most one change per minute for each consumer group. This deliberate pacing ensures that the system does not destabilize from rapid, frequent changes. As a result, while adapting to new conditions, the entire cluster may take some time to reach a stable and consistent state. This methodical approach is crucial for preserving the integrity and performance of the system as it dynamically adjusts to changing demands.

### Enabling Dynamic Multiplexing

There are two things you need to do to fully facilitate dynamic multiplexing:

1. Make sure you use `cooperative-sticky` rebalance strategy either globally or within the selected subscription group:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      # Other kafka settings...
      'partition.assignment.strategy': 'cooperative-sticky'
    }
  end

  routes.draw do
    # ...
  end
end
```

!!! warning "Always Use Cooperative-Sticky Rebalance with the Dynamic Mode"

    The `cooperative-sticky` rebalance strategy is strongly recommended for optimal performance in dynamic mode. Without it, every change in connection count (upscaling or downscaling) will trigger a consumer group-wide rebalance, potentially causing processing delays. 

    `cooperative-sticky` strategy minimizes these disruptions by allowing more gradual and efficient rebalancing, ensuring smoother operation and more consistent throughput.

!!! warning "Caution Against Using Dynamic Connection Multiplexing with Long-Running Jobs"

    Avoid dynamic connection multiplexing for long-running jobs to prevent frequent rebalances, which can disrupt processing and extend execution times. Use stable, dedicated connections for better reliability and efficiency.

2. Configure the `multiplexing` feature with a `min` flag set to a minimum number of connections you want to keep:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    # Establish at most three connections and shut down two if not needed. Start with 2.
    subscription_group 'events' do
      multiplexing(min: 1, max: 3, boot: 2)

      topic :events do
        consumer EventsConsumer
      end
    end
  end
end
```

### Benefits of the Dynamic Approach

- **Efficiency and Performance**: By optimizing resource use and ensuring each connection has a balanced share of partitions, Karafka maintains high efficiency and performance even as data volumes and structures change.

- **Cost-Effectiveness**: Reduces operational costs by using resources only when necessary and as dictated by the structure and distribution of Kafka partitions.

- **Scalability**: Supports the dynamic and fluctuating nature of distributed data systems without manual intervention, ensuring that the system can seamlessly adapt to varying partition loads.

- **Improved Parallelism**: Enhances the system's ability to process data concurrently across multiple partitions and topics, resulting in faster processing times and higher throughput.

### When to Use Multiplexing vs. Alternatives

**Use Multiplexing When:**

- High-volume, multi-partition scenarios where alternatives don't provide sufficient performance
- Connection count is not a primary constraint
- You need isolation between partition processing streams

**Consider Alternatives When:**

- Minimizing connection count is a priority
- Working with single-partition topics (use [Virtual Partitions](Pro-Virtual-Partitions) instead)
- librdkafka tuning can achieve similar fairness improvements

### Limitations

Below, you can find specific considerations and recommendations related to using dynamic mode multiplexing in Karafka.

#### Static Group Membership and Dynamic Mode Multiplexing

We do not recommend using static group membership with Multiplexing operating in Dynamic mode. Multiplexing in Dynamic mode involves frequent changes in group composition, which conflicts with the nature of static group membership that relies on stable consumer identities. This can lead to increased complexity and more prolonged assignment lags.

However, Multiplexing can be used without issues if Dynamic mode is not enabled. In this configuration, consumers maintain a more predictable group composition, which aligns well with the principles of static group membership and ensures a more stable and efficient operation.

### Conclusion

The Dynamic Multiplexing feature in Karafka represents a refined approach to managing connections with Kafka clusters. By focusing on partition assignments, Karafka ensures that resources are utilized efficiently, balancing performance needs with cost and resource conservation. This feature is handy for large-scale, distributed applications where partition loads vary significantly.

## Memory and Resource Considerations

### Connection Resource Usage

**With Multiplexing**: Each additional connection consumes more memory as it maintains its own set of buffers, offsets, and other metadata. For large message scenarios, use the [Cleaner API](Pro-Cleaner-API).

**Without Multiplexing**: Lower memory usage, but potentially less parallel processing capability. Compensate with:

- Higher [concurrency settings](Concurrency-and-Multithreading)
- [Virtual Partitions](Pro-Virtual-Partitions) for single-partition parallelism
- Better librdkafka tuning for fairness

### Memory Usage Impact

When employing Multiplexing, each additional connection established by a process consumes more memory as it maintains its own set of buffers, offsets, and other metadata related to its subscribed topics. In scenarios where many connections are established to handle high volumes of data, the memory footprint can increase significantly.

This increased memory usage is particularly notable when messages are large or when a high volume of messages is being processed. The system needs to keep track of each message until it's successfully processed and acknowledged. We highly recommend using Multiplexing together with the [Cleaner API](Pro-Cleaner-API) when possible.

## Example Use Cases

- **High-Volume Data Streams**: For applications dealing with massive influxes of data, multiple connections can fetch data concurrently, reducing latency and preventing bottlenecks.

- **Resource Optimization**: Distribute the load across multiple connections to utilize system resources more effectively, ensuring no single connection becomes a strain point.

- **Improved Fault Tolerance**: With multiple connections, if one fails, others continue processing, providing higher availability and reliability.

- **Enhanced Throughput**: For systems requiring high throughput, multiple connections can collectively handle more messages per second than a single connection.

## Summary

Karafka Multiplexing is a powerful tool designed to enhance the performance of your Kafka-based applications, especially under heavy load. Allowing multiple connections to the same topic from a single process provides a robust solution for handling high-volume data streams, optimizing resources, and ensuring high availability. Whether you're dealing with fluctuating workloads, aiming for high throughput, or seeking to improve fault tolerance, Multiplexing can provide significant benefits.
