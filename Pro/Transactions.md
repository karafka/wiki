Transactions in Karafka provide a mechanism to ensure that a sequence of actions is treated as a single atomic unit. In the context of distributed systems and message processing, a transaction ensures that a series of produce and consume operations are either all successfully executed or none are, maintaining data integrity even in the face of system failures or crashes.

Karafka's and Kafka's transactional support extends across multiple partitions and topics. This capability is crucial for applications that require strong consistency guarantees when consuming from and producing various topics. A classic use case is the read-process-write pattern, where a consumer reads messages from a source topic, processes them, and produces the results to a sink topic. Using transactions, you can ensure that messages' consumption and subsequent production are atomic, preventing potential data loss or duplication.

Karafka supports Kafka's Exactly-Once Semantics, the gold standard for message processing systems. It ensures that each message is processed exactly once, eliminating data duplication or loss risks. In simpler terms, despite failures, retries, or other anomalies, each message will affect the system state only once.

In Kafka, achieving Exactly-Once Semantics involves ensuring that:

- Producers do not write duplicate records. Kafka achieves this by handling idempotence at the producer level. An idempotent producer assigns a sequence number to each message, and the broker ensures that each sequence is written only once.

- Consumers process messages only once. This is trickier and involves ensuring that the commit of the consumer's offset (which marks where the consumer is in a topic partition) is part of the same transaction as the message processing. If the consumer fails after processing the message but before committing the offset, the message might be processed again, leading to duplicates.

Karafka transactions provide Exactly-Once Semantics by ensuring that producing to a topic and committing the consumer offset are part of the same atomic transaction. When a transactional producer publishes messages, they are not immediately visible to consumers. They become visible only after the producer commits the transaction. If the producer fails before committing, the consumers do not read the messages, and the state remains consistent.

## Using Transactions

!!! tip "Scope of WaterDrop Transactions"

    Please note that **this document concentrates solely on the consumer-related aspects of Karafka's transactions**. For a comprehensive understanding of transactions and to ensure a well-rounded mastery of Karafka's transactional capabilities, delving into the [WaterDrop transactions documentation](https://karafka.io/docs/WaterDrop-Transactions/) is imperative.

Before using transactions, you need to configure your producer to be transactional. This is done by setting `transactional.id` in the kafka settings scope:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'transactional.id': 'unique-id'
  }
end
```

### Simple Usage

The only thing you need to do to start using transactions is to wrap your code with a `#transaction` block:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    sum = 0

    messages.each do |message|
      sum += message.payload['count']
    end

    transaction do
      produce_async(topic: :sums, payload: sum.to_s)

      mark_as_consumed(messages.last)
    end
  end
end
```

Karafka will automatically start a `#producer` with support for committing the message offset inside. That way, your message production can be interconnected with marking the offset. Either both will be successful or none.

In case the transaction fails (for any reason), neither of the messages will be produced nor the offset will be marked.

### Aborting Transactions

Any exception or error raised within a transaction block will automatically result in the transaction being aborted. This ensures that if there are unexpected behaviors or issues during message production or processing, the entire batch of messages within that transaction won't be committed, preserving data consistency.

Below, you can find an example that ensures that all the messages are successfully processed and only in such cases all produced messages are being sent to Kafka together with marking of last message as consumed:

```ruby
def consume
  transaction do
    messages.each do |message|
      payload = message.payload

      next unless message.payload.fetch(:type) == 'update'

      # If this exception is raised, none of the messages will be dispatched
      raise UnexpectedResource if message.payload.fetch(:resource) != 'user'

      # Pipe the data to users specific topic
      produce_async(topic: 'users', payload: message.raw_payload)
    end

    mark_as_consumed(messages.last)
  end
end
```

Karafka also provides a manual way to abort a transaction without raising an error. By using `throw(:abort)``, you can signal the transaction to abort. This method is advantageous when you want to abort a transaction based on some business logic or condition without throwing an actual error.

```ruby
def consume
  transaction do
    messages.each do |message|
      # Pipe all events
      producer.produce_async(topic: 'events', payload: message.raw_payload)
    end

    mark_as_consumed(messages.last)

    # And abort if more events are no longer needed
    throw(:abort) if KnowledgeBase.more_events_needed?
  end
end
```

### Automatic Offset Management in Transactions

TBA

### Using a Dedicated Transactional Producer

TBA

### Offset Metadata Storage

TBA

### Transactions After Revocation

TBA

### Transactions in Dead-Letter Queue

TBA

Note about after consume potential DLQ failures and their retry policy.

### Producers Connection Pooling

TBA

### Instrumentation

TBA

## Delivery Warranties

TBA

## Limitations

TBA

## Example Use Cases

TBA

## Summary

TBA
