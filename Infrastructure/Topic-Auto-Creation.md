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

!!! info "Already Enabled by Default Outside Production"

    Karafka automatically sets `allow.auto.create.topics` to `true` for both consumers and the default producer in non-production environments, so you do not need to configure this setting yourself in development or test. This default does not apply in production.

## Expected vs. Actual Behavior

Many developers expect that when a consumer subscribes to a non-existent topic with `allow.auto.create.topics` set to `true`, the topic will be automatically created.

**Actual behavior:**

- **Consumer subscription to non-existent topics**: The consumer monitors the topic name in metadata requests and subscribes only when the topic exists
- **Topic creation timing**: Topics are created during the **first message production** using WaterDrop, not during consumer subscription
- **Consumer behavior**: If a topic does not exist, the consumer waits and "keeps an eye on it" until the topic is created

## Technical Details

When only consumers are present (no WaterDrop producers), topics will **not** be created automatically. Topic creation requires a WaterDrop producer to send the first message to the non-existent topic. Consumers detect newly created topics during metadata refresh cycles. In development and test environments, Karafka sets `topic.metadata.refresh.interval.ms` to 5 seconds by default so newly created topics are detected quickly; in production, where this is not injected, the underlying librdkafka default of 5 minutes applies unless you configure it explicitly.

**WaterDrop producer behavior:**

- **Auto-creation trigger**: The first `produce_sync` or `produce_async` call to a non-existent topic creates the topic
- **Configuration dependency**: Requires both `allow.auto.create.topics` set to `true` (consumer config) and `auto.create.topics.enable` set to `true` (broker config)
- **Partition key limitation**: If using partition keys, topic creation may fail due to metadata caching limitations, resulting in an error rather than a silent failure

## Delivery Report Offsets on Auto-Created Topics

When you produce to a topic that already exists, the delivery report always carries the real offset of the message. When the topic does not exist yet and the broker auto-creates it, the delivery report for that first message can carry `-1001` instead.

`-1001` is the invalid offset marker used by librdkafka (`RD_KAFKA_OFFSET_INVALID`). It means the offset is not available in that report, **not** that the produce failed. The message is stored and is consumable at its real offset. Only the report is missing the value, because librdkafka does not always get the offset back for the message that triggered the topic creation.

That first report is ambiguous by nature: it carries either `-1001` or a real offset, depending on timing. Every later produce to that topic reports a real offset that matches the broker offset of the message.

!!! warning "Treat a Negative Offset as Unknown"

    A negative offset is not a position in the partition. Check it before you display it, store it, or build a link from it.

```ruby
report = producer.produce_sync(topic: 'my_topic', payload: 'my_payload')

if report.offset.negative?
  puts "Message produced to #{report.topic_name}, offset not available"
else
  puts "Message produced to #{report.topic_name} at offset #{report.offset}"
end
```

The partition and the topic name are correct in both cases, so you can rely on them even when the offset is not available.

Pre-creating your topics avoids this altogether, which is one more reason to use declarative topics in production.

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

- **Consumers do not create topics** - they only subscribe to existing ones
- **WaterDrop producers create topics** - during the first `produce_sync` or `produce_async` call
- **Plan for topic lifecycle** - consider pre-creating topics in production using declarative topics
- **Monitor metadata refresh** - newly created topics may not be immediately visible to consumers

This behavior ensures topics are created only when there is actual data to store, not merely because a consumer is interested in potentially receiving messages.

## See Also

- [Declarative Topics](Infrastructure-Declarative-Topics) - Manage topic creation explicitly as code for production environments
- [Admin API](Infrastructure-Admin-API) - Programmatically create and manage topics
- [Usage](WaterDrop-Usage) - Understand producer behavior that triggers topic auto-creation
- [Configuration](Basics-Configuration) - Configure allow.auto.create.topics and related settings
