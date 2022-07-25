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

The return value of the virtual partitioner needs to classify messages that should be grouped together uniquely. We recommend using simple types like strings or integers.

### Partitioning based on the messages keys

If you already use message keys to direct messages to partitions automatically, you can use those keys to distribute work to virtual partitions without any risks of distributing data incorrectly (splitting dependent data to different virtual partitions):

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    # Distribute work to virtual partitions based on the message key
    virtual_partitioner ->(message) { message.key }
  end
end
```

### Partitioning based on the payload

Since the virtual partitioner accepts the message as the argument, you can use both `#raw_payload` as well as `#payload` to compute your uniqueness key:

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer

    # Distribute work to virtual partitions based on the user id ensuring,
    # that per user everything is in order
    virtual_partitioner ->(message) { message.payload.fetch('user_id') }
  end
end
```

**Note**: Keep in mind that Karafka provides [lazy deserialization](https://github.com/karafka/karafka/wiki/Deserialization#lazy-deserialization). If you decide to use payload data, deserialization will happen in the main thread before the processing. That is why, unless needed, it is not recommended.

## Monitoring

Karafka default [DataDog/StatsD](Monitoring-and-logging#datadog-and-statsd-integration) monitor and dashboard work with virtual partitions out of the box. No changes are needed. Virtual batches are reported as they would be regular batches.

## Behaviour on errors

TBA

## Ordering warranties

TBA

## Manual offset management

TBA

## Usage with Long-Running Jobs

TBA
