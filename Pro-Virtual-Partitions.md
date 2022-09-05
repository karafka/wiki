Virtual Partitions allow you to parallelize the processing of data from a single partition. This can drastically increase throughput when IO operations are involved.

While the default scaling strategy for Kafka consumers is to increase partitions count and number of consumers, in many cases, this will not provide you with desired effects. In the end, you cannot go with this strategy beyond assigning one process per single topic partition. That means that without a way to parallelize the work further, IO may become your biggest bottleneck.

Virtual Partitions solve this problem by providing you with the means to further parallelize work by creating "virtual" partitions that will operate independently but will, as a collective processing unit, obey all the Kafka warranties.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/stats/virtual_partitions_performance.png" />
</p>
<p align="center">
  <small>*This example illustrates the throughput difference for IO intense work, where the IO cost of processing a single message is 1ms.
  </small>
</p>

## Messages distribution

Message distribution is based on the outcome of the `virtual_partitions` settings. Karafka will make sure to distribute work into jobs with a similar number of messages in them (as long as possible). It will also take into consideration the current `concurrency` setting and the `concurrency` setting defined within the `virtual_partitions` method.

Below is a diagram illustrating an example partitioning flow of a single partition data. Each job will be picked by a separate worker and executed in parallel (or concurrently when IO is involved).

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/virtual_partitions_partitioner.png" />
</p>

## Using virtual partitions

The only thing you need to add to your setup is the `virtual_partitions` definition for topics for which you want to enable it:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      # Distribute work to virtual partitions per order id
      virtual_partitions(
        partitioner: ->(message) { message.headers['order_id'] },
        # Defines how many concurrent virtual partitions will be created for this
        # topic partition. When not specified, Karafka global concurrency setting
        # will be used to make sure to accommodate as many worker threads as possible.
        concurrency: 5
      )
    end
  end
end
```

No other changes are needed.

The virtual `partitioner` requires to respond to a `#call` method, and it accepts a single Karafka message as an argument.

The return value of this partitioner needs to classify messages that should be grouped uniquely. We recommend using simple types like strings or integers.

### Partitioning based on the message key

Suppose you already use message keys to direct messages to partitions automatically. In that case, you can use those keys to distribute work to virtual partitions without any risks of distributing data incorrectly (splitting dependent data to different virtual partitions):

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    # Distribute work to virtual partitions based on the message key
    virtual_partitions(
      partitioner: ->(message) { message.key }
    )
  end
end
```

### Partitioning based on the message payload

Since the virtual partitioner accepts the message as the argument, you can use both `#raw_payload` as well as `#payload` to compute your distribution key:

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    # Distribute work to virtual partitions based on the user id, ensuring,
    # that per user, everything is in order
    virtual_partitions(
      partitioner: ->(message) { message.payload.fetch('user_id') }
    )
  end
end
```

**Note**: Keep in mind that Karafka provides [lazy deserialization](https://github.com/karafka/karafka/wiki/Deserialization#lazy-deserialization). If you decide to use payload data, deserialization will happen in the main thread before the processing. That is why, unless needed, it is not recommended.

### Partitioning randomly

If your messages are independent, you can distribute them randomly by running `rand(Karafka::App.config.concurrency)` for even work distribution:

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    # Distribute work to virtual partitions based on the user id, ensuring,
    # that per user, everything is in order
    virtual_partitions(
      partitioner: ->(_) { rand(Karafka::App.config.concurrency) }
    )
  end
end
```

## Managing number of Virtual Partitions

By default, Karafka will create at most `Karafka::App.config.concurrency` concurrent Virtual Partitions. This approach allows Karafka to occupy all the threads under optimal conditions.

### Limiting number of Virtual Partitions

However, it also means that other topics may not get their fair share of resources. To mitigate this, you may dedicate only 80% of the available threads to Virtual Partitions.

```ruby
setup do |config|
  config.concurrency = 10
end

routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    virtual_partitions(
      partitioner: ->(message) { message.payload.fetch('user_id') },
      # Leave two threads for other work of other topics partitions
      # (non VP or VP of other partitions)
      concurrency: 8
    )
  end
end
```

**Note**: Virtual Partitions `concurrency` setting applies per topic partition. In the case of processing multiple partitions, there may be a case where all the work happens on behalf of Virtual Partitions.

### Increasing number of Virtual Partitions

There are specific scenarios where you may be interested in having more Virtual Partitions than threads. One example would be to create one Virtual Partition for the data of each user. If you set the `concurrency` to match the `max_messages`, Karafka will create each Virtual Partition based on your grouping without reducing it to match number of worker threads.

```ruby
setup do |config|
  config.concurrency = 10
  config.max_messages = 200
end

routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    virtual_partitions(
      partitioner: ->(message) { message.payload.fetch('user_id') },
      # Make sure, that each virtual partition always contains data of only a single user
      concurrency: 200
    )
  end
end
```

**Note**: Please remember that Virtual Partitions are long-lived and will stay in the memory for as long as the Karafka process owns the given partition.

## Monitoring

Karafka default [DataDog/StatsD](Monitoring-and-logging#datadog-and-statsd-integration) monitor and dashboard work with virtual partitions out of the box. No changes are needed. Virtual batches are reported as they would be regular batches.

## Behaviour on errors

For a single partition-based Virtual Partitions group, offset management and retries policies are entangled. They behave [on errors](Error-handling-and-back-off-policy#runtime) precisely the same way as regular partitions with one difference: back-offs and retries are applied to the underlying regular partition. This means that if an error occurs in one of the virtual partitions, Karafka will pause based on the first offset received from the regular partition.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/virtual_partitions_error_handling.png" />
</p>

If processing in all virtual partitions ends up successfully, Karafka will mark the last message from the underlying partition as consumed.

**Note**: Since pausing happens in Kafka, the re-fetched data may contain more or fewer messages. This means that after retry, the number of messages and their partition distribution may differ. Despite that, all ordering warranties will be maintained.

## Ordering warranties

Virtual Partitions provide two types of warranties in regards to order:

- Standard warranties per virtual partitions group - that is, from the "outside" of the virtual partitions group Kafka ordering warranties are preserved.
- Inside each virtual partition - the partitioner order is always preserved. That is, offsets may not be continuous (1, 2, 3, 4), but lower offsets will always precede larger (1, 2, 4, 9). This depends on the `virtual_partitions` `partitioner` used for partitioning a given topic.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/virtual_partitions_order.png" />
</p>
<p align="center">
  <small>*Example distribution of messages in between two virtual partitions.
  </small>
</p>

## Manual offset management

Manual offset management as well as checkpointing during virtual partitions execution is **not** recommended. Virtual Partitions group order is not deterministic, which means that if you mark the message as processed from a virtual batch, it may not mean that messages with earlier offset from a different virtual partition were processed.

## Shutdown and revocation handlers

Both `#shutdown` and `#revoked` handlers work the same as within [regular consumers](Consuming-messages#shutdown-and-partition-revocation-handlers).

For each virtual consumer instance, both are executed when shutdown or revocation occurs. Please keep in mind that those are executed for **each** instance. That is, upon shutdown, if you used ten threads and they were all used with virtual partitions, the `#shutdown` method will be called ten times. Once per each virtual consumer instance that was in use.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/virtual_partitions_shutdown.png" />
</p>

## Usage with Long-Running Jobs

Virtual Partitions **can** be used with [Long-Running Jobs](Pro-Long-Running-Jobs). There are no special procedures.

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer
    long_running_job true
    virtual_partitions(
      partitioner: ->(message) { message.headers['order_id'] }
    )
  end
end
```

## Usage with Enhanced Active Job

Virtual Partitions **can** be used with Active Job without any limitations. The only thing worth keeping in mind is that the message payload for Active Job contains serialized job details and should not be deserialized in the partitioner.

The recommended approach is to use the Enhanced Active Job headers support to add a key that can be used for partitioning:

```ruby
class Job < ActiveJob::Base
  queue_as :jobs

  karafka_options(
    dispatch_method: :produce_async,
    partitioner: ->(job) { job.arguments.first[0] }
  )
end

class KarafkaApp < Karafka::App
  routes.draw do
    active_job_topic :jobs do
      virtual_partitions(
        partitioner: ->(job) { job.key }
      )
    end
  end
end
```
