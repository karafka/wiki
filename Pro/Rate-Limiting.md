Rate Limiting mechanism that allows controlling the speed at which messages are consumed from a Kafka topic. By limiting the consumption rate, Karafka can reduce the impact of high message throughput on the CPU and other resources, preventing a potential bottleneck in the processing pipeline.

The Rate Limiting mechanism in Karafka is implemented using a window throttler that monitors the message consumption rate and pauses the consumption of a given topic partition when the configured limit is reached. The window throttler maintains a sliding window of the last processed messages and calculates the consumption rate by dividing the number of messages consumed in the window by the window size. If the consumption rate exceeds the configured limit, the throttler pauses the consumption of the topic for some time until the consumption rate falls below the limit.

The Rate Limiting feature in Karafka can be configured on a per-topic basis. This means that different topics can have different consumption limits depending on the message volume and processing requirements. For example, a high-priority topic can have a lower limit than a low-priority topic to ensure that important messages are processed faster.

## Enabling Rate Limiting

To enable the Rate Limiting feature in Karafka, you need to add the `throttle` option to your Karafka routing configuration. Here's an example of how to do that:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders do
      consumer OrdersConsumer
      # Allow for processing of at most 100 messages
      # in a 60 second rolling window
      throttle(limit: 100, interval: 60_000)
    end
  end
end
```

!!! Warning "Rate Limiting Impact on Internal Queues"

    When using Rate Limiting, be aware it uses `#pause`, which will purge your internal message queue. This occurs because `#pause` is a fencing mechanism, invalidating all messages in the queue. To mitigate excessive network traffic due to re-fetching of messages, consider lowering the `queued.max.messages.kbytes` value. You can read more about this [here](https://karafka.io/docs/Pausing-Seeking-and-Rate-Limiting/#pause-and-seek-usage-potential-networking-impact).

## Behaviour on errors

When an error occurs during message processing in Karafka, the Rate Limiting feature behaves in a way that ensures that the same message is not re-processed immediately. Instead, Karafka waits for a configurable period (known as the "backoff") before retrying the message.

During this retry interval, the message is not counted towards the rate limiting, so it does not contribute to the overall message processing rate. Once the retry interval has elapsed, Karafka will attempt to process the message again, and it will count towards the overall rate limiting as usual.

## Limitations

While a powerful tool, the Rate Limiting API in Karafka has a few limitations and nuances worth knowing:

- Due to its reliance on the `#pause` method, especially for short durations, usage of the Rate Limiting API can inadvertently lead to significant network traffic. This arises because Karafka tries to replenish its internal buffer after resuming from a pause. When this behavior is frequent, it results in redundant fetching of the same data repeatedly, creating unnecessary network load. For a more detailed explanation of the impact of the `#pause` method on networking and its potential consequences, you can read more [here](https://karafka.io/docs/Pausing-Seeking-and-Rate-Limiting/#pause-and-seek-usage-potential-networking-impact).

- Rebalance in the Kafka cluster will reset the Rate Limiting mechanism in Karafka. This happens because rebalancing can cause a redistribution of partitions between the consumer group members, affecting the consumption rate. However, Karafka provides an advanced filtering API that allows extending the throttler to prevent reset on rebalancing as long as the same process will receive the same assignment back. This feature can be helpful in scenarios where the consumer group members are frequently rebalanced, and the Rate Limiting mechanism needs to maintain its state across rebalances.

## Example Use Cases

Here are some real-life examples of how Karafka's Rate Limiting feature can be useful across different industries:

- General: Limiting the incoming message rate to match the external HTTP API limit that the system needs to call per each received message.

- Finance: Limiting the rate of incoming financial transactions to a trading platform to prevent resource exhaustion and ensure timely processing.

- Social Media: Controlling the rate of incoming messages from a social media platform's real-time feed to prevent overwhelming the processing pipeline.

- Retail: Throttling the pace of incoming orders in an e-commerce application to prevent inventory discrepancies and order processing delays.

- Advertising: Regulating the flow of ad impressions data from multiple ad exchanges to a centralized data analytics platform to prevent resource exhaustion and ensure timely analysis.

- Transportation: Controlling the rate of incoming vehicle telemetry data in a connected car platform to prevent resource exhaustion and ensure timely processing.

## Summary

In summary, the Rate Limiting mechanism in Karafka provides a flexible way to control the message consumption rate from Kafka topics, improving the scalability and resilience of message-based applications. By configuring the limits on a per-topic basis and using advanced filtering APIs, Karafka can adapt to different processing requirements and handle dynamic changes in the Kafka cluster topology.
