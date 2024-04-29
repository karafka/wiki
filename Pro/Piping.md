In complex systems where applications act as part of a larger data-processing ecosystem, efficiently passing data between processes is crucial. Karafka Pro includes a robust feature for message piping, allowing applications to forward processing results seamlessly to subsequent stages or other applications. This document explores the concept, use cases, and benefits of using message piping in Karafka Pro.

## What is Message Piping?

Message piping in Karafka refers to forwarding messages from one topic to another or to different applications within the same Kafka ecosystem. This is akin to Unix-like systems where commands can pipe output to other commands, facilitating complex data transformations and workflow orchestrations.

## Why Use Message Piping?

- **Decoupling Components**: Message piping helps decouple system components. Data producers do not need to know about the consumers, allowing for independent scaling and maintenance.

- **Enhanced Data Flow Management**: It provides a controlled way to manage data flow, ensuring data integrity and traceability through enhanced metadata headers similar to those used in enhanced Dead Letter Queues (DLQ).

- **Efficiency**: Message piping minimizes the overhead associated with messages piping by automatically applying a partitioning strategy and using raw payload and headers without any deserialization.

## Usage

Karafka Pro provides built-in methods to facilitate message piping directly from within your consumers. These methods handle the complexities of Kafka message attributes, ensuring messages are forwarded with all necessary context intact.

```ruby
class PaymentConsumer < ApplicationConsumer
  def consume
    payment_process(messages.payloads)

    # After processing, pipe messages to the next service
    pipe_many_async(
      topic: 'stock_check',
      messages: messages
    )
  end
end
```

### Public Piping Methods

The following table describes the public methods available for message piping:

| Method             | Description                                           |
|--------------------|-------------------------------------------------------|
| `pipe_async`       | Pipes a message to a specified topic asynchronously.  |
| `pipe_sync`        | Pipes a message to a specified topic synchronously.   |
| `pipe_many_async`  | Pipes multiple messages to a specified topic asynchronously. |
| `pipe_many_sync`   | Pipes multiple messages to a specified topic synchronously. |

### Enhancing Messages with `#enhance_pipe_message`

You can define a `#enhance_pipe_message` method in your consumer to alter the message before it is piped. This method allows you to add or modify headers, change the payload, or apply any other transformations before forwarding the message.

### Automatic Partition Key Selection

In Karafka, the message key selection for message piping is designed to maintain a high degree of ordering and integrity, especially when messages are forwarded to topics with differing partition counts. This ensures that correlated messages preserve their strong ordering, which is critical for processing sequences of interdependent events.

The process of message key selection is handled as follows:

- **Key Available**: If the original message includes a key, this key is reused when the message is piped. This ensures the message follows the same partitioning logic as before, maintaining its order and correlation with related messages.

- **Key Not Available**: When no key is present, Karafka automatically generates a partition key based on the partition number from which the message was originally consumed. This automatic key generation ensures that messages maintain their ordering by being routed to the same relative partition in the new topic.

This approach is particularly useful in scenarios where the number of partitions in the target topic differs from the source. It ensures that the message flow remains consistent and predictable, supporting scenarios like ordered processing and stateful computations where the order of messages is crucial.

### Traces in Headers

To enhance debuggability, the following trace headers are automatically included when a message is piped:

- `original_topic`: The topic from which the message originated.
- `original_partition`: The partition within the original topic.
- `original_offset`: The offset within the partition.
- `original_consumer_group`: The consumer group ID that processed the message.

These headers provide vital information for troubleshooting and understanding the message flow across different parts of your system.

!!! Warning "Trace Headers Replacement During Piping"

    When piping data from a Dead Letter Queue (DLQ) topic, be aware that similar trace headers are already present due to the [DLQ's mechanisms](https://karafka.io/docs/Pro-Enhanced-Dead-Letter-Queue/#additional-headers-for-increased-traceability). During the piping operation, these headers will be overwritten with the new trace information generated by the piping process. This may impact traceability if the original DLQ headers are required for further analysis or debugging.

### Exactly-Once Semantics and Transactions

Karafka Pro supports [exactly-once semantics](https://karafka.io/docs/Pro-Transactions) within its message piping feature, ensuring that messages are processed and forwarded precisely once, even in case of failures or retries. This is crucial in scenarios where message duplication or loss could lead to inconsistencies or erroneous behaviors in downstream systems.

Here's how you can utilize transactions with message piping:

```ruby
class Consumer < ApplicationConsumer
  def consume
    transaction do
      # Piping messages to the next topic as part of the transaction
      pipe_many_async(topic: 'target', messages: messages)

      # Marking the last message as consumed after successful piping
      mark_as_consumed(messages.last)
    end
  end
end
```

Transactional piping ensures that message forwarding completes successfully or not at all if any part of the transaction fails. This is particularly useful when your application logic involves multiple steps and needs to avoid partial execution. The `#mark_as_consumed` method acknowledges that the last message has been fully processed and its results confirmed, which is crucial for correct offset management in Karafka.

## Example Use Cases

- **Real-Time Data Processing**: In a real-time analytics system, events can be piped from initial ingestion points directly to processing engines and then to dashboards or alert systems. For example, streaming IoT device data can be processed to detect anomalies and piped to different topics for immediate actions or longer-term analytics.

- **Log Aggregation**: Logs from various services can be piped into a centralized logging service, indexed and made searchable. This use case is crucial for debugging and monitoring large-scale distributed systems.

- **Event-Driven Architecture**: In an event-driven architecture, different services react to events as they occur. Message piping is essential for forwarding events to relevant services without creating tightly coupled integrations.

## Conclusion

Karafka Pro's message piping feature significantly enhances the flexibility and efficiency of Kafka-based systems. Facilitating smooth data transfer between components without tight coupling enables the creation of scalable, maintainable, and robust distributed systems. Note, however, that this feature is part of Karafka Pro and requires a commercial license.
