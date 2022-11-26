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

## Using Long-Running Jobs

The only thing you need to add to your setup is the `long_running_job` option in your routing section:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      long_running_job true
    end
  end
end
```

## Processing during revocation

Upon a group rebalance, there are three scenarios affecting the paused partition you are processing:

1. Partition is not revoked because `cooperative-sticky` assignment strategy is in use.
2. Partition is revoked and re-assigned to the same process.
3. Partition is revoked and assigned to a different process.

**Note:**: The `#revoked?` method value changed independently from the workers' occupation. This means that the revocation status will be updated even if all the workers are busy processing long-running jobs.

**Note**: Revocation jobs are also non-blocking for long-running jobs. If the internal workers' batch is full, they will not block polling.

### `cooperative-sticky` rebalance

Using the `cooperative-sticky` assignment strategy is recommended when using Long-Running Jobs. This can increase overall stability by not triggering revocation of partitions upon rebalances when partition would be re-assigned back:

```ruby
setup_karafka do |config|
  config.kafka[:'partition.assignment.strategy'] = 'cooperative-sticky'
end
```

### Revocation and re-assignment

In the case of scenario `2`, there is nothing you need to do. Karafka will continue processing your messages and resume partition after it is done with the work.

### Revocation without re-assignment

If partition becomes assigned to a different process, this process will pick up the same messages you are currently working with. To mitigate this, Karafka has a `#revoked?` method you can periodically check to ensure that a given process still owns the partition you are working with.

This method, in the case of the Long-Running Jobs feature, does **not** require marking messages as consumed or taking any other actions. Group state is updated asynchronously alongside the work being done.

```ruby
def consume
  messages.each do |message|
    # Stop sending messages to the external service if we no longer own the partition
    return if revoked?

    ExternalSystemDispatcher.new.call(message)
  end
end
```

## Processing during shutdown

Karafka will wait for your Long-Running Jobs to finish within the limits of `shutdown_timeout`. Either set it to a value big enough for the jobs to finish or implement periodic shutdown checks and enable [manual offset management](Offset-management#manual-offset-management). Otherwise, Karafka may forcefully stop workers in the middle of processing after the `shutdown_timeout` is exceeded.

During the shutdown, polling occurs, so there is **no** risk of exceeding the `max.poll.interval.ms`.

```ruby
# Note that for this to work, you need to manage offsets yourself
# Otherwise, automatic offset management will commit offset of the last message
def consume
  messages.each do |message|
    # Stop sending messages if the app is stopping
    return if Karafka::App.stopping?

    ExternalSystemDispatcher.new.call(message)

    mark_message_as_consumed(message)
  end
end
```

## Using Long-Running Jobs alongside regular jobs in the same subscription group 

By default, Long-Running Jobs defined alongside regular jobs will be grouped in a single subscription group. This means they will share an underlying connection to Kafka and be subject to the same blocking polling limitations.

In case of a regular job blocking beyond `max.poll.interval.ms`, Kafka will revoke the regular jobs and the defined Long-Running Jobs.

If you expect that your regular jobs within the same subscription group may cause Kafka rebalances or any other issues, separating them into different subscription groups is worth doing. This will ensure that external factors do not influence Long-Running Jobs's stability.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    # By providing this, all the long running jobs will get a separate Kafka connection that
    # won't be affected by other topics consumption in any way
    subscription_group 'long_running_jobs' do
      topic :orders_states do
        consumer OrdersStatesConsumer

        long_running_job true
      end
    end

    topic :deliveries_states do
      consumer DeliviersStatesConsumer
    end
  end
end
```
