Karafka Multiplexing is designed to boost the efficiency and performance of message processing in Kafka. Allowing a single process to establish multiple independent connections to the same Kafka topic significantly enhances parallel processing and throughput.

Multiplexing in Karafka enables more effective data handling and improves performance by dividing the workload across several connections. This approach ensures quicker data processing, better resource utilization, and increased fault tolerance, making your Kafka-based systems more robust and responsive.

Multiplexing increases throughput and significantly enhances processing capabilities in scenarios with multi-partition lags. When a single process subscribes to multiple partitions, it can swiftly address lags in any of them, ensuring more consistent performance across your system. This advantage becomes particularly prominent in IO-intensive workloads where efficient data handling and processing are crucial.

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
    subscription_group 'events', multiplex: 2 do
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
    subscription_group 'main', multiplex: 2 do
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

Once you have configured multiplexing in your routing settings, no additional steps are required for it to function. Your application will start processing messages from multiple partitions simultaneously, leveraging the benefits of multiplexing immediately and seamlessly.

## Multiplexing vs. Virtual Partitions

Deciding between Multiplexing and Virtual Partitions isn't a strict either/or scenario; in fact, they can be complementary. While Virtual Partitions parallelize single-topic processing without extra Kafka connections, Multiplexing increases throughput by allowing a consumer to handle multiple partitions. Together, they can enhance capabilities, especially in IO-intensive workloads. For instance, with a concurrency of ten, you might use two Kafka connections and virtualize each into five virtual partitions. This approach leverages both strategies for optimal performance, adapting to your application's needs, data intricacies, and anticipated load.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    subscription_group multiplex: 2 do
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

## Multiplexing Memory Usage Implications

TBA

## Example Use Cases

- **High-Volume Data Streams**: For applications dealing with massive influxes of data, multiple connections can fetch data concurrently, reducing latency and preventing bottlenecks.

- **Resource Optimization**: Distribute the load across multiple connections to utilize system resources more effectively, ensuring no single connection becomes a strain point.

- **Improved Fault Tolerance**: With multiple connections, if one fails, others continue processing, providing higher availability and reliability.

- **Enhanced Throughput**: For systems requiring high throughput, multiple connections can collectively handle more messages per second than a single connection.

## Summary

Karafka Multiplexing is a powerful tool designed to enhance the performance of your Kafka-based applications, especially under heavy load. Allowing multiple connections to the same topic from a single process provides a robust solution for handling high-volume data streams, optimizing resources, and ensuring high availability. Whether you're dealing with fluctuating workloads, aiming for high throughput, or seeking to improve fault tolerance, Multiplexing can provide significant benefits.
