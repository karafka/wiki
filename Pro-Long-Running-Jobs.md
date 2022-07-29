When working with Kafka, there is a setting called [`max.poll.interval.ms`](https://docs.confluent.io/platform/current/installation/configuration/consumer-configs.html#consumerconfigs_max.poll.interval.ms).

It is the maximum delay between invocations of `poll()` when using consumer group management. This places an upper bound on the time the consumer can be idle before fetching more records.

After exceeding this time, an error will be raised, and you may notice the following message:

```
Maximum poll interval (300000ms) exceeded by 255ms 
(adjust max.poll.interval.ms for long-running message processing): leaving group
```

To mitigate this, you can do a few things:

- you can extend the `max.poll.interval.ms`
- you can decrease `max_messages`
- you can use Long-Running Jobs

## Periodic revocation checks

TBA

## Processing during revocation

TBA

## Processing during shutdown

TBA

## Usage with Virtual Partitions

TBA
