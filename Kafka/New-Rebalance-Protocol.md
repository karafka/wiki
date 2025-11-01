# Consumer Group Rebalance Protocol (KIP-848)

[KIP-848](https://cwiki.apache.org/confluence/display/KAFKA/KIP-848%3A+The+Next+Generation+of+the+Consumer+Rebalance+Protocol) introduces a next-generation consumer group rebalance protocol that can deliver up to 20x faster rebalances while eliminating stop-the-world pauses. This guide focuses specifically on using this protocol with Karafka - certain KIP-848 features and limitations not relevant to Karafka applications are intentionally omitted.

!!! info "Low-Level Protocol Details"

    Parts of this documentation are based on the [librdkafka KIP-848 documentation](https://github.com/confluentinc/librdkafka/blob/v2.12.0/INTRODUCTION.md#next-generation-consumer-group-protocol-kip-848). Big thank you to the librdkafka team for allowing me to build upon their excellent documentation.

    For detailed low-level information about the next generation consumer group protocol, including internal implementation details and protocol specifications, see the librdkafka documentation linked above.

## Overview

Traditional consumer rebalancing requires **all** consumers to stop processing during coordination, even if only one consumer joins or leaves the group. KIP-848 solves this by moving coordination logic to the Kafka broker and allowing consumers to continue processing while rebalancing happens incrementally in the background.

**Key Benefits:**

- Rebalances complete several times faster in large consumer groups
- Consumers continue processing messages during rebalancing
- Only affected consumers pause briefly when receiving new partition assignments
- Better isolation when some consumers are slower than others
- Improved operational visibility with server-side coordination

## When to use the new protocol

- **With large consumer groups:** If your consumer groups have 10+ consumers managing many partitions, you will see the most dramatic improvements. For example, a group with 10 consumers adding 900 partitions completes rebalancing in 5 seconds instead of 103 seconds.

- **For high-availability applications:** If your application can't afford processing interruptions, you will benefit from continuous message processing during rebalances. Financial services, real-time analytics, and fraud detection systems are ideal candidates.

- **In frequently rebalancing environments:** If you have auto-scaling deployments, Kubernetes with frequent pod restarts, or development environments with continuous deployments, you will experience much less disruption.

- **When scaling partitions dynamically:** If you regularly add partitions and topics to match workload changes, the new protocol will handle these changes more efficiently.

## Requirements

### Broker Requirements

- Apache Kafka 4.0+ or Confluent Platform 8.0+
- KRaft mode (ZooKeeper-based clusters must migrate first)

!!! warning "Alternative Kafka Protocol Implementations"

    At the time of writing, KIP-848 is not supported by Redpanda or other alternative Kafka protocol implementations. This feature requires Apache Kafka 4.0+ brokers. Check with your broker vendor for KIP-848 support status if not using Apache Kafka.

### Karafka Requirements

- karafka-rdkafka with librdkafka 2.12.0+
- Karafka 2.4+
- Ruby 3.2+ recommended

!!! note "No Code Changes Required"

    **No application code changes required.** You only need to update configuration.

### Supported Features

KIP-848 in librdkafka 2.12.0+ supports all major consumer features:

- **Topic subscriptions**: Both explicit topic lists and regular expression (regex) patterns
- **Static group membership**: Using `group.instance.id` for stable member identities
- **Rebalance callbacks**: Incremental assignment and revocation callbacks
- **Manual and automatic offset management**: Both commit modes work as expected
- **Rolling upgrades**: Seamless migration from classic protocol without downtime

Regex subscriptions work identically to the classic protocol - topics matching the pattern will be automatically discovered and assigned.

## Configuration

### Enabling KIP-848

The new protocol is **not** enabled by default. Update your Karafka configuration:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'kafka-broker:9092',
      'group.protocol': 'consumer'  # Enable KIP-848
    }
  end
end
```

### Choosing an assignor

The protocol provides two server-side assignors:

```ruby
config.kafka = {
  'group.protocol': 'consumer',
  'group.remote.assignor': 'uniform'  # Default, recommended for most cases
}
```

- **Uniform assignor** (recommended): Distributes partitions evenly across consumers. Works well for most workloads and provides good balance.

- **Range assignor**: Groups topic partitions together as ranges. Useful when you need related partitions on the same consumer.

### Configuration Cleanup

When migrating to KIP-848, remove these classic protocol settings:

```ruby
config.kafka = {
  'group.protocol': 'consumer',

  # Remove these - they cause errors with the new protocol:
  # 'partition.assignment.strategy': 'cooperative-sticky',
  # 'session.timeout.ms': 45000,
  # 'heartbeat.interval.ms': 3000
}
```

!!! warning "Deprecated Properties"

    Session and heartbeat timeouts are now controlled by the broker, not individual consumers. Including deprecated properties like:

    - `partition.assignment.strategy`
    - `session.timeout.ms`
    - `heartbeat.interval.ms`

    when using `group.protocol=consumer` will cause request rejection.

## Migration Guide

### Preparation

Before migrating:

1. Upgrade Kafka brokers to version 4.0+
1. Verify brokers are running in KRaft mode
1. Upgrade all the Karafka ecosystem components to the most recent versions
1. Test the migration in a staging environment first
1. Ensure monitoring tools are ready to track the new protocol

### Rolling Migration

KIP-848 supports live migration without downtime. When the first consumer using the new protocol joins a group, the coordinator will automatically transition the entire group.

1. Update your Karafka configuration to enable `'group.protocol': 'consumer'` and remove deprecated properties.

1. Deploy the updated configuration using a rolling restart:

    - Restart the first consumer instance
    - The group coordinator will transition to the new protocol
    - Continue restarting remaining consumers one at a time
    - Monitor for any errors during the rollout

    !!! warning

        Complete the migration within a few hours. Don't leave the group in a mixed state for extended periods.

### Rollback

If issues arise, remove `'group.protocol': 'consumer'` from your configuration and restart consumers. The coordinator will automatically convert back to classic protocol when the last new-protocol consumer leaves.

### Migration Checklist

Use this checklist to ensure a smooth migration to KIP-848:

**Prerequisites:**

- [ ] Upgrade Kafka brokers to version 4.0.0+
- [ ] Verify brokers are running in KRaft mode (not ZooKeeper)
- [ ] Upgrade to the latest version of all Karafka ecosystem components

**Configuration Changes:**

- [ ] Set `'group.protocol': 'consumer'` in `config.kafka`
- [ ] Remove `'partition.assignment.strategy'` if present
- [ ] Remove `'session.timeout.ms'` if present
- [ ] Remove `'heartbeat.interval.ms'` if present
- [ ] Remove `'group.protocol.type'` if present

**Code Review (if using static membership):**

- [ ] Review static membership usage (`group.instance.id`) and understand new fencing behavior

**Deployment:**

- [ ] Deploy using rolling restart (one consumer instance at a time)
- [ ] Monitor first consumer restart for successful group protocol transition
- [ ] Continue rolling restart across all consumer instances
- [ ] Verify migration with `kafka-consumer-groups.sh --describe --group <group> --state` or using Karafka Web UI
- [ ] Complete migration within a few hours (don't leave in mixed state)

**Post-Migration Validation:**

- [ ] Verify all consumers show in consumer group
- [ ] Check consumer lag is normal
- [ ] Monitor rebalance frequency and duration
- [ ] Watch for new protocol-specific errors in logs
- [ ] Validate offset commits are working correctly

**Rollback Plan (if needed):**

- [ ] Document rollback procedure: remove `'group.protocol': 'consumer'` and restart
- [ ] Understand that rollback triggers another rebalance
- [ ] Prepare monitoring alerts for rollback detection

## Karafka-Specific Considerations

### Rebalance Callbacks

Your existing rebalance callbacks will continue working with KIP-848:

```ruby
class EventsConsumer < Karafka::BaseConsumer
  def consume
    messages.each { |msg| process(msg) }
  end

  def revoked
    logger.info "Partitions revoked: #{topic.name}"
    # Cleanup: flush buffers, commit work, etc.
  end

  def shutdown
    # Final cleanup when consumer shuts down
  end
end
```

### Multi-Threading Behavior

Karafka's multi-threaded processing benefits significantly from KIP-848. During rebalances, only threads consuming or processing affected partitions will pause briefly. Other threads will continue processing messages uninterrupted.

[Virtual Partitions](Pro-Virtual-Partitions) (parallel processing within a partition) will also experience less disruption during rebalances.

## Protocol Behavior Differences

KIP-848 introduces several important behavioral changes compared to the classic protocol. Understanding these differences helps avoid surprises during migration and operation.

### Session Timeout and Message Fetching

- **KIP-848 Behavior:** When the Group Coordinator becomes unreachable, consumers **will continue fetching and processing messages** but will not be able to commit offsets. The consumer will only be fenced once a heartbeat response is received from the Coordinator indicating the session has expired.

- **Classic Protocol:** Consumers stopped fetching messages when the client-side session timeout expired, even if the broker was unreachable.

- **Implication:** With KIP-848, your consumers will remain productive during temporary coordinator outages. However, be aware that processed messages will not be able to be committed until coordinator connectivity is restored. Design your consumers to handle duplicate processing if a crash occurs during this window.

### Static Group Membership Fencing

- **KIP-848 Behavior:** When a duplicate `group.instance.id` is detected, the **newly joining member** will be fenced with `UNRELEASED_INSTANCE_ID` (fatal error). The existing member will continue operating.

- **Classic Protocol:** The **existing member** was fenced instead, allowing the new member to take over.

!!! warning "Breaking Change: Fencing Behavior Reversal"

    KIP-848 **reverses** static membership fencing behavior compared to the classic protocol. If you rely on static membership (`group.instance.id`), this change can significantly impact your deployment and recovery procedures:

    - **Deployment Impact:** You cannot quickly replace a consumer with the same `group.instance.id` unless the old consumer shuts down cleanly first
    - **Recovery Impact:** After crashes, replacements will be blocked until the broker's session timeout expires (removing the zombie member)
    - **Recommendation:** Ensure robust shutdown hooks and consider whether static membership is necessary for your use case

- **Implication:** This reversal prevents accidental takeovers. Ensure clean consumer shutdown before starting replacements with the same `group.instance.id`. If a consumer crashes without graceful shutdown, the replacement will be blocked until the broker's session timeout expires and removes the existing member.

### Unknown and Unauthorized Topics

- **KIP-848 Behavior:**
    - `UNKNOWN_TOPIC_OR_PART` is no longer returned when subscribing to a topic that's missing from the local metadata cache. The subscription proceeds, and the consumer will discover the topic when metadata refreshes.
    - `TOPIC_AUTHORIZATION_FAILED` is reported once per heartbeat or subscription change, even if only one subscribed topic is unauthorized.

- **Classic Protocol:** Errors were reported immediately upon subscription if topics were missing from the local metadata cache.

- **Implication:** Topic discovery is more seamless, but authorization failures may appear less frequently in logs.

## Error Handling

KIP-848 introduces new error conditions:

- **STALE_MEMBER_EPOCH:** Consumer's state is behind the coordinator. This will usually resolve automatically within seconds. Alert if errors persist.

- **FENCED_MEMBER_EPOCH:** Consumer must rejoin the group. This indicates serious coordination issues requiring investigation.

## Summary

KIP-848 delivers significant improvements in rebalance performance and stability without requiring application code changes. The benefits are most significant for large consumer groups and high-availability applications.

- **Migration Complexity:** Low - configuration changes only, rolling restart supported, rollback possible.

- **Risk Level:** Low with production Kafka 4.0 and librdkafka 2.12.0 releases. Known issues are well-documented with workarounds.

- **Recommendation:** For new deployments on Kafka 4.0+, enable KIP-848 from the start. For existing deployments, test thoroughly in staging before migrating to production.
