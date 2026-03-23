# Consumer Groups vs Share Groups

Apache Kafka supports two consumption models: **consumer groups** and **share groups**. Consumer groups are the traditional model, using exclusive partition assignment to deliver ordered streams of events to consumers. Share groups, introduced by [KIP-932](https://cwiki.apache.org/confluence/display/KAFKA/KIP-932:+Queues+for+Kafka), are a new model that enables cooperative, queue-like consumption where multiple consumers can process records from the same partition simultaneously.

This page explains both models, compares their characteristics across key dimensions, and provides guidance on when to use each in Karafka-based applications.

!!! note "Share Group Support in Karafka"

    Karafka's share group support is actively in progress. As librdkafka, the underlying C driver Karafka uses to communicate with Kafka, lands the share group protocol, Karafka is being extended to support share groups natively — including routing DSL integration, consumer APIs, and Web UI observability. The information below describes how share groups work at the Kafka level. Follow the progress in [GitHub issue #2953](https://github.com/karafka/karafka/issues/2953).

## Consumer Groups

Consumer groups are Kafka's original consumption model and the foundation of all current Karafka message processing. In a consumer group, each topic partition is assigned to exactly one consumer at a time. This exclusive assignment guarantees that records within a partition are processed in offset order by a single consumer.

Karafka uses consumer groups to subscribe to topics. By default, all topics defined in the routing DSL belong to a single consumer group:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_app'
  end

  routes.draw do
    topic :orders do
      consumer OrdersConsumer
    end

    topic :payments do
      consumer PaymentsConsumer
    end
  end
end
```

You can also define multiple consumer groups explicitly when topics have different scaling or isolation requirements:

```ruby
routes.draw do
  consumer_group :events do
    topic :orders do
      consumer OrdersConsumer
    end

    topic :shipments do
      consumer ShipmentsConsumer
    end
  end

  consumer_group :analytics do
    topic :page_views do
      consumer PageViewsConsumer
    end
  end
end
```

### Partition Assignment and Ordering

Each partition is assigned to exactly one consumer within a consumer group. If you have 12 partitions and 4 consumer processes, each process handles 3 partitions. If you scale to 12 processes, each gets exactly 1 partition. Adding a 13th process leaves it idle because there is no partition to assign.

This model provides a strong ordering guarantee: records within a single partition are always delivered and processed in offset order. This is critical for use cases where event sequence matters, such as processing state changes for an entity identified by a partition key.

### Offset Management

Consumer groups track progress using offsets. In Karafka, offsets are committed at the batch level using `#mark_as_consumed`:

```ruby
class OrdersConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      Order.process(message.payload)
    end

    mark_as_consumed(messages.last)
  end
end
```

When an offset is committed, Kafka knows that all records up to and including that offset have been processed. On restart or rebalance, consumption resumes from the last committed offset. This is an efficient mechanism for sequential processing but means that individual message acknowledgment is not natively supported. If a consumer crashes mid-batch, the entire batch is redelivered.

For more details, see the [Offset Management](https://karafka.io/docs/Offset-management/) documentation.

### Rebalancing

When a consumer joins or leaves a consumer group, Kafka triggers a **rebalance** to redistribute partitions among the remaining members. During a rebalance, consumption pauses across all members of the group while partitions are reassigned.

Karafka supports the cooperative-sticky assignment strategy and the [next-generation consumer group protocol (KIP-848)](https://karafka.io/docs/Kafka-New-Rebalance-Protocol/), which reduces rebalance disruption by allowing incremental partition migration instead of a full stop-the-world pause. However, rebalancing remains an inherent characteristic of consumer groups that can temporarily impact throughput.

### Scaling Beyond Partition Count

With consumer groups, the maximum number of active consumers equals the number of partitions. Karafka provides several features that work within or beyond this constraint:

- **[Virtual Partitions](https://karafka.io/docs/Pro-Virtual-Partitions/)** (Pro): Enable parallel processing of messages from a single Kafka partition by distributing them across multiple worker threads. This is particularly effective for IO-bound workloads.
- **[Parallel Segments](https://karafka.io/docs/Pro-Parallel-Segments/)** (Pro): Split a single subscription group into independent parallel segments, each maintaining its own polling loop and worker pool. This allows multiple OS-level threads to consume and process data from the same topics simultaneously within a single process.
- **[Multiplexing](https://karafka.io/docs/Pro-Multiplexing/)** (Pro): Establishes multiple independent connections to the same topic from a single process.
- **[Swarm Mode](https://karafka.io/docs/Swarm-Multi-Process/)** (Pro): Forks multiple independent OS processes for enhanced CPU utilization.

These features allow Karafka applications using consumer groups to achieve high parallelism even when the partition count is limited.

## Share Groups

Share groups, introduced by [KIP-932: Queues for Kafka](https://cwiki.apache.org/confluence/display/KAFKA/KIP-932:+Queues+for+Kafka), add queue-like consumption semantics to Kafka. Instead of assigning each partition exclusively to one consumer, share groups allow multiple consumers to cooperatively consume records from the same partition. This model is designed for workloads where messages represent independent work items that can be processed concurrently in any order.

!!! tip "Share Groups Are Not Queues"

    KIP-932 does not add a "queue" data structure to Kafka. Share groups operate on regular Kafka topics. The same topic can be consumed by both consumer groups and share groups simultaneously, each operating independently. Think of a share group as a "durable shared subscription."

### How Share Groups Work

In a share group, the Kafka broker distributes available records from a topic's partitions across all consumers in the group. There is no exclusive partition assignment. Multiple consumers can receive records from the same partition, and the number of consumers can exceed the number of partitions.

At the Kafka protocol level, a share group consumer uses `group.type=share` instead of the default consumer group type. A dedicated share-partition leader on the broker manages the distribution of records and tracks their delivery state.

### Record Lifecycle and Acknowledgment

Share groups introduce per-record state tracking. Each record passes through a defined lifecycle:

<table>
  <thead>
    <tr>
      <th>State</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Available</strong></td>
      <td>Record is eligible for delivery to a consumer.</td>
    </tr>
    <tr>
      <td><strong>Acquired</strong></td>
      <td>Record has been delivered to a consumer and is awaiting acknowledgment. A time-limited acquisition lock prevents redelivery during processing.</td>
    </tr>
    <tr>
      <td><strong>Acknowledged</strong></td>
      <td>Consumer has confirmed successful processing.</td>
    </tr>
    <tr>
      <td><strong>Archived</strong></td>
      <td>Terminal state. Record is no longer available for delivery. Reached after acknowledgment, explicit rejection, or exceeding the maximum delivery attempts.</td>
    </tr>
  </tbody>
</table>

Consumers acknowledge each record using one of three acknowledgment types:

<table>
  <thead>
    <tr>
      <th>Acknowledgment</th>
      <th>Effect</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>ACCEPT</strong></td>
      <td>Record processed successfully. Transitions to Acknowledged.</td>
    </tr>
    <tr>
      <td><strong>RELEASE</strong></td>
      <td>Record cannot be processed right now (transient failure). Returns to Available for redelivery to any consumer.</td>
    </tr>
    <tr>
      <td><strong>REJECT</strong></td>
      <td>Record is permanently unprocessable (poison message). Transitions directly to Archived.</td>
    </tr>
  </tbody>
</table>

This per-record acknowledgment model means that a single failing message does not block the processing of subsequent messages, unlike consumer groups where offset-based tracking requires sequential commitment.

### Delivery Count and Poison Message Protection

The broker tracks how many times each record has been delivered. Every time a record is acquired by a consumer, its **delivery count** increments. The maximum number of delivery attempts is controlled by the broker configuration `group.share.delivery.count.limit` (default: **5**).

If a record reaches the delivery count limit without being accepted, it transitions to the Archived state. This prevents poison messages from being endlessly redelivered and blocking progress. Consumers can inspect the delivery count via the record metadata to implement delivery-count-aware processing logic.

!!! note "Dead Letter Queues for Share Groups"

    [KIP-1191](https://cwiki.apache.org/confluence/display/KAFKA/KIP-1191:+Dead-letter+queues+for+share+groups) proposes automatic dead-letter queue (DLQ) support for share groups, where rejected or max-retry records are automatically written to a configured DLQ topic. This is expected to become available in Kafka 4.2 or later. Until then, archived records are simply no longer delivered.

### No Ordering Guarantees

Share groups do **not** guarantee processing order. Because multiple consumers receive records from the same partition concurrently, and because released records are redelivered to potentially different consumers, records may be processed in a different order than they were produced. Within a single fetched batch, records are in increasing offset order, but no ordering is guaranteed across batches or consumers.

This is a fundamental trade-off: share groups sacrifice the ordering guarantees of consumer groups in exchange for greater parallelism and flexibility.

### Rebalancing in Share Groups

Share group rebalancing is a much less disruptive event than consumer group rebalancing. Because partitions are not exclusively assigned, there is no stop-the-world synchronization barrier. When a consumer joins or leaves a share group, the broker adjusts the partition assignment across members incrementally. Consumers are not aware of each other, and there is no need for revocations to be acknowledged before new assignments take effect.

This makes share groups better suited for elastic scaling, where consumers are added or removed frequently in response to load changes.

## Comparison Table

The following table summarizes the key differences between consumer groups and share groups:

<table>
  <thead>
    <tr>
      <th>Dimension</th>
      <th>Consumer Groups</th>
      <th>Share Groups (KIP-932)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Partition assignment</strong></td>
      <td>Exclusive: each partition assigned to exactly one consumer</td>
      <td>Cooperative: multiple consumers share the same partition</td>
    </tr>
    <tr>
      <td><strong>Max consumers</strong></td>
      <td>Limited to the number of partitions</td>
      <td>Can exceed the number of partitions</td>
    </tr>
    <tr>
      <td><strong>Ordering guarantee</strong></td>
      <td>Strong ordering within each partition</td>
      <td>No ordering guarantees across consumers</td>
    </tr>
    <tr>
      <td><strong>Progress tracking</strong></td>
      <td>Offset-based (batch-level commits)</td>
      <td>Per-record acknowledgment (ACCEPT/RELEASE/REJECT)</td>
    </tr>
    <tr>
      <td><strong>Failure handling</strong></td>
      <td>Entire batch redelivered from last committed offset</td>
      <td>Individual records released or rejected independently</td>
    </tr>
    <tr>
      <td><strong>Poison message handling</strong></td>
      <td>Requires application-level DLQ (Karafka provides built-in <a href="https://karafka.io/docs/Dead-Letter-Queue/">DLQ</a>)</td>
      <td>Broker-level delivery count limit with automatic archival</td>
    </tr>
    <tr>
      <td><strong>Rebalancing impact</strong></td>
      <td>Can pause all consumers in the group (mitigated by cooperative strategies)</td>
      <td>Minimal disruption; no stop-the-world barrier</td>
    </tr>
    <tr>
      <td><strong>Delivery semantics</strong></td>
      <td>At-least-once or exactly-once</td>
      <td>At-least-once only</td>
    </tr>
    <tr>
      <td><strong>Kafka version</strong></td>
      <td>All versions</td>
      <td>Kafka 4.0+ (early access), 4.1 (preview), 4.2+ (GA)</td>
    </tr>
    <tr>
      <td><strong>Karafka support</strong></td>
      <td>Full support with extensive features</td>
      <td>Under Development</td>
    </tr>
    <tr>
      <td><strong>Best suited for</strong></td>
      <td>Ordered event streams, stateful processing, event sourcing</td>
      <td>Independent work items, job queues, elastic scaling</td>
    </tr>
  </tbody>
</table>

## When To Use Each Model

### Use Consumer Groups When

Consumer groups remain the right choice for the majority of Kafka workloads, especially those where **ordering matters**. Common use cases include:

- **Event sourcing and state reconstruction**: Processing a sequence of state changes for an entity (user actions, order lifecycle events) where the order of events determines the final state.
- **Stream processing pipelines**: Aggregating, joining, or transforming ordered streams of data where records must be processed sequentially within a key's partition.
- **Exactly-once processing**: Workloads requiring transactional guarantees, which are only available with consumer groups.
- **Log compaction consumers**: Processing compacted topics where the latest value per key must be read in order.

If your workload benefits from ordering and you need to scale beyond the partition count, consider Karafka's [Virtual Partitions](https://karafka.io/docs/Pro-Virtual-Partitions/) feature, which provides parallelism within a single partition while maintaining grouping semantics.

### Use Share Groups When

Share groups are designed for workloads that resemble **traditional message queues**, where each message is an independent unit of work. Consider share groups for:

- **Job queues and task distribution**: Processing independent work items (image resizing, email sending, report generation) where order does not matter and individual acknowledgment is valuable.
- **Elastic scaling for peak loads**: Scaling consumers beyond the partition count during traffic spikes without repartitioning topics.
- **Heterogeneous processing times**: Workloads where individual messages have unpredictable processing durations. In consumer groups, a slow message blocks the entire partition. In share groups, other consumers continue processing available records.
- **Simplified failure handling**: Scenarios where individual message retry and rejection semantics (without blocking the stream) are more important than strict ordering.

!!! warning "Share Groups Are Not a Universal Replacement"

    Share groups complement consumer groups; they do not replace them. The lack of ordering guarantees and exactly-once semantics makes share groups unsuitable for workloads that depend on these properties. Evaluate your requirements carefully before choosing between the two models.

### What You Can Do Today

Until share group support arrives in Karafka, you can achieve many of the benefits that share groups provide by using existing Karafka features:

- **[Virtual Partitions](https://karafka.io/docs/Pro-Virtual-Partitions/)** (Pro): Parallelize processing within a single partition, enabling concurrency beyond the one-consumer-per-partition limit. This is the closest existing analog to share group parallelism for IO-bound workloads.
- **[Dead Letter Queue](https://karafka.io/docs/Dead-Letter-Queue/)**: Handle poison messages by dispatching them to a DLQ topic after a configurable number of retries, similar to share group delivery count limits.
- **[Long-Running Jobs](https://karafka.io/docs/Pro-Long-Running-Jobs/)** (Pro): Process messages that take longer than `max.poll.interval.ms` without being removed from the consumer group.
- **Increasing partition count**: If you need more consumer parallelism and ordering within each partition is sufficient, adding partitions remains a straightforward scaling approach.

## Summary

Consumer groups and share groups represent two different philosophies for consuming Kafka data. Consumer groups provide ordered, partition-exclusive delivery suited for event streaming and stateful processing. Share groups provide cooperative, unordered delivery suited for job queue patterns and elastic scaling. Both models operate on the same Kafka topics, and a single topic can be consumed by consumer groups and share groups simultaneously.

For Karafka users, consumer groups with the framework's rich feature set (Virtual Partitions, DLQ, subscription groups, multiplexing) remain the production-ready choice today. When share group support becomes available, it will open new patterns for workloads that benefit from queue-like semantics without requiring a separate messaging system alongside Kafka.
