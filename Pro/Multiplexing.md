Karafka Multiplexing is designed to boost the efficiency and performance of message processing in Kafka. Allowing a single process to establish multiple independent connections to the same Kafka topic significantly enhances parallel processing and throughput.

Multiplexing in Karafka enables more effective data handling and improves performance by dividing the workload across several connections. This approach ensures quicker data processing, better resource utilization, and increased fault tolerance, making your Kafka-based systems more robust and responsive.

Multiplexing increases throughput and significantly enhances processing capabilities in scenarios with multi-partition lags. When a single process subscribes to multiple partitions, it can swiftly address lags in any of them, ensuring more consistent performance across your system. This advantage becomes particularly prominent in IO-intensive workloads where efficient data handling and processing are crucial.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/multiplexing/500k_lag.png" />
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

!!! notice "Proper Placement of `#multiplexing` configuration"

    The `#multiplexing` method must be used exclusively within a `#subscription_group` block. It is not suitable for routing without an explicit subscription group definition.

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

Once you have configured multiplexing in your routing settings, no additional steps are required for it to function. Your application will start processing messages from multiple partitions simultaneously, leveraging the benefits of multiplexing immediately and seamlessly.

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
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/multiplexing/flow.svg" />
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

### Benefits of the Dynamic Approach:

- **Efficiency and Performance**: By optimizing resource use and ensuring each connection has a balanced share of partitions, Karafka maintains high efficiency and performance even as data volumes and structures change.

- **Cost-Effectiveness**: Reduces operational costs by using resources only when necessary and as dictated by the structure and distribution of Kafka partitions.

- **Scalability**: Supports the dynamic and fluctuating nature of distributed data systems without manual intervention, ensuring that the system can seamlessly adapt to varying partition loads.

- **Improved Parallelism**: Enhances the system's ability to process data concurrently across multiple partitions and topics, resulting in faster processing times and higher throughput.

### Conclusion

Dynamic Multiplexing feature in Karafka represents a refined approach to managing connections with Kafka clusters. By focusing on partition assignments, Karafka ensures that resources are utilized efficiently, balancing performance needs with cost and resource conservation. This feature is handy for large-scale, distributed applications where partition loads vary significantly.

## Multiplexing Memory Usage Implications

When employing Multiplexing, one must be aware of the potential impact on memory usage. Each additional connection established by a process consumes more memory as it maintains its own set of buffers, offsets, and other metadata related to its subscribed topics. In scenarios where many connections are established to handle high volumes of data, the memory footprint can increase significantly.

This increased memory usage is particularly notable when messages are large or when a high volume of messages is being processed. The system needs to keep track of each message until it's successfully processed and acknowledged. We highly recommend using Multiplexing together with the [Cleaner API](Pro-Cleaner-API) when possible.

## Example Use Cases

- **High-Volume Data Streams**: For applications dealing with massive influxes of data, multiple connections can fetch data concurrently, reducing latency and preventing bottlenecks.

- **Resource Optimization**: Distribute the load across multiple connections to utilize system resources more effectively, ensuring no single connection becomes a strain point.

- **Improved Fault Tolerance**: With multiple connections, if one fails, others continue processing, providing higher availability and reliability.

- **Enhanced Throughput**: For systems requiring high throughput, multiple connections can collectively handle more messages per second than a single connection.

## Summary

Karafka Multiplexing is a powerful tool designed to enhance the performance of your Kafka-based applications, especially under heavy load. Allowing multiple connections to the same topic from a single process provides a robust solution for handling high-volume data streams, optimizing resources, and ensuring high availability. Whether you're dealing with fluctuating workloads, aiming for high throughput, or seeking to improve fault tolerance, Multiplexing can provide significant benefits.
