The Dead Letter Queue feature provides a systematic way of dealing with persistent consumption errors that may require a different handling approach while allowing you to continue processing.

While consuming data, not everything may go as intended. When an error occurs in Karafka, by default, the framework will apply a back-off strategy and will try again and again. Some errors, however, may be non-recoverable. For example, a broken JSON payload will not be fixed by parsing it again. Messages with non-recoverable errors can be safely moved and analyzed later without interrupting the flow of other valid messages.

And this is where the Dead Letter Queue pattern shines.

A Dead Letter Queue in Karafka is a feature that, when enabled, will transfer problematic messages into a separate topic allowing you to continue processing even upon errors.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/dead_letter_queue/example_flow.svg" />
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
        max_retries: 2,
        # Apply the independent approach for the DLQ recovery. More in the docs below
        # It is set to false by default
        independent: false,
        # Should the offset of dispatched DLQ message be marked as consumed
        # This is true by default except when using manual offset management
        mark_after_dispatch: true
      )
    end
  end
end
```

Once enabled, after the defined number of retries, problematic messages will be moved to a separate topic unblocking the processing.

!!! tip "Advanced DLQ Management in Karafka Pro"

    If you're looking for advanced error handling and message recovery capabilities, Karafka Pro's [Enhanced DLQ](Pro-Enhanced-Dead-Letter-Queue) offers complex, context-aware strategies and additional DLQ-related features for superior message integrity and processing precision.

!!! warning "Default Behavior with `manual_offset_management`"

    When `manual_offset_management` is enabled, the `mark_after_dispatch` option is set to `false` by default. This means that messages moved to the Dead Letter Queue (DLQ) will not have their offsets automatically marked as consumed. You need to handle offset marking manually or set `mark_after_dispatch` to `true` explicitly to ensure proper message acknowledgment and avoid reprocessing the same message repeatedly.

## DLQ Configuration Options

The table below contains options the `#dead_letter_queue` routing method accepts.

<table border="1">
  <thead>
    <tr>
      <th>Name</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>max_retries</code></td>
      <td>Integer</td>
      <td>Defines the number of retries before moving a message to the DLQ.</td>
    </tr>
    <tr>
      <td><code>topic</code></td>
      <td>String</td>
      <td>Specifies the DLQ topic name for problematic messages.</td>
    </tr>
    <tr>
      <td><code>independent</code></td>
      <td>Boolean</td>
      <td>Treats each message independently with its own error counter.</td>
    </tr>
    <tr>
      <td><code>dispatch_method</code></td>
      <td>Symbol (<code>:produce_async</code> or <code>:produce_sync</code>)</td>
      <td>Describes whether dispatch on dlq should be sync or async (async by default).</td>
    </tr>
    <tr>
      <td><code>marking_method</code></td>
      <td>Symbol (<code>:mark_as_consumed</code> or <code>:mark_as_consumed!</code>)</td>
      <td>Describes whether marking on DLQ should be async or sync (async by default).</td>
    </tr>
    <tr>
      <td><code>mark_after_dispatch</code></td>
      <td>Boolean</td>
      <td>Controls whether the message offset is marked as consumed after it's moved to the DLQ. When <code>true</code> (default for non-MOM), the offset is committed, ensuring smooth continuation of message processing. By default, it is set to <code>false</code> when <code>manual_offset_management(true)</code> is used.</td>
    </tr>
  </tbody>
</table>

## Independent Error Counting

In standard operations, Karafka, while processing messages, does not make assumptions about the processing strategy employed by the user. Whether it’s individual message processing or batch operations, Karafka remains agnostic. This neutrality in the processing strategy becomes particularly relevant during the DLQ recovery phases.

Under normal circumstances, Karafka treats a batch of messages as a collective unit during DLQ recovery. For example, consider a batch of messages labeled `0` through `9`, where message `4` is problematic. Messages `0` to `3` are processed successfully, but message `4` causes a crash. Karafka then enters the DLQ flow, attempting to reprocess message `4` multiple times before eventually moving it to the DLQ and proceeding to message `5` after a brief backoff period.
This approach is based on the presumption that the entire batch might be problematic, possibly due to issues like batch upserts. Hence, if a subsequent message in the same batch (say, message `7`) fails after message `4` has recovered, Karafka will move message `7` to the DLQ without resetting the counter and will restart processing from message `8`.

This collective approach might not align with specific use cases with independent message processing. In such cases, the failure of one message does not necessarily imply a problem with the entire batch.

Karafka's independent flag introduces a nuanced approach to DLQ recovery, treating each message as an individual entity with its error counter. When enabled, this flag allows Karafka to reset the error count for each message as soon as it is successfully consumed, ensuring that each message is processed on its own merits, independent of the batch. This feature is especially beneficial in scenarios where messages are not interdependent, providing a more targeted and efficient error-handling process for each message within a batch.

To enable it, add `independent: true` to your DLQ topic definition:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: 'dead_messages',
        max_retries: 3,
        independent: true
      )
    end
  end
end
```

And make sure your consumer is marking each message as successfully consumed:

```ruby
class OrdersStatesConsumer < Karafka::BaseConsumer
  def consume
    messages.each do |message|
      puts message.payload

      mark_as_consumed(message)
    end
  end
end
```

The following diagrams compare DLQ flows in Karafka: the first without the independent flag and the second with it enabled, demonstrating the operational differences between these two settings.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/dead_letter_queue/no_independent.svg" />
</p>
<p align="center">
  <small>*The diagram shows DLQ retry behavior without the independent flag: each error in a batch adds to the error counter until the DLQ dispatch takes place on the last erroneous message.
  </small>
</p>

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/dead_letter_queue/independent.svg" />
</p>
<p align="center">
  <small>*The diagram shows DLQ retry behavior with the independent flag active: the error counter resets after each message is successfully processed, avoiding DLQ dispatch if all messages recover.
  </small>
</p>

## Delaying the DLQ Data Processing

In some cases, it can be beneficial to delay the processing of messages dispatched to a Dead Letter Queue (DLQ) topic. This can be useful when a message has failed to be processed multiple times, and you want to avoid overwhelming the system with repeated processing attempts. By delaying the processing of these messages, you can avoid consuming valuable resources and prevent potential system failures or downtime.

Another benefit of delaying the processing of messages dispatched to a DLQ topic is that it can allow developers to investigate the underlying issues that caused the message to fail in the first place. With delayed processing, you can give your team time to investigate and address the root cause of the issue rather than simply reprocessing the message repeatedly and potentially compounding the problem.

Overall, delaying the processing of messages dispatched to a DLQ topic can help ensure the stability and reliability of your system while also giving your team the time and resources needed to address underlying issues and prevent future failures.

You can read more about the Karafka Delayed Topics feature [here](Pro-Delayed-Topics).

## Disabling Retries

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

## Disabling Dispatch

For some use cases, you may want to skip messages after retries without dispatching them to an alternative topic.

This functionality is available in Karafka Pro, and you can read about it [here](Pro-Enhanced-Dead-Letter-Queue#disabling-dispatch).

## Dispatch Warranties

Messages dispatched to the DLQ topic preserve both `payload` and `headers`. They do **not** follow any partitioning strategy and will be distributed randomly.

!!! note

    The original offset, partition, and topic information will **not** be preserved. If you need those, we recommend you use the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue).

If you need messages dispatched to the DLQ topic to preserve order, you either need to use a DLQ topic with a single partition, or you need to use the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) implementation.

## Manual DLQ Dispatch

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

## Monitoring and Instrumentation

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

## Batch Processing Limitations

At the moment, DLQ does **not** have the ability to skip whole batches. For scenarios where the collective outcome of messages operations is causing errors, Karafka will skip one after another. This means that you may encounter "flickering", where seemingly valid messages are being moved to the DLQ before reaching the corrupted one.

If skipping batches is something you would utilize, please get in touch with us so we can understand your use cases and possibly introduce this functionality.

## Compacting Limitations

Karafka does **not** publish the `key` value for DLQ messages. This means that if you set your `log.cleanup.policy` to `compact`, newer messages will overwrite the older ones when the log compaction process kicks in.

Karafka Pro sets the `key` value based on the errored message partition to ensure the same partition delivery for consecutive errors from the same original partition.

We recommend either:

- Enhancing the DLQ messages with a proper `key` value using the [Enhanced Dead Letter Queue custom details](Pro-Enhanced-Dead-Letter-Queue#dlq-message-key-enhancements-for-a-compacted-dlq-topic) feature.
- Not using a `compact` policy and relying on `log.retention.ms` instead to make sure that the given DLQ topic does not grow beyond expectations.
- Enhancing the DLQ dispatched message by forking Karafka and making needed enhancements to the code.

## Using Dead Letter Queue with a Multi-Cluster Setup

When working with a DLQ pattern and using Karafka multi-cluster support, please remember that by default, all the messages dispatched to the DLQ topic will go to the main cluster as the `#producer` uses the default cluster settings.

You can alter this by overriding the `#producer` consumer method and providing your cluster-specific producer instance.

!!! note

    Do **not** create producer instances per consumer but one per cluster. Karafka producer is thread-safe and can operate from multiple consumers simultaneously.

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

You can read more about producing to multiple clusters [here](Producing-Messages#producing-to-multiple-clusters).

## Dispatch and Marking Warranties

When using the Dead Letter Queue (DLQ) feature in Karafka, messages are handled with specific dispatch and marking behaviors critical for understanding how message failures are managed. By default, Karafka employs asynchronous dispatch and non-blocking marking as consumed. However, these can be configured to behave synchronously for stricter processing guarantees.

For environments where message processing integrity is critical, you should configure dispatch and marking to operate synchronously. This ensures that each message is not only sent to the DLQ but also acknowledged by Kafka before proceeding and, similarly, that a message is confirmed as consumed before moving on.

To configure synchronous dispatch, you can set the `dispatch_method` option to `:produce_sync`. This setting ensures that the producer waits for a response from Kafka, confirming that the message has been received and stored before it returns control to the application.

Similarly, to configure blocking marking, you can set the `marking_method` to `:mark_as_consumed!`. This ensures that the message is marked as consumed in your application when Kafka confirms that it has been committed, reducing the risk of losing the message's consumption state.

Here is an example configuration that uses synchronous dispatch and blocking marking for messages sent to the DLQ:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: 'dead_messages',
        max_retries: 2,
        dispatch_method: :produce_sync,
        marking_method: :mark_as_consumed!
      )
    end
  end
end
```

!!! warning "Risks of Async DLQ Dispatch"

    When configuring the Dead Letter Queue (DLQ) in Karafka with asynchronous dispatch (`dispatch_method: :produce_async`), messages are immediately moved to a background queue and considered dispatched as soon as the action is triggered. This can create a potential risk where the application assumes a message has been delivered to the DLQ when, in reality, it may still be pending dispatch or could fail. In this case:

    - **Edge Case:** If there's an error in the background dispatch (e.g., network failure or broker downtime), the application won't be aware immediately, and retry mechanisms might not handle the failed message correctly.

    - **Risk:** This can lead to undetected message loss or delayed delivery to the DLQ, causing inconsistency in how failures are handled.

    For critical systems where message integrity is essential, it's recommended to use synchronous dispatch (`dispatch_method: :produce_sync`), ensuring the DLQ message is successfully acknowledged by Kafka before continuing.

## DLQ Topic Configuration Management

The Dead Letter Queue (DLQ) topics in Karafka are Kafka topics like any other. Managing their configuration requires separate route definitions with specific configuration settings. Paying attention to these details is crucial as they allow you to fully control and customize the DLQ topics to suit your needs.

To manage the configuration of the DLQ topic, you need to define a separate route for it, specifying the desired configurations, such as the number of partitions, replication factor, retention policies, and more.

Here's an example of how to set up a DLQ topic with specific configurations:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: 'dead_messages',
        max_retries: 2
      )
    end

    # Separate route definition for the DLQ topic with specific configurations
    topic :dead_messages do
      # Indicate that we do not consume from this topic
      active(false)
      config(
        partitions: 3,
        replication_factor: 2,
        'retention.ms': 604_800_000, # 7 days in milliseconds
        'cleanup.policy': 'compact'
      )
    end
  end
end
```

This approach ensures that you can manage the DLQ topic configurations independently of the main topic, providing greater flexibility and control over how problematic messages are handled and stored.

## Pro Enhanced Dead Letter Queue

We highly recommend you check out the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue), especially if you:

- expect a higher quantity of messages being moved to the DLQ topic,
- need to preserve original topic, partition, and offset,
- need to preserve the ordering of messages,
- need an ability to write complex context and error-type aware strategies for error handling,
- want to have a DLQ topic with several partitions.
- want to alter `payload`, `headers`, `key` or any other attributes of the DLQ message.
- want to delay processing of data dispatched to the DLQ topic.

## Example Use Cases

- Payment processing: In payment processing systems, DLQs can be used to capture failed payment transactions due to network issues, invalid payment information, or other issues. These transactions can be reviewed and processed later, ensuring no payment is lost.

- Email delivery: In email delivery systems, DLQs can be used to capture email messages that fail to deliver due to invalid email addresses, network issues, or other issues. These messages can be later reviewed and resent, ensuring that important emails are not lost.

- Order processing: In e-commerce systems, DLQs can be used to capture orders that fail to process due to system errors, payment failures, or other issues. These orders can be reviewed and processed later, ensuring no orders are lost, and customer satisfaction is maintained.

- Data pipeline processing: In data pipeline systems, DLQs can be used to capture data events that fail to process due to data schema issues, data quality issues, or other issues. These events can be later reviewed and processed, ensuring that important data is not lost and data integrity is maintained.

- Fraud detection: In financial systems, DLQs can be used to capture suspicious transactions that fail to process due to system errors, network issues, or other issues.

- Gaming platforms: In gaming systems, DLQs can be used to capture game events that fail to process due to connectivity issues, data quality problems, or other issues.

The Karafka Dead Letter Queue is worth using because it provides a way to handle messages that cannot be processed for any reason without losing data. The DLQ allows the failed messages to be reviewed and processed later, reducing the risk of data loss and providing greater reliability and resilience to the system. The DLQ in Karafka is easy to set up and can be configured to handle different scenarios, including retry mechanisms, error handling, and version incompatibilities. This makes it an essential feature for businesses that want to ensure the reliability of their messaging system and avoid data loss in case of errors.
