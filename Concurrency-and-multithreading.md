Karafka uses native Ruby threads to achieve concurrent processing in three scenarios:

- for concurrent processing of messages from different topics partitions.
- for concurrent processing of messages from a single partition when using the **Virtual Partitions** feature.
- to handle consumer groups management (each consumer group defined will be managed by a separate thread).

## Parallel messages processing

After messages are fetched from Kafka, Karafka will split incoming messages into separate jobs. Those jobs will then be put on a queue from which a poll of workers can consume. All the ordering warranties will be preserved.

You can control the number of workers you want to start by using the `concurrency` setting:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Run two processing threads
    config.concurrency = 2
    # Other settings here...
  end
end
```

### Parallel processing of multiple topics/partitions

Karafka uses multiple threads to process messages coming from different topics and partitions.

Using multiple threads for IO intense work can bring great performance improvements to your system "for free."

<p align="center">
  <img src="images/workers-performance.png" />
  </br>
  <small>*This example illustrates performace difference for IO intense jobs.</small>
</p>

Example of work distribution amongst two workers:

<p align="center">
  <img src="images/processing-workers.svg" />
</p>

**Note**: Please keep in mind that if you scale horizontally and end up with one Karafka process being subscribed only to a single topic partition, you can still process data from it in parallel using the **Virtual Partitions** feature.

### Parallel processing of a single topic partition (Virtual Partitions)

Karafka allows you to parallelize further processing of data from a single partition of a single topic via a feature called [Virtual Partitions](https://github.com/karafka/karafka/wiki/Pro-Virtual-Partitions).

Virtual Partitions allow you to parallelize the processing of data from a single partition. This can drastically increase throughput when IO operations are involved.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/stats/virtual_partitions_performance.png" />
</p>
<p align="center">
  <small>*This example illustrates the throughput difference for IO intense work, where the IO cost of processing a single message is 1ms.
  </small>
</p>

You can read more about this feature [here](https://github.com/karafka/karafka/wiki/Pro-Virtual-Partitions).

## Consumer group multi-threading

Since each consumer group requires a separate connection and a thread, we do this concurrently.

It means that for each consumer group, you will have one additional thread running. For high-load topics, there is always an IO overhead on transferring data from and to Kafka. This approach allows you to consume data concurrently.
