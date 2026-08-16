Lag Compensation refreshes watermark offsets and consumer lag for long-paused partitions, so dashboards, alerts, and the Web UI keep reporting accurate lag instead of a frozen value while a partition is paused.

!!! info "Lag Compensation Is a Karafka Pro Feature"

    Lag Compensation is part of [Karafka Pro](https://karafka.io/#become-pro).

## The Problem It Solves

`librdkafka` updates watermark offsets and consumer lag only from fetch responses. A paused partition does not fetch, so once it has stayed paused for a while, its watermark offset and `consumer_lag` values stop changing in `statistics.emitted` and remain frozen for as long as the pause lasts. Any dashboard, alert, or Web UI view built on those values then shows stale lag for the paused partition, even though the partition may be falling further behind.

This matters most when a pause is expected to last a while - for example, [Persistent Pausing](Consumer-Groups-Persistent-Pausing) via the Filtering API, where a topic can stay paused for hours during a maintenance window.

## How It Works

When enabled, Karafka Pro periodically refreshes the watermark offsets and lags of long-paused partitions through the running consumer connection (a single batched `ListOffsets` query) and overlays the refreshed values onto the emitted statistics, so long-paused partitions report an accurate, moving lag.

## Configuration

The feature is disabled by default and controlled by two internal settings:

<table>
  <tr>
    <th>Setting</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>config.internal.statistics.consumer_groups.lag_compensation.interval</code></td>
    <td><code>0</code></td>
    <td>How often, in milliseconds, to refresh the watermarks and lags of long-paused partitions at most. <code>0</code> disables the feature entirely.</td>
  </tr>
  <tr>
    <td><code>config.internal.statistics.consumer_groups.lag_compensation.pause_age</code></td>
    <td><code>30_000</code></td>
    <td>How long, in milliseconds, a partition needs to stay continuously paused before it qualifies for compensation. Short pause and resume cycles reset the clock and never qualify. The minimum accepted value is <code>5_000</code>, because statistics of partitions paused for a shorter time are fresh enough that compensating them is pointless.</td>
  </tr>
</table>

To enable it, set the interval to a value greater than zero. The compensated values are overlaid onto the same `statistics.emitted` payload, so `statistics.interval.ms` must be enabled as well:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'localhost:9092',
      'statistics.interval.ms': 5_000
    }

    # Refresh the lag of partitions paused for 30s or more, at most every 30s
    config.internal.statistics.consumer_groups.lag_compensation.interval = 30_000
    config.internal.statistics.consumer_groups.lag_compensation.pause_age = 30_000
  end
end
```

## Resume Hand-Off

When a partition resumes, the refreshing stops, but the last compensated values are kept until the post-resume `librdkafka` fetches catch up. This hands over to the live statistics only once fresh fetch values are available, instead of the emitted lag snapping back to the frozen pre-resume value in the meantime. The kept values are dropped in bulk on the next rebalance.

!!! warning "Compensated Lag Can Overstate `read_committed` Lag During a Transaction"

    The refresh uses the batched `ListOffsets` API, which resolves the end offset to the high watermark regardless of the consumer isolation level. While a transaction is in flight on a paused partition, the compensated lag can transiently overstate the `read_committed` lag by the number of uncommitted messages. It self-corrects once the transaction resolves. Non-transactional topics are unaffected.

## See Also

- [Persistent Pausing](Consumer-Groups-Persistent-Pausing) - A common scenario where partitions stay paused long enough for this feature to matter
- [Monitoring and Logging](Infrastructure-Monitoring-and-Logging) - Statistics and instrumentation events in general
