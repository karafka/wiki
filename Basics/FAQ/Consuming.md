1. [Could an HTTP controller also consume a fetched message through the Karafka router?](#could-an-http-controller-also-consume-a-fetched-message-through-the-karafka-router)
1. [Can I use ```#seek``` to start processing topics partition from a certain point?](#can-i-use-seek-to-start-processing-topics-partition-from-a-certain-point)
1. [Why Karafka does not pre-initializes consumers prior to first message from a given topic being received?](#why-karafka-does-not-pre-initializes-consumers-prior-to-first-message-from-a-given-topic-being-received)
1. [Can I use Thread.current to store data between batches?](#can-i-use-threadcurrent-to-store-data-between-batches)
1. [Why, when using `cooperative-sticky` rebalance strategy, all topics get revoked on rebalance?](#why-when-using-cooperative-sticky-rebalance-strategy-all-topics-get-revoked-on-rebalance)
1. [What will happen with uncommitted offsets during a rebalance?](#what-will-happen-with-uncommitted-offsets-during-a-rebalance)
1. [Why, in the Long-Running Jobs case, `#revoked` is executed even if `#consume` did not run because of revocation?](#why-in-the-long-running-jobs-case-revoked-is-executed-even-if-consume-did-not-run-because-of-revocation)
1. [Do I need to use `#revoked?` when not using Long-Running jobs?](#do-i-need-to-use-revoked-when-not-using-long-running-jobs)
1. [Why, despite setting `initial_offset` to `earliest`, Karafka is not picking up messages from the beginning?](#why-despite-setting-initial_offset-to-earliest-karafka-is-not-picking-up-messages-from-the-beginning)
1. [Can I consume the same topic independently using two consumers within the same application?](#can-i-consume-the-same-topic-independently-using-two-consumers-within-the-same-application)
1. [Can a consumer instance be called multiple times from multiple threads?](#can-a-consumer-instance-be-called-multiple-times-from-multiple-threads)
1. [Can multiple threads reuse a single consumer instance?](#can-multiple-threads-reuse-a-single-consumer-instance)
1. [Can I consume messages from a Rake task?](#can-i-consume-messages-from-a-rake-task)
1. [Does Karafka Expiring Messages remove messages from Kafka?](#does-karafka-expiring-messages-remove-messages-from-kafka)
1. [Is there a way to mark messages as consumed in bulk?](#is-there-a-way-to-mark-messages-as-consumed-in-bulk)
1. [How can I consume all the messages from a Kafka topic without a consumer process?](#how-can-i-consume-all-the-messages-from-a-kafka-topic-without-a-consumer-process)
1. [Is there an option in Karafka to re-consume all the messages from a topic even though all were already consumed?](#is-there-an-option-in-karafka-to-re-consume-all-the-messages-from-a-topic-even-though-all-were-already-consumed)
1. [Does using consumer `#seek` resets the committed offset?](#does-using-consumer-seek-resets-the-committed-offset)
1. [Is it recommended to use public consumer methods from outside the consumer?](#is-it-recommended-to-use-public-consumer-methods-from-outside-the-consumer)
1. [What are consumer groups used for?](#what-are-consumer-groups-used-for)
1. [Why Karafka commits offsets on rebalances and `librdkafka` does not?](#why-karafka-commits-offsets-on-rebalances-and-librdkafka-does-not)
1. [What is Karafka's assignment strategy for topics and partitions?](#what-is-karafkas-assignment-strategy-for-topics-and-partitions)
1. [Why can't I see the assignment strategy/protocol for some Karafka consumer groups?](#why-cant-i-see-the-assignment-strategyprotocol-for-some-karafka-consumer-groups)
1. [Does Kafka guarantee message processing orders within a single partition for single or multiple topics? And does this mean Kafka topics consumption run on a single thread?](#does-kafka-guarantee-message-processing-orders-within-a-single-partition-for-single-or-multiple-topics-and-does-this-mean-kafka-topics-consumption-run-on-a-single-thread)
1. [Can I pass custom parameters during consumer initialization?](#can-i-pass-custom-parameters-during-consumer-initialization)
1. [Can I retrieve all records produced in a single topic using Karafka?](#can-i-retrieve-all-records-produced-in-a-single-topic-using-karafka)
1. [How can I get the total number of messages in a topic?](#how-can-i-get-the-total-number-of-messages-in-a-topic)
1. [Does running #mark_as_consumed increase the processing time?](#does-running-mark_as_consumed-increase-the-processing-time)
1. [What are Long Running Jobs in Kafka and Karafka, and when should I consider using them?](#what-are-long-running-jobs-in-kafka-and-karafka-and-when-should-i-consider-using-them)
1. [What is the principle of strong ordering in Kafka and its implications?](#what-is-the-principle-of-strong-ordering-in-kafka-and-its-implications)
1. [Why Karafka is consuming the same message multiple times?](#why-karafka-is-consuming-the-same-message-multiple-times)
1. [How can the retention policy of Kafka affect the data sent during the downtime?](#how-can-the-retention-policy-of-kafka-affect-the-data-sent-during-the-downtime)
1. [Is it possible to fetch messages per topic based on a specific time period in Karafka?](#is-it-possible-to-fetch-messages-per-topic-based-on-a-specific-time-period-in-karafka)
1. [Does the open-source (OSS) version of Karafka offer time-based offset lookup features?](#does-the-open-source-oss-version-of-karafka-offer-time-based-offset-lookup-features)
1. [Why did our Kafka consumer start from the beginning after a 2-week downtime, but resumed correctly after a brief stop and restart?](#why-did-our-kafka-consumer-start-from-the-beginning-after-a-2-week-downtime-but-resumed-correctly-after-a-brief-stop-and-restart)
1. [How does Karafka handle messages with undefined topics, and can they be routed to a default consumer?](#how-does-karafka-handle-messages-with-undefined-topics-and-can-they-be-routed-to-a-default-consumer)
1. [What does setting the `initial_offset` to `earliest` mean in Karafka? Does it mean the consumer starts consuming from the earliest message that has not been consumed yet?](#what-does-setting-the-initial_offset-to-earliest-mean-in-karafka-does-it-mean-the-consumer-starts-consuming-from-the-earliest-message-that-has-not-been-consumed-yet)
1. [How can I set up custom, per-message tracing in Karafka?](#how-can-i-set-up-custom-per-message-tracing-in-karafka)
1. [When Karafka reaches `max.poll.interval.ms` time and the consumer is removed from the group, does this mean my code stops executing?](#when-karafka-reaches-maxpollintervalms-time-and-the-consumer-is-removed-from-the-group-does-this-mean-my-code-stops-executing)
1. [Which component is responsible for committing the offset after consuming? Is it the listener or the worker?](#which-component-is-responsible-for-committing-the-offset-after-consuming-is-it-the-listener-or-the-worker)
1. [Can the `on_idle` and `handle_idle` methods be changed for a specific consumer?](#can-the-on_idle-and-handle_idle-methods-be-changed-for-a-specific-consumer)
1. [Is it possible to get watermark offsets from inside a consumer class without using Admin?](#is-it-possible-to-get-watermark-offsets-from-inside-a-consumer-class-without-using-admin)
1. [Is there middleware for consuming messages similar to the middleware for producing messages?](#is-there-middleware-for-consuming-messages-similar-to-the-middleware-for-producing-messages)
1. [Is there an undo of Quiet for a consumer to get it consuming again?](#is-there-an-undo-of-quiet-for-a-consumer-to-get-it-consuming-again)
1. [Can two Karafka server processes with the same group_id consume messages from the same partition in parallel?](#can-two-karafka-server-processes-with-the-same-group_id-consume-messages-from-the-same-partition-in-parallel)
1. [When does EOF (End of File) handling occur in Karafka, and how does it work?](#when-does-eof-end-of-file-handling-occur-in-karafka-and-how-does-it-work)

---

## Could an HTTP controller also consume a fetched message through the Karafka router?

**No**. Kafka messages can be consumed only using Karafka consumers. You cannot use your Ruby on Rails HTTP consumers to consume Kafka messages, as Karafka is **not** an HTTP Kafka proxy. Karafka uses Kafka API for messages consumption.

## Can I use ```#seek``` to start processing topics partition from a certain point?

Karafka has a ```#seek``` consumer method that can be used to do that.

## Why Karafka does not pre-initializes consumers prior to first message from a given topic being received?

Because Karafka does not have knowledge about the whole topology of a given Kafka cluster. We work on what we receive dynamically building consumers when it is required.

## Can I use Thread.current to store data between batches?

**No**. The first available thread will pick up work from the queue to better distribute work. This means that you should **not** use `Thread.current` for any type of data storage.

## Why, when using `cooperative-sticky` rebalance strategy, all topics get revoked on rebalance?

This behavior can occur if you are using blocking `mark_as_consumed!` method and the offsets commit happens during rebalance. When using `cooperative-sticky` we recommend using `mark_as_consumed` instead.

!!! tip "Consider KIP-848 for Improved Rebalancing"

    If you're using Kafka 4.0+ with KRaft mode, consider migrating to the [next-generation consumer group protocol (KIP-848)](Kafka-New-Rebalance-Protocol), which offers up to 20x faster rebalances and eliminates many classic protocol limitations.

## What will happen with uncommitted offsets during a rebalance?

When using `mark_as_consumed`, offsets are stored locally and periodically flushed to Kafka asynchronously.

Upon rebalance, all uncommitted offsets will be committed before a given partition is re-assigned.

## Why, in the Long-Running Jobs case, `#revoked` is executed even if `#consume` did not run because of revocation?

The `#revoked` will be executed even though the `#consume` did not run upon revocation because `#revoked` can be used to teardown resources initialized prop to `#consume`. For example, for things initialized in a custom `initialize` method.

## Do I need to use `#revoked?` when not using Long-Running jobs?

In a stable system, **no**. The Karafka default [offset management](Consumer-Groups-Offset-management) strategy should be more than enough. It ensures that after batch processing as well as upon rebalances, before partition reassignment, all the offsets are committed.

You can read about Karafka's revocation/rebalance behaviors [here](Consumer-Groups-Offset-management) and [here](Basics-Consuming-Messages#detecting-revocation-midway).

## Why, despite setting `initial_offset` to `earliest`, Karafka is not picking up messages from the beginning?

There are a few reasons why Karafka may not be picking up messages from the beginning, even if you set `initial_offset` to `earliest`:

1. Consumer group already exists: If the consumer group you are using to consume messages already exists, Karafka will not start consuming from the beginning by default. Instead, it will start consuming from the last committed offset for that group. To start from the beginning, you need to reset the offsets for the consumer group using the Kafka CLI or using the Karafka consumer `#seek` method.
1. Topic retention period: If the messages you are trying to consume are older than the retention period of the topic, they may have already been deleted from Kafka. In this case, setting `initial_offset` to `earliest` will not allow you to consume those messages.
1. Message timestamps: If the messages you are trying to consume have timestamps that are older than the retention period of the topic, they may have already been deleted from Kafka. In this case, even setting `initial_offset` to `earliest` will not allow you to consume those messages.
1. Kafka configuration: There may be a misconfiguration in your Kafka setup that is preventing Karafka from consuming messages from the beginning. For example, the `log.retention.ms` or `log.retention.bytes` settings may be set too low, causing messages to be deleted before you can consume them.

To troubleshoot the issue, you can try:

- changing the Karafka `client_id` temporarily,
- renaming the consumer group,
- resetting the offsets for the consumer group using `#seek`,
- checking the retention period for the topic,
- verifying the messages timestamps,
- reviewing your Kafka configuration to ensure it is correctly set up for your use case.

## Can I consume the same topic independently using two consumers within the same application?

Yes. You can define independent consumer groups operating within the same application. Let's say you want to consume messages from a topic called `event` using two consumers. You can do this as follows:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    consumer_group :db_storage do
      topic :events do
        consumer DbFlusherConsumer
      end
    end

    consumer_group :s3_storage do
      topic :events do
        consumer S3StoringConsumer
      end
    end
  end
end
```

Such a setup will ensure that both of them can be processed independently in parallel. Error handling, dead letter queue, and all the other per-topic behaviors will remain independent despite consuming the same topic.

## Can a consumer instance be called multiple times from multiple threads?

**No**. Given consumer object instance will never be called/used from multiple threads simultaneously. Karafka ensures that a single consumer instance is always used from a single thread. Other threads may call the consumer object for coordination, but this is unrelated to your code.

## Can multiple threads reuse a single consumer instance?

A single consumer instance can perform work in many threads but only in one simultaneously. Karafka does **not** guarantee that consecutive batches of messages will be processed in the same thread, but it **does** ensure that the same consumer instance will process successive batches. A single consumer instance will **never** process any work in parallel.

## Can I consume messages from a Rake task?

**Yes**. Karafka Pro provides the [Iterator API](Pro-Consumer-Groups-Iterator-API) that allows you to run one-off consumptions inline from within Rake tasks and any other Ruby processes.

## Does Karafka Expiring Messages remove messages from Kafka?

When a message is produced to a Kafka topic, it is stored in Kafka until it expires based on the retention policy of the topic. The retention policy determines how long messages are kept in Kafka before they are deleted.

Karafka's [Expiring Messages](Pro-Consumer-Groups-Expiring-Messages) functionality removes messages from Karafka's internal processing queue after a specified amount of time has passed since the message was produced. This functionality is useful when processing messages with a limited lifetime, such as messages with time-sensitive data or messages that should not be processed after a certain amount of time has passed.

However, it's important to note that Karafka's Expiring Messages functionality does not remove messages from Kafka itself, and it only removes messages from Karafka's internal processing queue. Therefore, the retention policy of the Kafka topic will still apply, and the message will remain in Kafka until it expires based on the topic's retention policy.

To set the retention policy of a Kafka topic, you can use Kafka's built-in retention policies or configure custom retention policies using the [declarative topics](Infrastructure-Declarative-Topics) functionality. By configuring the retention policy, you can control how long messages are kept in Kafka before they are deleted, regardless of whether Karafka has processed them or not.

## Is there a way to mark messages as consumed in bulk?

In Kafka, there is no explicit need to mark messages as "consumed" in bulk because Kafka's offset mechanism takes care of this automatically.

The moment you consume a message from a specific topic partition at a particular offset, Kafka considers all previous messages up to that offset as consumed.

Kafka maintains a commit log that records the offset of each message within a topic partition. When a consumer reads messages from a partition, it keeps track of the offset of the last consumed message. This offset is then used to resume consumption from the same point if the consumer restarts or fails.

When you mark a message as consumed with a higher offset, it implies that all previous messages with lower offsets have been successfully processed and considered consumed. Kafka's offset mechanism ensures that the consumer's offset is moved accordingly, indicating that those messages have been processed.

While Kafka's offset mechanism automatically tracks the progress of message consumption and allows you to resume from the last consumed offset, there can be scenarios where explicitly marking each message as consumed becomes beneficial. This is particularly relevant when messages are processed sequentially, with a significant time gap between consuming each message.

In such cases, marking each message as consumed provides finer-grained control over the consuming progress. By explicitly acknowledging the consumption of each message, you ensure that even if a crash or failure occurs during processing, the consumer can resume from the last successfully processed message.

Here's an explanation of the benefits of marking each message as consumed:

- Granular Progress Tracking: Marking each message as consumed allows you to have a more detailed view of the processing progress. You can precisely identify the last processed message and easily determine the remaining messages that need to be processed.

- Enhanced Fault Tolerance: In the event of a crash or failure, explicitly marking each message as consumed ensures that the consumer can restart from the last processed message rather than starting from the beginning or relying solely on the offset mechanism. This reduces duplicated processing and improves fault tolerance.

- Handling Long-running Processing: If the processing time for each message is significant, explicitly marking them as consumed provides better visibility into the progress. It allows you to identify any potential bottlenecks or delays in processing and take appropriate actions if needed.

!!! note

    When using Karafka [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions), it is recommended to mark each message as consumed due to how [Virtual Offset Management](Pro-Consumer-Groups-Virtual-Partitions#virtual-offset-management) works.

## How can I consume all the messages from a Kafka topic without a consumer process?

Karafka has an Iterator API for that. You can read about it [here](Pro-Consumer-Groups-Iterator-API).

## Is there an option in Karafka to re-consume all the messages from a topic even though all were already consumed?

Yes.

There are a few ways to do that:

1. Use the [Iterator API](Pro-Consumer-Groups-Iterator-API) to run a one-time job alongside your regular Karafka consumption.
1. Use the `#seek` consumer method in combination with [Admin watermark API](Infrastructure-Admin-API#reading-the-watermark-offsets) to move to the first offset and re-consume all the data.
1. Create a new consumer group that will start from the beginning.

## Does using consumer `#seek` resets the committed offset?

No, using the `#seek` method in a Karafka consumer does not reset the committed offset.

In Karafka, the `#seek` method is used to manually set the position of the next record that should be fetched, i.e., it changes the current position of the consumer. However, it does not affect the committed offset stored in Kafka.

The committed offset is the position of the last record that Kafka will not read again in the event of recovery or failover.

So, you can think of the position set by `#seek` as a volatile, in-memory value, while the committed offset is a more durable, stored value.

If you would like to `#seek` back and be able to commit offsets from the seek location, please use the `reset_offset` flag when seeking:

```ruby
def consume
  # Some operations...
  # ...
  seek(100, reset_offset: true)
end
```

## Is it recommended to use public consumer methods from outside the consumer?

In general, it is not recommended to use public consumer methods from outside the consumer in Karafka.

Karafka is designed to handle the concurrent processing of messages. Directly calling consumer methods from outside the consumer could result in race conditions or other concurrency issues if not done carefully.

The only exception is when you are using Karafka instrumentation API. However, it is still not recommended to invoke any methods or operations that would result in consumer state changes.

## What are consumer groups used for?

Consumer groups in Kafka are used to achieve parallel processing, high throughput, fault tolerance, and scalability in consuming messages from Kafka topics. They enable distributing of the workload among multiple consumers within a group, ensuring efficient processing and uninterrupted operation even in the presence of failures. In general, for 90% of cases, one consumer group is used per Karafka application. Using multiple consumer groups in a single app can be beneficial if you want to consume the same topic multiple times, structure your app for future division into microservices or introduce parallel consumption.

## Why Karafka commits offsets on rebalances and `librdkafka` does not?

While Karafka uses `librdkafa` under the hood, they serve slightly purposes and follow different design principles.

Karafka is designed with certain assumptions, such as auto-committing offsets, to simplify its usage for Ruby developers. One of the key decisions is to commit offsets on rebalances and assume that the offset management is done using Kafka itself with optional additional offset storage when needed. The reason behind this is to ensure that messages are processed only once in the case of a group rebalance. By committing offsets on rebalances, Karafka tries to ensure at-least-once delivery. That is, every message will be processed at least once, and no message will be lost, which is a typical requirement in many data processing tasks.

On the other hand, `librdkafka` is a C library that implements the Apache Kafka protocol. It's designed to be more flexible and to offer more control to the user. It doesn't commit offsets on rebalances by default because it gives power to the application developer to decide when and how to commit offsets and where to store them. Depending on the specific requirements of your application, you may want to handle offsets differently.

So the difference between the two libraries is mainly due to their different design principles and target audiences: Karafka is more opinionated and tries to simplify usage for Ruby developers, while `librdkafka` is more flexible and provides more control to the user but at the same time requires much more knowledge and effort.

## What is Karafka's assignment strategy for topics and partitions?

As of Karafka `2.0`, the default assignment strategy is `range`, which means that it attempts to assign partitions contiguously. For instance, if you have ten partitions and two consumers, then the first consumer might be assigned partitions 0-4, and the second consumer would be given partitions 5-9.

The `range` strategy has some advantages over the `round-robin` strategy, where partitions are distributed evenly but not contiguously among consumers.

Since data is often related within the same partition, `range` can keep related data processing within the same consumer, which could lead to benefits like better caching or business logic efficiencies. This can be useful, for example, to join records from two topics with the same number of partitions and the same key-partitioning logic.

The assignment strategy is not a one-size-fits-all solution and can be changed based on the specific use case.

**Recommended approaches:**

1. **KIP-848 Consumer Protocol (Kafka 4.0+)** - This is the recommended approach for new deployments:
   - Set `group.protocol` to `consumer` to use the new protocol
   - Configure `group.remote.assignor` (e.g., `uniform` or `range`)
   - Benefits: Faster rebalancing, less disruption, simpler operation, better static membership handling

2. **Cooperative-Sticky (for older Kafka versions)** - Use when KIP-848 is not available:
   - Set `partition.assignment.strategy` to `cooperative-sticky`
   - Provides incremental rebalancing benefits over eager protocols
   - Good fallback option for teams on older infrastructure

3. **Legacy strategies** - `range` or `roundrobin` for specific use cases or compatibility requirements

It's important to consider your Kafka broker version, particular use case, the number of consumers, and the nature of your data when choosing your assignment strategy.

For Kafka 4.0+ with KRaft mode, you can also use the [next-generation consumer group protocol (KIP-848)](Kafka-New-Rebalance-Protocol) with `group.protocol: 'consumer'`, which offers significantly improved rebalance performance.

## Why can't I see the assignment strategy/protocol for some Karafka consumer groups?

The assignment strategy or protocol for a Karafka consumer group might not be visible if a topic is empty, no data has been consumed, and no offsets were stored. These conditions indicate that no data has been produced to the topic and no consumer group has read any data, leaving no record of consumed data.

In such cases, Kafka doesn't have any information to establish an assignment strategy. Hence, it remains invisible until data is produced, consumed, and offsets are committed.

## Does Kafka guarantee message processing orders within a single partition for single or multiple topics? And does this mean Kafka topics consumption run on a single thread?

Yes, within Kafka, the order of message processing is guaranteed for messages within a single partition, irrespective of whether you're dealing with one or multiple topics. However, this doesn't imply that all Kafka topics run on a single thread. In contrast, Karafka allows for multithreaded processing of topics, making it possible to process multiple topics or partitions concurrently. In some cases, you can even process data from one topic partition concurrently.

## Can I pass custom parameters during consumer initialization?

**No**. In Karafka, consumers are typically created within the standard lifecycle of Kafka operations, after messages are polled but before they are consumed. This creation happens in the listener loop before work is delegated to the workers' queue.

- You have the flexibility to modify the `#initialize` method. However, there are some nuances to note:

- You can redefine the `#initialized` but not define it with arguments, i.e., `def initialized(args)` is not allowed.

- If you redefine `#initialize`, you **need** to call `super`.

- While you can perform actions during initialization, be cautious not to overload this phase with heavy tasks or large resource loads like extensive caches. This is because the initialization happens in the listener loop thread, and any extensive process here could block message consumption.

- If there's a minor delay (a few seconds) during initialization, it's acceptable.

Furthermore, with no arguments in the initialize method, this API structure is designed for your customization, and there are no plans to change this in the foreseeable future.

## Can I retrieve all records produced in a single topic using Karafka?

Yes, you can consume all records from a specific topic in Karafka by setting up a new consumer for that topic or using the [Iterator API](Pro-Consumer-Groups-Iterator-API).

If your primary aim is to get the count of messages, you might have to maintain a counter as you consume the messages.

If you are performing a one-time operation of that nature, Iterator API will be much better:

```ruby
iterator = Karafka::Pro::Iterator.new('my_topic_name')

i = 0
iterator.each do
  puts i+= 1
end
```

## How can I get the total number of messages in a topic?

Getting the exact number of messages in a Kafka topic is more complicated due to the nature of Kafka's distributed log system and features such as log compaction. However, there are a few methods you can use:

1. Using the `Karafa::Admin#read_watermark_offsets` to get offsets for each partition and summing them:

    ```ruby
    Karafka::Admin
      .cluster_info
      .topics
      .find { |top| top[:topic_name] == 'my_topic_name' }
      .then { |topic| topic.fetch(:partitions) }
      .size
      .times
      .sum do |partition_id|
        offsets = Karafka::Admin.read_watermark_offsets('my_topic_name', partition_id)
        offsets.last - offsets.first
      end
    ```

1. Using the [Iterator API](Pro-Consumer-Groups-Iterator-API) and counting all the messages:

    ```ruby
    iterator = Karafka::Pro::Iterator.new('my_topic_name')

    i = 0
    iterator.each do
      puts i+= 1
    end
    ```

The first approach offers rapid results, especially for topics with substantial messages. However, its accuracy may be compromised by factors such as log compaction. Conversely, the second method promises greater precision, but it's important to note that it could necessitate extensive data transfer and potentially operate at a reduced speed.

## Does running #mark_as_consumed increase the processing time?

When working with Karafka, the `#mark_as_consumed` method is designed to be asynchronous, meaning it doesn't immediately commit the offset but schedules it to be committed later. In contrast, the `#mark_as_consumed!` (with the exclamation mark) is synchronous and commits the offset immediately, thus having a more noticeable impact on processing time.

Given the asynchronous nature of `#mark_as_consumed`, its impact on the overall processing time should be marginal, less than 1%. It's optimized for performance and efficiency to ensure that offset management doesn't significantly slow down your primary processing logic.

We recommend using `#mark_as_consumed` for most cases because of its non-blocking nature. By default, Karafka flushes the offsets every five seconds and during each rebalances. This approach strikes a good balance between ensuring offset accuracy and maintaining high throughput in message processing.

## What are Long Running Jobs in Kafka and Karafka, and when should I consider using them?

Despite its name, "Long Running Jobs" doesn't refer to the longevity of the underlying Ruby process (like a typical long-running Linux process). Instead, it denotes the duration of message processing. The term "Long Running Jobs" was chosen due to its popularity, even though a more accurate name might have been "Long Running Consumers".

The [Long Running Jobs](Pro-Consumer-Groups-Long-Running-Jobs) feature adheres to the strategy recommended by Confluent. It involves "pausing" a given partition during message processing and then "resuming" the processing of that partition once the task is completed. This ensures that as long as no rebalances occur (which would result in the partition being revoked), the `poll()` command can happen within the confines of the `max.poll.interval.ms`, preventing unwanted rebalances and errors.

However, it's essential to use this feature properly. If your regular workloads don't push the limits of `max.poll.interval.ms`, enabling Long Running Jobs might degrade performance. This is because pausing the partition prevents data polling, which can lead to inefficiencies in situations where message processing is typically fast.

In conclusion, while Long Running Jobs provide a powerful tool to maintain stability during extended message processing tasks, it's crucial to understand your data and processing patterns to utilize them effectively. Otherwise, you might inadvertently introduce performance bottlenecks.

## What is the principle of strong ordering in Kafka and its implications?

Strong ordering in Kafka means that records are strictly ordered in the partition log. Karafka consumers are bound by this design, which acts as a limiter. As a result, the way data is polled and distributed within Karafka is influenced by this principle, which can impact concurrency and performance.

## Why Karafka is consuming the same message multiple times?

When you use Karafka and notice that the same message is being consumed multiple times, several reasons might be causing this. Here are the common reasons why you may experience the same message being processed numerous times:

- **At-Least-Once Delivery**: Kafka guarantees at-least-once delivery, which means a message can be delivered more than once in specific scenarios. This is a trade-off to ensure that no messages are lost during transport. As a result, it's up to the consumer to handle duplicate messages appropriately.

- **Consumer Failures**: If a consumer crashes after processing a message but before it has had a chance to commit its offset, the consumer might process the same message again upon retry.

- **Commit Interval**: The interval at which the consumer commits its offset can also lead to messages being consumed multiple times. If the commit interval is too long, and there's a crash before an offset is committed, messages received since the last commit will be re-consumed.

- **Similar-Looking Messages**: It's possible that the messages aren't actually duplicates, but they look alike. This can be particularly common in systems where certain events occur regularly or when there's a glitch in the producing service. It's essential to check the message key, timestamp, or other unique identifiers to ascertain if two messages are identical or have similar payloads.

- **Dead Letter Queue (DLQ) Misconfiguration with Manual Offset Management**: If you're using a Dead Letter Queue in combination with manual offset management, it's possible to get into a situation where messages are consumed multiple times. If a message cannot be processed and is forwarded to the DLQ, but its offset isn't correctly committed, or the message isn't marked as consumed, the consumer may pick up the same message again upon its next iteration or restart. This behavior can especially become evident when a message consistently fails to be processed correctly, leading to it being consumed multiple times and continually ending up in the DLQ. Ensuring a proper synchronization between message processing, DLQ forwarding, and offset management is essential to avoid such scenarios.

Remember that distributed systems, Kafka included, are complex and can exhibit unexpected behaviors due to various factors. The key is to have comprehensive logging, monitoring, and alerting in place, which can provide insights into anomalies and help in their early detection and resolution.

## How can the retention policy of Kafka affect the data sent during the downtime?

If your data retention policy has compacted the data, then the data from the downtime period might no longer be available.

## Is it possible to fetch messages per topic based on a specific time period in Karafka?

Yes, in newer versions of Karafka, you can use the [Iterator API](Pro-Consumer-Groups-Iterator-API) or the [Enhanced Web UI](Web-UI-Features#explorer) to perform time-based offset lookups.

## Does the open-source (OSS) version of Karafka offer time-based offset lookup features?

Only partially. Karafka OSS allows you to use the consumer `#seek` method to navigate to a specific time in the subscribed topic partition. Still, you cannot do it outside the consumer subscription flow.

## Why did our Kafka consumer start from the beginning after a 2-week downtime, but resumed correctly after a brief stop and restart?

This issue is likely due to the `offsets.retention.minutes` setting in Kafka. Kafka deletes the saved offsets if a consumer is stopped for longer than this set retention period (like your 2-week downtime). Without these offsets, the consumer restarts from the beginning. However, the offsets are still available for shorter downtimes (like your 15-minute test), allowing the consumer to resume from where it left off.

You can read more about this behavior [here](Infrastructure-Application-Development-vs-Production#configure-your-brokers-offsetsretentionminutes-policy).

## How does Karafka handle messages with undefined topics, and can they be routed to a default consumer?

Karafka Pro's Routing Patterns feature allows for flexible routing using regular expressions, automatically adapting to dynamically created Kafka topics. This means Karafka can instantly recognize and consume messages from new topics without extra configuration, streamlining the management of topic routes. For optimal use and implementation details, consulting the their [documentation](Pro-Routing-Patterns) is highly recommended.

## What does setting the `initial_offset` to `earliest` mean in Karafka? Does it mean the consumer starts consuming from the earliest message that has not been consumed yet?

The `initial_offset` setting in Karafka is relevant only during the initial start of a consumer in a consumer group. It dictates the starting point for message consumption when a consumer group first encounters a topic. Setting `initial_offset` to `earliest` causes the consumer to start processing from the earliest available message in the topic (usually the message with offset 0, but not necessarily). Conversely, setting it to `latest` instructs the consumer to begin processing the next message after the consumer has started. It's crucial to note that `initial_offset` does not influence the consumption behavior during ongoing operations. For topics the consumer group has previously consumed, Karafka will continue processing from the last acknowledged message, ensuring that no message is missed or processed twice.

## How can I set up custom, per-message tracing in Karafka?

Implementing detailed, per-message tracing in Karafka involves modifying the monitoring and tracing setup to handle individual messages. This setup enhances visibility into each message's processing and integrates seamlessly with many tracing products like DataDog.

Here's how you can set up this  detailed tracing step-by-step:

1. **Register Custom Event**

    Begin by registering a custom event in Karafka for each message processed. This is essential to create a unique event for the monitoring system to trigger on each message consumption.

    ```ruby
    # This will trigger before consumption to start trace
    Karafka.monitor.notifications_bus.register_event('consumer.consume.message')
    # This will trigger after consumption to finish trace
    Karafka.monitor.notifications_bus.register_event('consumer.consumed.message')
    ```

    Registering a custom event allows you to define specific behavior and tracking that aligns with your application's needs, distinct from the batch processing default.

1. **Instrument with Karafka Monitor**

    Once the event is registered, use Karafka’s monitor to instrument it. This step does not involve actual data processing but sets up the framework for tracing.

    ```ruby
    class OrdersStatesConsumer < ApplicationConsumer
      def consume
        messages.each do |message|
          Karafka.monitor.instrument('consumer.consume.message', message: message)

          consume_one(message)

          Karafka.monitor.instrument('consumer.consumed.message', message: message)

          # Mark as consumed after each successfully processed message
          mark_as_consumed(message)
        end
      end

      def consume_one(message)
        # Your logic goes here
      end
    end
    ```

1. **Build a Custom Tracing Listener**

    Modify or build a new tracing listener that specifically handles the per-message tracing.

    ```ruby
    class MyTracingListener
      def on_consumer_consume_message(event)
        # Start tracing here...
      end

      def on_consumer_consumed_message(event)
        # Finalize trace when message is processed
      end

      def on_error_occurred(event)
        # Do not forget to finalize also on errors if trace available
      end
    end

    Karafka.monitor.subscribe(MyTracingListener.new)
    ```

## When Karafka reaches `max.poll.interval.ms` time and the consumer is removed from the group, does this mean my code stops executing?

No, your code does not stop executing when Karafka reaches the `max.poll.interval.ms` time, and the consumer is removed from the group. Karafka does not interrupt the execution of your code. Instead, it reports an error  indicating that the maximum poll interval has been exceeded, like this:

```text
Data polling error occurred: Application maximum poll interval (300000ms) exceeded by 348ms
```

Your code will continue to execute until it is complete. However, marking messages as consumed after this error will not be allowed.

## Which component is responsible for committing the offset after consuming? Is it the listener or the worker?

In the Karafka framework, the worker contains a consumer that handles the offset committing. The consumer within the worker sends a commit request to the underlying C client instance. This process involves the worker's consumer storing the offset to be saved, which then goes through a C thread for the actual commit operation. It's important to note that Karafka commits offsets asynchronously by default.

## Can the `on_idle` and `handle_idle` methods be changed for a specific consumer?

**No**. The `on_idle` and `handle_idle` methods are part of Karafka's internal API and are not editable. Internal components use these methods for periodic jobs within the Karafka framework. They are not intended for user modification or are not part of the official public API. If you need to execute a specific method when the consumer is idle or when the last message from the topic has been consumed, you should use Karafka's [periodic jobs](Pro-Consumer-Groups-Periodic-Jobs) feature. This feature is designed to handle such use cases effectively.

## Is it possible to get watermark offsets from inside a consumer class without using Admin?

You can get watermark offsets and other metrics directly from within a consumer class using Karafka's Inline Insights. This feature provides a range of metrics, including watermark offsets, without using the Admin API. For more details, refer to the [Inline Insights](Consumer-Groups-Inline-Insights) documentation.

## Is there middleware for consuming messages similar to the middleware for producing messages?

Due to the complexity of the data flow, there are only a few middleware layers for consuming messages in Karafka, but several layers can function similarly. These are referred to as "strategies" in Karafka, and there are around 80 different combinations available.

Karafka provides official APIs to alter the consumption and processing flow at various key points. The most notable among these is the [Filtering API](Pro-Consumer-Groups-Filtering-API), which, despite its name, offers both flow control and filtering capabilities. This API spans from post-polling to post-batch execution stages.

One of the key strengths of Karafka is its support for pluggable components. These components can be tailored to meet your specific requirements, offering a high degree of customization. Detailed information about these components and their configurations can be found in the Karafka documentation.

## Is there an undo of Quiet for a consumer to get it consuming again?

A quietened consumer needs to be replaced. When a consumer is quieted, it holds the connections and technically still "moves" forward, but it does so without processing messages. Therefore, to resume consuming, the consumer should be stopped, and a new one should be started.

## Can two Karafka server processes with the same group_id consume messages from the same partition in parallel?

No, two Karafka server processes with the same `group_id` cannot consume messages from the same partition in parallel because this would violate Kafka's strong ordering guarantees. However, you can use virtual partitions to parallelize the work within a single process. Additionally, you can use direct assignments to assign specific partitions to specific processes, but managing offsets would still require a separate consumer group.

## When does EOF (End of File) handling occur in Karafka, and how does it work?

EOF handling in Karafka only occurs when it is explicitly enabled. However, it's important to understand that EOF execution may not always trigger when the end of a partition is reached during message processing.

When messages are present in the final batch that reaches the end of a partition, Karafka will execute a regular consumption run with the `#eofed?` flag set to `true`, rather than triggering the EOF handling logic.

This is because the primary purpose of EOF handling is to deal with scenarios where there are no more messages to process, rather than handling the last message batch. The EOF handling can be useful for executing cleanup or maintenance tasks when a partition has been fully consumed, but it should not be relied upon as a guaranteed trigger for end-of-partition processing logic. If you need guaranteed processing for the last message or batch in a partition, you should implement that logic within your regular message consumption flow using the `#eofed?` check.
