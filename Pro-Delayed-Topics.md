Karafka's Delayed Topics is a feature that enables delaying message processing from specific topics for a specified time. It can be beneficial to delay message processing for various reasons. For example, to allow additional processing or validation time, avoid overloading the system during high-traffic periods, or provide a retry mechanism for failed messages. Delayed Topics offer greater flexibility and control over message processing.

One of the benefits of the Karafka Delayed Topic feature is that it allows for arbitrary delay without impacting the processing of other topics. 

Delay is implemented by pausing the consumption of the partitions for a specified amount of time. This means that there is no explicit sleep or anything of that nature involved that would clog or impact other topics' operations, and all the available resources are free to process messages that are not expected to be delayed.

This makes the Delayed Topic feature a great choice for applications that need to delay the processing of specific messages without impacting the processing of other messages in the system. By using Karafka's built-in partition pausing mechanism, delayed messages can be processed in a way that is both efficient and reliable.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/delayed_topics_flow.svg" />
</p>
<p align="center">
  <small>*Illustration presenting how Delayed Topics delays too young messages.
  </small>
</p>

## Enabling Delayed Topics

To enable the Delayed Topics feature in Karafka, you need to add the `delay_by` option to your Karafka routing configuration. Here's an example of how to do that:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders do
      consumer OrdersConsumer
      # Always delay processing messages from the orders topic by 1 minute
      delay_by(60_000)
    end
  end
end
```

**Note**: Please keep in mind, that the delay time needs to be provided in milliseconds

## Limitations

While the Karafka Delayed Topics feature provides a valuable way to delay message processing, it does have some limitations to keep in mind.

One significant limitation is that the delay is not always millisecond-precise. This is because the Delayed Topics feature works by pausing the processing of a given partition for a specified amount of time and then unpausing it after that time has elapsed. However, the unpausing happens before the polling happens, so there can be a slight delay between when the partition is unpaused and when the delayed message is processed.

This means that if you need millisecond-precise timing for your application, there may be better choices than Delayed Topics. However, this limitation is unlikely to be a significant issue for most use cases.

This limitation also means that messages may be delayed slightly more than the requirement minimum but will **never** be delayed less than expected.

## Example use-cases

Here are some potential use cases for Delayed Topics:

- General: By using Delayed Topics in conjunction with a Dead Letter Queue, you can create a more robust and dynamic system that is capable of handling a variety of failure scenarios and providing a more efficient and effective message processing system.

- Data crawling: The Delayed Topics feature can be helpful in data crawling applications, where immediately published data may not be immediately available due to HTTP caches. In such cases, it may be beneficial to delay the processing of messages for a fixed period, to ensure that all the caches have expired and the data is fully available. By using delayed processing, you can avoid processing incomplete or stale data and ensure that your application works with the latest, fully available information.

- E-commerce: Delay processing of orders for a short period to allow for cancellation or modification of orders by customers. During this delay, additional validation can be performed, such as stock availability or fraud detection. If there is a problem with processing an order, it can be moved to a Dead Letter Queue for reprocessing later.

- Social Media: Delay processing of user-generated content to allow for moderation by human teams before publishing. During the delay, messages can be stored in a separate queue and notified to moderators for review. If approved, the message can be moved to the main processing queue for publishing. The message can be moved to a Dead Letter Queue for further action if not approved.

- Finance: Delay processing of high-risk transactions to provide additional time for fraud detection. If a transaction is flagged as suspicious, it can be moved to a separate queue for human review. If a transaction fails to process due to a system error, it can be moved to a Dead Letter Queue for reprocessing at a later time.

- Real-Time Monitoring: Delay processing of real-time monitoring data to enable better performance and reduce network congestion. By batching data and delaying processing, it can be processed more efficiently and effectively, and results can be displayed to users in a more timely manner.

- Machine Learning: Delay processing of machine learning training data to avoid training on stale or inaccurate data. By delaying data processing, it is possible to ensure that the data used for training is up-to-date and accurate.

## Summary

Karafka's Delayed Topics is a powerful feature that allows for arbitrary delays when processing messages from specific topics. It can be used in various use cases, such as e-commerce, social media moderation, and finance. By delaying message processing, you can perform additional processing or validation, moderate user-generated content, and introduce a retry mechanism for failed messages. By using Delayed Topics in conjunction with a Dead Letter Queue, you can create a more robust and dynamic system that can handle various failure scenarios and detect potential fraud more effectively.
