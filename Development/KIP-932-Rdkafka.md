# KIP-932 for rdkafka-ruby

!!! warning "Work in Progress"

    This document is a work in progress used for development purposes. It is subject to constant changes as it tracks research and development work related to KIP-932. It should not be used for any assumptions about future APIs, features, or implementation details.

KIP-932 introduces **Share Groups**, a new consumption model for Kafka that enables queue-like semantics. Unlike traditional consumer groups where each partition is assigned to exactly one consumer, share groups allow multiple consumers to cooperatively consume from the same partitions without exclusive assignment.

This document analyzes the changes required in rdkafka-ruby to support KIP-932.

## Critical Dependency: librdkafka

rdkafka-ruby is an FFI wrapper around librdkafka. **All KIP-932 functionality depends on librdkafka implementing share group support first.**

| Component | Status | Notes |
| --------- | ------ | ----- |
| librdkafka KIP-932 | Not started | No public issues or PRs as of research date |
| rdkafka-ruby bindings | Blocked | Waiting for librdkafka implementation |

Once librdkafka implements KIP-932, rdkafka-ruby will need to expose the new APIs through FFI bindings.

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
- Internal topic: `__share_group_state`
- Offsets: SPSO (Share-Partition Start Offset), SPEO (Share-Partition End Offset)

## Current rdkafka-ruby Architecture

### Consumer Structure

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

For rdkafka-ruby to support KIP-932, librdkafka must expose APIs for:

- **Share group subscription** - Subscribe to topics as a share group
- **Acknowledgment** - ACCEPT, RELEASE, or REJECT individual records
- **Batch acknowledgment** - Acknowledge multiple records at once
- **Commit** - Commit pending acknowledgments (for explicit mode)
- **Delivery attempt** - Get the delivery attempt count for a message
- **Statistics** - Share group metrics in the statistics JSON

The exact API signatures will depend on librdkafka's implementation decisions.

## API Design: Extended Consumer Class

Following librdkafka's approach, rdkafka-ruby will extend the existing `Consumer` class rather than creating a separate class. The group type is determined by configuration.

### New Consumer Methods

```ruby
module Rdkafka
  class Consumer
    # Existing methods remain unchanged...

    # NEW: Share group acknowledgment
    # @param message [Message] The message to acknowledge
    # @param type [Symbol] :accept, :release, or :reject
    def acknowledge(message, type = :accept)
      # FFI call to librdkafka acknowledge function
    end

    # NEW: Batch acknowledgment
    # @param messages [Array<Message>] Messages to acknowledge
    # @param type [Symbol] :accept, :release, or :reject
    def acknowledge_batch(messages, type = :accept)
      # FFI call to librdkafka batch acknowledge function
    end

    # NEW: Check if this consumer is using a share group
    def share_group?
      # Check group.type config
    end
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

### Message Extensions

```ruby
module Rdkafka
  class Message
    # NEW: Delivery attempt count (share groups)
    # Returns 1 for first delivery, increments on redelivery
    def delivery_attempt
      # FFI call to get delivery attempt from native message
    end

    # NEW: Check if this is a redelivered message
    def redelivered?
      delivery_attempt > 1
    end
  end
end
```

### Method Availability

When using a share group consumer, certain methods don't apply:

| Method | Consumer Group | Share Group |
| ------ | -------------- | ----------- |
| `subscribe` | Yes | Yes |
| `poll` | Yes | Yes |
| `each` | Yes | Yes |
| `commit` | Yes | Yes (commits acknowledgments) |
| `acknowledge` | No | Yes |
| `acknowledge_batch` | No | Yes |
| `store_offset` | Yes | No (raises error) |
| `seek` | Yes | No (raises error) |
| `pause/resume` | Yes | No (raises error) |

Methods that don't apply to share groups will raise a descriptive error when called.

## Statistics Exposure

### Share Group Statistics Structure

When librdkafka exposes share group statistics, they will likely appear in a separate section (e.g., `sgrp`) from consumer group stats (`cgrp`):

```ruby
config.consumer_statistics_callback = ->(stats) {
  if stats['sgrp']  # Share group stats
    sg = stats['sgrp']
    puts "Share group state: #{sg['state']}"
    puts "Member ID: #{sg['member_id']}"

    sg['topics']&.each do |topic, topic_stats|
      topic_stats['partitions']&.each do |partition_id, p_stats|
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

    # NEW: Helper to check if error is share group related
    def share_group_error?
      # Check against share group error codes
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

consumer = config.consumer
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

## Usage Example

```ruby
# Create share group consumer
config = Rdkafka::Config.new(
  'bootstrap.servers': 'localhost:9092',
  'group.id': 'job-processors',
  'group.type': 'share',
  'share.acknowledgement.mode': 'explicit'
)

consumer = config.consumer
consumer.subscribe(['jobs'])

# Process messages
consumer.each do |message|
  puts "Processing job (attempt #{message.delivery_attempt})"

  begin
    process_job(message.payload)
    consumer.acknowledge(message, :accept)
  rescue TransientError
    # Release for immediate redelivery to any consumer
    consumer.acknowledge(message, :release)
  rescue PermanentError
    # Reject - won't be redelivered (archived after max attempts)
    consumer.acknowledge(message, :reject)
  end
end
```

## Open Questions

### librdkafka Design Dependencies

- What will the statistics JSON structure look like for share groups?
- Will there be new callbacks for share group events (member joined, etc.)?
- How will librdkafka handle implicit vs explicit acknowledgment mode?

### rdkafka-ruby API Decisions

- How should batch acknowledgment handle partial failures?
- Should statistics parsing be unified or separate for consumer/share groups?

### Compatibility

- Minimum librdkafka version required for KIP-932?
- Kafka broker version requirements (4.0+)?
- Will there be feature detection for share group support?
