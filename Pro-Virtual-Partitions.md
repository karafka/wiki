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

Message distribution is based on the outcome of the `virtual_partitioner` outcome. Karafka will make sure to distribute work into jobs with a similar number of messages in them (as long as possible). It will also take into consideration the current `concurrency` setting.

Below is a diagram illustrating an example partitioning flow of a single partition data. Each job will be picked by a separate worker and executed in parallel (or concurrency when IO is involved).

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/virtual_partitions_partitioner.png" />
</p>

## Using virtual partitions

The only thing you need to add to your setup is the `virtual_partitioner` definition for topics for which you want to enable it:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      # Distribute work to virtual partitions per order id
      virtual_partitioner ->(message) { message.headers['order_id'] }
    end
  end
end
```

No other changes are needed.

The virtual partitioner requires to respond to a `#call` method, and it accepts a single Karafka message as an argument.

The return value of the virtual partitioner needs to classify messages that should be grouped uniquely. We recommend using simple types like strings or integers.

### Partitioning based on the message key

Suppose you already use message keys to direct messages to partitions automatically. In that case, you can use those keys to distribute work to virtual partitions without any risks of distributing data incorrectly (splitting dependent data to different virtual partitions):

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    # Distribute work to virtual partitions based on the message key
    virtual_partitioner ->(message) { message.key }
  end
end
```

### Partitioning based on the message payload

Since the virtual partitioner accepts the message as the argument, you can use both `#raw_payload` as well as `#payload` to compute your uniqueness key:

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    # Distribute work to virtual partitions based on the user id, ensuring,
    # that per user, everything is in order
    virtual_partitioner ->(message) { message.payload.fetch('user_id') }
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
    virtual_partitioner ->(_) { rand(Karafka::App.config.concurrency) }
  end
end
```

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
- Inside each virtual partition - the partitioner order is always preserved. That is, offsets may not be continuous (1, 2, 3, 4), but lower offsets will always precede larger (1, 2, 4, 9). This depends on the `virtual_partitioner` used for partitioning a given topic.

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

TBA

## Usage with Long-Running Jobs

TBA

## Usage with Enhanced Active Job

TBA
