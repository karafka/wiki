# WaterDrop Transactions

!!! tip "Transactional and Exactly-Once Semantics Support in Consumers"

    Karafka Pro supports transactional operations and Exactly-Once Semantics for both producers and consumers. This enhanced functionality includes the production of messages and the committing of consumer offset within the same transaction. This ensures atomicity and consistency in message handling, making your data streaming processes more reliable and efficient. For a detailed understanding of these capabilities and their implementation, refer to the Karafka Pro [Transactions](https://karafka.io/docs/Pro-Transactions) documentation section.

WaterDrop transactions enable users to send multiple messages to multiple topics/partitions so that all messages are successfully published or none are, ensuring atomicity.

## Using Transactions

Before using transactions, you need to configure your producer to be transactional. This is done by setting `transactional.id` in the `kafka` settings scope:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'transactional.id': 'unique-id'
  }
end
```

The `transactional.id` is a unique identifier associated with a Kafka producer that allows it to participate in Kafka transactions. It's fundamental to achieving exactly-once semantics in Kafka.

A single `transactional.id` should only be used by one producer instance. Using the same `transactional.id` across multiple producer instances simultaneously can lead to undefined behavior and potential data inconsistencies.

### Simple Usage

The only thing you need to do to start using transactions is to wrap your code with a `#transaction` block:

```ruby
producer.transaction do
  producer.produce_async(topic: 'topic1', payload: 'data1')
  producer.produce_async(topic: 'topic2', payload: 'data2')
end
```

### Producing Messages One After Another

When a WaterDrop producer is set up in a transactional mode, every single message production will automatically initiate its transaction when it isn't wrapped within a transaction block. While this ensures atomicity for each message, there are more efficient approaches. Each transaction will introduce additional latency due to the overhead of starting and completing a transaction for every message.

For optimized performance, it's advisable to leverage batch dispatches. By batching messages, you can reduce the number of transactions and, consequently, the associated overheads. This will improve throughput and minimize the latency introduced by frequent transaction initiations and completions. In a transactional setting, batching is key to balancing consistency and performance.

**BAD**:

```ruby
# This code with a transactional producer will create and commit transaction
# with each outgoing message, slowing things down
Users.find_each do |user|
  producer.produce_async(topic: 'users', payload: user.to_json)
end
```

**BETTER**:

```ruby
# This code will create one transaction
# The downside is, that the transaction can reach a timeout if there are many users
producer.transaction do
  Users.find_each do |user|
    producer.produce_async(topic: 'users', payload: user.to_json)
  end
end
```

**BEST**:

```ruby
# This code will create a transaction per batch without risk of the transaction timeout
Users.find_in_batches do |users|
  producer.transaction do
    users.each do |user|
      producer.produce_async(topic: 'users', payload: user.to_json)
    end
  end
end
```

### Producing In Batches

When utilizing WaterDrop's `#produce_many_sync` and `#produce_many_async` methods, there's an inherent convenience built-in: WaterDrop will automatically encase the dispatch within a transaction. Hence, if your producer is already configured to be transactional, there's no need for an additional outer `#transaction` block. It streamlines the process, ensuring that your batch messages get delivered or none at all without requiring extra layers of transactional wrapping.

```ruby
# In case of batch messages production, the `#transaction` wrapper is not needed.
producer.transaction do
  producer.produce_many_async(messages)
end

# The code below will wrap the dispatch with a transaction automatically
producer.produce_many_async(messages)
```

### Aborting Transaction

Any exception or error raised within a transaction block will automatically result in the transaction being aborted. This ensures that if there are unexpected behaviors or issues during message production or processing, the entire batch of messages within that transaction won't be committed, preserving data consistency.


Below, you can find an example that ensures that all the messages are successfully processed and only in such cases all produced messages are being sent to Kafka:

```ruby
producer.transaction do
  messages.each do |message|
    payload = message.payload

    next unless message.payload.fetch(:type) == 'update'

    # If this exception is raised, none of the messages will be dispatched
    raise UnexpectedResource if message.payload.fetch(:resource) != 'user'

    # Pipe the data to users specific topic
    producer.produce_async(topic: 'users', payload: message.raw_payload)
  end
end
```

WaterDrop also provides a manual way to abort a transaction by raising an error. By using `raise WaterDrop::AbortTransaction`, you can signal the transaction to abort. This method is advantageous when you want to abort a transaction based on some business logic or condition without throwing an actual error that would leak out of the transaction.

```ruby
producer.transaction do
  messages.each do |message|
    # Pipe all events
    producer.produce_async(topic: 'events', payload: message.raw_payload)
  end

  # And abort if more events are no longer needed
  raise(WaterDrop::AbortTransaction) if KnowledgeBase.more_events_needed?
end
```

In both behaviors, the overarching principle is to ensure data consistency and reliability. Whether you're aborting due to unforeseen errors or specific business logic, Karafka provides the tools necessary to manage your transactions effectively.

### Delivery Handles and Delivery Reports

In WaterDrop, when dispatching messages to Kafka, the feedback mechanism about the delivery status of a message depends on whether you choose synchronous or asynchronous dispatching. You'll receive a delivery report for synchronous dispatches, providing immediate feedback about the message's delivery status. With synchronous dispatch, your program will pause and await a confirmation from the Kafka broker, signaling the successful receipt of the message.

Both delivery handels and delivery reports are supported when working within transactions, but they behave differently in this context. Delivery reports will have relevant details, such as the appropriate partition and offset values; however, a crucial distinction is the difference between message "delivery" and its visibility to consumers in a transactional setting. Even if the delivery report acknowledges the successful dispatch of a message, it doesn't guarantee that consumers will see it. Messages sent within a transaction have their offsets "reserved" in Kafka. But, unless the transaction is fully committed, these messages might not reach the consumers. Instead, they may undergo a "compaction" process, where they're essentially removed or not made visible to consumers.

In a transactional context with WaterDrop, a delivery report signals the message's successful reservation in Kafka, not its eventual consumability. The entire transaction must be successfully committed for a message to be available for consumption.

Below you can find an example of an aborted transaction with reports that indicate the offsets reserved for dispatched messages. Note, that while those offsets were reserved, they will never be passed to consumers.

```ruby
reports = []

producer.transaction do
  10.times do
    reports << producer.produce_sync(topic: 'events', payload: rand.to_s)
  end

  raise WaterDrop::AbortTransaction
end

reports.each do |report|
  puts <<~MSG.tr("\n", '')
    "Aborted message was sent to: #{report.topic_name}##{report.partition}
    and got offset: #{report.offset}"
  MSG
end

# Aborted message was sent to: events#0and got offset: 33
# Aborted message was sent to: events#0and got offset: 34
# Aborted message was sent to: events#0and got offset: 35
# Aborted message was sent to: events#0and got offset: 36
# ...
```

It's also vital to grasp a specific behavior when dealing with messages within a Kafka transaction in WaterDrop. If messages are part of a transaction but have yet to be delivered, and you attempt to use the `#wait` method on their delivery handles, you might encounter a `Rdkafka::RdkafkaError` `purge_queue` error. This error arises because the Kafka brokers did not acknowledge these undelivered messages. If the encompassing transaction is aborted, these messages are consequently removed from the delivery queue. This removal triggers the `purge_queue` error since you're essentially waiting on handles of messages that have been purged due to the transaction's abort.

```ruby
handles = []

producer.transaction do
  100.times do
    # Async is critical here
    handles << producer.produce_async(topic: 'events', payload: rand.to_s)
  end

  raise WaterDrop::AbortTransaction
end

# If messages were not yet acknowledged by the broker during the transaction
# this may raise an error as below
handles.each(&:wait)

# Local: Purged in queue (purge_queue) (Rdkafka::RdkafkaError)
```

## Delivery Warranties

When a WaterDrop transaction is committed without errors, it guarantees that all messages within the transaction have been successfully produced. This simplifies the process of instrumentation and monitoring of the producer and messages dispatch process significantly:

- **Single Point of Failure**: The end (commit) of the transaction is the primary focus. Its successful execution implies that all messages in the transaction have been produced, eliminating the need for additional checks.

- **Implicit Success Confirmation**: The absence of errors during transaction commitment implicitly confirms successful message production.

Because of the above, delivery reports may seem useless, however, while delivery reports are optional in transactional contexts, they still can help retrieve the offset of messages accepted by the broker, which can be valuable for tracking and auditing purposes.

## Internal Errors Retries

WaterDrop is designed to be intelligent about handling transaction-related errors. It discerns which errors can be retried and will attempt based on the configuration settings. The retries aren't immediate – they come with a backoff period, giving the system a brief respite before trying again. This approach can mitigate transient issues that might resolve themselves after a short period.

Regardless of the nature of the error – whether retryable or not - WaterDrop ensures transparency by publishing instrumentation events to `error.occurred` channel. This feature keeps the stakeholders informed, and potential interventions or investigations can be initiated if a pattern of errors emerges.

Errors encapsulated as `Rdkafka::RdkafkaError` offer insight into their nature, helping formulate a response strategy. Here's how you can interpret them:

- **retryable**: Indicates that a particular operation, such as offset commit, can be retried after a backoff. The assumption is that the operation should function as expected after the retry. WaterDrop is configured to attempt these retries several times before deeming it a failure.

- **fatal**: These errors signify issues from which there's no recovery, irrespective of the number of retry attempts. An example is being fenced out of a transaction. When encountering fatal errors, it's recommended to investigate the root cause, as they might indicate underlying severe problems.

- **abortable**: Errors in this category aren't recoverable in the current context of the ongoing transaction. While the error might not be fatal to the system, it does necessitate the abortion of the present transaction to maintain data integrity and consistency.


Below, you can find an example monitor that will print only transaction-related errors with extra status info:

```ruby
producer.monitor.subscribe('error.occurred') do |event|
  next unless event[:type].start_with?('transaction.')

  error = event[:error]

  puts 'Rdkafka error occurred during the transaction'
  puts "Error: #{error}"
  puts "Retryable: #{error.retryable?}"
  puts "Abortable: #{error.abortable?}"
  puts "Fatal: #{error.fatal?}"
end
```

Errors that are neither retryable, abortable, nor fatal are considered fatal as well.

## Purge Errors

Purge errors occur mostly when WaterDrop cannot deliver a given message for an extended period and decides to remove it from its internal queue.

In the context of a standard producer, a purge error is relatively uncommon and usually indicative of a problem. This type of error often arises when WaterDrop cannot deliver a given message to Kafka for an extended period. Common causes include network issues, Kafka broker unavailability, or misconfigurations.

Given the unexpected nature of purges in this context, they're flagged as errors. When such a situation arises, WaterDrop propagates the purge error via the `error.occurred` notification channel. As these are not typical behaviors, they should be diligently monitored and addressed.
Conversely, purge errors take on a different meaning within a transactional producer context. Specifically, during aborted transactions, it's a standard operation for WaterDrop to purge each message within the transaction that hasn't been dispatched to Kafka yet. This behavior is expected and part of how transactional processes ensure atomicity and consistency.

This purging process is anticipated within transactional boundaries, so these purge errors are not considered typical "errors." Instead of using the `error.occurred` notification channel, WaterDrop uses the `message.purged` channel to report these events. This distinction is crucial to ensure system monitors or logs are not flooded with false positives when working with transactional producers.

## Timeouts

The `transaction.timeout.ms` parameter in Kafka is a configuration setting specifying the maximum amount of time (in milliseconds) a transactional session can remain open without being completed. Once this timeout is reached, Kafka will proactively abort the transaction.

This behavior may impact you in the following ways:

- **Ensures Bounded Transaction Durations**: With `transaction.timeout.ms` in place, WaterDrop ensures that no transaction lingers indefinitely. This is especially crucial when unforeseen issues might prevent a transaction from completing normally. Having a set timeout ensures system resources aren't indefinitely tied up with stalled or zombie transactions.

- **Enhances System Resilience**: By auto-aborting transactions that surpass the set timeout, we avoid potential deadlocks or long-running transactions that might block other critical operations.

- **Determines Batch Size**: If you're sending a batch of messages as a part of a single transaction in WaterDrop, you need to ensure that the entire batch can be processed within the `transaction.timeout.ms` window. If the processing time risks exceeding this timeout, consider reducing the batch size or optimizing the processing speed.

- **Error Handling**: Transactions that are aborted due to reaching the timeout will raise an error. In the context of WaterDrop, it's crucial to handle these timeout-aborted transactions gracefully, possibly by retrying them or logging them for further investigation.

- **A Balancing Act**: Setting the correct value for `transaction.timeout.ms` requires a balance. If it's too short, legitimate transactions requiring more time might get prematurely aborted, leading to increased retries and system overhead. If it's too long, it might delay the detection and resolution of genuine issues.

!!! Warning "Potential Exceedance of `max_wait_timeout` in WaterDrop Transactions"

    When working with transactions in WaterDrop, especially in clusters experiencing connectivity issues or unavailability, be aware that the `max_wait_timeout` parameter may be exceeded. This behavior is due to the internal retry policies within WaterDrop, which are critical for maintaining system stability. Although this might result in longer wait times, it is an expected and necessary mechanism to ensure reliable message delivery and consistency across transactions. Therefore, this will not be addressed or altered in future updates.

## `transactional.id` Management and Fencing

One of the critical aspects of `transactional.id` is its ability to "fence out" older instances of a producer. If a producer instance with a given `transactional.id` crashes and another instance starts with the same `transactional.id`, Kafka ensures that the older producer instance can't commit any more messages, preventing potential duplicates. This behaviour is called fencing.

Below, you can find an example of how fencing works. After `producer2` first transaction, `producer1` will no longer be able to produce messages and will raise an error:

```ruby
kafka_config = {
'bootstrap.servers': 'localhost:9092',
'transactional.id': 'unique-id'
}

producer1 = WaterDrop::Producer.new do |config|
  config.kafka = kafka_config
end

producer2 = WaterDrop::Producer.new do |config|
  config.kafka = kafka_config
end

producer1.transaction do
  producer1.produce_async(topic: 'example', payload: 'data')
end

producer2.transaction do
  producer2.produce_async(topic: 'example', payload: 'data')
end

# This will raise an error as Kafka will fence out this producer instance
producer1.transaction do
  producer1.produce_async(topic: 'example', payload: 'data')
end
```

Here are some recommendations on how to set the `transactional.id` value:

1. **Uniqueness**: Ensure each producer instance has a unique `transactional.id`. This avoids conflicts and allows Kafka to correctly track and manage the state of each producer's transactions.

1. **Durability**: The `transactional.id` is meant to be durable across producer restarts. If a producer goes down and comes back up, it should use the same `transactional.id` to resume its activities.

1. **Avoid Sharing**: Never use the same transactional.id across multiple producer instances simultaneously. This can lead to unexpected behavior and data inconsistencies.

1. **Consistent Mapping**: If you have a particular processing task or a set of tasks, always assign the same `transactional.id` to them. This consistent mapping helps maintain exactly-once semantics, especially if jobs or producers restart.

1. **Storage**: Consider storing the mapping of `transactional.id` to specific tasks or workflows in durable storage. This ensures that even if your application restarts, you can consistently assign the correct `transactional.id` to each task.

1. **Monitoring**: Regularly monitor the transactions in your Kafka cluster. Look for anomalies or issues related to specific `transactional.id`, such as frequent aborts. This can help in early detection of potential problems.

1. **Fencing Awareness**: Understand that Kafka uses the `transactional.id` for producer fencing. Suppose a new producer instance starts with an existing transactional.id, older instances with the same ID will be "fenced out" and unable to send more messages. This is a protective measure to ensure data consistency, but be aware of this behavior when managing producer lifecycles.

1. **Avoid Overloading**: While it might be tempting to use highly descriptive `transactional.id` that encapsulates a lot of meta-information about the producer or task, keep them reasonably short and meaningful. This ensures better performance and manageability.

By adhering to these recommendations, you can ensure reliable transactional processing in Karafka and avoid potential pitfalls related to mismanagement of `transactional.id`.

## Nested Transaction

In certain situations, developers might inadvertently nest transactions within one another. With WaterDrop, this is gracefully handled to prevent any undesired side effects.

When using the WaterDrop producer, it possesses an inherent awareness of an ongoing transaction. If you initiate a nested transaction — starting another transaction inside an existing one — the producer won't get confused or initiate a separate, inner transaction. Instead, it will treat the entire sequence of operations as if they were under a single wrapping transaction from the beginning.

This intelligent behavior ensures:

1. **Simplicity**: You don't need to manage or be overly cautious about accidentally nesting transactions.

1. **Consistency**: Whether it's a single or mistakenly nested transaction, the outcome remains consistent; messages will either all be committed or aborted.

1. **Performance**: Since WaterDrop recognizes and avoids initiating multiple transactions, there's no additional overhead or latency from nested transaction initiations.

While it's generally good practice to be explicit and avoid nesting, with WaterDrop, you can be assured that even if nested transactions occur, they're handled seamlessly without any adverse effects.

```ruby
producer.transaction do
  producer.produce_async(topic: 'my_data', payload: rand.to_s)

  producer.transaction do
    producer.produce_async(topic: 'my_data', payload: rand.to_s)

    producer.transaction do
      producer.produce_async(topic: 'my_data', payload: rand.to_s)
    end
  end
end

# The above code conceptually behaves like that:
producer.transaction do
  producer.produce_async(topic: 'my_data', payload: rand.to_s)
  producer.produce_async(topic: 'my_data', payload: rand.to_s)
  producer.produce_async(topic: 'my_data', payload: rand.to_s)
end
```

## Instrumentation

In  WaterDrop, transaction-related events are monitored, emitting notifications for key activities. These events include:

- `transaction.started`
- `transaction.committed`
- `transaction.aborted`
- `transaction.marked_as_consumed`
- `transaction.finished`

Listeners can subscribe to these events, which integrate seamlessly with Karafka and WaterDrop's monitoring and logging systems. This feature ensures that every crucial phase of transaction processing is observable, aiding in debugging, performance monitoring, and system reliability.

!!! Warning "Event Subscription with Multiple Producers"

    In setups using a connection pool or multiple dedicated producers, remember to subscribe your event listeners to each producer instance. Each producer operates independently, so subscriptions are not automatically shared across instances. Failure to subscribe to each can result in missing critical transaction-related events.

```ruby
producer = WaterDrop::Producer.new

producer.setup do |config|
  config.kafka = { 'bootstrap.servers': 'localhost:9092' }
end

producer.monitor.subscribe('transaction.started') do |_event|
  puts "Wow, transaction just started!"
end

producer.monitor.subscribe('transaction.committed') do |_event|
  puts "Wow, transaction just got committed!"
end

producer.monitor.subscribe('transaction.aborted') do |_event|
  puts "Wow, transaction just got aborted!"
end
```

## Fatal Errors Recovery Strategy

When a fatal transactional error occurs, the producer can close and recreate its underlying client. This ensures that the system can continue operating without being halted by a single instance failure. The failed transaction will automatically roll back, allowing the new instance to take over safely.

The reloading mechanism is used exclusively within locked transactions, eliminating the risk of race conditions. Fencing is excluded to prevent any potential race conditions arising from this process.

The reloading process will be triggered only by errors caused during message dispatches within transactions. The system reloads on any errors where the cause is `Rdkafka::RdkafkaError`, with specific exclusions to avoid unintended reloading. This approach reloads the client in cases where other errors, such as those from Karafka, occur within transactions. Although this can impact performance due to the overhead of closing and reconnecting, it ensures that all errors result in a rollback, maintaining system integrity.

If you find this behaviour undesired, you have the power to set the `reload_on_transaction_fatal_error` configuration value to `false`. In this case, the producer client will not be reloaded, giving you control over the system's response to fatal errors.

## Limitations

Karafka producer transactions provide atomicity over streams, but users should be mindful of the following limitations:

- **Not Database Transactions**: WaterDrop transactions are distinct from database transactions. They don't support the rollback states typically in databases. Aborting a transaction ensures that the messages are not published but won't "undo" other side effects arising from message processing.

- **Latency**: Transactions necessitate coordination amongst Kafka brokers, leading to added latency.

- **Hanging Transactions**: Transactions that don't complete (neither committed nor aborted) can impact the Last Stable Offset (LSO) in Kafka. This can block consumers from reading new data until the hanging transaction is resolved, affecting data consumption and overall system throughput.

- **Web UI Dispatch Interference**: When both user code and Karafka Web UI use `Karafka.producer`, prolonged transactions can block the Web UI from reporting data due to a held lock, blocking other dispatches to Kafka. Ensure brief transactions, avoid concurrent access or initialize additional producers to mitigate this.

- **Handling Purge Errors in Transactions**: Purge errors are common during aborted transactions. Instead of broadcasting these through the `error.occurred` notification channel, they are relayed via the `message.purged` notification. This distinction is important because undelivered messages from an aborted transaction will trigger this notification. Recognizing these as standard behavior rather than errors is crucial when working with transactions.

- **Topic Creation During Production**: While WaterDrop's transactional producer can operate with non-existent topics when `allow.auto.create.topics` is set to `true`, creating topics beforehand is **strongly** advised. Failing to do so can lead to errors like:

    > Broker: Producer attempted a transactional operation in an invalid state (invalid_txn_state)

- **Thread Safety with WaterDrop**: While WaterDrop is inherently thread-safe, there are specifics to keep in mind for transactions:
    - **Lock During Transactions**: WaterDrop locks access to itself when a transaction is underway. For those anticipating high transactional loads, consider leveraging multiple producers. This way, while one producer is engaged in a transaction in one thread, others can operate independently.

    - **Exclusive Transactional Usage**: Should you configure a producer as transactional, be aware that it cannot then be used for non-transactional messaging, and all producer operations will be wrapped with a transaction.

- **Kafka System Records and Offset Allocation**: Kafka transactions, by design, create an additional record in the topic partition. This record is a system record and doesn't contain any user data. However, this, along with the messages from aborted transactions, does occupy offsets. These offsets are not merely placeholders; they represent an actual record in the Kafka log. It's crucial to understand that aborted transactions, despite not delivering messages, take up space in the log and modify the offset count. In the Karafka Web UI, these are visible as system records. This behavior can sometimes lead to confusion, as users might observe a disparity between the number of user messages and the total count of records (including system records). Recognizing and understanding these system records can help users better manage and diagnose issues with their Kafka topics and transactions.
  
    Below, you can find an example of how the Karafka Web UI reports topic looks when all the records are created using the transactional producer:

    <p align="center">
      <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/explorer_transactional.png" alt="karafka web ui transactional explorer"/>
    </p>

These limitations underline the importance of a thorough understanding and careful implementation when leveraging Kafka transactions, especially with tools like WaterDrop.

## Example Use Cases

- **Order Processing Systems**: When an order is placed, various events might be produced, such as order creation, payment processing, and inventory updates. All or none of these events must be published to ensure data consistency.

- **Financial Systems**: Consider a system responsible for handling bank transfers. Two events are produced for a transfer - debit from the source account and credit to the destination account. To maintain financial integrity, both events must be processed atomically.

- **Inventory Management**: Two actions might occur concurrently when selling a product online - updating the inventory count and notifying the shipping service. If only one of these actions is successful, it could result in data inconsistency.

- **Multi-step Workflows**: In processes involving multiple steps (like data transformation and aggregation), and each stage results in a message, all messages in the workflow must be published to maintain a consistent view of the workflow's state.

- **Audit Logging Systems**: When an action is performed, it may produce multiple audit logs. All related audit logs must be written atomically to ensure a complete trail of events.
