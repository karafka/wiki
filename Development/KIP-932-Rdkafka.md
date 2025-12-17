# KIP-932 for rdkafka-ruby

!!! warning "Work in Progress"

    This document is a work in progress used for development purposes. It is subject to constant changes as it tracks research and development work related to KIP-932. It should not be used for any assumptions about future APIs, features, or implementation details.

KIP-932 introduces **Share Groups**, a new consumption model for Kafka that enables queue-like semantics. Unlike traditional consumer groups where each partition is assigned to exactly one consumer, share groups allow multiple consumers to cooperatively consume from the same partitions without exclusive assignment.

This document analyzes the changes required in rdkafka-ruby to support KIP-932, serving as the foundation layer that Karafka and karafka-web depend on.

## Critical Dependency: librdkafka

rdkafka-ruby is an FFI wrapper around librdkafka. **All KIP-932 functionality depends on librdkafka implementing share group support first.**

| Component | Status | Notes |
| --------- | ------ | ----- |
| librdkafka KIP-932 | Not started | No public issues or PRs as of research date |
| rdkafka-ruby bindings | Blocked | Waiting for librdkafka implementation |
| Karafka integration | Design phase | See KIP-932-Karafka.md |

Once librdkafka implements KIP-932, rdkafka-ruby will need to expose the new C APIs through FFI bindings.

## KIP-932 Overview

### What Are Share Groups?

Share groups represent a new consumption model where:

| Aspect | Consumer Groups (Current) | Share Groups (KIP-932) |
| ------ | ------------------------- | ---------------------- |
| **Partition Access** | Exclusive per consumer | Shared/cooperative |
| **Scaling** | Limited by partition count | Can exceed partition count |
| **Record Handling** | Offset-based commits | Per-record acknowledgment |
| **Delivery Tracking** | Implicit via offsets | Explicit delivery counts |
| **Rebalancing** | Client or server-side | Server-side only (SimpleAssignor) |
| **Group States** | Multiple (PREPARING_REBALANCE, etc.) | Simple (EMPTY, STABLE, DEAD) |

### Key Concepts

- **At-least-once delivery**: Records can be redelivered if not acknowledged
- **Per-record acknowledgment**: ACCEPT, RELEASE, or REJECT each record
- **Acquisition locks**: Records are locked for processing (default 30s)
- **Delivery attempt tracking**: Max 5 attempts by default, then archived
- **Record states**: Available → Acquired → Acknowledged/Archived

### New Protocol Components

- `ShareFetch` / `ShareAcknowledge` RPCs
- `ShareGroupHeartbeat` for membership management
- `KafkaShareConsumer` client interface (Java reference)
- Internal topic: `__share_group_state`
- Offsets: SPSO (Share-Partition Start Offset), SPEO (Share-Partition End Offset)

## Current rdkafka-ruby Architecture

### FFI Binding Structure

rdkafka-ruby uses Ruby FFI to bind to librdkafka's C API:

```text
Rdkafka::Config
├── consumer() → Rdkafka::Consumer
├── producer() → Rdkafka::Producer
└── admin()    → Rdkafka::Admin

Rdkafka::Consumer
├── subscribe(topics)
├── poll(timeout)
├── each { |message| ... }
├── commit(message, async)
├── store_offset(message)
├── pause/resume(topic_partition_list)
├── seek(topic_partition)
└── close()

Rdkafka::Bindings (FFI)
├── rd_kafka_subscribe()
├── rd_kafka_consumer_poll()
├── rd_kafka_commit()
├── rd_kafka_offset_store()
└── ... (other librdkafka functions)
```

### Statistics Callback

rdkafka-ruby exposes librdkafka statistics via a callback mechanism:

```ruby
config = Rdkafka::Config.new(
  'bootstrap.servers': 'localhost:9092',
  'statistics.interval.ms': 5000
)
config.consumer_statistics_callback = ->(stats) {
  # stats is a Hash parsed from librdkafka's JSON statistics
  # Contains: cgrp (consumer group), topics, brokers, etc.
}
```

The `cgrp` (consumer group) section currently includes:

- `state` - Consumer group state
- `stateage` - Time in state (microseconds)
- `join_state` - Join state for rebalancing
- `rebalance_age` - Time since last rebalance
- `rebalance_cnt` - Rebalance count
- `rebalance_reason` - Last rebalance reason

### Error Handling

Errors are exposed via `Rdkafka::RdkafkaError`:

```ruby
begin
  consumer.commit(message)
rescue Rdkafka::RdkafkaError => e
  case e.code
  when :unknown_member_id
    # Handle error
  end
end
```

## Required librdkafka APIs

For rdkafka-ruby to support KIP-932, librdkafka must expose these C APIs:

### Share Consumer Creation

```c
// New consumer type or configuration option
rd_kafka_t *rd_kafka_share_consumer_new(rd_kafka_conf_t *conf);
// OR
// Flag/config to create share consumer from existing rd_kafka_new()
```

### Share Group Subscription

```c
// Subscribe to topics as share group
rd_kafka_resp_err_t rd_kafka_share_subscribe(
    rd_kafka_t *rk,
    const rd_kafka_topic_partition_list_t *topics
);
```

### Polling

```c
// Poll for messages (may reuse existing rd_kafka_consumer_poll)
rd_kafka_message_t *rd_kafka_share_consumer_poll(
    rd_kafka_t *rk,
    int timeout_ms
);
```

### Acknowledgment

```c
// Acknowledge individual record
rd_kafka_resp_err_t rd_kafka_share_acknowledge(
    rd_kafka_t *rk,
    rd_kafka_message_t *message,
    rd_kafka_share_ack_type_t type  // ACCEPT, RELEASE, REJECT
);

// Batch acknowledgment
rd_kafka_resp_err_t rd_kafka_share_acknowledge_batch(
    rd_kafka_t *rk,
    rd_kafka_message_t **messages,
    size_t count,
    rd_kafka_share_ack_type_t type
);

// Commit acknowledgments (implicit or explicit mode)
rd_kafka_resp_err_t rd_kafka_share_commit(rd_kafka_t *rk);
rd_kafka_resp_err_t rd_kafka_share_commit_async(rd_kafka_t *rk);
```

### Message Metadata

```c
// Get delivery attempt count for message
int rd_kafka_message_delivery_attempt(const rd_kafka_message_t *message);
```

### Statistics Extensions

librdkafka statistics JSON must include share group data:

```json
{
  "sgrp": {
    "state": "stable",
    "stateage": 12345678,
    "member_id": "rdkafka-xxx",
    "topics": {
      "my-topic": {
        "partitions": {
          "0": {
            "spso": 1000,
            "speo": 1500,
            "in_flight": 50,
            "acquired": 25,
            "acknowledged": 975
          }
        }
      }
    }
  }
}
```

## FFI Binding Changes

### New FFI Functions

```ruby
module Rdkafka
  module Bindings
    extend FFI::Library

    # Acknowledgment types enum
    enum :share_ack_type, [
      :accept, 0,
      :release, 1,
      :reject, 2
    ]

    # Share group acknowledgment
    attach_function :rd_kafka_share_acknowledge,
      [:pointer, :pointer, :share_ack_type],
      :int

    # Batch acknowledgment
    attach_function :rd_kafka_share_acknowledge_batch,
      [:pointer, :pointer, :size_t, :share_ack_type],
      :int

    # Share commit
    attach_function :rd_kafka_share_commit,
      [:pointer],
      :int

    attach_function :rd_kafka_share_commit_async,
      [:pointer],
      :int

    # Delivery attempt accessor
    attach_function :rd_kafka_message_delivery_attempt,
      [:pointer],
      :int
  end
end
```

### New Constants

```ruby
module Rdkafka
  # Share group acknowledgment types
  module ShareAckType
    ACCEPT = :accept
    RELEASE = :release
    REJECT = :reject
  end

  # Share group states (for statistics parsing)
  module ShareGroupState
    EMPTY = 'empty'
    STABLE = 'stable'
    DEAD = 'dead'
  end
end
```

## API Design Options

### Option A: Separate ShareConsumer Class

Create a dedicated `Rdkafka::ShareConsumer` class:

```ruby
module Rdkafka
  class ShareConsumer
    def initialize(native_kafka, config)
      @native_kafka = native_kafka
      @config = config
    end

    def subscribe(topics)
      # Share group subscription
    end

    def poll(timeout_ms = 250)
      # Returns message with delivery_attempt
    end

    def each(timeout_ms: 250)
      loop do
        message = poll(timeout_ms)
        yield message if message
      end
    end

    def acknowledge(message, type = :accept)
      # ACCEPT, RELEASE, or REJECT
    end

    def acknowledge_batch(messages, type = :accept)
      # Batch acknowledgment
    end

    def commit
      # Commit pending acknowledgments (explicit mode)
    end

    def commit_async
      # Async commit
    end

    def close
      # Cleanup
    end

    # NOT available (raise helpful error):
    # - store_offset (no offset management)
    # - seek (no offset-based consumption)
    # - pause/resume on partitions (no exclusive ownership)
  end
end
```

**Config creation:**

```ruby
config = Rdkafka::Config.new(
  'bootstrap.servers': 'localhost:9092',
  'group.id': 'my-share-group',
  'group.type': 'share'  # New config option
)
share_consumer = config.share_consumer
```

### Option B: Extend Existing Consumer

Add share group methods to `Rdkafka::Consumer`:

```ruby
module Rdkafka
  class Consumer
    # Existing methods...

    # NEW: Share group methods
    def acknowledge(message, type = :accept)
      raise_unless_share_group!
      # ...
    end

    def share_group?
      @config['group.type'] == 'share'
    end

    private

    def raise_unless_share_group!
      raise Rdkafka::ShareGroupRequiredError unless share_group?
    end
  end
end
```

### Recommended Approach: Option A (Separate Class)

**Rationale:**

- **Clear separation**: Consumer groups and share groups have fundamentally different semantics
- **No method guards**: Methods only exist where they apply
- **Type safety**: Harder to accidentally call wrong methods
- **Follows librdkafka pattern**: Java has separate `KafkaConsumer` and `KafkaShareConsumer`
- **Easier testing**: Each class has focused responsibility

## New Methods

### ShareConsumer Methods

| Method | Description | Returns |
| ------ | ----------- | ------- |
| `subscribe(topics)` | Subscribe to topics as share group | `nil` |
| `poll(timeout_ms)` | Poll for single message | `Message` or `nil` |
| `each(timeout_ms:)` | Iterate over messages | yields `Message` |
| `acknowledge(message, type)` | Acknowledge single record | `nil` |
| `acknowledge_batch(messages, type)` | Acknowledge multiple records | `nil` |
| `commit` | Commit pending acknowledgments | `nil` |
| `commit_async` | Async commit | `nil` |
| `close` | Close consumer | `nil` |

### Message Extensions

```ruby
module Rdkafka
  class Message
    # NEW: Delivery attempt count (share groups)
    # Returns 1 for first delivery, increments on redelivery
    def delivery_attempt
      Bindings.rd_kafka_message_delivery_attempt(@native_message)
    end

    # NEW: Check if redelivered
    def redelivered?
      delivery_attempt > 1
    end
  end
end
```

## Statistics Exposure

### Share Group Statistics Structure

When librdkafka exposes share group statistics, rdkafka-ruby will parse them similarly to consumer group stats:

```ruby
# Statistics callback receives parsed JSON
config.consumer_statistics_callback = ->(stats) {
  if stats['sgrp']  # Share group stats
    sg = stats['sgrp']
    puts "Share group state: #{sg['state']}"
    puts "Member ID: #{sg['member_id']}"

    sg['topics'].each do |topic, topic_stats|
      topic_stats['partitions'].each do |partition_id, p_stats|
        puts "#{topic}[#{partition_id}]:"
        puts "  SPSO: #{p_stats['spso']}"
        puts "  SPEO: #{p_stats['speo']}"
        puts "  In-flight: #{p_stats['in_flight']}"
        puts "  Acquired: #{p_stats['acquired']}"
      end
    end
  end
}
```

### Statistics Schema Differences

| Metric | Consumer Group | Share Group |
| ------ | -------------- | ----------- |
| **Group state** | `cgrp.state` (up, etc.) | `sgrp.state` (empty/stable/dead) |
| **Join state** | `cgrp.join_state` | N/A (no client-side joining) |
| **Rebalance** | `cgrp.rebalance_*` | N/A (server-side assignment) |
| **Partition lag** | `cgrp.topics.*.partitions.*.lag` | N/A (different semantics) |
| **SPSO/SPEO** | N/A | `sgrp.topics.*.partitions.*.spso/speo` |
| **In-flight** | N/A | `sgrp.topics.*.partitions.*.in_flight` |
| **Acquired** | N/A | `sgrp.topics.*.partitions.*.acquired` |

## Error Handling

### New Error Codes

KIP-932 introduces new error codes that librdkafka will expose:

| Error Code | Description | Handling |
| ---------- | ----------- | -------- |
| `SHARE_SESSION_NOT_FOUND` | Share session expired/invalid | Re-establish session |
| `SHARE_PARTITION_NOT_FOUND` | Partition not available | Retry or resubscribe |
| `INVALID_SHARE_SESSION_EPOCH` | Stale session epoch | Re-poll to get new epoch |
| `FENCED_STATE_EPOCH` | State epoch mismatch | Internal retry |
| `INVALID_RECORD_STATE` | Invalid state transition | Check acknowledgment logic |

### Error Class Extensions

```ruby
module Rdkafka
  class RdkafkaError < StandardError
    # Existing error codes...

    # NEW: Share group error codes
    SHARE_SESSION_NOT_FOUND = -XXX
    SHARE_PARTITION_NOT_FOUND = -XXX
    INVALID_SHARE_SESSION_EPOCH = -XXX
    FENCED_STATE_EPOCH = -XXX
    INVALID_RECORD_STATE = -XXX

    def share_group_error?
      [
        SHARE_SESSION_NOT_FOUND,
        SHARE_PARTITION_NOT_FOUND,
        INVALID_SHARE_SESSION_EPOCH,
        FENCED_STATE_EPOCH,
        INVALID_RECORD_STATE
      ].include?(code)
    end
  end
end
```

## Configuration Options

### Share Group Specific Settings

These configuration options will be passed through to librdkafka:

| Config Key | Default | Description |
| ---------- | ------- | ----------- |
| `group.type` | `consumer` | Group type: `consumer` or `share` |
| `group.share.record.lock.duration.ms` | `30000` | Acquisition lock timeout |
| `group.share.heartbeat.interval.ms` | `3000` | Heartbeat frequency |
| `group.share.session.timeout.ms` | `45000` | Session timeout |
| `group.share.min.record.lock.duration.ms` | `15000` | Minimum lock duration |
| `group.share.max.record.lock.duration.ms` | `60000` | Maximum lock duration |

### Configuration Example

```ruby
config = Rdkafka::Config.new(
  'bootstrap.servers': 'localhost:9092',
  'group.id': 'my-share-group',
  'group.type': 'share',
  'group.share.record.lock.duration.ms': 30000,
  'group.share.heartbeat.interval.ms': 3000,
  'group.share.session.timeout.ms': 45000
)

share_consumer = config.share_consumer
```

### Acknowledgment Mode

KIP-932 defines two acknowledgment modes:

- **Implicit**: Records acknowledged via `poll()` or `commit()`
- **Explicit**: Per-record acknowledgment via `acknowledge()`

```ruby
# Implicit mode (auto-acknowledge on next poll)
config = Rdkafka::Config.new(
  # ...
  'share.acknowledgement.mode': 'implicit'
)

# Explicit mode (must call acknowledge)
config = Rdkafka::Config.new(
  # ...
  'share.acknowledgement.mode': 'explicit'
)
```

## Integration with Karafka

### Karafka Client Layer

Karafka's `Connection::Client` will wrap the new `ShareConsumer`:

```ruby
# lib/karafka/connection/client.rb
module Karafka
  module Connection
    class Client
      def initialize(subscription_group)
        @subscription_group = subscription_group

        if subscription_group.share_group?
          @kafka = build_share_consumer
        else
          @kafka = build_consumer
        end
      end

      # NEW: Share group acknowledgment
      def acknowledge(message, type = :accept)
        @kafka.acknowledge(message, type)
      end

      def share_group?
        @subscription_group.share_group?
      end

      private

      def build_share_consumer
        Rdkafka::Config.new(kafka_config).share_consumer
      end

      def build_consumer
        Rdkafka::Config.new(kafka_config).consumer
      end
    end
  end
end
```

### Message Delivery Attempt

Karafka's `Message` class will delegate to rdkafka-ruby:

```ruby
# lib/karafka/messages/message.rb
class Message
  def delivery_attempt
    # Delegates to rdkafka-ruby message
    @raw_message.delivery_attempt
  end

  def redelivered?
    delivery_attempt > 1
  end
end
```

### Statistics Flow

karafka-web consumes statistics from rdkafka-ruby's callback:

```text
librdkafka statistics (JSON)
    ↓
rdkafka-ruby callback (parsed Hash)
    ↓
Karafka instrumentation events
    ↓
karafka-web sampler/listeners
    ↓
Web UI display
```

Share group statistics will flow through the same pipeline, requiring karafka-web to handle the different `sgrp` structure (see KIP-932-Web-UI.md).

## Usage Example

```ruby
# Create share consumer
config = Rdkafka::Config.new(
  'bootstrap.servers': 'localhost:9092',
  'group.id': 'job-processors',
  'group.type': 'share',
  'share.acknowledgement.mode': 'explicit'
)

share_consumer = config.share_consumer
share_consumer.subscribe(['jobs'])

# Process messages
share_consumer.each do |message|
  puts "Processing job (attempt #{message.delivery_attempt})"

  begin
    process_job(message.payload)
    share_consumer.acknowledge(message, :accept)
  rescue TransientError
    # Release for immediate redelivery to any consumer
    share_consumer.acknowledge(message, :release)
  rescue PermanentError
    # Reject - won't be redelivered (archived after max attempts)
    share_consumer.acknowledge(message, :reject)
  end
end
```

## Open Questions

### librdkafka Design Dependencies

- Will librdkafka expose a separate `rd_kafka_share_consumer_*` API or extend existing consumer API?
- What will the statistics JSON structure look like for share groups?
- Will there be new callbacks for share group events (member joined, etc.)?
- How will librdkafka handle implicit vs explicit acknowledgment mode?

### rdkafka-ruby API Decisions

- Should `ShareConsumer` share a base class with `Consumer` for common functionality?
- How should batch acknowledgment handle partial failures?
- Should statistics parsing be unified or separate for consumer/share groups?

### Compatibility

- Minimum librdkafka version required for KIP-932?
- Kafka broker version requirements (4.0+)?
- Will there be feature detection for share group support?

## Timeline Dependencies

```text
1. librdkafka implements KIP-932 APIs
   ↓
2. rdkafka-ruby adds FFI bindings
   ↓
3. rdkafka-ruby adds ShareConsumer class
   ↓
4. Karafka adds share_group routing DSL
   ↓
5. karafka-web adds share group UI support
```

Each layer depends on the previous. Monitor librdkafka development for progress on KIP-932 implementation.
