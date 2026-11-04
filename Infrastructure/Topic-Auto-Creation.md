This document explains topic auto-creation behavior and addresses common misconceptions about the `allow.auto.create.topics` configuration. It clarifies when and how topics are automatically created by consumers versus producers.

**Bottom Line**: A consumer does **not** create a missing topic when it subscribes. It creates one only in a narrow case: `allow.auto.create.topics` is `true`, the broker allows auto-creation, and the same subscription group already consumes an existing topic. Topics are normally created during message production using WaterDrop.

## Configuration Settings

<table>
<tr>
<th>Configuration</th>
<th>Description</th>
</tr>
<tr>
<td>Consumer: <code>allow.auto.create.topics</code> set to <code>true</code></td>
<td>Does not create topics when a consumer subscribes. librdkafka sends the subscription metadata requests with auto-creation turned off. The periodic metadata refresh can create a missing subscribed topic, but only when the same subscription group already consumes an existing topic. A subscription with only missing topics never creates them.</td>
</tr>
<tr>
<td>Broker: <code>auto.create.topics.enable</code> set to <code>true</code></td>
<td>Enables automatic topic creation on the broker side.</td>
</tr>
</table>

!!! info "Already Enabled by Default Outside Production"

    Karafka automatically sets `allow.auto.create.topics` to `true` for both consumers and the default producer in every environment except `production`, including when no environment variable is set. You do not need to configure this setting yourself outside `production`.

## Expected vs. Actual Behavior

Many developers expect that when a consumer subscribes to a non-existent topic with `allow.auto.create.topics` set to `true`, the topic will be automatically created.

**Actual behavior:**

- **Consumer subscription to non-existent topics**: The consumer monitors the topic name in metadata requests and subscribes only when the topic exists
- **Topic creation timing**: Topics are created during the **first message production** using WaterDrop, not during consumer subscription
- **Consumer behavior**: If a topic does not exist, the consumer waits and "keeps an eye on it" until the topic is created
- **Exception for mixed subscription groups**: When a subscription group consumes an existing topic and also subscribes to a missing one, the periodic metadata refresh creates the missing topic. This happens only when the consumer `allow.auto.create.topics` and the broker `auto.create.topics.enable` are both `true`. Outside `production`, Karafka refreshes metadata every 5 seconds, so the topic appears within about 5 seconds

## Technical Details

When only consumers are present (no WaterDrop producers), a topic is created only in the mixed subscription group case described above. A subscription group with only missing topics does not create them: a WaterDrop producer must send the first message. Consumers detect newly created topics during metadata refresh cycles. In every environment except `production`, Karafka sets `topic.metadata.refresh.interval.ms` to 5 seconds by default so newly created topics are detected quickly; in `production`, where this is not injected, the underlying librdkafka default of 5 minutes applies unless you configure it explicitly.

**WaterDrop producer behavior:**

- **Auto-creation trigger**: The first `produce_sync` or `produce_async` call to a non-existent topic creates the topic
- **Configuration dependency**: Requires both `allow.auto.create.topics` set to `true` (producer config) and `auto.create.topics.enable` set to `true` (broker config)
- **Partition key limitation**: If using partition keys, topic creation may fail due to metadata caching limitations, resulting in an error rather than a silent failure

## CLI Tool Behavior

The Kafka CLI consumer (`kafka-console-consumer.sh`) behaves differently and may create topics:

```shell
# Before running consumer
$ kafka-topics.sh --list | grep my-topic
# (no output)

# Run consumer on non-existent topic
$ kafka-console-consumer.sh --topic my-topic
# Shows warning: unknown_topic_or_partition

# After stopping, topic is created
$ kafka-topics.sh --list | grep my-topic
my-topic
```

This CLI behavior is implementation-specific and does not reflect standard consumer behavior.

## Summary

Understanding topic auto-creation behavior is crucial for building reliable event-driven applications:

- **Consumers do not create topics on subscribe** - only the periodic metadata refresh of a subscription group that already consumes an existing topic can create a missing one
- **WaterDrop producers create topics** - during the first `produce_sync` or `produce_async` call
- **Plan for topic lifecycle** - consider pre-creating topics in production using declarative topics
- **Monitor metadata refresh** - newly created topics may not be immediately visible to consumers

This behavior ensures topics are created only when there is actual data to store, not merely because a consumer is interested in potentially receiving messages.

## See Also

- [Declarative Topics](Infrastructure-Declarative-Topics) - Manage topic creation explicitly as code for production environments
- [Admin API](Infrastructure-Admin-API) - Programmatically create and manage topics
- [Usage](WaterDrop-Usage) - Understand producer behavior that triggers topic auto-creation
- [Configuration](Basics-Configuration) - Configure allow.auto.create.topics and related settings
