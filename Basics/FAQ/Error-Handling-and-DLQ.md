1. [Can I skip messages on errors?](#can-i-skip-messages-on-errors)
1. [Why do DLQ messages in my system keep disappearing?](#why-do-dlq-messages-in-my-system-keep-disappearing)
1. [Why, when DLQ is used with `max_retries` set to `0`, Karafka also applies a back-off?](#why-when-dlq-is-used-with-max_retries-set-to-0-karafka-also-applies-a-back-off)
1. [Can extra information be added to the messages dispatched to the DLQ?](#can-extra-information-be-added-to-the-messages-dispatched-to-the-dlq)
1. [What will happen when a message is dispatched to a dead letter queue topic that does not exist?](#what-will-happen-when-a-message-is-dispatched-to-a-dead-letter-queue-topic-that-does-not-exist)
1. [How can I make Karafka not retry processing, and what are the implications?](#how-can-i-make-karafka-not-retry-processing-and-what-are-the-implications)
1. [What happens if an error occurs while consuming a message in Karafka? Will the message be marked as not consumed and automatically retried?](#what-happens-if-an-error-occurs-while-consuming-a-message-in-karafka-will-the-message-be-marked-as-not-consumed-and-automatically-retried)
1. [Why do I see hundreds of repeat exceptions with `pause_with_exponential_backoff` enabled?](#why-do-i-see-hundreds-of-repeat-exceptions-with-pause_with_exponential_backoff-enabled)
1. [Why does the Dead Letter Queue (DLQ) use the default deserializer instead of the one specified for the original topic in Karafka?](#why-does-the-dead-letter-queue-dlq-use-the-default-deserializer-instead-of-the-one-specified-for-the-original-topic-in-karafka)
1. [What should I consider when manually dispatching messages to the DLQ in Karafka?](#what-should-i-consider-when-manually-dispatching-messages-to-the-dlq-in-karafka)
1. [How can I handle `dispatch_to_dlq` method errors when using the same consumer for a topic and its DLQ?](#how-can-i-handle-dispatch_to_dlq-method-errors-when-using-the-same-consumer-for-a-topic-and-its-dlq)
1. [What happens to a topic partition when a message fails, and the exponential backoff strategy is applied? Is the partition paused during the retry period?](#what-happens-to-a-topic-partition-when-a-message-fails-and-the-exponential-backoff-strategy-is-applied-is-the-partition-paused-during-the-retry-period)
1. [How can I determine if a message is a retry or a new message?](#how-can-i-determine-if-a-message-is-a-retry-or-a-new-message)
1. [What are poison pill messages, and how should I handle them in Karafka?](#what-are-poison-pill-messages-and-how-should-i-handle-them-in-karafka)
1. [How can I validate messages before processing them?](#how-can-i-validate-messages-before-processing-them)
1. [How should I handle missing or invalid records during message processing?](#how-should-i-handle-missing-or-invalid-records-during-message-processing)

---

## Can I skip messages on errors?

Karafka Pro can skip messages non-recoverable upon errors as a part of the Enhanced Dead Letter Queue feature. You can read about this ability [here](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue#disabling-dispatch).

## Why do DLQ messages in my system keep disappearing?

DLQ messages may disappear due to many reasons. Some possible causes include the following:

- The DLQ topic has a retention policy that causes them to expire and be deleted.
- The DLQ topic is a compacted topic, which only retains the last message with a given key.
- The messages are being produced to a DLQ topic with a replication factor of 1, which means that if the broker storing the messages goes down, the messages will be lost.

For more details, please look at the [Compacting limitations](Consumer-Groups-Dead-Letter-Queue#compacting-limitations) section of the DLQ documentation.

## Why, when DLQ is used with `max_retries` set to `0`, Karafka also applies a back-off?

Even when no retries are requested, applying a back-off strategy is crucial in maintaining system stability and preventing system overload.

When Karafka encounters an error processing a message, it might be due to a temporary or intermittent issue. Even if retries are not set, the system needs a moment to recover and stabilize after an error before moving on to the next message.

By applying a back-off strategy, Karafka ensures that a pause is introduced between the occurrence of the error and the dispatch of the message to the Dead Letter Queue (DLQ) or the processing of the next message. This brief pause allows the system's resources to recover.
For instance, if the error were due to a sudden spike in CPU usage, the back-off time would give the CPU a chance to cool down. If the error was due to a momentary network issue, the pause allows time for the network to stabilize.

Without the back-off mechanism, even if retries are not requested, Karafka would move on to the next message immediately after an error. If errors are frequent, this could lead to the system getting into a state where it is constantly encountering errors and never getting a chance to recover. This, in turn, could lead to an overload of the system, causing degraded performance or even a complete system crash.

## Can extra information be added to the messages dispatched to the DLQ?

**Yes**. Karafka Enhanced DLQ provides the ability to add custom details to any message dispatched to the DLQ. You can read about this feature [here](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue#adding-custom-details-to-the-dlq-message).

## What will happen when a message is dispatched to a dead letter queue topic that does not exist?

When a message is dispatched to a [dead letter queue](Consumer-Groups-Dead-Letter-Queue) (DLQ) topic that does not exist in Apache Kafka, the behavior largely depends on the `auto.create.topics.enable` Kafka configuration setting and the permissions of the Kafka broker. If `auto.create.topics.enable` is `true`, Kafka will automatically create the non-existent DLQ topic with one partition using the broker's default configurations, and the message will then be stored in the new topic.

On the other hand, if `auto.create.topics.enable` is set to `false`, Kafka will not auto-create the topic, and instead, an error will be raised when trying to produce to the non-existent DLQ topic. This error could be a topic authorization exception if the client doesn't have permission to create topics or `unknown_topic_or_part` if the topic doesn't exist and auto-creation is disabled.

!!! note

    In production environments, `auto.create.topics.enable` is often set to `false` to prevent unintended topic creation.

For effective management of DLQs in Kafka, we recommend using Karafka's [Declarative Topics](Infrastructure-Declarative-Topics), where you declare your topics in your code. This gives you more control over the specifics of each topic, such as the number of partitions and replication factors, and helps you avoid unintended topic creation. It also aids in efficiently managing and monitoring DLQs in your Kafka ecosystem.

Below you can find an example routing that includes a DLQ declaration as well as a declarative definition of the target DLQ topic:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic 'events' do
      config(
        partitions: 6,
        replication_factor: 3,
        'retention.ms': 31 * 86_400_000 # 31 days in ms,
        'cleanup.policy': 'delete'
      )

      consumer EventsConsumer

      dead_letter_queue(
        topic: 'dlq',
        max_retries: 2
      )
    end

    topic 'dlq' do
      config(
        partitions: 2,
        replication_factor: 2,
        'retention.ms': 31 * 86_400_000 # 31 days in ms,
      )

      # Set to false because of no automatic DLQ handling
      active false
    end
  end
end
```

## How can I make Karafka not retry processing, and what are the implications?

If you make Karafka not retry, the system will not attempt retries on errors but will continue processing forward. You can achieve this in two methods:

1. **Manual Exception Handling**: This involves catching all exceptions arising from your code and choosing to ignore them. This means the system doesn't wait or retry; it simply moves to the next task or message.

    ```ruby
    def consume
      messages.each do |message|
        begin
          persist(message)
        # Ignore any errors and just log them
        rescue StandardError => e
          ErrorTracker.notify(e)
        end

        mark_as_consumed(message)
      end
    end
    ```

1. **Using Enhanced DLQ Capabilities**: With this method, messages will be moved to the [Dead Letter Queue (DLQ)](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue) immediately, without retrying them, and an appropriate backoff policy will be invoked, preventing you from further overloading your system in case of external resources' temporary unavailability.

    ```ruby
    class KarafkaApp < Karafka::App
      routes.draw do
        topic :orders_states do
          consumer OrdersStatesConsumer

          # This setup will move broken messages to the DLQ, backoff and continue
          dead_letter_queue(
            topic: 'dead_messages',
            max_retries: 0
          )
        end
      end
    end

    class OrdersStatesConsumer < ApplicationConsumer
      def consume
        # No need to handle errors manually, if `#persist` fails,
        # Karafka will pause, backoff and retry automatically and
        # will move the failed messages to `dead_messages` topic
        messages.each do |message|
          persist(message)

          mark_as_consumed(message)
        end
      end
    end
    ```

However, it's essential to be aware of the potential risks associated with these approaches. In the first method, there's a possibility of overloading temporarily unavailable resources, such as databases or external APIs. Since there is no backoff between a failure and the processing of the subsequent messages, this can exacerbate the problem, further straining the unavailable resource. To mitigate this, using the [`#pause`](Consumer-Groups-Pausing-Seeking-and-Rate-Limiting) API is advisable, which allows you to pause the processing manually. This will give strained resources some breathing room, potentially preventing more significant system failures.

## What happens if an error occurs while consuming a message in Karafka? Will the message be marked as not consumed and automatically retried?

In Karafka's default flow, if an error occurs during message consumption, the processing will pause at the problematic message, and attempts to consume it will automatically retry with an exponential backoff strategy. This is typically effective for resolving transient issues (e.g., database disconnections). However, it may not be suitable for persistent message-specific problems, such as corrupted JSON. In such cases, Karafka's Dead Letter Queue feature can be utilized. This feature allows a message to be retried several times before it's moved to a Dead Letter Queue (DLQ), enabling the process to continue with subsequent messages. More information on this can be found in the [Dead Letter Queue Documentation](Consumer-Groups-Dead-Letter-Queue).

## Why do I see hundreds of repeat exceptions with `pause_with_exponential_backoff` enabled?

When `pause_with_exponential_backoff` is enabled, the timeout period for retries doubles after each attempt, but this does not prevent repeated exceptions from occurring. With `pause_max_timeout` set to the default 30 seconds, an unaddressed exception can recur up to 120 times per hour. This frequent repetition happens because the system continues to retry processing until the underlying issue is resolved.

## Why does the Dead Letter Queue (DLQ) use the default deserializer instead of the one specified for the original topic in Karafka?

When a message is piped to the DLQ, if you decide to consume data from the DLQ topic, it defaults to using the default deserializer unless explicitly specified otherwise for the DLQ  topic. This behavior occurs because the deserializer setting is tied to specific topics rather than the consumer. If you require a different deserializer for the DLQ, you must define it directly on the DLQ topic within your routing setup. This setup ensures that each topic, including the DLQ, can have unique processing logic tailored to its specific needs.

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer
      deserializer SpecificDeserializer.new
      dead_letter_queue(
        topic: :failed_orders_dlq,
        max_retries: 2
      )
    end

    topic :failed_orders_dlq do
      consumer FailedOrdersRecoveryConsumer
      deserializer SuperSpecificDeserializer.new
    end
  end
end
```

## What should I consider when manually dispatching messages to the DLQ in Karafka?

When manually dispatching a message to the DLQ in Karafka, it's essential to understand that the dispatch action itself only moves the message to the DLQ and does not mark it as consumed. If your intention is to prevent further processing of the original message and to avoid halting the offset commitment, you need to explicitly mark the message as consumed. This can be crucial in maintaining the flow of message processing and ensuring that message consumption offsets are correctly committed.

## How can I handle `dispatch_to_dlq` method errors when using the same consumer for a topic and its DLQ?

If you use the same consumer for a particular topic and its [Dead Letter Queue (DLQ)](Consumer-Groups-Dead-Letter-Queue), you might encounter an issue where the `dispatch_to_dlq` method is unavailable in the DLQ context. This can lead to errors if the method is called again during DLQ reprocessing.

In Karafka, different consumer instances may operate in different contexts. Specifically, the DLQ context does not have access to DLQ-specific methods because these methods are injected only for the original topic consumer context. This ensures that specific methods are not used outside their intended context, maintaining a clean and safe API.

To handle this, you can use a guard to check whether the `#dispatch_to_dlq` method is available before calling it. Here are a couple of approaches:

1. **Check for Method Availability**:

    You can use the `#respond_to?` method to check if dispatch_to_dlq is available before calling it.

    ```ruby
    if respond_to?(:dispatch_to_dlq)
      dispatch_to_dlq
    else
      # Handle the error or reprocess logic here
    end
    ```

1. **Differentiate Using Topic Reference**:

    Alternatively, you can check if the consumer is processing a DLQ topic by using the `topic.dead_letter_queue?` method. This method returns true if the current topic has DLQ enabled but will be false when processing the DLQ itself.

    ```ruby
    if topic.dead_letter_queue?
      # This is the original topic, so `dispatch_to_dlq` is safe to use
      dispatch_to_dlq
    else
      # This is the DLQ topic, handle accordingly
      # Handle the error or reprocess logic here
    end
    ```

When using the same consumer for both a topic and its DLQ in Karafka, ensure that you handle method availability appropriately to avoid errors. Using guards like checking the topic context with `topic.dead_letter_queue?` can help maintain robustness and prevent unexpected exceptions during reprocessing.

## What happens to a topic partition when a message fails, and the exponential backoff strategy is applied? Is the partition paused during the retry period?

Yes, when a message fails on a specific topic partition and the exponential backoff strategy is applied, that partition is effectively paused during the retry period. This ensures strong ordering, which is a key guarantee of Karafka. If you want to bypass this behavior, you can configure a DLQ with delayed processing, allowing you to manage retries without pausing the partition.

## How can I determine if a message is a retry or a new message?

You can use:

- `#attempt` - shows retry attempt number
- `#retrying?` - boolean indicating if message is being retried

Note that:

1. This works per offset location, not per individual message, unless you mark each message as consumed
1. The error causing the retry may differ between retry attempts

You can find more details about this [here](Consumer-Groups-Error-Handling-and-Back-Off-Policy#altering-the-consumer-behaviour-upon-reprocessing).

## What are poison pill messages, and how should I handle them in Karafka?

A poison pill message is a message that causes your consumer to fail repeatedly, blocking the processing of all subsequent messages in that partition. Common causes include malformed JSON, incompatible schema changes, corrupt binary data, or messages that trigger application bugs.

**Handling strategies in Karafka:**

1. **Dead Letter Queue (DLQ)** - The recommended approach for production systems. After a configurable number of retries, the problematic message is moved to a separate topic for later analysis:

    ```ruby
    class KarafkaApp < Karafka::App
      routes.draw do
        topic :orders do
          consumer OrdersConsumer
          dead_letter_queue(
            topic: 'orders_dlq',
            max_retries: 3
          )
        end
      end
    end
    ```

2. **Skip without dispatch (Pro)** - Karafka Pro's [Enhanced DLQ](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue) allows skipping messages without sending them anywhere by setting `topic: false`:

    ```ruby
    dead_letter_queue(
      topic: false,
      max_retries: 2
    )
    ```

3. **Defensive coding patterns** - Handle potential failures gracefully within your consumer:

    ```ruby
    class OrdersConsumer < ApplicationConsumer
      def consume
        messages.each do |message|
          process_order(message)
          mark_as_consumed(message)
        rescue JSON::ParserError => e
          # Log and skip malformed messages
          Karafka.logger.error("Malformed message at offset #{message.offset}: #{e.message}")
          mark_as_consumed(message)
        end
      end
    end
    ```

4. **Attempt-based handling** - Use `#attempt` to implement custom recovery logic after multiple failures:

    ```ruby
    class OrdersConsumer < ApplicationConsumer
      def consume
        if attempt > 5
          # After 5 failures, log and skip the problematic message
          messages.each do |message|
            Karafka.logger.warn("Skipping message after #{attempt} attempts: #{message.offset}")
            mark_as_consumed(message)
          end
        else
          # Normal processing - let errors propagate for retry
          messages.each do |message|
            process_order(message)
            mark_as_consumed(message)
          end
        end
      end
    end
    ```

For comprehensive error handling documentation, see [Error Handling and Back-Off Policy](Consumer-Groups-Error-Handling-and-Back-Off-Policy) and [Dead Letter Queue](Consumer-Groups-Dead-Letter-Queue).

## How can I validate messages before processing them?

Validating messages before processing helps catch malformed or invalid data early, preventing downstream errors and making debugging easier.

The ideal long-term approach is to use formal schema definitions (such as Avro, JSON Schema, or Protobuf) that enforce structure at the serialization level. However, as a simple first step - especially for teams not yet ready to adopt a schema registry - you can implement validation using Ruby's built-in tools or libraries like ActiveModel.

**Using ActiveModel validations:**

```ruby
class OrderValidator
  include ActiveModel::Validations

  attr_accessor :order_id, :amount, :customer_id, :status

  validates :order_id, presence: true
  validates :amount, presence: true, numericality: { greater_than: 0 }
  validates :customer_id, presence: true
  validates :status, inclusion: { in: %w[pending confirmed shipped] }

  def initialize(attributes = {})
    attributes.each { |key, value| send("#{key}=", value) if respond_to?("#{key}=") }
  end
end
```

**Using validation in your consumer:**

```ruby
class OrdersConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      validator = OrderValidator.new(message.payload)

      if validator.valid?
        process_order(message.payload)
        mark_as_consumed(message)
      else
        handle_invalid_message(message, validator.errors)
      end
    end
  end

  private

  def handle_invalid_message(message, errors)
    Karafka.logger.warn(
      "Invalid message at offset #{message.offset}: #{errors.full_messages.join(', ')}"
    )

    # Option 1: Skip and mark as consumed
    mark_as_consumed(message)

    # Option 2: Dispatch to DLQ manually for inspection
    # dispatch_to_dlq(message)

    # Option 3: Re-raise to trigger retry (if error might be transient)
    # raise ValidationError, errors.full_messages.join(', ')
  end
end
```

**Validation in custom deserializer:**

For schema validation during deserialization, implement a custom deserializer:

```ruby
class ValidatingJsonDeserializer
  def call(message)
    payload = JSON.parse(message.raw_payload)
    validate!(payload)
    payload
  rescue JSON::ParserError => e
    raise Karafka::Errors::DeserializationError, "Invalid JSON: #{e.message}"
  end

  private

  def validate!(payload)
    required_fields = %w[id type timestamp]
    missing = required_fields - payload.keys

    if missing.any?
      raise Karafka::Errors::DeserializationError, "Missing required fields: #{missing.join(', ')}"
    end
  end
end
```

For more details on custom deserializers, see the [Deserialization](Consumer-Groups-Deserialization) documentation.

## How should I handle missing or invalid records during message processing?

When processing messages that reference external records (database rows, API resources, etc.), you may encounter situations where the referenced record doesn't exist or is in an unexpected state. The correct handling depends on whether the missing record is expected or indicates a problem.

**Pattern 1: Return early when records are optional or legitimately missing**

Use this when the absence of a record is a valid business case (e.g., record was deleted, optional relationship):

```ruby
class OrderUpdatesConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      order_id = message.payload['order_id']
      order = Order.find_by(id: order_id)

      # Skip if order doesn't exist - it may have been deleted
      unless order
        Karafka.logger.info("Order #{order_id} not found, skipping update")
        mark_as_consumed(message)
        next
      end

      update_order(order, message.payload)
      mark_as_consumed(message)
    end
  end
end
```

**Pattern 2: Re-raise when records should exist (race condition)**

Use this when a missing record indicates a timing issue that may resolve itself (e.g., message arrived before the database transaction committed):

```ruby
class OrderNotificationsConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      order_id = message.payload['order_id']
      order = Order.find_by(id: order_id)

      # Order MUST exist - if not, it's likely a race condition
      # Re-raising will trigger a retry after back-off
      unless order
        raise RecordNotFoundError, "Order #{order_id} not found - possible race condition"
      end

      send_notification(order)
      mark_as_consumed(message)
    end
  end
end
```

**Pattern 3: Combine with attempt tracking for race conditions**

Handle race conditions with limited retries before giving up:

```ruby
class OrderEventsConsumer < ApplicationConsumer
  MAX_RACE_CONDITION_RETRIES = 3

  def consume
    messages.each do |message|
      order_id = message.payload['order_id']
      order = Order.find_by(id: order_id)

      unless order
        if attempt <= MAX_RACE_CONDITION_RETRIES
          # Likely a race condition - retry
          raise RecordNotFoundError, "Order #{order_id} not found, attempt #{attempt}"
        else
          # After multiple retries, treat as legitimately missing
          Karafka.logger.warn(
            "Order #{order_id} not found after #{attempt} attempts, skipping"
          )
          mark_as_consumed(message)
          next
        end
      end

      process_event(order, message.payload)
      mark_as_consumed(message)
    end
  end
end
```

For comprehensive error handling strategies, see [Error Handling and Back-Off Policy](Consumer-Groups-Error-Handling-and-Back-Off-Policy).
