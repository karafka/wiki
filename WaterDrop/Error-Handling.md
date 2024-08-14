Understanding WaterDrop error handling mechanisms is crucial for developing robust and reliable Kafka-based applications.

!!! notice ""

    This document focuses on error handling for the Standard Producer (non-transactional). For information regarding the error behavior of the Transactional Producer, it is highly recommended to refer to the [Transactional Producer](https://karafka.io/docs/WaterDrop-Transactions) documentation.

WaterDrop operates with a fully asynchronous architecture, maintaining a memory buffer for efficiently handling messages. This buffer stores messages waiting to be dispatched or already in the delivery process. Following the delivery of a message or the occurrence of an error after reaching the maximum retry limit, WaterDrop enqueues a delivery event into an internal event queue. This event includes the relevant delivery outcome, ensuring that each message's status is accurately tracked and managed within the system.

## Operational Modes

WaterDrop provides three distinct APIs, each with unique error-handling behaviors that are essential to understand for practical usage:

1. **Single Message Dispatch (`#produce_sync` and `#produce_async`)**: These methods send a single message to Kafka. Errors in this mode are specifically related to the individual message being sent. If an error occurs, it's directly tied to the single message dispatch attempt, making it straightforward to identify and handle issues related to message production or delivery.

2. **Batch Dispatch (`#produce_many_sync` and `#produce_many_async`)**: These methods allow sending multiple messages to Kafka in a batch. In this mode, errors can be more complex, as they might pertain to any single message within the batch. It's vital to have a strategy to identify which message(s) caused the error and respond accordingly. Error handling in this context needs to consider partial failures where some messages are dispatched successfully while others are not.

3. **Transactional Dispatch**: This mode supports operations within a Kafka transaction. It suits scenarios where you must maintain exactly-once delivery semantics or atomicity across multiple messages and partitions. Errors in this mode can be transaction-wide, affecting all messages sent within the transaction's scope. The transactional producer operates under its own set of rules and complexities, and it's crucial to refer to the [specific documentation](WaterDrop-Transactions) page dedicated to transactional dispatch for guidance on handling errors effectively.

## Error Types

In WaterDrop, errors encountered during the message-handling process can be categorized into five distinct types. Each type represents a specific stage or aspect of the message delivery lifecycle, highlighting the diverse issues in a message queuing system.

- **Inline Errors**: These errors occur at the initial stage of message production, preventing the creation of a delivery handle. Inline errors indicate the message has not been sent to the message queue. A typical example of this type of error is the `:queue_full`, which occurs when the message cannot be queued due to a lack of available buffer space. This type of error is immediate and directly related to the message production process and indicates a dispatch failure.

- **Wait Timeout Error**: This error arises when there is an exception during the invocation of the `#wait` method on a delivery handle. This can happen either directly or when producing messages synchronously, especially if the maximum wait time is reached. Notably, a wait error does not necessarily mean that the message will not be delivered; it primarily indicates that the allotted wait time for the message to be processed was exceeded. Please know that `#wait` can raise additional errors, indicating final delivery failure. With the default configuration where `max_wait_timeout` exceeds other message delivery timeouts, the `#wait` raised error should always be final.

- **Intermediate Errors**: These errors can occur anytime, are not necessarily linked to producing specific messages, do not happen inline, and are published via the `error.occurred` notifications channel. They usually signify operational problems within the system and are often temporary. Intermediate errors might indicate issues such as network interruptions or temporary system malfunctions. They are not directly tied to the fate of individual messages but rather to the overall health and functioning of the messaging system.

- **Delivery Failures**: This type of error is specifically related to the non-delivery of a message. A delivery failure occurs when a message, identifiable by its label, is retried several times but ultimately fails to be delivered. After a certain period, WaterDrop determines that it is no longer feasible to continue attempting delivery. This error signifies a definitive failure in the message delivery process, marking the end of the message's lifecycle with a non-delivery status.

- **ProduceMany** Errors: During non-transactional batch dispatches, some messages may be successfully enqueued, and some may not. In such a case, this error will be raised. It will contain a `#dispatched` key with appropriate delivery handles for successfully enqueuing messages. Those messages have the potential to be delivered based on their delivery report, but messages without matching delivery handles were for sure rejected and not enqueued for delivery.

- Transactional **ProduceMany** Errors: In a transactional batch dispatch, all messages within the transaction are either successfully enqueued and delivered together or not at all. If a failure occurs during the transaction, no messages are dispatched, and a rollback is performed. Therefore, the `#dispatched` key will always be empty in this error, as either all messages have been delivered successfully or none have been delivered. The transactional nature ensures atomicity, meaning that partial success or failure is not possible, and no message delivery handles will be available for any messages in case of a rollback.

Each error type plays a crucial role in understanding and managing the complexities of message handling in WaterDrop, providing precise categorization for troubleshooting and system optimization.

## Errors Impact on the Delivery

<table border="1">
    <thead>
      <tr>
        <th>Error Type</th>
        <th>Delivery Failed</th>
        <th>Details</th>
      </tr>
    </thead>
    <tbody>
        <tr>
            <td>Pre Handle Inline Errors</td>
            <td>Yes</td>
            <td>Errors occurring before delivery confirmation suggest non-delivery. For non-transactional batches, partial delivery may occur. <code>ProduceManyError</code> is raised, detailing messages via <code>#dispatched</code> for successful sends, while <code>#cause</code> reveals the original error.</td>
        </tr>
        <tr>
            <td><code>Rdkafka::Producer::WaitTimeoutError</code></td>
            <td>No</td>
            <td>This error occurs when the <code>#wait</code> exceeds its limit without receiving a delivery report. It implies prolonged waiting, not necessarily message non-delivery.</td>
        </tr>
        <tr>
            <td>Intermediate Errors on <code>error.occurred</code></td>
            <td>No</td>
            <td>Intermediate errors without a <code>delivery_report</code> key in <code>error.occurred</code> are temporary, identified by a <code>librdkafka.error</code> type, indicating ongoing processes or transient issues.</td>
        </tr>
        <tr>
            <td>Wait Inline Errors (excluding <code>WaitTimeoutError</code>)</td>
            <td>Yes</td>
            <td>Errors from <code>#wait</code> other than <code>WaitTimeoutError</code> signify an available delivery report with errors. In <code>ProduceManyError</code> cases, delivery may be partial; check <code>#dispatched</code> for success and <code>#cause</code> for error origins.</td>
        </tr>
        <tr>
            <td><code>WaterDrop::Errors::ProduceManyError</code></td>
            <td>Partially Yes</td>
            <td>Raised during batch dispatches with full queues. Some messages may be sent successfully (see <code>#dispatched</code> for details), while others fail. The <code>#cause</code> method provides the specific error reason.</td>
        </tr>
    </tbody>
</table>

## Tracking Deliveries and Errors

Due to WaterDrop's asynchronous nature, we recommend either using a transactional producer with its inline collective error handling and delivery warranties or using the async API and using the `error.occurred` notifications to detect and recognize messages that were not successfully delivered with inline error tracking for issues that would arise before the message had a chance to be enqueued for the delivery.

Every event published to `error.occurred` contains a type, and if the type is not `librdkafka.dispatch_error`, the error is intermediate or partial. It is worth logging but does not indicate that the dispatched message was not delivered. Events with the type set to `librdkafka.dispatch_error` will always contain a full delivery report for each enqueued message with exact details on why a message was not delivered.

In general, we recommend following a similar flow to the one below:

### Single Message Dispatch

All the potential errors will relate to a single dispatched message:

```ruby
begin
  # sync or async
  producer.produce_async(...)
rescue => e
  case e
  # This will never happen for async
  when Rdkafka::Producer::WaitTimeoutError
    puts 'Will not wait any longer but messages may still be delivered'
    puts "This dispatch may reach Kafka depending on the delivery report"
  when Rdkafka::RdkafkaError
    puts "Something went wrong and we did not get the delivery handle"
    puts "This dispatch for sure will not reach Kafka"
  else
    # Any other errors. This should not happen and indicates trouble.
    puts "Something else have happened. Read the error for details"
    puts "This dispatch will not reach Kafka"
    raise e
  end
end
```

```ruby
producer.monitor.subscribe('error.occurred') do |event|
  case event[:type]
  # Every single message that received a handler is delivered or fails event 
  when 'librdkafka.dispatch_error'
    puts "Message with label: #{event[:delivery_report].label} failed to be delivered"
    ErrorsTracker.track(event[:error])
  when
    # Track all the others
    ErrorsTracker.track(event[:error])
  end
end
```

### Batch Messages Dispatch

Errors may refer to one of the messages from the batch, and part of the messages might have been dispatched:

```ruby
begin
  # sync or async
  producer.produce_many_async(...)
rescue => e
  case e
  when WaterDrop::Errors::ProduceManyError
    puts "Something went wrong and we need to check messages"
    successful_handles = e.dispatched
    puts "Messages with following labels have handles: #{successful_handles.map(&:label)}"
    puts "Those without handles were for sure not delivered"
    puts "The original cause was: #{e.cause}"
  else
    # Any other errors. This should not happen and indicates trouble.
    raise e
  end
end
```

```ruby
producer.monitor.subscribe('error.occurred') do |event|
  case event[:type]
  # Every single message that received a handle is delivered or fails event 
  when 'librdkafka.dispatch_error'
    puts "Message with label: #{event[:delivery_report].label} failed to be delivered"
    ErrorsTracker.track(event[:error])
  when
    # Track all the others
    ErrorsTracker.track(event[:error])
  end
end
```

## Summary

WaterDrop's error handling is designed to manage the complexities of message delivery in Kafka through three primary APIs, each with distinct behaviors. Understanding these modes is crucial because error-handling strategies depend heavily on the dispatch method used, and each requires a different approach to ensure messages are reliably delivered or properly retried. Additionally, WaterDrop provides detailed error information, helping developers understand the context and cause of failures to implement effective recovery strategies. Along with monitoring errors and tracking delivery reports, it's also recommended to use WaterDrop's Labeling capabilities. This feature allows you to tag messages with labels associated with their dispatches during the dispatch lifecycle, making tracking and managing messages throughout their journey easier.
