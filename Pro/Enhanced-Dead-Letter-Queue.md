Enhanced Dead Letter Queue feature provides additional functionalities and warranties to the regular [Dead Letter Queue](Dead-Letter-Queue) feature. It aims to complement it with additional dispatch warranties and additional messages metadata information.

This documentation only covers extra functionalities enhancing the Dead Letter Queue feature.

Please refer to the [Dead Letter Queue](Dead-Letter-Queue) documentation for more details on its core principles.

## Using Enhanced Dead Letter Queue

There are no extra steps needed. If you are using Karafka Pro, Enhanced Dead Letter Queue is configured the same way as the regular one:

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
  end
end
```

## Delaying the DLQ Data Processing

In some cases, it can be beneficial to delay the processing of messages dispatched to a Dead Letter Queue (DLQ) topic. This can be useful when a message has failed to be processed multiple times, and you want to avoid overwhelming the system with repeated processing attempts. By delaying the processing of these messages, you can avoid consuming valuable resources and prevent potential system failures or downtime.

If you are processing data dispatched to the DLQ topic, all you need to do to make it delayed is to add `delay_by` to your DLQ topic routing definition as follows:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: :failed_orders_dlq,
        max_retries: 2
      )
    end

    topic :failed_orders_dlq do
      consumer FailedOrdersRecoveryConsumer
      # Try to process failed orders messages with 5 minutes of a delay
      delay_by(5 * 60_000)
    end
  end
end
```

## Disabling Dispatch

For some use cases, you may want to skip messages after retries without dispatching them to an alternative topic.

To do this, you need to set the DLQ `topic` attribute value to `false`:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: false,
        max_retries: 2
      )
    end
  end
end
```

When that happens, Karafka will retry two times and continue processing despite errors.

## Dispatch Warranties

Enhanced Dead Letter Queue ensures that messages moved to the DLQ topic will always reach the same partition and in order, even when the DLQ topic has a different number of partitions. This means that you can implement pipelines for processing broken messages and rely on the ordering warranties from the original topic.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/enhanced_dlq_flow.svg" />
</p>
<p align="center">
  <small>*This example illustrates how Enhanced DLQ preserves order of messages from different partitions.
  </small>
</p>

!!! note ""

    The DLQ topic does not have to have the same number of partitions as the topics from which the broken messages come. Karafka will ensure that all the messages from the same origin partition will end up in the same DLQ topic partition.

## Additional Headers For Increased Traceability

Karafka Pro, upon transferring the message to the DLQ topic, aside from preserving the `payload`, and the `headers` will add a few additional headers that allow for increased traceability of broken messages:

- `original_topic` - topic from which the message came
- `original_partition` - partition from which the message came
- `original_offset` - offset of the transferred message
- `original_key` - key of the transferred message
- `original_consumer_group` - id of the consumer group that was consuming this message

!!! note ""

    Karafka headers values are **always** strings.

This can be used for debugging or for example when you want to have a single DLQ topic with per topic strategies:

```ruby
class DlqConsumer
  def consume
    messages.each do |broken_message|
      original_topic = broken_message.headers['original_topic']
      original_partition = broken_message.headers['original_partition'].to_i
      original_offset = broken_message.headers['original_offset'].to_i
      payload = broken_message.raw_payload

      case original_topic
      when 'orders_events'
        BrokenOrders.create!(
          payload: payload,
          source_partition: original_partition,
          source_offset: original_offset
        )
      when 'users_events'
        NotifyDevTeam.call(
          payload: payload,
          source_partition: original_partition,
          source_offset: original_offset
        )
      else
        raise StandardError, "Unsupported original topic: #{original_topic}"
      end

      mark_as_consumed(broken_message)
    end
  end
end
```

## Adding Custom Details To the DLQ Message

If you want to add some extra information or change anything in the message that will be dispatched to the DLQ topic, you can do it by defining a custom method called `#enhance_dlq_message` in your consumer class.

It accepts two arguments:

- `dql_message` - a hash with all the details of the DLQ message that will be dispatched
- `skippable_message` - Karafka message that we skip via the DLQ feature

Let's say you want to add some headers and alter the payload. You can do it in the following way:

```ruby
class MyConsumer
  def consume
    # some code that can raise an error...
  end

  private

  def enhance_dlq_message(dlq_message, skippable_message)
    # Replace the DLQ message payload with a hash containing the original raw payload as well as
    # process pid
    #
    # Note that payload here needs to be a string
    dlq_message[:payload] = {
      original_raw_payload: skippable_message.raw_payload,
      process_pid: Process.pid
    }.to_json

    # Add one extra header to the message headers
    dlq_message[:headers]['extra-header'] = 'yes'
  end
end
```

!!! note ""

    No routing changes are needed to make it work.

## DLQ Message `key` Enhancements For a Compacted DLQ Topic

If you use a `compact` value for Kafka `log.cleanup.policy`, you may lose messages dispatched to the DLQ topic due to the [DLQ compacting limitations](Dead-Letter-Queue#compacting-limitations).

You can mitigate this by enhancing the DLQ message with a unique key using the `#enhance_dlq_message` consumer method:

```ruby
class MyConsumer
  def consume
    # some code that can raise an error...
  end

  private

  def enhance_dlq_message(dlq_message, skippable_message)
    dlq_message[:key] = [
      topic.name,
      skippable_message.partition,
      skippable_message.offset
    ].join('-')
  end
end
```

## Disabling Transactions During DLQ Dispatches

Karafka, by default, uses transactions to atomically dispatch messages to a Dead-Letter Queue (DLQ) and mark them as consumed when a transactional producer is available. However, you might prefer to handle these actions independently, especially when minimizing transactional overhead is a priority.

To turn off transactional behavior for DLQ dispatches, set the transactional option to false in the DLQ routing configuration. Here's how to apply this setting:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: 'dead_messages',
        max_retries: 2,
        # Do not use transactions for DLQ dispatches
        transactional: false
      )
    end
  end
end
```

This adjustment ensures that messages dispatched to the DLQ and the marking of their consumption are processed separately, providing you with the flexibility to align Karafka's behavior with your system's needs.

## Advanced Error Tracking

Karafka Pro maintains a log of the last 100 errors during message processing, retaining this error history until a successful processing. This feature allows developers to leverage historical error data to inform recovery strategies, ensuring a nuanced approach to handling errors based on past failures.

The errors_tracker API in Karafka's ErrorsTracker class is designed to accumulate and manage a history of errors during the `#consume` method execution. It tracks up to the last 100 errors to prevent memory leaks from endless error loops.

You can access the errors tracker from the consumer by invoking the `#errors_tracker` consumer method:

```ruby
def consume
  if retrying?
    skip_first = nil

    # Use the last (most recent) error details for advanced error handling
    case errors_tracker.last
    when DbTimeoutError
      skip_first = false
    when FormatError
      skip_first = true
    else
      skip_first = false
    end

    messages.each_with do |message, index|
      if index.zero? && skip_first
        mark_as_consumed(message)
        next 
      end

      DbStorage.save!(message.payload)
      mark_as_consumed(message)
    end
  else
    messages.each do |message|
      DbStorage.save!(message.payload)
    end
  end
end
```

### Error Tracking with Virtual Partitions

When using [Virtual Partitions](https://karafka.io/docs/Pro-Virtual-Partitions/), which operate in parallel within a single Kafka partition, Karafka aggregates errors across all virtual partitions. This aggregation means that errors from all virtual partitions are available during the recovery phase, providing a comprehensive view of the issues encountered. This capability is crucial for implementing effective recovery strategies, as it ensures that the error-handling logic can account for the diverse range of errors that may occur across parallel processing threads.

## Custom Context-Aware Recovery Strategies

Karafka allows for implementing custom DLQ handling and recovery strategies, leveraging the flexibility to respond to errors based on specific conditions like the number of attempts or the nature of the errors encountered. This approach enables tailored error handling, improving the resilience and reliability of your application. Custom strategies can differentiate between errors, deciding to retry, skip, or dispatch messages to a DLQ based on predefined logic, such as retrying database-related errors indefinitely, skipping non-recoverable errors immediately, or applying a limited number of retries for recoverable errors.

This method offers significant benefits, including more efficient processing, reduced noise from non-recoverable errors, and enhanced opportunity for successful message recovery, leading to a more robust and error-tolerant system.

For a practical implementation, consider a scenario where you define custom error classes for different error types and a strategy class that decides the action based on the last error and attempt number. This setup enables nuanced control over how your application responds to specific errors, optimizing your processing logic for efficiency and effectiveness.

To integrate a custom DLQ strategy, define your strategy class with the necessary logic in the `#call` method. Then, in your Karafka routing configuration, assign your custom strategy under the `#dead_letter_queue` option for the relevant topic:

```ruby
class OrdersDlqStrategy
  # @param errors_tracker [Karafka::Pro::Processing::Coordinators::ErrorsTracker] errors tracker
  #   that collects errors that occurred during processing until another successful processing run
  # @param attempt [Integer] attempt of processing of given messages
  def call(errors_tracker, attempt)
    #...
  end
end

class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: 'dead_messages',
        # When defining strategy, `max_retries` is not needed
        strategy: OrdersDlqStrategy.new
      )
    end
  end
end
```

After an error occurs and Karafka decides on what to do with the error, it will invoke the `#call` method from the strategy with the following arguments:

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>errors_tracker</code></td>
      <td><code>Karafka::Pro::Processing::Coordinators::ErrorsTracker</code></td>
      <td>Tracks the history of errors for the current messages until another successful run.</td>
    </tr>
    <tr>
      <td><code>attempt</code></td>
      <td>Integer</td>
      <td>Indicates the current attempt of processing.</td>
    </tr>
  </tbody>
</table>

When implementing a custom DLQ strategy in Karafka, the `#call` method is expected to return specific symbols indicating the next action for a message: `:retry`, `:dispatch`, or `:skip`. Each symbol represents a distinct pathway for handling messages that have encountered processing issues, guiding the system on whether to attempt reprocessing, move the message to a dead-letter queue, or bypass further attempts.

<table>
  <thead>
    <tr>
      <th>Return Result</th>
      <th>Explanation</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>:retry</code></td>
      <td>The processing should be retried. This is typically used when the error is considered transient and successful processing is possible in a subsequent attempt.</td>
    </tr>
    <tr>
      <td><code>:dispatch</code></td>
      <td>The message should be moved to the DLQ. This is used when the message cannot be processed successfully after several attempts or when specific error conditions are met.</td>
    </tr>
    <tr>
      <td><code>:skip</code></td>
      <td>The message should be skipped and not retried or dispatched to the DLQ. This is typically used for non-recoverable errors where retrying or dispatching is not appropriate.</td>
    </tr>
  </tbody>
</table>
