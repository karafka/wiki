The Adaptive Iterator is a Karafka Pro feature designed to proactively monitor the processing of messages within a batch to prevent exceeding Kafka's `max.poll.interval.ms`. By estimating the processing cost of each message and halting processing when the remaining time is insufficient, the Adaptive Iterator ensures smooth operation without exceeding Kafka's poll interval limit. This feature is particularly useful in environments where message processing times vary, and occasional long-processing times risk reaching the `max.poll.interval.ms`.

Consider the Adaptive Iterator as a solution when:

- Your application experiences occasional spikes in processing times that risk exceeding the Kafka poll interval.
- You want to ensure the consumer does not exceed the `max.poll.interval.ms`, preventing rebalancing and potential downtimes.
- You are processing messages one after another, as the Adaptive Iterator is designed to handle sequential message processing efficiently.

Do not use the Adaptive Iterator if:

- Your processing cost of a single message can exceed the `max.poll.interval.ms`.
- You are processing messages in batches instead of one after another, as the Adaptive Iterator is designed for individual message processing.
- You are using the [Virtual Partitions](Pro-Virtual-Partitions) feature, as it is not compatible with the Adaptive Iterator.
- Your application consistently handles long-running jobs. In that case, use the [Long-Running Jobs](Pro-Long-Running-Jobs) feature.
- Your consumer requires strict control over offset management outside the default provided by the Adaptive Iterator.

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/adaptive_iterator/flow.svg" />
</p>
<p align="center">
  <small>*Illustration presenting how Adaptive Iterator work.
  </small>
</p>

!!! tip "Handling Consistent Long-Running Jobs"

    Consider using Karafka's [Long-Running Jobs](Pro-Long-Running-Jobs) feature instead for consistently long-running jobs, as the Adaptive Iterator is primarily designed to handle sporadic long-processing cases.

## Benefits of Adaptive Iterator

- **Prevents Poll Interval Expiry**: Dynamically monitors the remaining time to avoid exceeding the Kafka poll interval, ensuring consumer group stability.

- **Seeks Back on Timeout**: When it determines that processing further messages in a batch could exceed the poll interval, it stops and seeks back, allowing the next poll to reset the timer.

- **Automated Handling**: Provides built-in capabilities for operations such as stopping processing if the consumer is revoked or auto-marking messages based on your configuration.

- **Configurable Safety Margin**: Allows configuring a safety margin to leave a buffer for post-processing activities, ensuring smooth handling of messages.

## Using Adaptive Iterator

To use the Adaptive Iterator in your consumer, you need to configure it at the topic level using the `adaptive_iterator` method. Here's how to do it:

### Enabling the Adaptive Iterator

The first step is to activate the Adaptive Iterator within the topic configuration in your consumer class. Below is an example:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      adaptive_iterator(
        active: true,
        safety_margin: 15, # 15% of time
        clean_after_yielding: true
      )
    end
  end
end
```

In this example, the Adaptive Iterator is activated with specific parameters. The `a`daptive_iterator` method takes several configuration options:

- `active`: Set this to true to enable the Adaptive Iterator for the topic.
- `safety_margin`: Defines the percentage of the total poll interval to reserve as a buffer. For instance, setting this to 15 leaves 15% of the time for post-processing, stopping further processing when 85% of the poll interval is used. The default is 10.
- `marking_method`: Specifies how messages are marked as consumed. The default method is `:mark_as_consumed`, but you can set it to `:mark_as_consumed!`.
- `clean_after_yielding`: Indicates whether to clean up after processing each message using the [Cleaner API](Pro-Cleaner-API). Set this to true if you want automatic cleanup after yielding.

### Processing Messages with the Adaptive Iterator

Once configured, the Adaptive Iterator wraps around the `#each` method used in your consume method. It monitors the time taken to process each message and calculates the remaining time within the Kafka poll interval. If it determines that there isn't enough time left to safely process more messages, it will stop and seek back to prevent exceeding the `max.poll.interval.ms`.

Here's an example of how you might use it:

```ruby
class MyConsumer < ApplicationConsumer
  def consume
    each do |message|
      # This block is monitored by the Adaptive Iterator for processing time
      process_message(message)
    end
  end

  private

  def process_message(message)
    # Your custom message processing logic here
  end
end
```

In this example, the iterator is configured with a safety margin of 20%, allowing a buffer to handle post-processing without exceeding the poll interval. It automatically marks messages as consumed and cleans up after each message, depending on the configuration.

!!! warning "Correct Iteration Method for Adaptive Iterator"

    When using the Adaptive Iterator, always use the consumer's `#each` method directly, as shown in the example, instead of iterating over `messages#each`. The Adaptive Iterator wraps both the messages and the consumer context, allowing it to accurately monitor processing time and handle tasks like stopping, seeking, and offset marking. Using `messages#each` bypasses this wrapping, preventing the Adaptive Iterator from functioning.

## Stopping and Seeking Back Implications

The Adaptive Iterator is designed to monitor message processing times and stop processing when it approaches the Kafka poll interval limit, seeking back to the last unprocessed message. While this mechanism helps prevent exceeding the poll interval, it may impact performance and networking.

### Impact on Performance

The primary impact on performance arises when the Adaptive Iterator stops processing frequently and initiates a seek operation. Seeking is not a lightweight operation; it involves the consumer resetting its position in the partition, introducing a delay. If seeking happens with every batch, especially when `the max.poll.interval.ms` is set to a lower value (default is 5 minutes), this overhead can become significant.

However, it's important to note the relative impact of seeking in the context of typical configurations. Assuming that seeking back takes approximately 5 seconds, this delay is still only around 2% of the total processing time if the safety margin is set to 10% of the poll interval. In cases where the interval is longer and seeking happens infrequently, this impact is minimal.

The performance hit becomes more noticeable if seeking occurs with every batch, which can lead the consumer to spend a disproportionate amount of time managing offsets instead of processing messages, ultimately reducing throughput. Thus, the key consideration is the frequency of seeking and the `configured max.poll.interval.ms` - the lower the interval, the higher the relative cost of frequent seeks. Proper configuration of the safety margin is crucial to balance processing efficiency against the risk of exceeding the poll interval.

### Impact on Networking

Frequent use of the Adaptive Iterator may have significant implications for networking, primarily due to increased communication with Kafka brokers. Each time the iterator stops processing and seeks back, it requires an update to the consumer's offset and the refetching of messages. In high-throughput environments, these operations can introduce a considerable increase in network traffic, as each one involves a network round trip between the consumer and the broker.

Moreover, the Adaptive Iterator's frequent stopping and resetting cause the consumer to poll the Kafka broker more often, generating additional network activity. If the safety margin is too tight or if message processing times are highly variable, this can result in a large volume of polling requests, further adding to the network load. This behavior not only impacts the network usage of individual consumers but also places additional strain on Kafka brokers. The cumulative effect of frequent seeks and polling can affect the overall responsiveness and stability of the consumer group, particularly in high-traffic environments where multiple consumers are using the Adaptive Iterator simultaneously.

## Summary

While the Adaptive Iterator is an effective tool for managing sporadic long-processing messages, it introduces trade-offs in terms of performance and networking. The frequent stopping and seeking back can reduce processing efficiency, increase network traffic, and place a higher load on Kafka brokers. To minimize these impacts, it's crucial to carefully configure the safety margin and use the Adaptive Iterator in situations where processing times are relatively predictable, with only occasional spikes. For environments with consistently long processing times or high variability, consider using other features like Long-Running Jobs to maintain optimal performance and network usage.

---

## See Also

- [Pro Iterator API](Pro-Iterator-API) - Iterator API documentation
- [Pro Long-Running Jobs](Pro-Long-Running-Jobs) - Handling long-running workloads
- [Consuming Messages](Consuming-Messages) - Message consumption basics
