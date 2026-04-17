# KIP-932 for Karafka

!!! warning "Work in Progress"

    This document is a work in progress used for development purposes. It is subject to constant changes as it tracks research and development work related to KIP-932. It should not be used for any assumptions about future APIs, features, or implementation details.

This document captures the design decisions, architectural choices, naming conventions, and the implementation plan for adding Kafka share group (KIP-932) support to Karafka. Share groups are a cooperative consumption model for queue-like workloads, shipping as GA in Apache Kafka 4.2.

**Key constraint:** librdkafka share consumer APIs are not yet available at the time of planning. The design targets a fake-broker-first approach so that Karafka-layer work can proceed independently of librdkafka timelines.

## Fundamental Differences Between Consumer Groups and Share Groups

### Consumer Groups (Current Karafka Model)

- Exclusive partition ownership: one partition to one consumer
- Offsets as a monotonic watermark per partition
- Parallelism capped by partition count
- Ordered processing within a partition
- Batch-oriented: poll returns all records from assigned partitions, application acks via offset commit
- Head-of-line blocking: one slow message stalls the partition

### Share Groups (KIP-932)

- No partition ownership; broker hands out individual records via time-bounded acquisition leases
- Lock duration defaults to 30s (`group.share.record.lock.duration.ms`)
- Consumers can exceed partition count
- No ordering guarantees across records
- Per-record acknowledgment: ACCEPT, RELEASE, REJECT, RENEW
- Broker tracks delivery counts; archives records after configurable max deliveries (default 5)
- No seek, no offset manipulation from the client
- Membership coordinated via KIP-848 protocol
- Consumer and share groups share the same broker namespace; names must not collide

### Semantic Consequences for Karafka

- **No partition affinity:** records with the same key may land on different consumers
- **No batch boundary:** records can be in-flight across polls
- **No partition pause:** there's no per-partition anything on the client side
- **Lock clock starts at fetch time, not poll time:** prefetched records can expire while buffered
- **Virtual partitions have no equivalent:** ordering-per-key can't be reconstructed without partition affinity

## Core Architectural Decisions

### Polling Model: Tight Loop, Not Aggressive Prefetch

The architecture follows Spring Kafka's approach: **don't fetch more than you can immediately process.** The loop is:

```text
loop:
  wait for free worker slot
  poll(timeout)
  hand records to worker(s)
  worker processes and acks directly
  (loop; next poll happens when another slot frees)
```

This sidesteps the prefetch-expiry problem (records acquired by the broker but sitting in local buffers until their lock expires) by never asking for records the application isn't ready to process.

### Scaling: Horizontal via Concurrency, Not Vertical via Batching

Throughput scales by running more share consumer instances, not by making each consumer process more records at once. Three tuning dimensions:

1. **`concurrency` per share group** — number of share consumer instances (threads) in one process
2. **`max_messages_per_job` per topic** — records per poll/processing unit
3. **Number of processes deployed** — horizontal scaling at the process level

This matches what KIP-932 was designed around: elastic scaling by adding consumers without over-partitioning.

### Threading: Thread Per Consumer Instance

Each share consumer instance owns its thread for the lifetime of the subscription group. librdkafka consumer instances have state that's expensive to set up and tear down; long-lived threads with dedicated consumers is the simplest and cheapest mapping.

- N threads = N `KafkaShareConsumer` instances
- Ruby's GIL is not a concern since work is I/O-bound
- Shared process resources (DB pools, logging, instrumentation) across threads

### librdkafka Is Thread-Safe

Unlike Java's `KafkaShareConsumer`, librdkafka is thread-safe per consumer, so workers can ack directly without a single-writer dispatch funnel. Acks also batch internally within librdkafka.

### Subscription Groups Stay Mode-Homogeneous

A subscription group cannot mix consumer-group and share-group topics (protocols differ; one librdkafka consumer can't subscribe as both kinds simultaneously). Auto-split mixed declarations at routing construction time with a warning.

### One Share Consumer Per Topic by Default

Cleaner backpressure, per-topic tuning, clearer ownership. Multi-topic share consumers are possible (Kafka allows it) but not the default.

### Isolated JobsQueue Per Mode

For share groups under the tight-loop model, a separate JobsQueue between poller and workers is not needed. Each share consumer thread is self-contained: poll, process, ack.

If a worker pool exists per consumer (for `workers_per_consumer > 1`), it's scoped to that consumer, not shared across modes.

## Consumer Instance Lifecycle

### Under Share Groups

- Consumer instance bound to **topic**, not partition
- Long-lived per topic across jobs
- No partition/offset identity on the consumer itself
- No `#partition`, `#offset`, `#coordinator` methods in the public API
- State that persisted across calls within a partition assignment now persists across calls within a topic assignment (roughly the lifetime of the process)

### Lifecycle Hooks

- **`#shutdown`** — retained, universal lifecycle hook when consumer is being torn down
- **`#revoked`** — consumer-group only, has no meaning under share groups
- **`#lock_expired(message)`** — new hook specific to share groups, called when a record's lock expires without being acked (optional; for cleanup of partial work)

### Messages and Partitions

- Batches under share groups may span multiple partitions
- Per-message access (`m.partition`, `m.offset`) remains available and reliable
- Batch-level partition aggregates are not meaningful by default (only under grouping JobsBuilders that enforce single-partition batches)

## Polling and Processing Model

### The Simple "Poll When Free" Loop

```ruby
loop do
  worker = pool.wait_for_free_slot
  records = consumer.poll(timeout)
  worker.assign(records)
  # Worker processes and acks; loop continues when worker frees
end
```

The worker pool size *is* the backpressure mechanism. When all workers are busy, the poller blocks. No separate capacity counter, no JobsQueue, no dispatch layer.

### Worker Pool Per Consumer

Default: `workers_per_consumer: 1` (pure tight loop — consumer thread does the processing itself).

For advanced cases (highly variable processing times, finer parallelism): `workers_per_consumer: N` spawns a small pool per consumer.

### librdkafka Prefetch Tuning

Less critical under the tight-loop model because prefetch stays naturally small, but still worth conservative defaults:

- `queued.min.messages` / equivalent should be sized to `workers * max_messages_per_job * small_factor`
- Not the streaming-workload defaults
- Surfaced as a Karafka-level config with sane defaults for job-queue workloads

### What Happens to Records on Process Crash

Broker's lock expiry (30s default) redelivers them to another consumer. No custom handling needed; this is the fail-safe built into share groups.

### Shutdown Path

- Stop polling
- Wait for in-flight workers to complete (or timeout)
- Ack any outstanding records (ACCEPT if completed, RELEASE if not)
- Close consumer

## Backoff, Retries, and Error Handling

### Four Patterns for Different Retry Semantics

| Goal | Pattern |
| --- | --- |
| Retry with broker-decided timing | Plain RELEASE |
| Retry with precise delay, stays on this worker | RENEW + in-worker sleep + retry |
| Retry with precise delay, goes back to group | RENEW + delay structure + RELEASE |
| Retry with long delay (> lock ceiling) | RELEASE + delay topic |

### Delivery Count Semantics

- Broker increments delivery count on each acquisition
- RELEASE sends record back to broker, delivery count increments on next acquisition
- After `group.share.delivery.count.limit` (default 5), broker archives the record
- In-worker retry (RENEW without RELEASE) does not increment delivery count
- RENEW-then-RELEASE increments exactly once per cycle

### Delay Structure Design

A priority queue for delayed RELEASEs. Workers hand records with a deadline to a dedicated delay manager thread, which:

- Maintains records indexed by `min(next_renewal_deadline, release_deadline)`
- Issues RENEW before locks expire to keep records alive during backoff
- Issues RELEASE at the specified deadline
- Has bounded size; falls back to immediate RELEASE if full
- Drains via immediate RELEASE on shutdown (no persistence across restarts)
- Exceeding broker's lock-duration ceiling raises a clear error at config time

### Lock Renewal for Long-Running Jobs

- User calls `extend_lock!(message)` manually, or
- Framework auto-renews based on heuristics (opt-in)
- Renewal happens at a configurable fraction of lock duration (default ~70%)
- Replaces the partition-pause-based LRJ pattern from consumer groups

### DLQ

- Initial implementation: client-side (REJECT + produce to DLQ topic)
- Future: broker-native DLQ when Kafka ships it
- Uses broker's delivery count as the retry limit signal
- Same DSL method name (`dead_letter_queue`) as consumer groups, different implementation internally

## Batching and JobsBuilder

### The Problem

A single poll may return records from multiple partitions. Users may want different grouping strategies for how those records get dispatched to processing units.

### JobsBuilder Concept

A first-class object per topic that decides how to split a poll result into jobs:

| Builder | Behavior |
| --- | --- |
| `PerMessage` (default) | N records, N jobs, one per record |
| `PerBatch` | N records, 1 job (or chunked by `max_messages_per_job`) |
| `PerPartition` | Records grouped by partition within the poll |
| `PerKey` | Records grouped by message key |
| `Custom` | User-supplied lambda or subclass |

### Configuration

```ruby
share_group "x" do
  topic :events do
    consumer EventConsumer
    jobs_builder :per_message             # default
    max_messages_per_job 1
  end

  topic :bulk do
    consumer BulkConsumer
    jobs_builder :per_batch
    max_messages_per_job 100
  end

  topic :keyed do
    consumer KeyedConsumer
    jobs_builder :per_key
    max_messages_per_job 50
  end
end
```

### Separation of Concerns

- `jobs_builder` = grouping strategy
- `max_messages_per_job` = size cap where applicable
- Framework derives `max.poll.records` automatically from these

### Consumer API Under Different Builders

- PerMessage: `messages.size == 1`
- PerBatch: cross-partition, cross-key
- PerPartition: single partition (`messages.first.partition` is consistent)
- PerKey: single key (`messages.first.key` is consistent)
- Custom: whatever the user returned

Users who opt into partition/key-scoped builders regain partition or key locality within a batch (but not across batches).

### CG Doesn't Need JobsBuilders (for Now)

This is a share-group concept. CG's virtual partitions are effectively a per-key builder implemented as a special case. Potential future unification, not today.

## Priority Handling

### Poll Frequency as the Priority Knob

Under the tight-loop model, priority is expressed by how often a share group polls:

```ruby
share_group "critical" do
  concurrency 20
  poll_interval 0             # poll as fast as possible
end

share_group "background" do
  concurrency 2
  poll_interval 500           # 500ms sleep between polls
end
```

Higher-priority share groups ask for records more often; lower-priority ones sleep between polls. The broker distributes records to whoever's asking. Priority emerges naturally from polling behavior.

### Why This Works

- No central scheduler needed
- No cross-group coordination
- No shared priority queue
- Composes with `concurrency` for multi-dimensional tuning
- Runtime-tunable (just change the sleep duration)

### Caveats

- Priority is per-process local resource allocation, not distributed coordination
- Extreme ratios can cause starvation of low-priority groups; document this
- Different share groups subscribed to the same topic don't compete with each other at the broker level; the broker distributes to each group independently

### Convenience Abstraction

`priority :high | :normal | :low | :background` maps to sensible default poll intervals.

## Pauses and Flow Control

### What Goes Away

- **Per-partition pause:** no equivalent; no per-partition anything exists under share groups
- **Seek:** no offsets to seek to
- **Long-running job via partition pause:** replaced by RENEW

### What Replaces Each Use Case

| Use case | Consumer group | Share group |
| --- | --- | --- |
| Backpressure | Pause partitions when saturated | Don't poll when workers are busy (tight loop handles this) |
| Retry with backoff | Pause + seek | RELEASE, or delay structure |
| Long-running job | Pause partition for heartbeats | RENEW the lease |
| Manual pause | `consumer.pause` | Stop polling (consumer-wide) |
| Throttling | Per-partition throttling | `poll_interval` on the share group |

### No Per-Partition Pause, No Per-Record Pause

The closest analog to "pause this" is:

- "Don't ack, let lock expire" — record goes to another consumer
- "Stop polling for a while" — consumer-wide

Document the "not supported" list clearly so users don't try to port partition-pause patterns.

## Feature Matrix by Mode

| Feature | Consumer Group | Share Group | Notes |
| --- | --- | --- | --- |
| `consumer` | Yes | Yes | shared |
| `deserializers` | Yes | Yes | shared |
| `kafka` (librdkafka opts) | Yes | Yes | some keys are mode-specific |
| `manual_offset_management` | Yes | No | CG concept |
| `explicit_acknowledgment` | No | Yes | SG concept |
| `virtual_partitions` | Yes | No | No partition affinity in SG |
| `long_running_job` | Yes | Yes | Different mechanism (pause vs RENEW) |
| `dead_letter_queue` | Yes | Yes | Same name, different semantics |
| `delayed_release` | No | Yes | SG only |
| `lock_extension` / auto-renew | No | Yes | SG only |
| `throttling` | Yes (per-partition) | Yes (consumer-wide) | Different scope |
| `filtering` | Yes | Yes | Shared |
| `pause` (API) | Yes | No | No per-partition pause in SG |
| `max_messages` | Yes | Yes | Shared concept |
| `max_wait_time` | Yes | Yes | Shared |
| `jobs_builder` | No | Yes | SG only |
| `poll_interval` | No | Yes | SG only (priority knob) |
| Offset-related (seek, offset metadata) | Yes | No | No offsets in SG |

## Naming Conventions

### Rules

1. **Namespaces are always plural** (with rare pragmatic exceptions for readability)
2. **Classes/modules inside are named for what they are** (singular)
3. **Full mode names in class names:** `ConsumerGroup`, `ShareGroup` — not abbreviations
4. **Kafka's own terminology preferred** over domain-framed names (no `JobConsumer`, `QueueConsumer`)
5. **Symmetric names across the stack** where possible
6. **Back-compat aliases at flat top level** for user-facing references
7. **`group_type` / `share_group?` / `consumer_group?`** as canonical mode-check API

### Handling Asymmetry

Kafka's own naming is asymmetric: `KafkaConsumer` vs `KafkaShareConsumer`, `consumer group` vs `share group`. Karafka follows this for user-facing classes but is symmetric internally where possible.

## Namespace Layout

```text
Karafka::
  BaseConsumer                                   # historical alias (CG-capable)
  ConsumerGroupConsumer                          # canonical CG consumer (alias of BaseConsumer)
  ShareGroupConsumer                             # canonical SG consumer

  Consumers::                                    # plural namespace
    Base
    ConsumerGroup                                # aliased to ConsumerGroupConsumer
    ShareGroup                                   # aliased to ShareGroupConsumer

  Messages::
    Message                                      # unchanged
    Messages                                     # unchanged, already mode-agnostic
    BatchMetadata::                              # namespace (plural rule relaxed for readability)
      LagMetrics                                 # shared module for consumption_lag / processing_lag
      ConsumerGroup                              # Struct with partition, first_offset, last_offset
      ShareGroup                                 # Struct without partition/offset aggregates

  Routing::
    Groups::                                     # Kafka-level group types (plural)
      Base
      ConsumerGroup
      ShareGroup
    SubscriptionGroup                            # peer to Groups, single mode-agnostic class
    Topics::                                     # plural
      Base
      ConsumerGroup
      ShareGroup
    Features::                                   # plural
      Filtering                                  # shared feature directly under Features
      ConsumerGroups::                           # CG-only features
        VirtualPartitions
        LongRunningJob
        DeadLetterQueue
        ManualOffsetManagement
        Pause
        Seek
        Throttling
      ShareGroups::                              # SG-only features
        Acknowledgment
        DelayedRelease
        LockExtension
        DeadLetterQueue
        Throttling
        JobsBuilder
        PollInterval

  Processing::
    ConsumerGroups::                             # CG processing internals
      Strategies::
      Coordinators::
      Pauses::
      OffsetManagement::
    ShareGroups::                                # SG processing internals
      Strategies::
      Coordinators::
      Leases::
      Acks::
      Backoff::                                  # delay structure
      JobsBuilders::
        Base
        PerMessage
        PerBatch
        PerPartition
        PerKey
        Custom
    JobsQueue                                    # shared class; instances per mode if used

  Connection::
    Listeners::                                  # plural
      Base
      ConsumerGroup
      ShareGroup
```

### Key Nesting Decisions

- `Groups::` holds Kafka-level group types (CG and SG are kinds of Kafka groups)
- `SubscriptionGroup` is a peer to `Groups::`, not inside it — it's a Karafka runtime construct, not a Kafka concept
- `Topics::` is its own namespace (topics belong to groups via composition, not nesting)
- `Features::` contains shared features directly, plus mode-specific sub-namespaces
- `BatchMetadata` relaxes the plural rule because "BatchMetadatas" reads worse than the inconsistency costs

## Component Inventory

### Existing Components Moving Under `ConsumerGroups::` Namespace

- Strategies (the 5-flag matrix)
- DLQ (CG flavor)
- Retries / backoff execution
- Pause manager
- Offset management / offset store / OffsetMetadata
- Per-partition coordinators
- Seek-related logic
- Manual offset management feature
- Virtual partitions feature
- Long-running jobs (CG implementation)
- Throttling (CG per-partition flavor)

### Existing Components That Stay Shared (Mechanism, Not Policy)

- JobsQueue class (if retained for SG at all; may not be needed)
- Worker pool class (for CG; SG uses per-consumer pools if any)
- Scheduler class (for CG)
- `Messages` collection class (already mode-agnostic — no changes needed)
- `Message` value object (already has per-message partition/offset, universal)
- Instrumentation bus / monitor / event bus
- Routing DSL framework
- Configuration framework (shared mechanism, per-mode schemas)
- CLI / server bootstrap / process management
- Error class hierarchy root
- Testing framework base
- Admin API framework (extended with SG operations)
- `SubscriptionGroup` (single mode-agnostic class)

### Components Needing Structural Split

- **`BatchMetadata`** — `BatchMetadata::ConsumerGroup` (with partition/offsets) and `BatchMetadata::ShareGroup` (without), sharing `LagMetrics` module
- **Topic class** — three-layer hierarchy (`Topics::Base` / `ConsumerGroup` / `ShareGroup`)
- **Consumer base class** — three-layer hierarchy with historical `BaseConsumer` preserved
- **Listener** — mode-specific subclasses under `Connection::Listeners::`

### Components Needing Refactor (Not Full Split)

- **Assignment tracker** — split into:
    - Shared `SubscriptionTracker` (topic-level subscription info)
    - CG-only partition-assignment tracker (stays under ConsumerGroups)
    - New `LeaseTracker` for SG (record-level state)

### New Components for Share Groups

- **`LeaseTracker`** — record-indexed state of currently-held leases, populated by poll/ack/renew
- **`RenewScheduler`** — watches LeaseTracker for records approaching lock expiry
- **`DelayedReleaseStructure`** — priority queue for delayed RELEASEs with RENEW keepalive
- **`PoisonRecordObserver`** — handles broker-archived records, produces to DLQ if configured
- **In-memory fake share-consumer** — for Phase 1 development and ongoing testing
- **Share-group strategies matrix** — SG version of CG's 5-flag matrix, simpler
- **Share-group DLQ implementation** — client-side REJECT + produce (broker-native later)
- **JobsBuilders hierarchy** — PerMessage, PerBatch, PerPartition, PerKey, Custom

### Components Explicitly NOT Needed

Thanks to the tight-loop model:

- Complex capacity-gated polling logic with explicit counters
- Application-layer record buffer with deadline tracking
- Proactive RELEASE logic for about-to-expire buffered records
- Subscription-level backpressure manager (worker pool size is the backpressure)
- Separate AckDispatcher (librdkafka batches internally)
- Single-writer ack funnel (librdkafka is thread-safe; workers ack directly)

## User-Facing API

### Routing DSL

```ruby
Karafka::App.routes.draw do
  # Existing CG topics unchanged
  consumer_group "orders" do
    topic :orders do
      consumer OrdersConsumer
    end
  end

  # New SG topics
  share_group "webhook_processors" do
    concurrency 10                    # number of share consumer instances
    poll_interval 0                   # 0 = eager polling (high priority)

    topic :webhooks do
      consumer WebhookConsumer
      max_messages_per_job 1
      jobs_builder :per_message       # default
    end
  end

  share_group "bulk_indexer" do
    concurrency 5

    topic :events do
      consumer IndexerConsumer
      max_messages_per_job 100
      jobs_builder :per_batch
      dead_letter_queue topic: :events_dlq, max_retries: 3
    end
  end

  share_group "background" do
    concurrency 2
    poll_interval 1000                # low priority, 1s between polls

    topic :reports do
      consumer ReportConsumer
    end
  end
end
```

### Consumer Classes

```ruby
# Consumer group consumer (unchanged from today)
class OrdersConsumer < Karafka::BaseConsumer
  def consume
    messages.each do |m|
      process(m)
      mark_as_consumed(m)
    end
  end
end

# Share group consumer (new)
class WebhookConsumer < Karafka::ShareGroupConsumer
  def consume
    messages.each do |m|
      begin
        deliver(m)
        mark_accepted(m)
      rescue TransientError => e
        mark_released(m, delay: e.retry_after)
      rescue PoisonPayload
        mark_rejected(m)
      end
    end
  end
end
```

### Ack API Methods (SG Consumers)

- `mark_accepted(message)` — ACCEPT
- `mark_released(message)` — RELEASE (broker-decided redelivery timing)
- `mark_released(message, delay: N)` — RELEASE after N seconds (framework handles RENEW)
- `mark_rejected(message)` — REJECT (poison, archives immediately)
- `extend_lock!(message)` — RENEW (for long-running processing)

### Implicit Ack Mode

Available as a convenience: on successful `#consume` return, all records ACCEPT; on raised exception, all REJECT. Users opt out via `explicit_acknowledgment true` for fine-grained control. Explicit is documented as the default for production use.

## Application-Level Organization

### Mixed-Mode Apps

Users with both CG and SG topics end up with two application-level bases:

```ruby
class ApplicationConsumer < Karafka::BaseConsumer
  # shared CG helpers
end

class ApplicationShareConsumer < Karafka::ShareGroupConsumer
  # shared SG helpers
end
```

### Extracting Truly Shared Behavior

```ruby
module ApplicationConsumerShared
  def log_consumption(m)
    # ...
  end
end

class ApplicationConsumer < Karafka::BaseConsumer
  include ApplicationConsumerShared
end

class ApplicationShareConsumer < Karafka::ShareGroupConsumer
  include ApplicationConsumerShared
end
```

### Generator Support

- `karafka install` generates `ApplicationConsumer` (unchanged)
- `karafka install:share_groups` (or similar) generates `ApplicationShareConsumer` alongside
- Existing users who never use SG never see `ApplicationShareConsumer`

## Backwards Compatibility Strategy

### What Must Not Break

- `class MyConsumer < Karafka::BaseConsumer` continues to work identically
- `topic :foo do ... end` without explicit mode continues to be a CG topic
- Existing feature DSL (`dead_letter_queue`, `manual_offset_management`, `virtual_partitions`, etc.) continues to work as-is for CG topics
- `is_a?(Karafka::Routing::Topic)` checks continue to resolve correctly (old class becomes base or is aliased)

### Approach

- **Additive changes only in minor releases.** Breaking changes batched for a major version if needed.
- **Alias preservation.** `Karafka::BaseConsumer` stays as the CG-capable class; `ConsumerGroupConsumer` is added as a canonical alias.
- **Namespace moves with aliases.** When CG code moves under `ConsumerGroups::`, old constant paths alias to new ones for at least one release cycle.
- **Deprecation warnings before removal.** Any removed method gets a deprecation shim for a release or two.

### What Users Might Need to Adapt

- Code using `is_a?` against specific internal classes that get renamed (rare)
- Code reaching into framework internals that get reorganized (uncommon; internals were never documented as stable API)
- Ecosystem gems (karafka-web, karafka-testing, third-party extensions) that track internal changes

## Implementation Plan

30 discrete steps, each shippable as a non-breaking minor release.

### Phase 0: Structural Preparation (No librdkafka Dependency)

1. **Namespace refactor of CG code** under `ConsumerGroups::` with aliases at old paths. Purely mechanical.
2. **Hidden-assumptions audit** in code that didn't move — find places secretly depending on offsets, partitions, or exclusive assignment.
3. **Subscription tracker extraction** — split responsibilities between shared `SubscriptionTracker` and CG-only partition-assignment.
4. **Per-mode JobsQueue wiring** — introduce the runtime coordinator pattern even though only CG exists for now.
5. **Topic and Consumer class hierarchies** — three-layer each (Base / ConsumerGroup / ShareGroup), feature registry per mode, expose `group_type` introspection.
6. **`share_group` routing block** — added as peer to `consumer_group`, raises `NotImplementedError` at startup with roadmap reference.

### Phase 1: Fake-Broker Foundation

1. **Public API spec for SG consumers** — RFC doc, no code yet. Drives component requirements.
2. **In-memory fake share-consumer** — pure-Ruby stub of poll/acquire/ack/release/renew/lock-expiry behavior.
3. **LeaseTracker implementation** — record-indexed state, populated by poll/ack/renew.
4. **Minimal listener loop** — capacity-gated (via worker pool), happy path, explicit ack only, one topic per consumer.
5. **Consumer base class extensions** — `mark_accepted`, `mark_released`, `mark_rejected`, `extend_lock!`.
6. **Shutdown path** — graceful drain, flush acks, close.
7. **Instrumentation** — SG events alongside CG, separate names where semantics differ.

### Phase 2: Feature Development (Against Fake Broker)

1. **First preview release** — labeled experimental, opt-in, loud "API will change" labeling.
2. **Per-record error handling with RELEASE** — foundation for retry features.
3. **Delayed-release structure** — `mark_released(m, delay: X)` with priority queue + RENEW scheduling.
4. **Long-running jobs equivalent** — `extend_lock!` exposed, auto-renew heuristics where appropriate.
5. **Share-group DLQ** — client-side REJECT + produce implementation.
6. **Share-group strategies matrix** — analog of CG 5-flag matrix.
7. **Admin API extensions** — describe SG, list SGs, reset SPSO, alter SG config.

### Phase 3: librdkafka Integration

1. **Swap fake broker for librdkafka** — interface-first design means this is an adapter swap.
2. **Real-cluster testing** — rebalance, failover, lock expiry under load, network partitions, tiered storage.
3. **Config layer completion** — all `share.*` / `group.share.*` configs mapped with job-queue defaults.
4. **Performance profiling and tuning** — ack dispatch, lease tracker lookups, delay queue ordering.

### Phase 4: Ecosystem

1. **Karafka Web UI integration** — parallel SG dashboards (members, leases, delivery count distributions, archived records, SPSO progress).
2. **karafka-testing integration** — matchers (`to accept(m)`, `to release(m)`), packaged fake broker.
3. **Migration tooling and documentation** — guides, reference implementations, capacity-planning updates.

### Phase 5: Maturation

1. **Preview to GA promotion** — after several releases of production stability.
2. **Pro features reconsidered** — scheduled messages, iterators: which get SG analogs, which stay CG-only.
3. **Consolidation / deprecation decisions** — lessons learned captured separately.

## Release Pacing

### Per-Step Pacing

- Each step ships as a non-breaking minor release
- Phase 0 spread across roughly one step per month, not rushed
- Phase 1 and 2 may be faster because they're self-contained work against the fake broker
- Phase 3 gated by librdkafka share-consumer support availability

### Preview Labeling

- Share-groups subsystem flagged as preview / experimental for extended period
- Preview label stays across multiple releases while real-world usage accumulates
- Clear "API may change, not for production" messaging
- Matches Kafka's own roll-out pattern: early access, preview, GA

### Versioning

- Aliases maintained indefinitely for back-compat
- Major version bump only if genuinely required (likely for removing deprecated internal APIs years down the line)
- Follow Kafka's versioning cadence where reasonable

### Coordination Points

- karafka-web: parallel dashboard work starts after core SG subsystem stabilizes
- karafka-testing: matchers added once SG API surface is stable
- Third-party extensions: release-notes flags at each structural change

## Open Questions

Questions deferred for resolution during implementation:

1. **OSS vs Pro placement** for share-group support. Affects where code lives and eventual pricing model.
2. **Exact librdkafka API shape** — affects Phase 3 adapter design. Monitor librdkafka issues for share-consumer support landing.
3. **DLQ naming** — same method name with different semantics, or different method names for clarity. Leaning toward same name with documented semantic differences.
4. **Generator defaults** for new projects — ask mode at install, or generate both and let users delete unused.
5. **Broker-native DLQ timing** — affects whether to ship client-side DLQ initially or wait for Kafka to provide it.
6. **Configuration precedence** when share-group and consumer-group knobs overlap in the `kafka` config block.
7. **`current_leases` API exposure** — expose LeaseTracker contents on the consumer for user observability, or keep internal-only.
8. **Prefetch defaults** — how aggressive to be. Leaning toward conservative for job-queue workloads.
9. **`workers_per_consumer` default** — 1 (pure tight loop) is probably right, but worth validating during performance testing.
10. **Auto-renew for LRJ** — opt-in or on-by-default. Probably on-by-default with opt-out for advanced users who want full control.
11. **Poll interval units** — milliseconds vs. duration object vs. symbol (`:eager`, `:normal`, `:low`) vs. all three. DSL ergonomics question.

## Design Ethos

- Ship simplicity, not cleverness
- Match Kafka's terminology and ecosystem conventions
- Per-mode feature clarity over artificial unification
- Explicit over implicit, especially at API boundaries
- Tight-loop processing over complex buffering
- Scale horizontally (more consumers) over vertically (bigger batches)
