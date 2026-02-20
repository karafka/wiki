# Kafka Best Practices

This page covers critical decisions and recommendations when working with Apache Kafka. The focus is on architectural and configuration choices that are easy to get right at the start but difficult or impossible to change later. These guidelines apply regardless of which Kafka client library you use.

!!! tip "Why This Matters"

    Kafka's architecture makes certain decisions effectively permanent once made. Partition counts can only increase (never decrease), replication factors require complex reassignment to change, topic names cannot be renamed, and consumer group names are tied to offset storage. Getting these right from day one saves significant pain later.

!!! note "Karafka Users"

    Karafka provides built-in solutions for several challenges described here - including DLQ handling, partition-bound scaling limitations, and offset management. However, this guide focuses on generic Kafka concepts and best practices that apply regardless of your client library. For Karafka-specific features and optimizations, refer to the relevant sections of the Karafka documentation.

## KRaft Mode

ZooKeeper was removed entirely in Kafka 4.0, so all new deployments should use KRaft mode. If you're running an existing ZooKeeper-based cluster, use Kafka 3.9 as your bridge release for migration - and don't delay planning, as ZooKeeper security support ended in November 2025.

KRaft provides substantial operational improvements: support for up to 2 million partitions (versus 200,000 with ZooKeeper), dramatically faster controller failovers, and a simplified architecture with a single system to configure and monitor.

## Kafka Version Planning

When upgrading to Kafka 4.0, ensure all brokers and clients are at version 2.1+ first, and migrate from MirrorMaker 1 to MirrorMaker 2 beforehand. Older message formats (v0/v1) were removed in 4.0.

The [new consumer group protocol](Kafka-New-Rebalance-Protocol) (`group.protocol=consumer`) delivers up to 20x faster rebalancing when available - worth enabling once your cluster supports it.

!!! warning "Share Groups Are Preview Only"

    Kafka 4.0 introduces Share Groups (KIP-932), which provide queue-like semantics where multiple consumers can read from the same partition with per-message acknowledgment - similar to RabbitMQ. However, clusters using this early-access feature cannot upgrade to Kafka 4.1 because the internal data format may change between versions. Keep Share Groups out of production for now.

## Choosing Partition Counts

Partition count is effectively permanent - you can add partitions later but never remove them. More critically, adding partitions breaks key-based ordering since Kafka routes messages using `hash(key) % partition_count`. Once you change the count, existing keys may start landing in different partitions.

Pick a count with many divisors (6, 12, 24, 60) to give yourself flexible consumer scaling options. Avoid prime numbers like 3, 7, or 11 - they severely limit how you can distribute consumers. Provision for 1-2 years of growth upfront rather than planning to increase later.

Messages are only ordered within a partition; cross-partition ordering is never guaranteed. The tradeoffs: too few partitions limit parallelism, while too many increase end-to-end latency (roughly 20ms per 1,000 partitions replicated), create more file handles, and extend broker recovery time.

!!! warning

    Stay under 4,000 partitions per broker. Beyond this, you'll see degraded performance and longer recovery times.

## Replication and Durability

Set your replication factor to 3 or higher at topic creation time. Changing it later requires partition reassignment, which copies all data over the network - an expensive and risky operation you want to avoid.

For production topics, configure `min.insync.replicas` to at least 2 and use `acks=all` on producers. This ensures messages are acknowledged by all in-sync replicas before the producer considers the write successful. Pair this with `enable.idempotence=true` to prevent duplicate messages during retries - the producer will automatically deduplicate based on sequence numbers, giving you exactly-once producer semantics.

One common misconfiguration: setting `min.insync.replicas` equal to `replication.factor`. This means all replicas must acknowledge every write, so if even one broker goes down, all writes fail. Leave yourself headroom.

For production workloads where write availability during maintenance matters, use at least 4 brokers. With three-broker clusters, you can tolerate one broker being down for maintenance and still accept writes if you set `min.insync.replicas=2` (with `replication.factor=3`). However, if `min.insync.replicas=3`, any single broker outage will make the cluster unavailable for writes.

!!! tip "AWS MSK Users"

    MSK has unique maintenance behaviors, including the potential for dual-broker outages during maintenance windows. This makes 4+ broker clusters essential for production. See the [AWS MSK Guide](https://karafka.io/docs/Operations-AWS-MSK-Guide) for MSK-specific considerations.

## Compression

Enable compression at the producer level using LZ4, which offers the best balance of speed and compression ratio - approximately 594 MB/s compression with 2,428 MB/s decompression. This suits high-throughput workloads without a significant latency impact.

On the broker side, set `compression.type=producer` to store messages using whatever compression the producer applied. This avoids recompression overhead. Never compress at the broker level; it just adds unnecessary CPU load.

!!! warning "Avoid ZSTD"

    ZSTD has known data corruption edge cases in certain librdkafka versions that can make data unrecoverable. Stick with LZ4.

## Consumer Scaling Model

Kafka's scaling model differs fundamentally from traditional job queues like Sidekiq or RabbitMQ. In those systems, adding workers immediately increases parallelism. In Kafka, parallelism is bounded by partition count - one partition can only be consumed by one consumer within a consumer group.

This means 10 consumers on a 3-partition topic leaves 7 consumers sitting idle. Match your partition count to your expected maximum consumer count, and don't expect adding consumers to solve performance problems once you've hit that ceiling.

Watch for hot partitions caused by skewed key distribution. If most messages share similar keys, they end up in the same partition, creating a bottleneck that additional consumers cannot help with.

!!! note "librdkafka Prebuffering"

    By default, librdkafka fetches up to 1MB of messages per partition into local memory. This prebuffering can mask the real bottleneck and make scaling appear ineffective when the actual problem lies elsewhere. Factor this into your performance analysis.

Some frameworks, like Karafka, have capabilities to work around these partition-bound scaling limitations.

## Dead Letter Queues

Implement your DLQ strategy before sending your first production message. Kafka's offset model creates a blocking problem: consumers must process messages in order and commit offsets sequentially. If a message fails processing, the consumer cannot skip it - it must either succeed or move the message elsewhere. Without a DLQ, a single bad message causes the consumer to retry forever, while all newer messages in that partition pile up unprocessed.

Use a retry topic pattern with increasing delays:

```text
main-topic → topic-retry-1 → topic-retry-2 → topic-retry-3 → topic-dlq
```

Limit retries to 3-5 attempts with exponential backoff before routing to the DLQ. Send non-retryable errors (deserialization failures, schema mismatches) directly to the DLQ - there's no point retrying something that will never succeed.

Include metadata in DLQ messages via headers: original topic, partition, offset, timestamp, and exception details. This context is invaluable when investigating failures later.

Monitor your DLQ message count and age. Sudden spikes typically indicate upstream issues that warrant immediate investigation.

## Retention and Cleanup Policies

Choose your cleanup policy based on use case:

- **`delete`** works for event streams, logs, and time-series data where you want messages removed after a retention period
- **`compact`** suits state stores, changelogs, and CDC streams where only the current state per key matters

One subtlety: Kafka writes to segment files and only deletes complete segments. The active segment being written to is never deleted, even if messages in it exceed retention time. For low-volume topics that require precise retention, set `segment.ms` to 1 hour to roll segments over more frequently.

Avoid the `compact,delete` policy if you need the guarantee of keeping at least one record per key - the delete portion can remove records you expected compaction to preserve.

## Naming Conventions

Establish naming conventions before creating your first topic. Topics cannot be renamed, and consumer group names are tied to offset storage - changing either requires migration.

A consistent pattern for topics works well:

```text
<environment>.<domain>.<entity>.(optionally)<action>

prod.orders.order
prod.payments.payment.processed
```

For consumer groups:

```text
<application>-<environment>[-<suffix>]

order-service-prod
analytics-consumer-staging
```

Use past tense for events (`created`, `updated`) and imperative for commands (`process`, `send`).

Pick one separator style and stick with it. Mixing periods and underscores causes metric name collisions in monitoring systems. Avoid including fields that change, like team names or service owners.

!!! warning

    Consumer group names must be globally unique within the cluster. Ensure your naming scheme prevents collisions between environments if they share a cluster.

Disable `auto.create.topics.enable` in production and enforce naming through CI/CD. Ad-hoc topic creation inevitably leads to inconsistent names you'll regret later.

## Serialization Format

Choose your serialization format before producing your first message. Changing formats later requires migrating all consumers and potentially reprocessing historical data.

JSON is the simplest option - human-readable and debuggable without special tooling. However, it lacks schema enforcement, wastes bytes on field names in every message, and provides no built-in compatibility guarantees. For production systems with multiple teams or services, schema-based formats like Avro or Protobuf with a schema registry provide significant advantages: schemas are versioned centrally, compatibility is enforced automatically, and payloads are more compact.

When using a schema registry, decide on your compatibility mode upfront. `BACKWARD` compatibility (new schemas can read old data) is the most common choice - it allows consumers to upgrade before producers. `FORWARD` compatibility (old schemas can read new data) suits cases where producers upgrade first. Avoid `NONE` in production; it removes all safety guarantees.

Whatever format you choose, include a schema version indicator in your messages or use the schema registry's wire format. This makes future migrations possible without requiring coordinated deployments across all producers and consumers.

## Cluster Capacity Planning

Running Kafka clusters with adequate capacity headroom is critical for fault tolerance. When a broker goes offline (planned maintenance, hardware failure, or network issues), the remaining brokers must absorb the additional load. Without sufficient headroom, this redistribution can cascade into cluster-wide issues.

### CPU Utilization Guidelines

As a general rule, your average CPU load should not exceed your available CPU cores (whether physical cores on bare metal or vCPUs in cloud environments). When load consistently exceeds available processing capacity, the system becomes oversaturated and response times degrade. For Kafka clusters specifically:

- **Target 40-50% average CPU utilization** across brokers in production to maintain headroom for traffic spikes and broker failures
- **Never exceed 80% sustained utilization** - this leaves no margin for traffic spikes or failure scenarios
- **Monitor load averages** relative to your core/vCPU count, not just percentage - a load average of 8 on a 6-core machine indicates saturation

### Node Failure Impact

The criticality of capacity headroom depends heavily on cluster size. When a broker goes down, remaining brokers must absorb its load - and the proportional impact varies dramatically based on how many brokers you have.

**The small cluster problem:**

In a 3-broker cluster, losing one broker means losing **1/3 of your total capacity**. The remaining two brokers must each absorb an additional 50% of their current load to compensate. This is a massive spike that leaves almost no room for error.

In a 6-broker cluster, losing one broker means losing only **1/6 of your capacity**. The remaining five brokers each absorb just 20% additional load - a far more manageable increase.

<table>
  <thead>
    <tr>
      <th>Cluster Size</th>
      <th>Capacity Lost Per Failure</th>
      <th>Load Increase Per Remaining Broker</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>3 brokers</td>
      <td>33% (1/3)</td>
      <td>+50%</td>
    </tr>
    <tr>
      <td>4 brokers</td>
      <td>25% (1/4)</td>
      <td>+33%</td>
    </tr>
    <tr>
      <td>6 brokers</td>
      <td>17% (1/6)</td>
      <td>+20%</td>
    </tr>
    <tr>
      <td>9 brokers</td>
      <td>11% (1/9)</td>
      <td>+12.5%</td>
    </tr>
  </tbody>
</table>

**Why 3-broker clusters are risky:**

Consider a 3-broker cluster running at 60% CPU each:

- Total cluster capacity: 3 brokers × 100% = 300% capacity units
- Current utilization: 3 brokers × 60% = 180% capacity units
- After losing one broker: 180% load ÷ 2 brokers = **90% per remaining broker**

At 90% utilization, the cluster has no headroom for traffic spikes, rebalancing overhead, or the increased coordination required during failover. Brokers may become too slow to acknowledge messages, triggering `msg_timed_out` errors and potentially cascading failures.

!!! warning "Three-Broker Clusters Require Extra Caution"

    With only 3 brokers, you should not exceed 45% average CPU utilization. At 45%, losing one broker puts remaining brokers at 67.5% - manageable. At 50%, you hit 75% after a failure - tight but survivable. At 60%, you hit 90% - likely to cause cascading failures. For production workloads where availability during maintenance matters, consider 4+ brokers.

### Symptoms of Running Over Capacity

When brokers become overloaded, Kafka does not fail immediately - it degrades progressively. Recognizing early warning signs helps you act before a full outage:

**Producer-side symptoms:**

- **`msg_timed_out` errors** - The most common sign. Brokers are too slow to acknowledge messages within `message.timeout.ms`. The producer retried for the full timeout period but never received confirmation.
- **`request_timed_out` errors** - Broker failed to respond to metadata or produce requests in time.
- **`queue_full` errors** - Producer's internal buffer filled up because messages are not being acknowledged fast enough.
- **Increased produce latency** - Even successful produces take longer as brokers struggle to keep up.

**Consumer-side symptoms:**

- **Consumer lag increases** - Consumers fall behind because fetch requests are slow or brokers cannot serve data quickly enough.
- **Frequent rebalances** - Overloaded brokers may fail to respond to heartbeats, causing consumers to be marked dead and triggering unnecessary rebalances.
- **`coordinator_not_available` errors** - The group coordinator broker is too overloaded to manage consumer group membership.

**Cluster-wide symptoms:**

- **Under-replicated partitions** - Followers cannot keep up with the leader, causing ISR (in-sync replica) count to drop.
- **`not_enough_replicas` errors** - ISR falls below `min.insync.replicas`, blocking writes entirely.
- **Leader election delays** - Controller is too slow to reassign leadership when brokers fail.
- **Cascading failures** - One overloaded broker causes increased load on others, which then also become overloaded.

When you observe these symptoms during or after a broker failure, the root cause is almost always insufficient capacity headroom - not a bug in your application or Kafka itself.

**Sizing for fault tolerance:**

- With 3 brokers at 45% each, losing one puts remaining at 67.5% - reasonable headroom
- With 4 brokers at 45% each, losing one puts remaining at 60% - comfortable margin
- With 6 brokers at 45% each, losing one puts remaining at 54% - excellent fault tolerance

### Scaling Strategies

When capacity becomes constrained, you have two options - but only one may actually be viable depending on your current utilization.

**Vertical scaling** (larger instances) seems simpler but creates a dangerous catch-22 when you are already CPU-constrained. Vertical scaling requires taking each broker offline to resize it (replace with a larger instance, add CPUs, upgrade hardware). During this window, the remaining brokers must absorb that node's load.

If your 3-broker cluster is already running at 60% CPU and you take one broker down to upgrade it, the remaining two brokers jump to 90% CPU - exactly the overload scenario you are trying to prevent. You cannot vertically scale a cluster that is already at capacity without risking the very outage you are trying to avoid.

**Horizontal scaling** (more brokers) is the only safe option when CPU is the bottleneck. By adding new brokers first, you increase total cluster capacity before removing or stressing any existing nodes:

1. Add new brokers to the cluster (capacity increases immediately for new partitions)
2. Gradually migrate partitions from overloaded brokers to new ones
3. Each migration reduces load on existing brokers rather than increasing it
4. Once load is balanced, the cluster has both more headroom and better fault tolerance

This approach:

- Adds capacity before removing any
- Allows incremental partition migration to avoid overwhelming nodes
- Reduces per-broker failure impact going forward (1/6 vs 1/3 of capacity)

After adding brokers, use the [Admin Replication API](https://karafka.io/docs/Admin-Replication-API#rebalancing-replicas) to rebalance partition assignments across the expanded cluster. Migrate partitions one at a time to minimize additional load during the transition.

!!! warning "The Vertical Scaling Trap"

    If you wait until CPU is the bottleneck to consider scaling, vertical scaling is no longer an option - you are effectively locked into horizontal scaling. Plan capacity increases before you hit this point. The best time to vertically scale is when you still have 30-40% headroom, not when you are already constrained.

!!! tip "Managed Kafka Provider Notes"

    Different providers handle scaling differently. Some (like Confluent) have self-balancing features that automatically redistribute partitions. Others require manual partition reassignment after adding brokers. Check your provider's documentation before scaling operations. Also verify whether your provider supports adding individual brokers or only scaling in fixed increments (for example, 3 to 6 nodes).

## Managed Service Considerations

Before committing to a managed Kafka provider, get clear answers to these questions:

- What is the in-place KRaft migration path?
- How far behind upstream Kafka releases is the service typically?
- What is the SLA and what does it actually cover?
- What topic and partition limits affect scaling?
- Which broker configurations can you modify?

Different providers have distinct trade-offs that affect operational flexibility, version currency, and available features. Evaluate based on your specific requirements for availability, ecosystem integration, and operational overhead.

---

## See Also

- [Kafka Topic Configuration](Kafka-Topic-Configuration) - Per-topic settings including retention, replication, and compaction
- [Kafka Cluster Configuration](Kafka-Cluster-Configuration) - Cluster-level broker settings and defaults
- [New Consumer Group Protocol](Kafka-New-Rebalance-Protocol) - Faster rebalancing with the new consumer protocol
- [AWS MSK Guide](Operations-AWS-MSK-Guide) - MSK-specific considerations and configuration
- [Dead Letter Queue](Dead-Letter-Queue) - Implementing DLQ patterns in Karafka
- [Idempotence and Acknowledgements](WaterDrop-Idempotence-and-Acknowledgements) - Producer durability settings and acks configuration
- [Broker Failures and Fault Tolerance](Broker-Failures-and-Fault-Tolerance) - Handling broker outages and ensuring availability
- [Latency and Throughput](Latency-and-Throughput) - Consumer performance tuning and optimization
