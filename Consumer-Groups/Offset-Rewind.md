# Consumer Lag Spikes and Offset Resets

A specific failure pattern can cause consumer lag to jump suddenly from near zero to the full topic retention window - potentially hours or days of lag - then slowly drain over time before repeating on a regular schedule. This document explains the two main causes of this pattern, how to tell them apart, and what to do about each.

## Symptom Pattern

The observable symptoms are distinctive:

- Consumer lag for one or more topics rises near-vertically from approximately zero to the topic's full retention age (for example, from 0 seconds to 9 days of lag within minutes)
- The lag plateau sits at or near the retention ceiling, then drains slowly over several hours as the consumer reprocesses already-consumed messages
- The pattern repeats on a regular schedule - often daily - and may intensify during periods of higher deployment or scaling activity
- Only a subset of topics may be affected; topics with higher message rates tend to show the most visible spikes because more messages are reprocessed per unit of time

The key diagnostic signal is the vertical rise. A genuine message backlog from slow consumption ramps up gradually at a finite slope. A near-instant jump to multi-day lag is only physically possible if the consumer's offset pointer has been moved backward to an older position - an offset rewind or offset reset.

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/consumer_groups_offset_rewinds/example-spikes.png" alt="consumer lag spikes caused by offset rewinds" />
</p>

## Rule Out Operational Causes First

Before investigating client or broker bugs, rule out the most common operational causes of the same symptom:

- Consumer downtime longer than the retention window - if a consumer group was stopped or severely lagging while the topic's retention policy trimmed past its committed offset, Kafka legitimately returns `offset_out_of_range` and the client resets to earliest. This is expected behavior, not a bug.
- Manual offset reset - an operator running `kafka-consumer-groups.sh --reset-offsets --to-earliest` or equivalent tooling against the group will produce an identical lag spike.
- Retention misconfiguration - `log.retention.ms` or `retention.bytes` set too aggressively relative to consumer throughput can cause the committed offset to continuously fall off the front of the log.

If none of these apply and the pattern recurs without any operator action, the bug classes below are the likely explanation.

## Root Cause: librdkafka Cooperative-Sticky Bugs

Three related librdkafka issues interact with the `cooperative-sticky` partition assignment strategy. They have different fix versions:

- [#4686](https://github.com/confluentinc/librdkafka/issues/4686) - The direct cause of the lag-to-retention-ceiling pattern. During a cooperative rebalance, partitions a consumer is keeping (not losing) are implicitly resumed. This can cause the consumer to resume fetching from a previous stale position rather than from the correct committed offset. If that stale position has since been trimmed by retention, the next fetch gets an `offset_out_of_range` response and the client resets to earliest - pinning lag at the full retention age. The librdkafka issue text describes the result as the consumer resuming "from a previous position"; the offset_out_of_range path is the most common consequence when the stale position has aged out of the retention window. Fixed in librdkafka 2.4.0 (PR #4636).
- [#4059](https://github.com/confluentinc/librdkafka/issues/4059) - The timed auto-committer could attempt commits during a cooperative rebalance, causing `illegal_generation` errors that trigger follow-up rebalances, which can cascade into an extended rebalance loop. This increases the frequency of rebalances and therefore the number of opportunities to hit #4686. Fixed in librdkafka 2.8.0 (PR #4908).
- [#3891](https://github.com/confluentinc/librdkafka/issues/3891) - When a consumer shuts down, the remaining consumers may experience several rapid successive rebalance cycles, each a further opportunity to trip #4686. Closed as a duplicate of #4059; addressed when #4059 is fixed.

<table border="1">
  <thead>
    <tr>
      <th>Karafka version</th>
      <th>librdkafka version</th>
      <th>#4686 (lag spikes)</th>
      <th>#4059 / #3891 (rebalance amplification)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>2.3.x and below</td>
      <td>&lt; 2.4.0</td>
      <td>Affected</td>
      <td>Affected</td>
    </tr>
    <tr>
      <td>2.4.x</td>
      <td>2.4.0 - 2.7.x</td>
      <td>Fixed</td>
      <td>Affected</td>
    </tr>
    <tr>
      <td>2.5.x and above</td>
      <td>&gt;= 2.8.0 (depending on pinned version)</td>
      <td>Fixed</td>
      <td>Fixed</td>
    </tr>
  </tbody>
</table>

### What Makes #4686 Fire

Bug #4686 does not require any explicit pause/resume from your application code. The implicit resume that `cooperative-sticky` issues on kept partitions during a rebalance is sufficient to trigger the stale-fetch-start path. Any `cooperative-sticky` consumer on librdkafka below `2.4.0` is exposed whenever a rebalance occurs.

The reset always lands at the full retention ceiling rather than a small backward nudge because the stale anchor points to a position that retention has long since trimmed. Each rebalance produces a full-retention-age lag spike, drains over hours as the consumer catches up, then repeats on the next rebalance.

### Why the Pattern Is Often Daily

A daily spike cadence typically points to a scheduled external trigger rather than random broker noise.

<table border="1">
  <thead>
    <tr>
      <th>Trigger</th>
      <th>Mechanism</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Automatic dyno/container cycling</td>
      <td>Platforms like Heroku restart dynos approximately every 24 hours. Each restart causes a consumer to leave and rejoin the group, triggering a cooperative rebalance.</td>
    </tr>
    <tr>
      <td>Daily deployments</td>
      <td>A rolling deploy cycles every consumer instance in the group, generating a burst of membership transitions each of which is its own cooperative rebalance round.</td>
    </tr>
    <tr>
      <td>Scheduled autoscaling events</td>
      <td>If instances scale down and back up on a predictable schedule, the corresponding join/leave events follow the same cadence.</td>
    </tr>
  </tbody>
</table>

If the cadence accelerates, look for an increase in deployment frequency, more aggressive autoscaling, or continuing broker instability that is generating additional rebalances above the baseline.

## Root Cause: Broker-Side Log Segment Race (Older Kafka Versions)

A separate class of bugs in older Apache Kafka broker versions can produce identical symptoms: consumer lag jumps to the retention ceiling even when the consumer is keeping up fine. Unlike the librdkafka cooperative-sticky issue, these are broker-side races and affect all Kafka consumer clients, not just librdkafka-based ones.

### KAFKA-2236 (Kafka < 0.10.0)

**JIRA:** [KAFKA-2236](https://issues.apache.org/jira/browse/KAFKA-2236) - Fixed in Kafka **0.10.0.0** (May 2016)

A race condition in the broker's offset request handler: a concurrent log segment roll can occur between the broker reading segment metadata and serving the offset response, producing a corrupted reply. The consumer receives an invalid offset and resets per `auto.offset.reset`. This can fire even when the consumer has zero lag and is a pure broker-side race. It manifests more often when topics use aggressive time-based segment rolling (`segment.ms` set low), which increases the frequency of rolls and therefore the window for the race.

If your cluster is on Kafka 0.8.x or 0.9.x and you see this pattern, upgrading the brokers to 0.10.0+ resolves it. Heroku Kafka customers encountered this on older cluster tiers before Heroku migrated them to 0.10.x and later.

### KAFKA-9543 (Kafka 2.4.0 - 2.5.0)

**JIRA:** [KAFKA-9543](https://issues.apache.org/jira/browse/KAFKA-9543) - Fixed in Kafka **2.4.2** and **2.5.1**

A regression introduced in Kafka 2.4.0. After a segment roll, consumers receive `offset_out_of_range` errors that correlate exactly with the roll event timing rather than with falling behind retention. The root cause is a concurrency issue in `Log.read()`: the check that determines whether a `fetchOffset` falls within valid segment boundaries is not atomic relative to segment transitions. Between the validity check and the actual fetch, a new segment boundary can cause the offset reference to become invalid.

The distinguishing symptom from KAFKA-2236 is that this regression is precisely correlated with new segment roll events rather than occurring intermittently under high roll rates.

If you are running Kafka 2.4.0 or 2.4.1, upgrading to 2.4.2 or 2.5.1 resolves it.

### Distinguishing the Broker Race from the librdkafka Bug

<table border="1">
  <thead>
    <tr>
      <th>Signal</th>
      <th>librdkafka #4686 (cooperative-sticky)</th>
      <th>Broker-side segment race (KAFKA-2236 / KAFKA-9543)</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Affected Kafka versions</td>
      <td>Any</td>
      <td>Kafka &lt; 0.10.0 or 2.4.0-2.5.0 specifically</td>
    </tr>
    <tr>
      <td>Affected client types</td>
      <td>librdkafka-based clients using <code>cooperative-sticky</code> only</td>
      <td>All consumer clients</td>
    </tr>
    <tr>
      <td>Timing of spike</td>
      <td>Correlates with rebalance events</td>
      <td>Correlates with log segment roll events</td>
    </tr>
    <tr>
      <td>Broker error logs</td>
      <td>No broker-side error</td>
      <td>KAFKA-2236: <code>ArrayIndexOutOfBoundsException</code> visible in broker logs. KAFKA-9543: no broker-side error - only a normal segment-roll INFO log line.</td>
    </tr>
    <tr>
      <td>Reproducible by switching assignor?</td>
      <td>Yes - switching to <code>range</code>/<code>roundrobin</code> stops it</td>
      <td>No effect from changing assignor</td>
    </tr>
    <tr>
      <td>Fix</td>
      <td>Upgrade to Karafka 2.4+ (librdkafka 2.4.0)</td>
      <td>Upgrade Kafka brokers to fixed version</td>
    </tr>
  </tbody>
</table>

## Confirming the Cause

### Enable Consumer Group Debug Logging

The most direct confirmation is to capture librdkafka internal logs around a spike onset. Set `debug` to `cgrp,fetch` in your Kafka configuration block:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'your-kafka:9092',
      # other settings...
      debug: 'cgrp,fetch'
    }
  end
end
```

!!! warning "Debug Mode in Production"

    `cgrp,fetch` is far less noisy than `all`, but it still generates significant log volume. Enable it only for a short diagnostic window and disable it once you have captured the event. If possible, capture on a single consumer instance and filter logs to the affected topic and partition names.

What to look for immediately after a rebalance in the debug output:

- A rebalance event followed by a resume on a partition the consumer is keeping (not gaining or losing)
- A fetch starting at an offset significantly behind the last committed position
- An `offset_out_of_range` response from the broker
- A subsequent reset to the earliest available offset

The combination of resume -> stale fetch position -> out-of-range -> reset-to-earliest is the fingerprint of #4686. If the out-of-range errors appear without a preceding rebalance and correlate instead with segment roll timing visible in broker logs, the broker-side race is more likely.

### Use `auto.offset.reset` as a Diagnostic Discriminator

Setting `auto.offset.reset` to `error` in your Kafka configuration converts silent offset resets into raised errors, making the event visible in monitoring. This is useful regardless of which root cause is present, because it converts "silent lag spike" into "visible stopped partition":

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'your-kafka:9092',
      # other settings...
      'auto.offset.reset': 'error'
    }
  end
end
```

!!! danger "Operational Impact of `auto.offset.reset: error`"

    When `auto.offset.reset` is `error`, a partition that would otherwise silently reset will instead stop consuming and surface an error. You **must** have alerting on offset-reset errors and a runbook to seek the affected partitions to the correct position before enabling this. Do **not** use `auto.offset.reset: 'latest'` to resolve these errors - doing so skips all messages between the valid committed position and the live edge, causing data loss.

### Reading the `OffsetOutOfRange` Context

When an `offset_out_of_range` error appears in logs, the broker includes the partition's low and high watermarks alongside the requested offset. The watermark values identify which sub-case you are in:

<table border="1">
  <thead>
    <tr>
      <th>Requested offset vs watermarks</th>
      <th>Indicates</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Requested offset &lt; low watermark</td>
      <td>The consumer's position (stale or committed) is below the oldest retained offset. This is the #4686 path or a genuine retention-overrun case.</td>
    </tr>
    <tr>
      <td>Requested offset &gt; high watermark</td>
      <td>The committed offset is ahead of the log end. This indicates the broker lost data (unclean leader election, log truncation). A broker-side data loss event during the original crash may have contributed to the bad state.</td>
    </tr>
  </tbody>
</table>

Both cases call for the same upstream fix (upgrading to Karafka 2.4+ for the librdkafka cause, or upgrading Kafka brokers for the segment race cause), but the second case warrants additional investigation of broker-side log integrity for the affected partitions.

## Mitigating the librdkafka Issue Without Upgrading

If upgrading to Karafka 2.4 is **not** immediately feasible, two mitigations can meaningfully reduce or eliminate the spiking while you plan the upgrade. These are independent and can be combined.

### Switch to an Eager Partition Assignor

The `cooperative-sticky` strategy is the prerequisite for #4686. Switching to an eager assignor (`range` or `roundrobin`) eliminates the implicit-resume path entirely: eager rebalances revoke all partitions from all members first, then reassign, so there is no "kept partition resume" step for the bug to exploit.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'your-kafka:9092',
      # other settings...
      'partition.assignment.strategy': 'range'
    }
  end
end
```

!!! danger "Eager Rebalances Pause the Entire Group"

    Eager assignors (`range`, `roundrobin`) pause consumption for the entire consumer group on every rebalance - every consumer stops processing, partitions are fully revoked, then reassigned. The trade-off versus `cooperative-sticky` is that individual rebalances are more disruptive but do **not** produce stale offset resets. For most applications this is an acceptable trade-off as a stopgap.

!!! warning "Switching Strategies Requires a Full Group Restart"

    `cooperative-sticky` and eager assignors are **not** compatible within the same consumer group during a transition. Mixed-strategy groups will fail with an `inconsistent_group_protocol` error. You **must** bring all consumer instances in the group down before restarting them with the new strategy. A rolling deploy while members are still using different strategies will break the group. Plan for a brief downtime window when making this change.

### Enable Static Group Membership

Static group membership (`group.instance.id`) allows a consumer to leave and rejoin the group without triggering a rebalance, provided it rejoins within `session.timeout.ms`. This directly attacks the most common rebalance trigger - routine process restarts and container/dyno cycling - which is typically the source of the daily cadence.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'your-kafka:9092',
      # other settings...
      'group.instance.id': "my-app-worker-#{ENV.fetch('INSTANCE_ID')}",
      'session.timeout.ms': 300_000
    }
  end
end
```

The `group.instance.id` **must** be stable across restarts (so the rejoining consumer is recognized as the same member) and **unique** within the consumer group (no two consumers may share an ID). If the ID is not stable, every restart generates a new member identity and triggers a rebalance.

!!! tip "Deriving a Stable ID on Heroku and Kubernetes"

    On Heroku, the `DYNO` environment variable holds a stable slot name (`web.1`, `worker.2`) that persists across the daily dyno cycle:

    ```ruby
    'group.instance.id': "#{ENV.fetch('APP_NAME', 'my-app')}-#{ENV.fetch('DYNO')}"
    ```

    Be aware that Heroku documents `$DYNO` as not always being unique within an app - during a deploy or restart, two dynos may briefly share the same slot identifier. If this brief overlap is a concern, append a startup timestamp or process ID to the base value to guarantee uniqueness during transitions.

    On Kubernetes, the pod name from `metadata.name` (injected via the Downward API) serves the same purpose when using a `StatefulSet` or another controller that maintains stable pod names.

Pairing `group.instance.id` with a `session.timeout.ms` large enough to cover the worst-case restart duration is essential. If the consumer is offline longer than the session timeout, the broker still treats it as a new member and triggers a rebalance. A value of 5 minutes (`300_000` ms) is a reasonable starting point for most deployment scenarios.

!!! warning "Static Membership and Fencing"

    Each `group.instance.id` value must be globally unique within the consumer group. If two consumers share the same ID, under the classic rebalance protocol the **existing** member is fenced with a `fenced_instance_id` error (the new joiner takes over the assignment). Under the KIP-848 next-generation protocol the behavior is reversed: the joining member is rejected with an `unreleased_instance_id` error and the existing member retains its assignment. See the [Errors and Troubleshooting FAQ](Basics-FAQ-Errors-and-Troubleshooting) for more on these errors.

## Permanent Fix: Upgrade to the Latest Karafka

Upgrading to the latest available Karafka release is the permanent resolution for all issues described in this document. Karafka ships bug fixes and patch releases frequently - staying current means you automatically receive all cumulative fixes, including librdkafka updates, without having to track individual issue fix versions. Running significantly behind the latest release increases the risk of operating on known bugs that have already been resolved upstream.

Before upgrading, review the [upgrade guides](Upgrades-Upgrading) for any breaking changes between your current and target versions, as some version-to-version changes can produce consumer group behavior that looks similar to the offset-reset pattern described in this document. See the [Versions Lifecycle and EOL](Upgrades-Versions-Lifecycle-and-EOL) page for the current support status of each release series.

## See Also

- [Offset Management](Consumer-Groups-Offset-management) - How Karafka manages offset commits under normal conditions
- [Broker Failures and Fault Tolerance](Infrastructure-Broker-Failures-and-Fault-Tolerance) - How Karafka and librdkafka handle broker failures and leader elections
- [Debugging](Infrastructure-Debugging) - Systematic approach to debugging consumer processing issues
- [Upgrading Karafka](Upgrades-Upgrading) - Upgrade strategies, best practices, and recommendations for staying current
- [Versions Lifecycle and EOL](Upgrades-Versions-Lifecycle-and-EOL) - Current support status of each Karafka release series
- [New Rebalance Protocol (KIP-848)](Kafka-New-Rebalance-Protocol) - The next-generation rebalance protocol; requires a Kafka 4.0+ broker and librdkafka 2.12.0+ (GA as of librdkafka 2.12)
- [librdkafka Configuration](Librdkafka-Configuration) - Reference for all librdkafka configuration properties including `partition.assignment.strategy`, `group.instance.id`, and `auto.offset.reset`
