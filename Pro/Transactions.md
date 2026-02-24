Transactions in Karafka provide a mechanism to ensure that a sequence of actions is treated as a single atomic unit. In the context of distributed systems and message processing, a transaction ensures that a series of produce and consume operations are either all successfully executed or none are, maintaining data integrity even in the face of system failures or crashes.

Karafka's and Kafka's transactional support extends across multiple partitions and topics. This capability is crucial for applications that require strong consistency guarantees when consuming from and producing various topics. A classic use case is the read-process-write pattern, where a consumer reads messages from a source topic, processes them, and produces the results to a sink topic. Using transactions, you can ensure that messages' consumption and subsequent production are atomic, preventing potential data loss or duplication.

Karafka supports Kafka's Exactly-Once Semantics, the gold standard for message processing systems. It ensures that each message is processed exactly once, eliminating data duplication or loss risks. In simpler terms, despite failures, retries, or other anomalies, each message will affect the system state only once.

In Kafka, achieving Exactly-Once Semantics involves ensuring that:

- Producers do not write duplicate records. Kafka achieves this by handling idempotence at the producer level. An idempotent producer assigns a sequence number to each message, and the broker ensures that each sequence is written only once.

- Consumers process messages only once. This is trickier and involves ensuring that the commit of the consumer's offset (which marks where the consumer is in a topic partition) is part of the same transaction as the message processing. If the consumer fails after processing the message but before committing the offset, the message might be processed again, leading to duplicates.

Karafka transactions provide Exactly-Once Semantics by ensuring that producing to a topic and committing the consumer offset are part of the same atomic transaction. When a transactional producer publishes messages, they are not immediately visible to consumers. They become visible only after the producer commits the transaction. If the producer fails before committing, the consumers do not read the messages, and the state remains consistent.

## Using Transactions

!!! tip "Scope of WaterDrop Transactions"

    Please note that **this document concentrates solely on the consumer-related aspects of Karafka's transactions**. For a comprehensive understanding of transactions and to ensure a well-rounded mastery of Karafka's transactional capabilities, delving into the [WaterDrop transactions documentation](WaterDrop-Transactions) is imperative.

!!! warning "Avoid Mixing Transactional and Non-Transactional Offset Committing"

    Mixing transactional offset committing with non-transactional offset committing is strongly discouraged. When these two modes are combined, it can lead to unpredictable behavior and compromise the integrity of your data processing.

    In such scenarios, Kafka will issue warnings in its logs, which may look like this:

    ```
      WARN [GroupMetadataManager brokerId=1]
      group: ID with leader: LEADER-ID has received offset commits from consumers as well as transactional producers.
      Mixing both types of offset commits will generally result in surprises and should be avoided.
      (kafka.coordinator.group.GroupMetadataManager)
    ```

    To ensure reliable and predictable processing, always commit offsets using the mode within your consumer. If transactional processing is enabled, all offset commits should be part of a transaction. If you're processing offsets non-transactionally, do not mix this with transactional operations.

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

Karafka also provides a manual way to abort a transaction without raising an error. By using `raise(WaterDrop::AbortTransaction)`, you can signal the transaction to abort. This method is advantageous when you want to abort a transaction based on some business logic or condition without throwing an actual error.

```ruby
def consume
  transaction do
    messages.each do |message|
      # Pipe all events
      producer.produce_async(topic: 'events', payload: message.raw_payload)
    end

    mark_as_consumed(messages.last)

    # And abort if more events are no longer needed
    raise(WaterDrop::AbortTransaction) if KnowledgeBase.more_events_needed?
  end
end
```

### Automatic Offset Management in Transactions

Karafka operates with a default mode that employs automatic offset management. This efficient approach commits offsets after the successful processing of each batch, streamlining the message-handling process:

```ruby
# Note: There's no need to mark messages as consumed manually;
# it occurs automatically post-batch processing.
def consume
  messages.each do |message|
    EventStore.save!(message.payload)
  end
end
```

Karafka recognizes and harmonizes the two flows when integrating transactions with this automatic offset management. This allows for the seamless use of transactions and the explicit marking of messages as consumed within these transactions without interfering with Karafka's implicit offset management behavior.

```ruby
def consume
  # Take at most 100 events and aggregate them, pipe them into a
  # separate topic and mark all as consumed in one go.
  messages.each_slice(100).each do |batch|
    transaction do
      result = Aggregator.merge(batch.map(&:payload))

      produce_async(topic: :aggregations_stream, payload: result.to_json)

      mark_as_consumed(batch.last)
    end
  end
end
```

Karafka's design capitalizes on Kafka's transactional mechanisms, intricately linking the consumption of messages with the output of subsequent messages within a singular, indivisible operation.

Consequently, if a transaction is prematurely aborted or encounters a failure, the offsets of the consumed messages remain uncommitted. As a result, the same batch of messages is queued for reprocessing, effectively nullifying data loss and strictly adhering to the principles of exactly-once processing semantics. Thus, the integration of automatic offset management with transactions is seamless and devoid of risk, ensuring the integrity and consistency of message processing.

### Manual Offset Management in Transactions

!!! warning "Direct Transactional Producer Usage Is Not Recommended"

    Using a transactional producer directly in a `#consume` method, bypassing the `#wrap` mechanism, is strongly discouraged unless you're fully managing the offsets in your consumer. While this approach may seem straightforward for basic use cases, it fails to accommodate advanced offset management scenarios, such as handling messages that need to be redirected to a Dead Letter Queue (DLQ).

When using Manual Offset Management, you can provide a custom producer to the `#transaction` method as its first argument. This allows for greater flexibility in managing transactions, particularly in scenarios requiring advanced control over producers and offsets.

In such cases, you do not have to use the `#wrap` API and you can embed selection of the consumer into your transactional flow directly:

```ruby
def consume
  PRODUCERS.with do |transactional_producer|
    # Use this only when fully managing offsets yourself
    transaction(transactional_producer) do
      messages.each do |message|
        # Custom processing logic
        process_message(message)

        mark_as_consumed(message)
      end
    end
  end
end
```

!!! tip "Using `#wrap` with Manual Offset Management and Custom Producers"

    When providing a custom producer directly to the `#transaction` method while using manual offset management, you must ensure that no Karafka features that automatically manage and store offsets are used in your consumer. Any inadvertent offset management by Karafka could interfere with the integrity of your manual offset strategy.

    In many cases, it may be a better idea to leverage the `#wrap` API, even when using manual offset management. The `#wrap` API allows you to handle custom producer assignment and lifecycle management seamlessly, while still ensuring that the overall Karafka consumption flow - including synchronization and framework-level operations—executes correctly. This approach reduces the risk of inconsistencies and simplifies producer handling in complex scenarios.

### Using a Dedicated Transactional Producer

Karafka's `#transaction` method is designed to handle complex message processing scenarios efficiently, especially in highly-traffic systems. It allows using a custom producer instance instead of the default `Karafka.producer`. This functionality is crucial in two primary contexts:

- **Dedicated Transactional Producer**: You can use a separate, dedicated producer for transactions when you need stronger guarantees about the atomicity and consistency of operations. This specialized producer works in tandem with the standard, faster, non-transactional producer, and it's beneficial for operations where maintaining transaction integrity is critical.

```ruby
def consume
  # Use a dedicated transactional producer instead of
  # default faster one for this type of operations
  transaction do
    result = Aggregator.merge(messages.payloads)

    produce_async(topic: :aggregations_stream, payload: result.to_json)

    mark_as_consumed(batch.last)
  end
end

# @param _action_name [Symbol] name of action like :consume, :revoked, etc
def wrap(_action_name)
  default = self.producer
  self.producer = TRANSACTIONAL_PRODUCER

  yield

  self.producer = default
end
```

- **WaterDrop Connection Pool**: In high-traffic systems where throughput is vital, efficiently managing producer instances becomes essential. WaterDrop provides a built-in [`ConnectionPool`](WaterDrop-Connection-Pool) that manages producer instances automatically. This pool allows your system to handle multiple transactions simultaneously by providing an available producer for each transaction, optimizing resource use, and maintaining system performance.

```ruby
def consume
  # If there were issues during wrapping (producer selection, etc), re-raise it so a backff
  # policy can be applied
  raise @wrap_error if @wrap_error

  transaction do
    result = Aggregator.merge(messages.payloads)

    produce_async(topic: :aggregations_stream, payload: result.to_json)

    mark_as_consumed(batch.last)
  end
end

# The `#wrap` allows you to wrap the actions with a custom block that can be used to assign
# a producer from WaterDrop's built-in connection pool
#
# @param _action_name [Symbol] name of action like :consume, :revoked, etc
def wrap(_action_name)
  # Store the original producer
  default = producer

  WaterDrop::ConnectionPool.with do |selected_producer|
    # Assign the transactional producer from the pool
    self.producer = selected_producer

    yield

    # Restore the original producer so the one from the pool does not leak out
    self.producer = default
  end
# Ensure yield is called even in case of any errors
rescue ConnectionPool::TimeoutError => e
  @wrap_error = e

  yield
ensure
  @wrap_error = false
end
```

The importance of having a pool of producers is highlighted by how transactions lock producers in Karafka. When a transaction starts, it locks its producer to the current thread, making the producer unavailable for other operations until the transaction is completed or rolled back. In a high-traffic system, this could lead to performance issues if multiple transactions are waiting for the same producer.

With WaterDrop's built-in [connection pool](WaterDrop-Connection-Pool), this challenge is mitigated. When a transaction begins, it picks an assigned producer from the pool, allowing other operations to proceed in parallel with their producers. After the transaction ends, the producer is released back to the pool, ready to be used for new transactions.

In essence, with support for dedicated transactional producers, Karafka's `#transaction` method offers a structured and efficient way to manage message transactions in highly-traffic systems.

!!! warning "Direct Transactional Producer Usage Is Not Recommended"

    Using a transactional producer directly in a `#consume` method, bypassing the `#wrap` mechanism, is strongly discouraged unless you're fully managing the offsets in your consumer. While this approach may seem straightforward for basic use cases, it fails to accommodate advanced offset management scenarios, such as handling messages that need to be redirected to a Dead Letter Queue (DLQ).

    In these scenarios, the Karafka framework might invoke the transactional producer after the main consumption logic completes. This implicit usage could lead to unintended transactional behavior or conflicts, undermining the integrity of your processing logic.

    The recommended approach is to utilize the `#wrap` method when customizing the producer. This ensures that the transactional producer is seamlessly managed across the entire lifecycle of the action, including any framework-level operations that occur after your custom logic. By adhering to this practice, you maintain consistency, avoid unexpected issues, and fully leverage the robustness of Karafka's transactional processing capabilities.

!!! warning "Ensure `#wrap` Always Calls `yield`"

    It is critical to ensure that the `#wrap` method always calls `yield`, even if operations like selecting a producer from a pool fail. The `yield` statement in `#wrap` executes the entire operational flow within Karafka, including not only your custom logic but also essential framework-level synchronization and processing code.

    You can read more about this requirement [here](Consuming-Messages#wrapping-the-execution-flow).

### Risks of Early Exiting Transactional Block

In all versions of Karafka, using `return`, `break`, or `throw` to exit a transactional block early is **not allowed**.

However, the behavior differs between versions of WaterDrop:

- **pre 2.8.0**: Exiting a transaction using `return`, `break`, or `throw` would cause the transaction to rollback.
- **2.8.0 and Newer**: Exiting a transaction using these methods will raise an error.

It is not recommended to use early exiting methods. To ensure that transactions are handled correctly, refactor your code to avoid using `return`, `break`, or `throw` directly inside transactional blocks. Instead, manage flow control outside the transaction block.

**BAD**:

```ruby
MAX = 10

def consume
  count = 0

  transaction do
    messages.each do |message|
      count += 1

      producer.produce_async(topic: 'events', payload: message.raw_payload)

      # This will cause either abort or error
      return if count >= MAX
    end
  end
end
```

**GOOD**:

```ruby
MAX = 10

def consume
  transaction do
    # This will be ok, since it is not directly in the transaction block
    produce_with_limits(messages)
  end
end

def produce_with_limits(messages)
  count = 0

  messages.each do |message|
    count += 1

    producer.produce_async(topic: 'events', payload: message.raw_payload)

    return if count >= MAX
  end
end
```

### Balancing Transactions and Long-Running Jobs

Providing a custom producer to the `#transaction` method temporarily overwrites the default producer for that specific consumer instance. This behavior is relevant in scenarios involving [Long-Running Jobs](Pro-Long-Running-Jobs) that execute alongside the message consumption process, such as handling `#revoked` under Long Running Jobs (LRJ).

It's crucial to understand the implications of this producer reassignment:

- **Temporary Producer Reassignment**: During the transaction's execution, the custom producer you provide becomes the active producer for the consumer. Any operations within the transaction's scope will use this custom producer instead of the default one.

- **Implications for Long-Running Jobs**: For long-running jobs actions `#revoked` that might run parallel with the consumption process, the transactional producer (the custom producer provided to the transaction) may be used for these operations. This could be a concern if the transactional producer is locked for an extended period due to a lengthy transaction, potentially affecting parallel processing.

- **Recommendation for Systems with Parallel Processing Needs**: If your system frequently handles long-running jobs alongside message consumption, especially if these jobs are expected to run in parallel with transactions, it's advisable to use WaterDrop's built-in [connection pool](WaterDrop-Connection-Pool) consistently. Doing so ensures that a locked producer in a lengthy transaction doesn't hinder the performance or progress of other parallel operations. Instead of relying on the default `#producer` consumer reference, using WaterDrop's [`ConnectionPool`](WaterDrop-Connection-Pool) can significantly enhance system robustness and concurrency, allowing each transaction or job to operate with its dedicated producer resource.

```ruby
# Example consumer that due to usage of LRJ in the routing can have the `#consume`
# and `#revoked` run in parallel. Due to this, WaterDrop's [connection pool](WaterDrop-Connection-Pool) is used to make sure
# that ongoing transaction and revocation get their respective dedicated producers
class LrjOperableConsumer
  def consume
    # Re-raise wrap error (if any)
    raise @wrap_error if @wrap_error

    # Uses the default transactional producer taken from a pool assigned via `#wrap`
    transaction do
      result = Aggregator.merge(messages.payloads)

      produce_async(topic: :aggregations_stream, payload: result.to_json)

      mark_as_consumed(batch.last)
    end
  end

  def revoked
    # If would run in parallel to `#consume` when LRJ is in use, will receive a
    # different producer instance
    PRODUCERS.with do |producer|
      producer.produce_async(topic: :revokactions, payload: @state.to_json)
    end
  end

  def wrap(action_name)
    # since for LRJ revoked can run in parallel with `#consume` we do not reassign the consumer but
    # rather we opt for explicit producer selection
    return yield if action_name == :revoked

    # Store the original producer
    default = producer

    WaterDrop::ConnectionPool.with do |selected_producer|
      # Assign the transactional producer
      self.producer = selected_producer

      yield

      # Restore the original producer so the one from the pool does not leak out
      self.producer = default
    end
  # yield needs to be called always, even in case of wrap errors
  rescue ConnectionPool::TimeoutError => e
    @wrap_error = e
    yield
  end
end
```

### Offset Metadata Storage

The [Offset Metadata Storage](Pro-Offset-Metadata-Storage) feature allows you to attach custom metadata to message offsets, enhancing the traceability and context of message processing. Crucially, this metadata can be included when you use the `#mark_as_consumed` method within transactions, ensuring the metadata is committed alongside the successful transaction. This feature is fully functional within and outside of transactional contexts, providing a consistent and flexible approach to enriching your message with valuable contextual data.

```ruby
def consume
  transaction do
    result = Aggregator.merge(messages.payloads)

    produce_async(topic: :aggregations_stream, payload: result.to_json)

    # Providing offset metadata will fully work from inside of transactions
    mark_as_consumed(
      batch.last,
      # Make sure that this argument is a string and in case of a JSON, do not
      # forget to define a custom deserializer
      {
        process_id: Process.uid,
        aggregated_state: @aggregator.to_h,
      }.to_json
    )
  end
end
```

### Transactions After Revocation

Specific scenarios, like partition revocation, can introduce complexities that must be handled gracefully. Here's how Karafka transactions behave after revocation:

1. **Transactions Post-Revocation**: Transactions in Karafka that solely focus on producing messages, without marking any message as consumed, continue to function normally even after revocation. This feature is handy in specific scenarios, such as executing transactions within the `#revoked` method, where you might want to continue producing messages based on some internal state or logic.

1. **Consumption Marking and Assignment Loss**: If a transaction attempts to mark a message as consumed after partition revocation, Karafka raises a `Karafka::Errors::AssignmentLostError`. This behavior is intentional and caters to the system's consistency guarantees. Since the consumer no longer owns the partition, marking messages, as consumed, could lead to inconsistencies and is therefore prevented.

1. **Handling Assignment Loss During Transactions**: If the assignment is lost while a transaction is in progress, the transaction is automatically rolled back, and an error is raised. This rollback is crucial to maintaining the atomicity and integrity of transactions, ensuring that partial or inconsistent states do not persist in the system.

In summary, Karafka's transaction handling after revocation is designed to maintain the integrity and consistency of message processing. By allowing message production to continue post-revocation and ensuring that consumption marking is tightly controlled, Karafka provides a robust framework for managing transactions, even in the face of complex distributed system behaviors like partition revocation.

### Transactions in the Dead-Letter Queue

This section explains how transactions interact with the DLQ and the implications for message processing.

1. **Consistent Transaction Behavior**: From the user's perspective, transactions in Karafka behave consistently, whether or not the DLQ is utilized. This means the practice of wrapping your message processing code within transactions remains unchanged, providing a consistent development experience.

1. **Transactional Dead-Letter Queue Operations**: In scenarios involving persistent errors - where messages need to be moved to the DLQ - Karafka, by default, uses transactions to perform two critical operations atomically: moving the message to the DLQ and committing the offset (when necessary). This ensures that the message relocation to the DLQ and the acknowledgment of message processing (offset commit) are treated as a single atomic operation, maintaining consistency.

    !!! note "Disabling Transactions During DLQ Dispatches"

        It's worth noting that this behavior can be adjusted. If the transactional mode in the DLQ configuration is turned off, Karafka won't use transactions to move messages to the DLQ. You can read more about this [here](Pro-Enhanced-Dead-Letter-Queue#disabling-transactions-during-dlq-dispatches).

1. **Error Handling and Retries**: If an error occurs during the DLQ operation, such as partition revocation or networking issues, Karafka's default behavior is to retry processing the same batch. This retry mechanism ensures that transient failures don't lead to message loss or unacknowledged message consumption. The system attempts to process the batch again, allowing the operation to succeed.

1. **Considerations for DLQ Dispatching**: In certain situations, particularly under specific configurations or system constraints, DLQ dispatches might not be possible. For instance, if network issues prevent communication with the DLQ topic or transactional integrity can't be maintained due to partition revocations, the DLQ operations might not proceed as expected.

In such cases, it's important to understand that the DLQ might not operate, meaning that messages that fail processing persistently might not be moved to the DLQ. This situation underscores the importance of monitoring and potentially adjusting the system configuration or handling mechanisms to ensure that messages are either processed successfully or reliably moved to the DLQ.

In conclusion, while transactions in Karafka provide a robust mechanism for processing messages consistently and atomically, their interaction with the DLQ introduces specific behaviors and considerations.

## Delivery Warranties

Karafka, leveraging Kafka's Transactional Producer, offers solid delivery warranties that ensure data integrity and reliable message processing in distributed systems.

Here's how Karafka's delivery warranties manifest in transactions:

- **Atomicity Across Partitions and Topics**: Karafka transactions maintain atomicity within a single partition or topic and across multiple ones. This feature is invaluable when a transaction spans producing and consuming from multiple topics or partitions, ensuring that all these operations succeed or fail as a single unit.

- **Exactly-Once Semantics (EOS)**: Karafka supports Kafka's exactly-once semantics within its transactional framework. This ensures that each message processed in a transaction is affected exactly once in the system, nullifying the risks associated with data duplication or loss, even in scenarios involving retries or system failures.

- **Idempotent Writes**: Through the use of Kafka's Transactional Producer, Karafka ensures idempotent writes within transactions. Even if the transactional producer attempts to send a message multiple times, each message is written only once, preventing data duplication and contributing to the EOS guarantee.

- **Consistent State in Failure Scenarios**: Karafka's transactional processing is designed to maintain system consistency, even when failures occur. If a transaction doesn't complete successfully due to issues like system crashes or network failures, it's aborted. This rollback mechanism ensures that incomplete or partial transactions don't corrupt the system state.

- **Isolation and Concurrency Control**: Transactions in Karafka are well-isolated, ensuring that the operations of an ongoing transaction aren't visible to others until the transaction is committed. This level of isolation is crucial in maintaining data consistency, particularly in environments where transactions are highly concurrent.

- **Robust Failure Recovery**: Karafka is built to handle failures gracefully. If a transaction is interrupted (e.g., due to a producer crash), Karafka ensures that the system can recover consistently, aligning with the last committed transaction. This resilience is key to maintaining continuous and reliable operations.

## Instrumentation

Transactions Instrumentation is directly tied to the **producer** handling the transaction. To effectively monitor transaction behavior, it's essential to integrate your instrumentation with the transactional producers. This ensures accurate tracking and analysis of transactional activities, enhancing system monitoring and reliability. Refer to the [WaterDrop Transactions Instrumentation](WaterDrop-Transactions#instrumentation) section for a comprehensive approach to transaction instrumentation.

However, it's important to know that **consumer lag monitoring** for transactional consumers behaves differently. Since offsets are committed as part of the transaction by the producer rather than by the consumer, the usual consumer metrics (like `consumer_lag_stored`) will not be published or will show `-1` (or remain at whatever initial offset they had when subscribing). In other words, **consumer lag is not directly visible at the consumer level** because it's bypassing the consumer's offset manager.

!!! warning "Consumer Lag Monitoring"

    It's essential to be aware that **consumer lag monitoring** for transactional consumers behaves differently. Since offsets are committed as part of the transaction by the producer rather than by the consumer, the usual consumer metrics (like `consumer_lag_stored`) will not be published or will show `-1` (or remain at whatever initial offset they had when subscribing). In other words, **consumer lag is not directly visible at the consumer level** because it's bypassing the consumer's offset manager.

### Karafka Web UI

Karafka Web UI compensates for the lack of lag reporting in the `statistics.emitted` and **tracks offsets that are updated post-transaction**. In the Web UI, you'll see lag that is "more or less" accurate - though you might notice small `+1/-1` discrepancies due to offset reporting nuances.

### Custom Instrumentation

If you've built custom instrumentation around consumer lag or offsets, you'll need to compensate manually. Because the consumer doesn't store the offsets, you can't rely on the usual consumer statistics to get the lag. You'll need to base your metrics on **post-transaction offsets** or handle offset tracking in your own way.

### Transaction Event Notification

For advanced monitoring or custom integrations, remember that the Karafka consumer publishes a `consumer.consuming.transaction` notification event after each successful transaction. This event can be used to hook into transaction completions and incorporate transaction-aware logic in your instrumentation or metrics gathering.

!!! tip "`consumer.consuming.transaction` Instrumentation Event"

    The `consumer.consuming.transaction` instrumentation event is triggered after each successful transaction. Importantly, if you raise `WaterDrop::AbortTransaction` to abort a transaction, this event will still be triggered. Similar to how ActiveRecord transactions handle rollbacks internally, the abort, in this case, does not bubble up as an exception. Instead, the transaction is cleanly rolled back, and the event is published, allowing you to track transaction completions even in cases where they were aborted.

## Using Transactions in Swarm Mode

For detailed information about working with transactional producers in Swarm Mode, including configuration inheritance, transactional ID management, and best practices, please refer to our dedicated documentation section on [Transactional Producer Handling in Swarm Mode](Swarm-Multi-Process#transactional-producer-handling-in-swarm-mode).

## Performance Implications

While Kafka transactions in Karafka provide strong consistency guarantees and data integrity, they have specific performance implications crucial to understanding system architecture and design. Here are the key considerations:

1. **Increased Latency**: Transactions introduce a particular overhead due to the additional coordination and state management required to ensure atomicity and consistency. This can lead to increased latency in message processing, as the system needs to ensure that all parts of the transaction are completed before moving forward.

1. **Resource Utilization**: Transactional operations typically consume more resources compared to non-transactional ones. This is because the system must maintain additional state information and handle the coordination and rollback mechanisms in case of failures. As a result, there might be an increased load on the brokers and a higher consumption of network resources.

1. **Throughput Considerations**: The use of transactions can impact the system's overall throughput. The need to ensure atomicity and exactly-once semantics means that messages within a transaction need to be processed more controlled, which can reduce the rate at which messages are processed compared to non-transactional workflows.

1. **Producer Locking in Karafka (Waterdrop)**: In Karafka, when a transaction is initiated, the Waterdrop producer is locked to the thread handling the transaction. This means any other thread can only use the producer once the transaction is completed. This locking mechanism is crucial for ensuring the integrity of the transaction but can lead to contention and reduced parallelism, especially in high-throughput scenarios where multiple threads need to produce messages concurrently.

1. **Handling Failures and Retries**: Transactions necessitate a more complex handling of failures and retries. If a part of the transaction fails, the whole transaction needs to be rolled back and potentially retried. This complexity can add to the processing time and requires careful design to avoid issues such as deadlocks or repeated failures.

1. **Risk of Hanging Transactions**: Hanging transactions pose a significant risk, often resulting from inconsistencies between the replicas and the transaction coordinator. Historically, analyzing these situations has been challenging due to limited visibility into the producers' and transaction coordinators' states. However, Kafka provides tools to detect, analyze, and recover from hanging transactions, enhancing system stability and performance. You can read more about this issue [here](https://cwiki.apache.org/confluence/display/KAFKA/KIP-664%3A+Provide+tooling+to+detect+and+abort+hanging+transactions).

In summary, while Kafka transactions in Karafka provide significant data consistency and reliability benefits, they also introduce specific performance implications. It's essential to weigh these factors carefully when designing your system and implement monitoring and performance tuning to ensure that the system can handle the required load while maintaining the integrity of the transactions. Understanding and managing these implications can help balance consistency guarantees and system performance.

## Example Use Cases

- **Financial Transactions Processing**: Ensuring that each financial transaction, whether a money transfer, payment, or stock trade, is processed exactly once, avoiding any financial discrepancies or double transaction issues.

- **Inventory Management**: Managing inventory updates precisely after sales or restocking, using Kafka to synchronize the updates across multiple systems and prevent scenarios like overselling or mismatches in stock levels.

- **Order Processing Systems**: Handling the lifecycle of an e-commerce order, from placement to delivery, by ensuring that each stage of the order is processed exactly once, thereby avoiding duplicate processing or lost orders.

- **Data Pipeline Deduplication**: Cleaning up data streams by removing duplicate data points is particularly crucial in data analytics and processing pipelines to ensure that downstream consumers work with unique, clean datasets.

- **User Activity Tracking**: Accurately recording user actions such as clicks, views, and interactions without duplication, thereby enabling precise analytics and the delivery of personalized content based on accurate user behavior data.

- **IoT Device State Synchronization**: Ensuring that messages from IoT devices are processed exactly once to maintain a consistent and accurate view of the device states is critical in environments where real-time monitoring and control are essential.

- **Distributed System Command Processing**: Processing commands issued to distributed systems like microservices architectures exactly once to prevent state corruption and ensure that the system's state remains consistent and reliable.

- **Real-time Analytics and Monitoring**: Providing accurate real-time analytics and monitoring by aggregating and processing logs or metrics data from various sources without duplication, ensuring that the insights derived are based on reliable data.

- **Multi-Database Synchronization**: Syncing data across different databases or data stores while ensuring that each update is applied exactly once, thereby preventing data drift and maintaining consistency across distributed data systems.

These scenarios illustrate the pivotal role of Karafka transactions in ensuring data integrity and consistency across various domains, leveraging Kafka's exactly-once processing semantics.

## Summary

Karafka's Kafka transactions provide a robust mechanism for ensuring atomicity and consistency in distributed message processing. Handling produce and consume operations as a single unit prevents data loss or duplication, which is crucial for applications demanding strong consistency across partitions and topics.

The framework supports Kafka's Exactly-Once Semantics, ensuring each message impacts the system state precisely once. This is crucial for operations like financial transactions or real-time analytics. However, performance implications like increased latency and resource demands must be considered.

Karafka ensures comprehensive transaction management, including automatic offset management, dedicated transactional producers, and effective handling in revocation and Dead-Letter queue scenarios.
