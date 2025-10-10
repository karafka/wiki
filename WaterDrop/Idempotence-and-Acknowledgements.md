This document covers the concepts of idempotence and acknowledgments in the context of using WaterDrop.

It explores the roles of idempotence, acknowledgments, and relevant configurations like `replication_factor` and `min.insync.replicas`. These mechanisms work together to ensure data consistency, fault tolerance, and durability in distributed messaging systems like Kafka.

## Idempotence

**Idempotence** ensures that an operation can be performed multiple times without changing the result beyond the initial application. In the context of Kafka and message processing:

- When a producer sends messages to Kafka, idempotence guarantees that **duplicate messages** (caused by retries, network issues, or any other transient errors) will **not be written more than once**.
- This is particularly useful in distributed systems where retries are common, and the goal is to **avoid processing the same message multiple times**.

### WaterDrop Idempotence

Producer idempotence ensures **exactly-once semantics (EOS)** by tracking a unique message ID for each message and preventing duplicate writes even if the producer retries. To enable idempotence in WaterDrop, configure the producer with `enable.idempotence` set to `true`:

```ruby
WaterDrop.setup do |config|
  config.kafka = {
    # Other settings...
    'enable.idempotence': true,
  }
end
```

When idempotence is enabled in WaterDrop producer:

- Kafka ensures that even if a message is retried, it will not be written again.
- The producer will assign a sequence number to each message, and Kafka ensures that messages with the same sequence number are deduplicated.

!!! info "Related: Fatal Error Recovery for Idempotent Producers"

    Idempotent producers can encounter fatal errors that require producer reload. WaterDrop provides automatic recovery mechanisms for these scenarios. For details on fatal error handling and recovery configuration, see the [Error Handling - Idempotent Producer Fatal Error Recovery](WaterDrop-Error-Handling#fatal-error-recovery) section.

## Acknowledgements

Acknowledgements (`acks`) dictate how the producer and the broker agree that a message has been successfully written. Kafka's acknowledgment system controls the level of durability and fault tolerance:

- `acks` `0`: The producer does not wait for any acknowledgment. This provides the lowest latency but risks data loss.
- `acks` `1`: The producer waits for acknowledgment from the leader broker only. If the leader broker fails after acknowledgment, data can be lost.
- `acks` `all`: The producer waits for acknowledgment from all in-sync replicas (ISRs). This provides the highest durability but introduces higher latency.

!!! tip "Per-Topic Acknowledgement Configuration in WaterDrop Variants"

    WaterDrop Variants support configuring acknowledgements on a **per-topic basis** while using the **same producer instance**. This flexibility allows different topics to have custom acknowledgement settings depending on the reliability and performance needs of the specific topic. 

    It is recommended to check the [WaterDrop Variants documentation](WaterDrop-Variants) for more details on how to configure this.

### Interaction with `min.insync.replicas`

The `acks` `all` configuration works in conjunction with `min.insync.replicas` to ensure that a message is only considered acknowledged when a certain number of replicas are in sync and able to receive the message. It is important to remember, that you can have more replicas than the number required to be in sync.

## Replication Factor

The Replication Factor determines how many copies of a partition are distributed across the Kafka cluster. This impacts fault tolerance and data availability. A higher replication factor increases fault tolerance, but also consumes more disk space and network bandwidth.

For example:

- A replication factor of 3 means that Kafka will store three copies of each partition across different brokers.
- If one broker fails, the remaining brokers will have the data.

The replication factor is set at the topic level when the topic is created. You can define it using the [Declarative Topics](Declarative-Topics) feature:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(
        partitions: 6,
        replication_factor: 3
      )

      consumer ConsumerA
    end
  end
end
```

## `min.insync.replicas`

`min.insync.replicas` is the minimum number of replicas that must be in sync with the leader for a message to be considered successfully written when `acks` set to `all` is used. This setting works with the `acks` set to `all` producer setting to enforce durability guarantees.

!!! tip "Maintaining Data Integrity During Broker Failures"

    If the number of in-sync replicas falls below this threshold (e.g., due to broker failure), Kafka will reject writes until the required number of replicas is back online.

To configure `min.insync.replicas` at the topic level you can use the [Declarative Topics](Declarative-Topics):

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(
        partitions: 6,
        replication_factor: 3,
        'min.insync.replicas': 2
      )

      consumer ConsumerA
    end
  end
end
```

## Example Scenario

- Replication Factor: `3` (three replicas of each partition)
- min.insync.replicas: `2` (two replicas must acknowledge the write)
- Producer `acks` set to `all`

In this scenario:

- At least two replicas must be in sync for the producer to successfully write a message.
- If one of the replicas is out of sync or down, Kafka will block writes to ensure data consistency.

## Replication Factor vs `min.insync.replicas`

<table border="1">
  <thead>
    <tr>
      <th>Aspect</th>
      <th>Replication Factor</th>
      <th>min.insync.replicas</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Definition</td>
      <td>Number of total replicas per partition.</td>
      <td>Minimum number of in-sync replicas required for writes.</td>
    </tr>
    <tr>
      <td>Purpose</td>
      <td>Controls fault tolerance via redundancy.</td>
      <td>Ensures write durability and data integrity.</td>
    </tr>
    <tr>
      <td>Write Impact</td>
      <td>Does not directly control write behavior.</td>
      <td>Directly impacts whether a write is accepted or rejected based on ISR count.</td>
    </tr>
    <tr>
      <td>Relation to Failures</td>
      <td>Ensures the partition is available across multiple brokers in case of failure.</td>
      <td>Determines how many replicas must acknowledge a write for it to be considered successful when acks=all.</td>
    </tr>
    <tr>
      <td>Setting Context</td>
      <td>Set when a topic is created or reassigned.</td>
      <td>Configured per-topic or as a broker default.</td>
    </tr>
    <tr>
      <td>Example Scenario</td>
      <td>With a replication factor of 3, there are 3 total replicas, one leader, and two followers for each partition.</td>
      <td>If <code>min.insync.replicas</code> set to <code>2</code>, at least <code>2</code> replicas must acknowledge a write when <code>acks</code> equal <code>all</code>.</td>
    </tr>
  </tbody>
</table>

## Best Practices

- Enable idempotence: Always enable producer idempotence for critical data to avoid duplicate messages during retries.
- Use `acks` set to `all`: Combine idempotence with `acks` `all` to ensure that your data is acknowledged by all in-sync replicas.
- Set appropriate `min.insync.replicas`: Ensure that `min.insync.replicas` is set to a value that matches your fault tolerance requirements (e.g., `2` for a replication factor of `3`).
- Monitor replicas: Regularly monitor your Kafka cluster to ensure that all replicas are in sync and healthy.
