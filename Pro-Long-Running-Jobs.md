When working with Kafka, there is a setting called [`max.poll.interval.ms`](https://docs.confluent.io/platform/current/installation/configuration/consumer-configs.html#consumerconfigs_max.poll.interval.ms).

It is the maximum delay between invocations of `poll()` commands. This places an upper bound on the time the consumer can wait before fetching more records.

After exceeding this time, an error will be raised, the process will be removed from the group, and you may notice the following message:

```
Maximum poll interval (300000ms) exceeded by 255ms 
(adjust max.poll.interval.ms for long-running message processing): leaving group
```

This value is effectively the **maximum** time you can spend processing messages fetched in a single `poll` even if they come from different partitions. Once this is exceeded, the given process will be removed from the group. This can cause the group to become unstable due to frequent rebalances.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/long-running-job-standard.png" />
</p>
<p align="center">
  <small>*Standard processing flow requires all the data to be processed before polling another batch of messages.
  </small>
</p>

To mitigate this, you can do a few things:

1. Extend the `max.poll.interval.ms`.
2. Decrease `max_messages`.
3. Use [Virtual Partitions](Pro-Virtual-Partitions) to parallelize the work further.
4. Use [Long-Running Jobs](Pro-Long-Running-Jobs) and not worry about that.

The strategy you want to go with heavily depends on your data and processing patterns. If you encounter this issue while maintaining a sane number of messages and decent `max.poll.interval.ms`, you should further parallelize the processing or enable this feature.

Long-Running Jobs feature follows the [Confluent recommended strategy](https://www.confluent.io/blog/kafka-consumer-multi-threaded-messaging/) of pausing a given partition for the time of the processing and resuming processing of the partition once the work is done.

That way, as long as no rebalances occur during the processing that would cause the partition to be revoked from the given process, polling can happen within the boundaries of `max.poll.interval.ms`.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/long-running-job-flow.png" />
</p>
<p align="center">
  <small>*With Long-Running Job enabled, the given partition is paused for the processing time, and polling happens independently from processing.
  </small>
</p>

This feature is great for scenarios where your processing may last for a longer time period. For example, when you need to communicate with external systems, their performance periodically is not deterministic.

## Periodic revocation checks

TBA

## Processing during revocation

TBA

## Processing during shutdown

TBA

## Usage with Virtual Partitions

TBA
