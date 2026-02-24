Staying informed and adjusting to real-time changes is critical in the dynamic data processing world. Karafka's Inline Insights provides a way to enhance your data processing capabilities by allowing your consumers to adjust their actions based on real-time metrics. Whether dealing with lag or responding to specific partition data changes, Inline Insights empowers developers to have a more hands-on and responsive approach. By tapping into this feature, you can ensure your system runs efficiently and adapts swiftly to any incoming data fluctuations.

## Using Inline Insights

To get started, incorporate the `inline_insights` definition for the desired topics in your setup:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      inline_insights(true)
    end
  end
end
```

After activating Inline Insights, your consumer gets supercharged with two additional methods:

- `#insights?` - A straightforward boolean method indicating whether Karafka possesses metrics for the current topic partition.
- `#insights` - A handy method that fetches a hash filled with Karafka statistics about the current topic partition in the context of its consumer group.

Below, you can find an example consumer that is lag aware to optimize its operations accordingly:

```ruby
# This consumer adjusts buffering based on lag: quick flushes for minimal lags
# and batched flushes during heavy lags to optimize IO.
class LogEventsConsumer < ApplicationConsumer
  # Defines the threshold for significant lag.
  LAG_THRESHOLD = 100_000

  # Sets the minimum buffer size before flush. under lag
  FLUSH_THRESHOLD = 20_000

  def initialized
    @buffer = InMemoryDbFlushingBuffer.new
  end

  def consume
    @buffer << messages.payloads  # Data is always buffered.

    # Remember that insights might not always be available immediately after consumer initiation.
    current_lag = insights? ? insights.fetch('consumer_lag') : 0

    # Buffering decisions are made based on current lag and buffer size.
    return if current_lag > LAG_THRESHOLD && @buffer.size < FLUSH_SIZE

    @buffer.flush
    mark_as_consumed(messages.last)
  end

  def shutdown
    @buffer.flush
    mark_as_consumed messages.last
  end
end
```

## Insights Runtime Availability

Upon establishing a connection with Kafka, it is essential to understand that metrics related to Inline Insights might not be immediately accessible. This delay is attributed to the way Karafka fetches and computes these metrics. By default, the metrics are calculated at intervals of 5 seconds.

Furthermore, depending on the version of Kafka you are using and other underlying factors, the availability of insights, especially during the first batch processing, may vary. This means that for a brief period after connecting, your consumers might not be insight-aware and insights will be empty.

```ruby
class LogEventsConsumer < ApplicationConsumer
  def process
    if insights?
      process_with_insights_awareness(messages)
    else
      process_with_default_flow(messages)
    end
  end
end
```

### Crucial Insights Presence with Karafka Pro

For scenarios where the presence of insights is vital for the functioning of your system, we recommend upgrading to [Karafka Pro](https://karafka.io/#become-pro). With its extended capabilities regarding Inline Insights, you can ensure that insights are always available when you need them.

In Karafka Pro, there's an option to define in the routing that insights are mandatory for a specific topic. When this setting is activated, Karafka will hold back and not consume any data from the specified topic partition until the necessary metrics are present. This guarantees that your consumers are always operating with the insights they require, ensuring optimized data consumption and processing. You can read more about this capability [here](Pro-Enhanced-Inline-Insights).

## Insights Freshness

When metrics related to Inline Insights are requested for the first time during a given batch processing, they become "materialized". This means that the metrics become tangible and ready for the system to leverage. One significant aspect to note is that once these metrics are materialized, they remain consistent throughout the data consumption process until new metrics become available. This means that metrics may be updated while you are processing the data. Metrics, however, will never disappear, meaning you can rely on their presence if you have a metrics state. They may be updated, but they will not disappear.

```ruby
# Simulate slow processing on a regular (non LRJ) consumer
class LogEventsConsumer < ApplicationConsumer
  def process
    before = insights

    messages.each do |message|
      puts message.payload
      sleep(10)
    end

    after = insights

    # This will never raise - metrics will always be the same during processing
    raise if before != after
  end
end
```

## Behaviour on Revocation

Insights are only collected for partitions a given consumer owns. This means that if a consumer does not have ownership of a particular partition, no insights will be collected. This design ensures that the metrics are always pertinent and directly related to the partitions being consumed, maintaining the relevance and efficiency of the insights provided.

There can be scenarios where a partition might be involuntarily revoked from a consumer by Kafka. In such events, rather than leaving the consumer without any insights, Karafka takes a proactive approach. Karafka will provide the last known metrics before the partition was forcefully revoked. This is paramount as it ensures that metrics are consistently available to the consumer, even during unforeseen Kafka operations.

Karafka ensures that consumers can continue processing with insights throughout their entire operation by ensuring the continuous availability of metrics, even post-revocation. This approach minimizes disruptions and ensures consumers won't be left operating without metrics even if Kafka alters assignments.

## Memory Footprint

One of the primary considerations for any system is the memory footprint of its features, and Karafka's Inline Insights is no exception. The insights occupy 4KB of space for a single topic partition. Thus, even if you have a multitude of partitions, the memory footprint remains low, enabling you to leverage insights without significantly impacting your system's performance.

### Insights Tracker Cache Management

The Karafka Inline Insights Tracker is designed with optimal memory usage in mind. It employs a caching system that retains metrics data for up to 5 minutes. This means that any metric data related to a partition that is no longer relevant or needed - like when a partition is lost or revoked - will be automatically cleared from the cache after a maximum of five minutes. This cache management approach ensures that memory is used efficiently, keeping only relevant and recent metrics in memory and preventing accumulating stale or unnecessary data.

## Example Use Cases

1. E-Commerce Inventory Management: In an e-commerce platform, inventory levels for hot-selling products are crucial. If there is a sudden surge in orders for a product, inventory levels need to be updated in real time to prevent overselling. Insights-aware consumers can monitor the lag in the inventory update partition. If the lag increases beyond a threshold, indicating potential discrepancies between actual and recorded inventory, the consumer can notify the inventory management system to pause new orders temporarily.

2. Financial Transactions Processing: In a digital banking platform, processing financial transactions in real time is crucial for maintaining customer trust. By monitoring partitions related to transaction processing, insights-aware consumers can detect lags or errors. If a particular partition starts showing a significant lag, the system can prioritize it or reroute the traffic to ensure transactions are processed in real time.

3. Real-time Health Monitoring Systems: In health tech, wearable devices send continuous data about a user's health metrics. Any delay in processing this data can be critical. If the consumer detects a lag in a partition related to a particular user or set of users, it can prioritize this data. For instance, the system can't afford a delay if a heart monitor shows irregular patterns with insights. Such critical data can be processed on priority.

4. Financial Trading Platforms: In stock trading applications where milliseconds matter, lag awareness can trigger rapid response mechanisms to adjust trading algorithms or halt specific activities when real-time data metrics indicate potential issues.

In each of these business scenarios, the ability of Karafka's insights-aware consumers to adapt in real-time based on partition metrics can play a critical role in maintaining efficient operations, ensuring customer satisfaction, and even averting crises.

## Summary

Karafka's Inline Insights is a powerful feature that enhances data processing capabilities by allowing consumers to adapt based on real-time metrics. By integrating Inline Insights, developers can address issues such as lag or respond promptly to specific partition data changes, ensuring an efficient and swift adaptation to data fluctuations.

---

## See Also

- [Pro Enhanced Inline Insights](Pro-Enhanced-Inline-Insights) - Advanced inline insights with enhanced metrics and performance tracking
- [Monitoring and Logging](Operations-Monitoring-and-Logging) - Comprehensive monitoring and logging strategies for Karafka applications
