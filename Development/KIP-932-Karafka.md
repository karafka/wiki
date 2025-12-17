# KIP-932 for Karafka

!!! warning "Work in Progress"

    This document is a work in progress used for development purposes. It is subject to constant changes as it tracks research and development work related to KIP-932. It should not be used for any assumptions about future APIs, features, or implementation details.

KIP-932 introduces **Share Groups**, a new consumption model for Kafka that enables queue-like semantics. Unlike traditional consumer groups where each partition is assigned to exactly one consumer, share groups allow multiple consumers to cooperatively consume from the same partitions without exclusive assignment.

This document analyzes the changes required in the Karafka framework to support KIP-932.

Supporting KIP-932 should require average changes to Karafka. Existing components can be extended:

| Component | Status |
| --------- | ------ |
| `SubscriptionGroup` | Likely unchanged (config flows through `kafka()` DSL) |
| `Listener` | Extend wait logic (wait for jobs empty AND backoff expired) |
| `Client` | Extend with `acknowledge` method |
| `BaseConsumer` | Extract methods to strategy modules: `ConsumerGroup` (`mark_as_consumed`, `seek`, `pause`, `attempt`) and `ShareGroup` (`accept`, `release`, `reject`, `pause`) |
| `Message` | Extend with `delivery_attempt` (works for both group types) |
| `ConsumerGroup` | Extract to `BaseGroup` parent class with `ConsumerGroup` and `ShareGroup` children |
| `RebalanceManager` | TBD (depends on callback design) |

## KIP-932 Overview

### What Are Share Groups?

Share groups represent a new consumption model where:

| Aspect | Consumer Groups (Current) | Share Groups (KIP-932) |
| ------ | ------------------------- | ---------------------- |
| **Partition Access** | Exclusive per consumer | Shared/cooperative |
| **Scaling** | Limited by partition count | Can exceed partition count |
| **Record Handling** | Offset-based | Individual acknowledgment |
| **Delivery Tracking** | Implicit via offsets | Explicit delivery counts |
| **Rebalancing** | Yes (with callbacks) | No (server-side assignment) |
| **Static Membership** | Supported | Not supported |

### Key Concepts

- **At-least-once delivery**: Records can be redelivered if not acknowledged
- **Per-record acknowledgment**: ACCEPT, RELEASE, or REJECT each record
- **Acquisition locks**: Records are locked for processing (default 30s)
- **Delivery attempt tracking**: Max 5 attempts by default, then archived
- **Server-side assignment**: No client-side partition assignment

### New Protocol & APIs

- `ShareFetch` / `ShareAcknowledge` RPCs
- `ShareGroupHeartbeat` for membership management
- `KafkaShareConsumer` client interface (Java)
- New internal topic: `__share_group_state`

## Current Karafka Architecture Relevant to KIP-932

### Client Layer (`lib/karafka/connection/client.rb`)

The current client wraps `Rdkafka::Consumer` and manages:

- Subscription/assignment (`subscribe()` / `assign()`)
- Message polling (`poll()`, `batch_poll()`)
- Offset storage and commits (`store_offset()`, `commit_offsets()`)
- Pause/resume operations
- Rebalance callback handling

**Impact**: Extend `Client` with `acknowledge` method. No new client class needed.

### Rebalance Manager (`lib/karafka/connection/rebalance_manager.rb`)

Tracks partition assignment changes via monitoring events:

- `on_rebalance_partitions_assigned`
- `on_rebalance_partitions_revoked`

Share groups don't have traditional rebalances. The rebalance manager concept doesn't apply - records can come from any partition at any time so the revocation and assignment events won't be needed.

### Subscription Group (`lib/karafka/routing/subscription_group.rb`)

Manages:

- `group.id` injection
- `group.instance.id` for static membership
- Topic subscriptions vs assignments

**Impact**: Likely unchanged. Static membership (`group.instance.id`) is already skipped if not configured - routing DSL simply won't set it for share groups. Config flows through existing `kafka()` DSL.

### Base Consumer (`lib/karafka/base_consumer.rb`)

Current lifecycle:

```text
on_initialized -> on_before_consume -> on_consume -> on_after_consume
                                                   -> on_revoked (partition lost)
                                                   -> on_shutdown
```

Current offset management:

- `mark_as_consumed(message)` - stores offset for later commit
- `mark_as_consumed!(message)` - stores and commits immediately
- Automatic offset tracking via `seek_offset`

**Impact**: Extract group-specific methods into strategy modules (`ConsumerGroup` and `ShareGroup`) injected via singleton class. Same `BaseConsumer` class, different methods available based on group type.

### Processing Coordinator (`lib/karafka/processing/coordinator.rb`)

Per-partition state tracking:

- Job counts
- Pause state
- Seek offset
- EOF state

**Impact**: Reuse existing `pause_tracker` for share group backoff. Same coordinator structure works for both group types.

## Required Changes

### Karafka Changes - Component Analysis

#### SubscriptionGroup - **LIKELY UNCHANGED**

The existing `SubscriptionGroup` should work as-is:

1. **`group.instance.id` skipping** - The existing `inject_group_instance_id` already checks if `group.instance.id` is configured. If the routing DSL simply doesn't set it for share groups, it's naturally skipped.

2. **Share-specific configs** - Passed through the existing `kafka()` DSL, which already works:

   ```ruby
   share_group :jobs do
     topic :tasks do
       kafka('max.poll.records': 500)  # Just use existing DSL
     end
   end
   ```

3. **`share_group?` flag** - Lives on `ConsumerGroup` level (set by routing builder), not `SubscriptionGroup`.

**No changes needed** - config flows through naturally.

#### ConsumerGroup → BaseGroup Hierarchy - **REFACTOR**

Introduce a class hierarchy to cleanly separate consumer group and share group functionality:

```text
BaseGroup (common: topics, kafka config, name, id generation)
├── ConsumerGroup (all features: MOM, VP, FTR, LRJ, DLQ, etc.)
└── ShareGroup (limited: basic processing, adapted DLQ, simplified VP)
```

**BaseGroup** extracts common pieces from current `ConsumerGroup`:

- Topic collection management
- Kafka configuration
- Subscription group handling
- Name/id generation

**ConsumerGroup** inherits from `BaseGroup`:

- Keeps all existing functionality
- Full feature set available (MOM, VP, FTR, LRJ, DLQ, etc.)

**ShareGroup** inherits from `BaseGroup`:

- Only compatible features available
- Incompatible options simply not exposed in DSL

**Routing API compatibility**: The `topic.consumer_group` accessor name stays unchanged for backwards compatibility. It returns either a `ConsumerGroup` or `ShareGroup` instance. A `type` field distinguishes them:

```ruby
topic.consumer_group          # returns ConsumerGroup or ShareGroup instance
topic.consumer_group.type     # => :consumer or :share
topic.consumer_group.share_group?    # => true/false
topic.consumer_group.consumer_group? # => true/false
```

This approach:

- Zero breaking changes to existing code using `topic.consumer_group`
- Clean separation of concerns
- Invalid configs rejected at setup time (DSL simply doesn't expose incompatible options)

#### Client - **EXTEND** (not new class)

Extend the existing `Client`:

```ruby
# lib/karafka/connection/client.rb (additions)
module Karafka
  module Connection
    class Client
      # Existing methods...

      # NEW: Share group acknowledgment
      def acknowledge(message, type = :accept)
        kafka.acknowledge(message, type)
      end

      # NEW: Check if this is a share group consumer
      def share_group?
        @subscription_group.share_group?
      end

      # Existing methods like store_offset, commit_offsets still exist
      # but are no-ops or raise errors for share groups
    end
  end
end
```

**Note**: Methods like `pause`, `seek`, `store_offset` may need guards to raise helpful errors when called on share group consumers (where they don't apply).

#### Listener - **REUSABLE AS-IS**

The `Listener` fetch loop structure is identical:

1. Poll messages
2. Build jobs
3. Schedule jobs
4. Wait for completion
5. Handle shutdown

Since `Client` is extended (not replaced), the `Listener` can be used as-is. The same `Client` instance handles both regular and share group consumers - the difference is in configuration and which methods are called.

#### RebalanceManager - **TBD**

Share groups use KIP-848 rebalancing protocol. Need to verify:

- Are there still partition assignment/revocation callbacks?
- If yes, existing RebalanceManager may work with minor changes
- If no callbacks, RebalanceManager is not needed for share groups

#### BaseConsumer - **SINGLETON INJECTION** (existing pattern)

Rather than adding methods with guards, inject the appropriate methods into the singleton class based on group type (same pattern Karafka uses for Pro features):

```ruby
# lib/karafka/processing/strategies/consumer_group.rb (extract from BaseConsumer)
module Karafka
  module Processing
    module Strategies
      module ConsumerGroup
        # Offset-based methods - only for regular consumer groups
        def mark_as_consumed(message, metadata = nil)
          # existing implementation
        end

        def mark_as_consumed!(message, metadata = nil)
          # existing implementation
        end

        def seek(offset, manual_seek = true, reset_offset: true)
          # existing implementation
        end

        def pause(offset, timeout = nil, manual_pause = true)
          # Pauses partition, seeks back to offset
          # existing implementation
        end

        def resume
          # existing implementation
        end

        # Consumer-level attempt counter (moved from BaseConsumer)
        # For share groups, use message.delivery_attempt instead
        def attempt
          coordinator.attempt
        end
      end
    end
  end
end

# lib/karafka/processing/strategies/share_group.rb (new module)
module Karafka
  module Processing
    module Strategies
      module ShareGroup
        # Acknowledgment-based methods - only for share groups

        def accept(message = nil)
          message ? client.acknowledge(message, :accept) : accept_all
        end

        def accept_all
          messages.each { |msg| client.acknowledge(msg, :accept) }
        end

        def release(message)
          # Explicit immediate release - message goes back to pool now
          client.acknowledge(message, :release)
        end

        def reject(message)
          client.acknowledge(message, :reject)
        end

        # Same API as ConsumerGroup, different behavior!
        def pause(offset_or_message, timeout = nil, manual_pause = true)
          # Does NOT pause partition (no exclusive ownership)
          # Instead:
          # 1. Signals backoff timeout to coordinator
          # 2. Message held (not released yet)
          # 3. Polling paused until: jobs done AND backoff expired
          # 4. After timeout: message released back to pool
          coordinator.pause_tracker.pause(timeout)
          coordinator.manual_pause if manual_pause
          coordinator.hold_for_release(offset_or_message, timeout)
        end

        def resume
          coordinator.pause_tracker.expire
        end
      end
    end
  end
end

# In strategy selector or executor, when building consumer:
if topic.share_group?
  consumer.singleton_class.include(Strategies::ShareGroup)
else
  consumer.singleton_class.include(Strategies::ConsumerGroup)
end
```

**`pause` API works for both group types - same interface, different behavior:**

| Aspect | Consumer Group | Share Group |
| ------ | -------------- | ----------- |
| Partition | Paused | No partition ownership - N/A |
| Offset | Seeks back to specified offset | N/A - message held for release |
| Polling | Paused until resume | Paused until: jobs done AND backoff expired |
| Message fate | Re-consumed from offset | Released back to pool after timeout |

**Reusing existing `TimeTrackers::Pause` infrastructure:**

The existing `pause_tracker` in `Coordinator` already has what we need:

```ruby
# TimeTrackers::Pause already provides:
pause_tracker.pause(timeout)  # Sets @ends_at = now + timeout
pause_tracker.expired?        # Returns monotonic_now >= @ends_at
pause_tracker.paused?         # Returns true if currently paused
```

**Share group `pause` implementation - just use the existing tracker:**

```ruby
# In ShareGroup strategy module
def pause(offset_or_message, timeout = nil, manual_pause = true)
  # Reuse existing pause_tracker - it already tracks timeout/expiry!
  coordinator.pause_tracker.pause(timeout)
  coordinator.manual_pause if manual_pause
  coordinator.hold_for_release(offset_or_message)
end
```

**With Virtual Partitions - each coordinator has its own pause_tracker:**

```ruby
# Each VP has its own coordinator with its own pause_tracker
# Listener checks all of them - waits for the longest one (last to expire)
```

**Listener wait logic extended for share groups:**

```ruby
# Current (consumer groups)
wait_until: -> { @jobs_queue.empty?(@subscription_group.id) }

# Extended for share groups - check all coordinators' pause_trackers
wait_until: -> {
  @jobs_queue.empty?(@subscription_group.id) &&
  (!share_group? || @coordinators.all? { |c| c.pause_tracker.expired? })
}
```

This naturally handles VPs - if VP1 pauses for 5s and VP2 pauses for 10s, the listener waits until all `pause_tracker.expired?` returns true (i.e., waits for the 10s one).

**Validation: backoff timeout must not exceed acquisition lock duration:**

```ruby
# In ShareGroup#pause
def pause(offset_or_message, timeout = nil, manual_pause = true)
  max_backoff = topic.share_record_lock_duration - topic.share_backoff_buffer
  # share_backoff_buffer defaults to 1 second (configurable)

  if timeout && timeout > max_backoff
    raise Errors::BackoffExceedsLockDuration,
      "Backoff #{timeout}ms exceeds max #{max_backoff}ms (lock: #{topic.share_record_lock_duration}ms, buffer: #{topic.share_backoff_buffer}ms)"
  end

  # ... rest of implementation
end
```

Configuration:

```ruby
share_group :jobs do
  topic :jobs do
    consumer JobsConsumer
    kafka('share.record.lock.duration.ms': 30_000)  # 30s lock
    share_backoff_buffer 1_000  # 1s buffer (configurable)
    # Max backoff = 30_000 - 1_000 = 29_000ms
  end
end
```

**Why `seek` doesn't apply to share groups:**

- No offset-based consumption - messages come from shared pool
- Use `release` for immediate redelivery, `pause` for delayed redelivery with backoff

This approach:

- **Same `pause` API** - familiar to existing users, works for retry/backoff in both group types
- Methods only exist where they apply (no runtime guards)
- Follows existing Karafka injection patterns
- Clean API - each group type gets exactly the methods it needs
- Symmetrical design: `ConsumerGroup` vs `ShareGroup` strategies
- Same lifecycle hooks (`consume`, `revoked`, etc.) work for both

#### Message - **EXTEND**

```ruby
# lib/karafka/messages/message.rb (additions)
class Message
  # Available for BOTH consumer groups and share groups
  # - Share groups: per-message value from Kafka
  # - Consumer groups: same value for all messages in batch (from coordinator.attempt)
  def delivery_attempt
    # For share groups: comes from Kafka metadata
    # For consumer groups: injected from coordinator.attempt
    metadata[:delivery_attempt] || 1
  end

  def redelivered?
    delivery_attempt > 1
  end
end
```

**Note**: For consumer groups, `delivery_attempt` will be the same for all messages in the batch (comes from coordinator's retry counter). For share groups, each message can have a different value (tracked per-message by Kafka).

### Routing DSL Changes

```ruby
# Current routing (consumer groups) - unchanged
Karafka::App.routes.draw do
  consumer_group :events do
    topic :orders do
      consumer OrdersConsumer
    end
  end
end

# Proposed routing for share groups - minimal new DSL
Karafka::App.routes.draw do
  share_group :queue_processing do  # New DSL method (similar to consumer_group)
    topic :jobs do
      consumer JobsConsumer  # Same BaseConsumer, uses accept/release/reject methods

      # Share group specific settings
      kafka(
        'max.poll.records': 500
        # Other share-specific configs
      )
    end
  end
end
```

**DSL Implementation**: The `share_group` method would be nearly identical to `consumer_group`, just setting a flag that marks the group as a share group.

### Configuration Changes

```ruby
# config.rb additions
class Karafka::Setup::Config
  setting :share_groups do
    # Default share group settings
    setting :acknowledgement_mode, default: 'explicit'
    setting :record_lock_duration_ms, default: 30_000
    setting :delivery_attempt_limit, default: 5
    setting :auto_offset_reset, default: 'latest'
    setting :heartbeat_interval_ms, default: 3_000
    setting :session_timeout_ms, default: 45_000
  end
end
```

### Pro Features Integration - Key Differences

#### Strategy Compatibility Analysis

Many Karafka Pro strategies are **fundamentally incompatible** with share groups due to their reliance on offset-based operations:

| Strategy | Compatible | Reason |
| -------- | ---------- | ------ |
| **Default** | Yes | Replace `mark_as_consumed` with `accept` |
| **DLQ** | Adapt | Use `delivery_attempt` + `reject` instead of offset skipping |
| **MOM** | **No** | No offset management in share groups - entire concept doesn't apply |
| **VP** | Partial | Distribution/parallelism works, but `virtual_offset_manager` not needed - per-message acks instead |
| **FTR** | **No** | Relies on `seek` to skip/filter messages - no seek in share groups |
| **LRJ** | **No** | Relies on partition pause/resume with long timeout - acquisition lock (30s default) prevents this |
| **AJ** | Partial | ActiveJob alone works, but not combined with MOM, FTR, LRJ |

**Why these are incompatible:**

1. **MOM (Manual Offset Management)**: Share groups have no concept of offsets to manage. You can only accept/release/reject individual records.

2. **FTR (Filtering/Throttling)**: Filtering uses `seek` to skip messages and move the cursor position. Share groups don't have seek - you must explicitly acknowledge each record.

3. **LRJ (Long Running Jobs)**: LRJ pauses the partition for extended periods (`MAX_PAUSE_TIME = 31 years`) while processing, then resumes. Share groups have an acquisition lock (default 30s) - if processing exceeds this, the message is redelivered to another consumer.

**Why VP is partially compatible:**

VP's message distribution and parallelization still works - you can split a batch across multiple threads using a partitioner. The only part that doesn't apply is `virtual_offset_manager` for offset coordination. Instead, each VP thread calls `accept(message)` individually.

**ShareGroup routing DSL** simply won't expose incompatible options:

```ruby
# ConsumerGroup - full options available
consumer_group :events do
  topic :orders do
    consumer OrdersConsumer
    manual_offset_management true  # available
    virtual_partitions(...)        # available
    long_running_job true          # available
    filter(...)                    # available
    dead_letter_queue(...)         # available
  end
end

# ShareGroup - only compatible options
share_group :jobs do
  topic :tasks do
    consumer TasksConsumer
    dead_letter_queue(...)         # available (adapted version)
    virtual_partitions(...)        # available (simplified - no offset coordination)
    # manual_offset_management     # NOT available - no such DSL method
    # long_running_job             # NOT available
    # filter                       # NOT available
  end
end
```

#### Retry & Failure Semantics

Share groups have fundamentally different retry/failure semantics than consumer groups:

| Concept | Consumer Groups | Share Groups |
| ------- | --------------- | ------------ |
| **Retry mechanism** | Pause + seek back to offset | `release` → message returns to pool |
| **Backoff** | Pause duration (exponential) | No native backoff - lock timeout only |
| **Retry tracking** | `attempt` counter in coordinator | `delivery_attempt` on message |
| **Max retries** | Configurable in Karafka | `delivery_attempt_limit` on broker (default: 5) |
| **After max retries** | DLQ dispatch | Message "archived" by broker |

#### Retries & Backoff

**Problem**: Share groups have no native backoff mechanism. When you `release` a message, it's immediately available for redelivery.

**Solution**: Reuse the `#pause` API with different behavior under the hood:

| Group Type     | `pause(timeout)` behavior                                  |
| -------------- | ---------------------------------------------------------- |
| Consumer Group | Pause partition + seek back to offset                      |
| Share Group    | Signal backoff timeout + hold messages for delayed release |

**Implementation approach:**

1. Consumer calls `pause(timeout)` after retryable error
2. Executor records backoff timeout
3. Listener wait logic extended:

   ```ruby
   wait_until: -> {
     @jobs_queue.empty?(@subscription_group.id) &&
     @executors.backoff_expired?  # NEW: also wait for backoff timeouts
   }
   ```

4. Jobs finish, but polling waits for backoff to expire
5. After timeout: release held messages, resume polling

**Same API, different behavior:**

```ruby
# Works for both consumer groups and share groups!
def consume
  messages.each do |message|
    begin
      process(message)
      accept(message)  # share group only (injected)
    rescue RetryableError
      # Consumer group: pauses partition, seeks back
      # Share group: signals backoff, holds message for delayed release
      pause(message.offset, backoff_timeout)
    rescue PermanentError
      reject(message)  # share group only (injected)
    end
  end
end
```

This works because:

- Acquisition lock duration gives us time for backoff (default 30s)
- Polling thread waits for both: jobs empty AND backoff expired
- Other messages in batch can still be processed during backoff
- Message stays locked to us during backoff (not redelivered elsewhere)

**Key constraint**: Backoff duration must be less than acquisition lock duration, otherwise the lock expires and message gets redelivered to another consumer mid-backoff.

#### Dead Letter Queue (DLQ)

Share groups have built-in "archiving" after max delivery attempts. DLQ integration captures messages on `reject` (explicit failure):

```ruby
def consume
  messages.each do |message|
    begin
      process(message)
      accept(message)
    rescue PermanentError => e
      # DLQ dispatch before reject
      dispatch_to_dlq(message, e)
      reject(message)
    end
  end
end
```

This approach dispatches to DLQ when the application explicitly rejects a message due to a permanent/non-retryable error.

#### Virtual Partitions - **PARTIALLY COMPATIBLE**

VPs can work with share groups, but with simplified mechanics:

**What works:**

- Message distribution via partitioner (round-robin, key-based, etc.)
- Parallel processing across multiple threads/workers
- Per-message acknowledgment (`accept`/`release`/`reject` per VP thread)

**What doesn't apply:**

- `virtual_offset_manager` - no offset coordination needed
- Collapsed mode - no offset-based recovery mechanism
- The "scaling beyond partition count" benefit - share groups already solve this natively

**Simplified VP for share groups:**

```ruby
share_group :jobs do
  topic :tasks do
    consumer TasksConsumer
    virtual_partitions(
      partitioner: :round_robin,  # Simple distribution for parallelism
      max_partitions: 5
    )
  end
end
```

Each VP thread processes its subset of messages and calls `accept(message)` individually - no collective offset coordination needed.

#### Long-Running Jobs (LRJ) - **NOT COMPATIBLE**

LRJ is **not compatible** with share groups because:

1. LRJ pauses the partition for extended periods (`MAX_PAUSE_TIME = ~31 years`) while processing
2. Share groups have acquisition locks (default 30s) - if processing exceeds this, the message is redelivered to another consumer
3. There's no partition to "pause" in share groups - messages come from a shared pool

**Workaround for longer processing**: Increase the acquisition lock duration via broker config, but this has trade-offs:

```ruby
share_group :jobs do
  topic :tasks do
    consumer TasksConsumer
    kafka(
      'share.record.lock.duration.ms': 300_000  # 5 minutes
    )
  end
end
```

**Caveats**:

- If job exceeds lock duration, message is redelivered to another consumer (duplicate processing)
- Long lock durations reduce share group efficiency (messages locked longer)
- May need application-level deduplication for safety
- This is a Kafka-level setting, not the same as Karafka's LRJ feature

## Breaking Changes & Migration

### No Breaking Changes to Existing Code

Share groups can be implemented as an **additive feature**:

- Existing `consumer_group` routing continues to work unchanged
- New `share_group` routing for share group consumers
- Same `BaseConsumer` class with different methods injected via strategy modules

### Conceptual Differences Users Must Understand

| Concept | Consumer Group | Share Group |
| ------- | -------------- | ----------- |
| Scaling model | Add partitions, then consumers | Add consumers directly |
| Ordering | Per-partition ordering guaranteed | No ordering guarantees |
| Offset management | Framework handles automatically | Must acknowledge each record |
| Reprocessing | Seek to offset | Record automatically redelivered |
| Failure handling | Pause + retry from offset | Release for redelivery |
| Exactly-once | Possible with transactions | Not supported (at-least-once only) |

## Risks & Considerations

### Behavioral Differences

Share groups have fundamentally different semantics:

- No ordering guarantees (even within a partition in the share group context)
- At-least-once only (no exactly-once)
- Different failure handling model

Users must understand these differences when choosing between consumer groups and share groups.

## Appendix A: Share Group Consumer Example

```ruby
# app/consumers/jobs_consumer.rb
# Note: Same BaseConsumer class, just uses share group methods
class JobsConsumer < Karafka::BaseConsumer
  def consume
    messages.each do |message|
      # Check if this is a redelivery
      if message.redelivered?
        Karafka.logger.info("Processing redelivered message, attempt #{message.delivery_attempt}")
      end

      begin
        process_job(message.payload)
        accept(message)  # Acknowledge successful processing
      rescue TransientError => e
        # Will be redelivered to any consumer in the share group
        release(message)
        Karafka.logger.warn("Releasing job for retry: #{e.message}")
      rescue PermanentError => e
        # Won't be redelivered after max attempts (goes to archive)
        reject(message)
        Karafka.logger.error("Rejecting job: #{e.message}")
      end
    end
  end

  private

  def process_job(payload)
    # Job processing logic
  end
end

# routes.rb
Karafka::App.routes.draw do
  share_group :job_processing do
    topic :jobs do
      consumer JobsConsumer
    end
  end
end
```

## Appendix B: Comparison with Current Virtual Partitions

| Feature | Virtual Partitions (Current Pro) | Share Groups (KIP-932) |
| ------- | -------------------------------- | ---------------------- |
| Scaling beyond partitions | Yes (client-side) | Yes (server-side) |
| Ordering | Configurable via partitioner | None guaranteed |
| Offset management | Standard Kafka offsets | Per-record acknowledgment |
| Redelivery | Manual (seek) | Automatic on release/timeout |
| Broker support needed | No | Yes (Kafka 4.0+) |
| Additional network overhead | No | Yes (acknowledgments) |
| Use case | High-throughput parallel processing | Job queues, task distribution |

Virtual Partitions and Share Groups serve similar but distinct use cases. Virtual Partitions are ideal for high-throughput scenarios where you want parallel processing with eventual ordering, while Share Groups are better suited for job queue patterns where any worker should be able to pick up any job.

**Note**: VPs can be combined with Share Groups for intra-batch parallelism. While share groups solve the "scaling beyond partitions" problem natively (making that VP benefit redundant), VP's message distribution across threads is still useful for parallel processing within a polled batch. The `virtual_offset_manager` is not used - instead, each VP thread calls `accept(message)` individually.
