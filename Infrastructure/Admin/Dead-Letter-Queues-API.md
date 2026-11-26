# Admin Dead Letter Queues API (Pro)

`Karafka::Pro::Admin::DeadLetterQueues` copies messages from a dead letter queue (DLQ) topic back to the topics they came from, or to a topic you choose. Your consumers then process them again. It is a Karafka Pro feature.

## Replaying DLQ Messages

`.copy` reads the DLQ topic and produces each message again. It returns the number of copied messages, or `0` when no message is in the requested range.

```ruby
# Copy all messages of a DLQ topic back to their source topics and partitions
Karafka::Pro::Admin::DeadLetterQueues.copy('events_dlq')
```

Without `target_topic_name`, each message goes to the topic named in its `source_topic` header and to the partition named in its `source_partition` header. The [Enhanced Dead Letter Queue](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue#additional-headers-for-increased-traceability) adds these headers when it moves a message to the DLQ topic.

To copy all messages to one topic, give `target_topic_name`. Karafka does not set the partition in this case, so the producer selects it:

```ruby
Karafka::Pro::Admin::DeadLetterQueues.copy(
  'events_dlq',
  target_topic_name: 'events_retry'
)
```

!!! warning "Messages From the OSS Dead Letter Queue Need a Target Topic"

    The OSS Dead Letter Queue produces only the payload, without the key, the headers or the source topic. Copy its messages with `target_topic_name`. Without it, `.copy` raises `Karafka::Pro::Admin::DeadLetterQueues::Errors::SourceTopicMissingError` when it reads a message without a `source_topic` header. The error message names the topic, partition and offset of that message.

## Options

<table>
  <thead>
    <tr>
      <th>Option</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>target_topic_name</code></td>
      <td><code>nil</code></td>
      <td>Topic to copy all messages to. When <code>nil</code>, each message goes to its <code>source_topic</code> and <code>source_partition</code>.</td>
    </tr>
    <tr>
      <td><code>partitions</code></td>
      <td><code>nil</code></td>
      <td>DLQ topic partitions to copy from, as a non-empty array of unique non-negative integers. When <code>nil</code>, all partitions.</td>
    </tr>
    <tr>
      <td><code>start_offset</code></td>
      <td><code>0</code></td>
      <td>First offset to copy in each partition (inclusive), or a <code>Time</code>. An offset below the low watermark starts at the low watermark. With a <code>Time</code>, the copy starts at the first message at or after that time, and a partition without such a message is skipped.</td>
    </tr>
    <tr>
      <td><code>end_offset</code></td>
      <td><code>nil</code></td>
      <td>Offset at which to stop in each partition (exclusive). When <code>nil</code> or above the high watermark, the high watermark read at the start of the call is used. Messages that arrive in the DLQ topic during the copy are not copied.</td>
    </tr>
    <tr>
      <td><code>producer</code></td>
      <td><code>nil</code></td>
      <td>WaterDrop producer to produce with. When <code>nil</code>, <code>Karafka.producer</code>. Required with a custom <code>kafka</code> configuration.</td>
    </tr>
  </tbody>
</table>

The example below copies offsets `100` to `199` of partition `0`:

```ruby
Karafka::Pro::Admin::DeadLetterQueues.copy(
  'events_dlq',
  target_topic_name: 'events',
  partitions: [0],
  start_offset: 100,
  end_offset: 200
)
```

To copy what arrived in the DLQ topic in the last hour:

```ruby
Karafka::Pro::Admin::DeadLetterQueues.copy(
  'events_dlq',
  start_offset: Time.now - 3600
)
```

## Copied Message Content

Each copied message keeps the payload, the key and the headers of the DLQ message, with these changes:

- Karafka removes the Enhanced DLQ `source_*` headers: `source_topic`, `source_partition`, `source_offset`, `source_consumer_group`, `source_attempts` and `source_trace_id`.
- Karafka sets the `replay_count` header to its previous value plus one. On the first copy it is `1`.

If a copied message fails again, the Enhanced DLQ by default produces it back to the DLQ topic with its `replay_count` header. A custom [`#enhance_dead_letter_queue_message`](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue#adding-custom-details-to-the-dlq-message) keeps this header only if it keeps the original headers. Use this header to find messages that you replay repeatedly. Karafka does not act on it.

## How the Copy Works

`.copy` reads the DLQ topic with one `Karafka::Pro::Iterator` and produces the messages with `#produce_many_sync` in batches of 1000 messages. Gaps in the offsets, for example from compaction or aborted transactions, do not stop it.

!!! warning "The Copy Is Not Atomic"

    When `.copy` fails, the batches produced before the failure stay in the target topics. This also applies to `SourceTopicMissingError`: Karafka does not produce the batch with the failing message, but the earlier batches are already produced.

## Using a Different Cluster

To copy messages on a cluster other than the default one, create an instance with a custom `kafka` configuration, as with the other [Admin APIs](Infrastructure-Admin-API#multi-cluster-setup). The iterator reads with this configuration, also when the instance has an `external_client`.

`Karafka.producer` produces to the default cluster, so a custom `kafka` configuration requires a `producer`. Without it, `#copy` raises `Karafka::Errors::InvalidConfigurationError`.

```ruby
PRODUCER = WaterDrop::Producer.new do |config|
  config.kafka = { 'bootstrap.servers': 'other-cluster:9092' }
end

dlq = Karafka::Pro::Admin::DeadLetterQueues.new(
  kafka: { 'bootstrap.servers': 'other-cluster:9092' }
)

dlq.copy('events_dlq', producer: PRODUCER)
```

## See Also

- [Dead Letter Queue](Consumer-Groups-Dead-Letter-Queue) - Base DLQ feature and configuration
- [Enhanced Dead Letter Queue](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue) - Pro DLQ with the `source_*` headers used for replay
- [Iterator](Pro-Iterator-API) - Reading topics without consumers
- [Admin API](Infrastructure-Admin-API) - Core admin operations and multi-cluster setup
