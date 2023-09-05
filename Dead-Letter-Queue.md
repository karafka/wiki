The Dead Letter Queue feature provides a systematic way of dealing with persistent consumption errors that may require a different handling approach while allowing you to continue processing.

While consuming data, not everything may go as intended. When an error occurs in Karafka, by default, the framework will apply a back-off strategy and will try again and again. Some errors, however, may be non-recoverable. For example, a broken JSON payload will not be fixed by parsing it again. Messages with non-recoverable errors can be safely moved and analyzed later without interrupting the flow of other valid messages.

And this is where the Dead Letter Queue pattern shines.

A Dead Letter Queue in Karafka is a feature that, when enabled, will transfer problematic messages into a separate topic allowing you to continue processing even upon errors.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/dlq_example_flow.svg" />
</p>
<p align="center">
  <small>*This example illustrates a simple DLQ flow with a processing retry.
  </small>
</p>

## Using Dead Letter Queue

The only thing you need to add to your setup is the `dead_letter_queue` definition for topics for which you want to enable it:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        # Name of the target topic where problematic messages should be moved to
        topic: 'dead_messages',
        # How many times we should retry processing with a back-off before
        # moving the message to the DLQ topic and continuing the work
        #
        # If set to zero, will not retry at all.
        max_retries: 2
      )
    end
  end
end
```

Once enabled, after the defined number of retries, problematic messages will be moved to a separate topic unblocking the processing.

## Delaying the DLQ data processing

In some cases, it can be beneficial to delay the processing of messages dispatched to a Dead Letter Queue (DLQ) topic. This can be useful when a message has failed to be processed multiple times, and you want to avoid overwhelming the system with repeated processing attempts. By delaying the processing of these messages, you can avoid consuming valuable resources and prevent potential system failures or downtime.

Another benefit of delaying the processing of messages dispatched to a DLQ topic is that it can allow developers to investigate the underlying issues that caused the message to fail in the first place. With delayed processing, you can give your team time to investigate and address the root cause of the issue rather than simply reprocessing the message repeatedly and potentially compounding the problem.

Overall, delaying the processing of messages dispatched to a DLQ topic can help ensure the stability and reliability of your system while also giving your team the time and resources needed to address underlying issues and prevent future failures.

You can read more about the Karafka Delayed Topics feature [here](Pro-Delayed-Topics).

## Disabling retries

If you do not want to retry processing at all upon errors, you can set the `max_retries` value to `0`:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: 'dead_messages',
        max_retries: 0
      )
    end
  end
end
```

Messages will never be re-processed with the following settings and will be moved without retries to the DLQ topic.

## Disabling dispatch

For some use cases, you may want to skip messages after retries without dispatching them to an alternative topic.

This functionality is available in Karafka Pro, and you can read about it [here](Pro-Enhanced-Dead-Letter-Queue#disabling-dispatch).

## Dispatch warranties

Messages dispatched to the DLQ topic preserve both `payload` and `headers`. They do **not** follow any partitioning strategy and will be distributed randomly.

Please note that the original offset, partition, and topic information will **not** be preserved. If you need those, we recommend you use the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue).

If you need messages dispatched to the DLQ topic to preserve order, you either need to use a DLQ topic with a single partition, or you need to use the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) implementation.

## Manual DLQ dispatch

When the Dead Letter Queue is enabled, Karafka will provide you with an additional method called `#dispatch_to_dlq` that you can use to transfer messages to the DLQ topic. You can use it if you encounter messages you do not want to deal with but do not want to raise an exception:

```ruby
class OrdersStatesConsumer
  def consume
    messages.each do |message|
      if EventContract.valid?(message.payload)
        EventsImporter.import(message.payload)
      else
        # Skip on messages that are not valid without raising an exception
        dispatch_to_dlq(message)
      end

      mark_as_consumed(message)
    end
  end
end
```

## Monitoring and instrumentation

Each time a message is moved to the Dead Letter Queue topic, it will emit a `dead_letter_queue.dispatched` with a `message` key.

You can use it to enrich your instrumentation and monitoring:

```ruby
Karafka.monitor.subscribe('dead_letter_queue.dispatched') do |event|
  message = event[:message]

  topic = message.topic
  partition = message.partition
  offset = message.offset

  puts "Oh no! We gave up on this flunky message: #{topic}/#{partition}/#{offset}"
end
```

## Batch processing limitations

At the moment, DLQ does **not** have the ability to skip whole batches. For scenarios where the collective outcome of messages operations is causing errors, Karafka will skip one after another. This means that you may encounter "flickering", where seemingly valid messages are being moved to the DLQ before reaching the corrupted one.

If skipping batches is something you would utilize, please get in touch with us so we can understand your use cases and possibly introduce this functionality.

## Compacting limitations

Karafka does **not** publish the `key` value for DLQ messages. This means that if you set your `log.cleanup.policy` to `compact`, newer messages will overwrite the older once when the log compaction process kicks in.

Karafka Pro sets the `key` value based on the errored message partition to ensure the same partition delivery for consecutive errors from the same original partition.

We recommend either:

- Enhancing the DLQ messages with a proper `key` value using the [Enhanced Dead Letter Queue custom details](Pro-Enhanced-Dead-Letter-Queue#dlq-message-key-enhancements-for-a-compacted-dlq-topic) feature.
- Not using a `compact` policy and relying on `log.retention.ms` instead to make sure that the given DLQ topic does not grow beyond expectations.
- Enhancing the DLQ dispatched message by forking Karafka and making needed enhancements to the code.

## Using Dead Letter Queue with a multi-cluster setup

When working with a DLQ pattern and using Karafka multi-cluster support, please remember that by default, all the messages dispatched to the DLQ topic will go to the main cluster as the `#producer` uses the default cluster settings.

You can alter this by overriding the `#producer` consumer method and providing your cluster-specific producer instance.

**Note**: Do **not** create producer instances per consumer but one per cluster. Karafka producer is thread-safe and can operate from multiple consumers simultaneously.

```ruby
# In an initializer, before usage
PRODUCERS_FOR_CLUSTERS = {
  primary: Karafka.producer,
  secondary: ::WaterDrop::Producer.new do |p_config|
    p_config.kafka = {
      'bootstrap.servers': 'localhost:9095',
      'request.required.acks': 1
    }
  end
}

class ClusterXConsumer
  def consume
    # logic + DLQ setup in routes
  end

  private

  # Make this consumer always write all data to the secondary cluster
  # by making this method return your desired producer and not the default
  # producer
  def producer
    PRODUCERS_FOR_CLUSTERS.fetch(:secondary)
  end
end
```

You can read more about producing to multiple clusters [here](https://karafka.io/docs/Producing-messages#producing-to-multiple-clusters).

## Pro Enhanced Dead Letter Queue

We highly recommend you check out the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue), especially if you:

- expect a higher quantity of messages being moved to the DLQ topic,
- need to preserve original topic, partition, and offset,
- need to preserve the ordering of messages,
- want to have a DLQ topic with several partitions.
- want to alter `payload`, `headers`, `key` or any other attributes of the DQL message.
- want to delay processing of data dispatched to the DLQ topic.

## Example use-cases

- Payment processing: In payment processing systems, DLQs can be used to capture failed payment transactions due to network issues, invalid payment information, or other issues. These transactions can be reviewed and processed later, ensuring no payment is lost.

- Email delivery: In email delivery systems, DLQs can be used to capture email messages that fail to deliver due to invalid email addresses, network issues, or other issues. These messages can be later reviewed and resent, ensuring that important emails are not lost.

- Order processing: In e-commerce systems, DLQs can be used to capture orders that fail to process due to system errors, payment failures, or other issues. These orders can be reviewed and processed later, ensuring no orders are lost, and customer satisfaction is maintained.

- Data pipeline processing: In data pipeline systems, DLQs can be used to capture data events that fail to process due to data schema issues, data quality issues, or other issues. These events can be later reviewed and processed, ensuring that important data is not lost and data integrity is maintained.

- Fraud detection: In financial systems, DLQs can be used to capture suspicious transactions that fail to process due to system errors, network issues, or other issues.

- Gaming platforms: In gaming systems, DLQs can be used to capture game events that fail to process due to connectivity issues, data quality problems, or other issues.

The Karafka Dead Letter Queue is worth using because it provides a way to handle messages that cannot be processed for any reason without losing data. The DLQ allows the failed messages to be reviewed and processed later, reducing the risk of data loss and providing greater reliability and resilience to the system. The DLQ in Karafka is easy to set up and can be configured to handle different scenarios, including retry mechanisms, error handling, and version incompatibilities. This makes it an essential feature for businesses that want to ensure the reliability of their messaging system and avoid data loss in case of errors.
