Karafka's Expiring Messages feature allows messages to be excluded from processing automatically in case they are too old. This feature is helpful in scenarios where messages become irrelevant or outdated after a specific time frame.

To use the Expiring Messages feature in Karafka, you can specify the message expiration time in your routing. Once the specified time has elapsed, the message is automatically ignored and will not reach the consumer. Karafka provides the ability to configure the default message expiration time for all messages in a topic.

## How does it work

Karafka's Expiring Messages filtering process takes place before the virtual partitioning (if applicable) and dispatching of messages to consumers. This helps optimize resource utilization, particularly CPU usage, as consumers receive sets of messages that are already filtered.

By filtering messages before they are partitioned and dispatched, Karafka reduces the number of messages that need to be processed by each consumer. This approach ensures that only relevant and recent messages are dispatched to consumers, making it easier for them to process the data and reducing the overall processing load on the system. This optimization helps in improving the performance of the overall system and enables more efficient data processing.

## Enabling Expiring Messages

To enable the Expiring Messages feature in Karafka, you need to add the `expire_on` option to your Karafka routing configuration. Here's an example of how to do that:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders do
      consumer OrdersConsumer
      # Skip processing of messages that would be older than 1 hour
      expire_in(60 * 60_000)
    end
  end
end
```

## Behaviour on errors

Karafka's Expiring Messages feature ensures that failed messages are reprocessed after a short period. However, if the failed messages become too old, Karafka will skip them. This is because the Expiring Messages feature in Karafka automatically filters out messages that are older than the defined period. Therefore, if a failed message becomes older than the expiry period, it will not be included in the batch of messages that Karafka processes again. This is a design decision made to optimize resource utilization and prevent the processing of stale or irrelevant data.

It is important to note that this behavior can be adjusted by changing the expiry period for messages in the configuration settings. It is also essential to ensure that the message expiry period is set to a value appropriate for the use case. For example, suppose the processing time for messages is expected to be longer than the expiry period. In that case, it may be necessary to increase the expiry period to ensure that failed messages are not skipped.

## Limitations

When a Karafka consumer process is heavily saturated, and there are more jobs in the internal queue than threads available, processing lag is risky. This means there may be a delay between when a message is polled and when it is processed. In some cases, the delay can be long enough that messages that were polled but not yet processed can go beyond the expiration time.

The delay occurs due to the nature of the Karafka consumer processing flow. When messages are polled, they are subject to filtering before they are dispatched for processing. This filtering process, along with the dispatching and processing itself, can take some time, mainly when a large number of messages are being processed at once. If the number of jobs in the internal queue exceeds the number of available threads, then some messages will need to wait for processing, leading to processing lag. This lag can be mitigated by increasing the number of threads available for processing, but this may not be possible in some cases, such as with resource constraints.

If case of such scenarios, we recommend running second-stage filtering to ensure that at the moment of processing particular messages, they are not expired.

## Example use-cases

- Email dispatch: In email dispatch applications, the expiring consumption of Kafka messages can be used to prevent sending emails based on old events. For example, skipping messages that would dispatch emails that would no longer be relevant or useful, such as promotions or marketing campaigns that have already ended.

- Push notifications: In e-commerce applications, the expiring consumption of Kafka messages can be used to prevent sending push notifications based on old events. For example, skipping events that would trigger outdated push notifications to the user, such as a reminder to complete a no longer-relevant purchase.

- Log analysis: In log analysis applications, the expiring consumption of Kafka messages can be used to prevent the processing of old logs that are no longer useful. For example, skipping logs that are older than a certain age or logs that have already been analyzed and processed.
