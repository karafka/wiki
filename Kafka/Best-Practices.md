# Kafka Best Practices

This page covers critical decisions and recommendations when working with Apache Kafka. The focus is on architectural and configuration choices that are easy to get right at the start but difficult or impossible to change later. These guidelines apply regardless of which Kafka client library you use.

!!! Tip "Why This Matters"

    Kafka's architecture makes certain decisions effectively permanent once made. Partition counts can only increase (never decrease), replication factors require complex reassignment to change, topic names cannot be renamed, and consumer group names are tied to offset storage. Getting these right from day one saves significant pain later.

## KRaft Mode

ZooKeeper was removed entirely in Kafka 4.0, so all new deployments should use KRaft mode. If you're running an existing ZooKeeper-based cluster, use Kafka 3.9 as your bridge release for migration—and don't delay planning, as ZooKeeper security support ended in November 2025.

KRaft provides substantial operational improvements: support for up to 2 million partitions (versus 200,000 with ZooKeeper), dramatically faster controller failovers, and a simplified architecture with a single system to configure and monitor.

## Kafka Version Planning

When upgrading to Kafka 4.0, ensure all brokers and clients are at version 2.1+ first, and migrate from MirrorMaker 1 to MirrorMaker 2 beforehand. Older message formats (v0/v1) were removed in 4.0.

The new consumer group protocol (`group.protocol=consumer`) delivers up to 20x faster rebalancing when available—worth enabling once your cluster supports it.

!!! Warning "Share Groups Are Preview Only"

    Kafka 4.0 introduces Share Groups (KIP-932), which provide queue-like semantics where multiple consumers can read from the same partition with per-message acknowledgment—similar to RabbitMQ. However, clusters using this early-access feature cannot upgrade to Kafka 4.1 because the internal data format may change between versions. Keep Share Groups out of production for now.

## Choosing Partition Counts

Partition count is effectively permanent—you can add partitions later but never remove them. More critically, adding partitions breaks key-based ordering since Kafka routes messages using `hash(key) % partition_count`. Once you change the count, existing keys may start landing in different partitions.

Pick a count with many divisors (6, 12, 24, 60) to give yourself flexible consumer scaling options. Avoid prime numbers like 3, 7, or 11—they severely limit how you can distribute consumers. Provision for 1-2 years of growth upfront rather than planning to increase later.

Messages are only ordered within a partition; cross-partition ordering is never guaranteed. The tradeoffs: too few partitions limit parallelism, while too many increase end-to-end latency (roughly 20ms per 1,000 partitions replicated), create more file handles, and extend broker recovery time.

!!! Warning

    Stay under 4,000 partitions per broker. Beyond this, you'll see degraded performance and longer recovery times.

## Replication and Durability

Set your replication factor to 3 or higher at topic creation time. Changing it later requires partition reassignment, which copies all data over the network—an expensive and risky operation you want to avoid.

For production topics, configure `min.insync.replicas` to at least 2 and use `acks=all` on producers. This ensures messages are written to all in-sync replicas before the producer considers the write successful.

One common misconfiguration: setting `min.insync.replicas` equal to `replication.factor`. This means all replicas must acknowledge every write, so if even one broker goes down, all writes fail. Leave yourself headroom.

For production workloads where write availability during maintenance matters, use at least 4 brokers. Three-broker clusters become unavailable for writes when any single broker is down for maintenance.

!!! Tip "AWS MSK Users"

    MSK has unique maintenance behaviors, including the potential for dual-broker outages during maintenance windows. This makes 4+ broker clusters essential for production. See the [AWS MSK Guide](https://karafka.io/docs/Operations-AWS-MSK-Guide) for MSK-specific considerations.

## Compression

Enable compression at the producer level using LZ4, which offers the best balance of speed and compression ratio—approximately 594 MB/s compression with 2,428 MB/s decompression. This suits high-throughput workloads without a significant latency impact.

On the broker side, set `compression.type=producer` to store messages using whatever compression the producer applied. This avoids recompression overhead. Never compress at the broker level; it just adds unnecessary CPU load.

!!! Warning "Avoid ZSTD"

    ZSTD has known data corruption edge cases in certain librdkafka versions that can make data unrecoverable. Stick with LZ4.

## Consumer Scaling Model

Kafka's scaling model differs fundamentally from traditional job queues like Sidekiq or RabbitMQ. In those systems, adding workers immediately increases parallelism. In Kafka, parallelism is bounded by partition count—one partition can only be consumed by one consumer within a consumer group.

This means 10 consumers on a 3-partition topic leaves 7 consumers sitting idle. Match your partition count to your expected maximum consumer count, and don't expect adding consumers to solve performance problems once you've hit that ceiling.

Watch for hot partitions caused by skewed key distribution. If most messages share similar keys, they end up in the same partition, creating a bottleneck that additional consumers cannot help with.

!!! Note "librdkafka Prebuffering"

    By default, librdkafka fetches up to 1MB of messages per partition into local memory. This prebuffering can mask the real bottleneck and make scaling appear ineffective when the actual problem lies elsewhere. Factor this into your performance analysis.

Some frameworks, like Karafka, have capabilities to work around these partition-bound scaling limitations.

## Dead Letter Queues

Implement your DLQ strategy before sending your first production message. Kafka's offset model creates a blocking problem: consumers must process messages in order and commit offsets sequentially. If a message fails processing, the consumer cannot skip it—it must either succeed or move the message elsewhere. Without a DLQ, a single bad message causes the consumer to retry forever, while all newer messages in that partition pile up unprocessed.

Use a retry topic pattern with increasing delays:

```
main-topic → topic-retry-1 → topic-retry-2 → topic-retry-3 → topic-dlq
```

Limit retries to 3-5 attempts with exponential backoff before routing to the DLQ. Send non-retryable errors (deserialization failures, schema mismatches) directly to the DLQ—there's no point retrying something that will never succeed.

Include metadata in DLQ messages via headers: original topic, partition, offset, timestamp, and exception details. This context is invaluable when investigating failures later.

Monitor your DLQ message count and age. Sudden spikes typically indicate upstream issues that warrant immediate investigation.

## Retention and Cleanup Policies

Choose your cleanup policy based on use case:

- **`delete`** works for event streams, logs, and time-series data where you want messages removed after a retention period
- **`compact`** suits state stores, changelogs, and CDC streams where only the current state per key matters

One subtlety: Kafka writes to segment files and only deletes complete segments. The active segment being written to is never deleted, even if messages in it exceed retention time. For low-volume topics that require precise retention, set `segment.ms` to 1 hour to roll segments over more frequently.

Avoid the `compact,delete` policy if you need the guarantee of keeping at least one record per key—the delete portion can remove records you expected compaction to preserve.

## Naming Conventions

Establish naming conventions before creating your first topic. Topics cannot be renamed, and consumer group names are tied to offset storage—changing either requires migration.

A consistent pattern for topics works well:

```
<environment>.<domain>.<entity>.(optionally)<action>

prod.orders.order
prod.payments.payment.processed
```

For consumer groups:

```
<application>-<environment>[-<suffix>]

order-service-prod
analytics-consumer-staging
```

Use past tense for events (`created`, `updated`) and imperative for commands (`process`, `send`).

Pick one separator style and stick with it. Mixing periods and underscores causes metric name collisions in monitoring systems. Avoid including fields that change, like team names or service owners.

!!! Warning

    Consumer group names must be globally unique within the cluster. Ensure your naming scheme prevents collisions between environments if they share a cluster.

Disable `auto.create.topics.enable` in production and enforce naming through CI/CD. Ad-hoc topic creation inevitably leads to inconsistent names you'll regret later.

## Managed Service Considerations

Before committing to a managed Kafka provider, get clear answers to these questions:

- What is the in-place KRaft migration path?
- How far behind upstream Kafka releases is the service typically?
- What is the SLA and what does it actually cover?
- What topic and partition limits affect scaling?
- Which broker configurations can you modify?

Different providers have distinct trade-offs that affect operational flexibility, version currency, and available features. Evaluate based on your specific requirements for availability, ecosystem integration, and operational overhead.
