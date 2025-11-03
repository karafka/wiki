This document explains topic auto-creation behavior and addresses common misconceptions about the `allow.auto.create.topics` configuration. It clarifies when and how topics are automatically created by consumers versus producers.

**Bottom Line**: Consumers do **not** create topics automatically, even with `allow.auto.create.topics` set to `true`. Topic creation occurs automatically during message production using WaterDrop, not during consumption.

## Configuration Settings

<table>
<tr>
<th>Configuration</th>
<th>Description</th>
</tr>
<tr>
<td>Consumer: <code>allow.auto.create.topics</code> set to <code>true</code></td>
<td>Allows automatic topic creation on the broker when subscribing to non-existent topics. Often misunderstood to mean consumers will create topics.</td>
</tr>
<tr>
<td>Broker: <code>auto.create.topics.enable</code> set to <code>true</code></td>
<td>Enables automatic topic creation on the broker side.</td>
</tr>
</table>

## Expected vs. Actual Behavior

Many developers expect that when a consumer subscribes to a non-existent topic with `allow.auto.create.topics` set to `true`, the topic will be automatically created.

**Actual behavior:**

- **Consumer subscription to non-existent topics**: The consumer monitors the topic name in metadata requests and subscribes only when the topic exists
- **Topic creation timing**: Topics are created during the **first message production** using WaterDrop, not during consumer subscription
- **Consumer behavior**: If a topic doesn't exist, the consumer waits and "keeps an eye on it" until the topic is created

## Technical Details

When only consumers are present (no WaterDrop producers), topics will **not** be created automatically. Topic creation requires a WaterDrop producer to send the first message to the non-existent topic. Consumers detect newly created topics during metadata refresh cycles (default: 5 minutes).

**WaterDrop producer behavior:**

- **Auto-creation trigger**: The first `produce_sync` or `produce_async` call to a non-existent topic creates the topic
- **Configuration dependency**: Requires both `allow.auto.create.topics` set to `true` (consumer config) and `auto.create.topics.enable` set to `true` (broker config)
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

This CLI behavior is implementation-specific and doesn't reflect standard consumer behavior.

## Summary

Understanding topic auto-creation behavior is crucial for building reliable event-driven applications:

- **Consumers don't create topics** - they only subscribe to existing ones
- **WaterDrop producers create topics** - during the first `produce_sync` or `produce_async` call
- **Plan for topic lifecycle** - consider pre-creating topics in production using declarative topics
- **Monitor metadata refresh** - newly created topics may not be immediately visible to consumers

This behavior ensures topics are created only when there's actual data to store, not merely because a consumer is interested in potentially receiving messages.

---

## See Also

- [Declarative-Topics](Declarative-Topics) - Manage topic creation explicitly as code for production environments
- [Admin-API](Admin-API) - Programmatically create and manage topics
- [WaterDrop-Usage](WaterDrop-Usage) - Understand producer behavior that triggers topic auto-creation
- [Configuration](Configuration) - Configure allow.auto.create.topics and related settings
