When working with Kafka, there is a setting called [`max.poll.interval.ms`](https://docs.confluent.io/platform/current/installation/configuration/consumer-configs.html#consumerconfigs_max.poll.interval.ms).

It is the maximum delay between invocations of `poll()` commands. This places an upper bound on the time the consumer can wait before fetching more records.

After exceeding this time, an error will be raised, the process will be removed from the group, and you may notice the following message:

```text
Maximum poll interval (300000ms) exceeded by 255ms 
(adjust max.poll.interval.ms for long-running message processing): leaving group
```

This value is effectively the **maximum** time you can spend processing messages fetched in a single `poll` even if they come from different partitions. Once this is exceeded, the given process will be removed from the group. This can cause the group to become unstable due to frequent rebalances.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/long_running_jobs/standard.svg" />
</p>
<p align="center">
  <small>*Standard processing flow requires all the data to be processed before polling another batch of messages.
  </small>
</p>

To mitigate this, you can do a few things:

1. Extend the `max.poll.interval.ms`.
2. Decrease `max_messages`.
3. Use [Virtual Partitions](Pro-Virtual-Partitions) to parallelize the work further.
4. Use [Adaptive Iterator](Pro-Adaptive-Iterator) to mitigate occasional spikes in processing time.
5. Use [Long-Running Jobs](Pro-Long-Running-Jobs) and not worry about that.

The strategy you want to go with heavily depends on your data and processing patterns. If you encounter this issue while maintaining a sane number of messages and decent `max.poll.interval.ms`, you should further parallelize the processing or enable this feature.

Long-Running Jobs feature follows the [Confluent recommended strategy](https://www.confluent.io/blog/kafka-consumer-multi-threaded-messaging/) of pausing a given partition for the time of the processing and resuming processing of the partition once the work is done.

That way, as long as no rebalances occur during the processing that would cause the partition to be revoked from the given process, polling can happen within the boundaries of `max.poll.interval.ms`.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/long_running_jobs/flow.svg" />
</p>
<p align="center">
  <small>*With Long-Running Job enabled, the given partition is paused for the processing time, and polling happens independently from processing.
  </small>
</p>

This feature is great for scenarios where your processing may last for a longer time period. For example, when you need to communicate with external systems, their performance periodically is not deterministic.

!!! tip "Alternatives to Long-Running Jobs: Direct Assignments and Iterator"

    An alternative to using subscription group-based assignments to handle long-running jobs in Karafka is the [Direct Assignments API](Pro-Direct-Assignments). This API provides a flexible way to manage Kafka partitions directly, bypassing the `max.poll.interval.ms` constraint. The [Iterator API](Pro-Iterator-API) also presents a viable alternative for scenarios requiring fine-tuned control over message consumption. These approaches can be instrumental in systems where long processing times are common and must be managed efficiently.

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

!!! warning "Long-Running Job Impact on Internal Queues"

    When using Long-Running Jobs, be aware that pausing to manage `max.poll.interval.ms` will purge your internal message queue. This is due to `#pause` acting as a fencing mechanism, invalidating all messages currently in the queue. To avoid extensive network traffic from message re-fetching, it's recommended to reduce `queued.max.messages.kbytes`. This ensures a smaller pre-fetched message queue, which is crucial if you frequently seek, helping to optimize bandwidth usage. You can read more about this [here](Pausing-Seeking-and-Rate-Limiting#pause-and-seek-usage-potential-networking-impact).

## Processing during revocation

Upon a group rebalance, there are three scenarios affecting the paused partition you are processing:

1. Partition is not revoked because advanced rebalance strategy (KIP-848 or `cooperative-sticky`) is in use.
2. Partition is revoked and re-assigned to the same process.
3. Partition is revoked and assigned to a different process.

!!! note

    The `#revoked?` method value changes independently from the workers' occupation. This means that the revocation status will be updated even if all the workers are busy processing long-running jobs.

!!! note

    Revocation jobs are also non-blocking for long-running jobs. If the internal workers' batch is full, they will not block polling.

### Advanced Rebalance Strategies

Using advanced rebalance strategies is recommended when using Long-Running Jobs. This increases overall stability by not triggering revocation of partitions upon rebalances when partitions would be re-assigned back.

**Recommended (Kafka 4.0+ with KRaft):** Use the [next-generation consumer group protocol (KIP-848)](Kafka-New-Rebalance-Protocol):

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'group.protocol': 'consumer'
    }
  end
end
```

**Alternative (Older Kafka versions):** Use the `cooperative-sticky` assignment strategy:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'partition.assignment.strategy': 'cooperative-sticky'
    }
  end
end
```

Both strategies help avoid unnecessary partition revocations when partitions would be re-assigned back to the same process.

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
      consumer DeliveriesStatesConsumer
    end
  end
end
```

## Pausing in Long-Running Jobs

When using Karafka Long-Running Jobs, it is not recommended to use manual pausing because it can lead to unexpected behaviors and errors in the system. Long-Running Jobs automatically pause and resume topic partitions based on the consumption flow. In case of a manual pause that operates for a shorter duration than the consumer processing time, the partition may be resumed before the consumer finishes its processing, which can cause unexpected behaviors and errors in the system.

If a manual pause is needed, it is recommended to compute its duration based on the following formula:

`max_remaining_processing_time + 2 * max_wait_time`

This will ensure that the consumer has enough time to process all the messages in the batch before the partition is resumed.

Overall, it is crucial to be mindful of the potential risks and issues associated with manual pausing when using Karafka Long-Running Jobs. By following best practices and leveraging the built-in features of the framework, we can ensure that the system remains reliable, scalable, and performs as expected.

## Non-Blocking Jobs: Complementing Long-Running Job Pausing

The Long-Running Jobs feature is designed to handle tasks that take longer to process than the standard Kafka message batch. Using the pausing strategy allows for efficient parallel processing across multiple partitions of the same topic. This approach helps manage longer tasks without risking the stability of the consumer group due to frequent rebalances. For users looking to optimize their parallel processing further, reviewing the [Non-Blocking Jobs](Pro-Non-Blocking-Jobs) documentation for additional strategies and best practices is recommended.

## Example Use Cases

- External Service Calls: In some cases, processing messages may require making HTTP requests to external services, which can take a long time to complete. For example, processing messages to perform payment processing, geocoding, or weather data retrieval may require making requests to external services that can take a significant amount of time to return a response.

- IoT Data Processing: With the rise of the Internet of Things (IoT), data processing and analysis of IoT-generated data has become increasingly important. The processing of messages may involve analyzing sensor data, predicting equipment failure, and optimizing operations.

- Complex Database Operations: Performing complex database operations such as joins, aggregations, or subqueries can take a significant amount of time, especially when dealing with large datasets. The processing of messages may involve performing such operations on the incoming data.

- Data Cleaning and Preprocessing: Data cleaning and preprocessing can take significant time, especially when dealing with large datasets. The processing of messages may involve tasks such as data validation, data normalization, or data standardization.

These are just a few examples of how Long-Running Jobs can benefit different industries where processing messages takes a significant amount of time. Karafka's Long-Running Jobs feature can be used to develop and manage these jobs, enabling continuous data processing and analysis.
