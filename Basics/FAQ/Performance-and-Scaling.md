1. [Why is Karafka not doing work in parallel when I started two processes?](#why-is-karafka-not-doing-work-in-parallel-when-i-started-two-processes)
1. [What is the optimal number of threads to use?](#what-is-the-optimal-number-of-threads-to-use)
1. [Why is increasing `concurrency` not helping upon a sudden burst of messages?](#why-is-increasing-concurrency-not-helping-upon-a-sudden-burst-of-messages)
1. [How can I make polling faster?](#how-can-i-make-polling-faster)
1. [Why do Karafka reports lag when processes are not overloaded and consume data in real-time?](#why-do-karafka-reports-lag-when-processes-are-not-overloaded-and-consume-data-in-real-time)
1. [Why is my Karafka application consuming more memory than expected?](#why-is-my-karafka-application-consuming-more-memory-than-expected)
1. [How can I optimize memory usage in Karafka?](#how-can-i-optimize-memory-usage-in-karafka)
1. [Are Virtual Partitions effective in case of not having IO or not having a lot of data?](#are-virtual-partitions-effective-in-case-of-not-having-io-or-not-having-a-lot-of-data)
1. [Is the "one process per one topic partition" recommendation in Kafka also applicable to Karafka?](#is-the-one-process-per-one-topic-partition-recommendation-in-kafka-also-applicable-to-karafka)
1. [Does it make sense to have multiple worker threads when operating on one partition in Karafka?](#does-it-make-sense-to-have-multiple-worker-threads-when-operating-on-one-partition-in-karafka)
1. [Why don't Virtual Partitions provide me with any performance benefits?](#why-dont-virtual-partitions-provide-me-with-any-performance-benefits)
1. [What can I do to optimize the latency in Karafka?](#what-can-i-do-to-optimize-the-latency-in-karafka)
1. [What is the maximum recommended concurrency value for Karafka?](#what-is-the-maximum-recommended-concurrency-value-for-karafka)
1. [Are there concerns about having unused worker threads for a Karafka consumer process?](#are-there-concerns-about-having-unused-worker-threads-for-a-karafka-consumer-process)
1. [How can you effectively scale Karafka during busy periods?](#how-can-you-effectively-scale-karafka-during-busy-periods)
1. [What are the benefits of using Virtual Partitions (VPs) in Karafka?](#what-are-the-benefits-of-using-virtual-partitions-vps-in-karafka)
1. [What's the difference between increasing topic partition count and using VPs in terms of concurrency?](#whats-the-difference-between-increasing-topic-partition-count-and-using-vps-in-terms-of-concurrency)
1. [How do Virtual Partitions compare to multiple subscription groups regarding performance?](#how-do-virtual-partitions-compare-to-multiple-subscription-groups-regarding-performance)
1. [Why Is Kafka Using Only 7 Out of 12 Partitions Despite Specific Settings?](#why-is-kafka-using-only-7-out-of-12-partitions-despite-specific-settings)
1. [How can I ensure that my Karafka consumers process data in parallel?](#how-can-i-ensure-that-my-karafka-consumers-process-data-in-parallel)
1. [How should I handle the migration to different consumer groups for parallel processing?](#how-should-i-handle-the-migration-to-different-consumer-groups-for-parallel-processing)
1. [What are the best practices for setting up consumer groups in Karafka for optimal parallel processing?](#what-are-the-best-practices-for-setting-up-consumer-groups-in-karafka-for-optimal-parallel-processing)
1. [Is Multiplexing an alternative to running multiple Karafka processes but using Threads?](#is-multiplexing-an-alternative-to-running-multiple-karafka-processes-but-using-threads)
1. [How can Virtual Partitions help with handling increased consumer lag in Karafka?](#how-can-virtual-partitions-help-with-handling-increased-consumer-lag-in-karafka)
1. [Is scaling more processes a viable alternative to using Virtual Partitions?](#is-scaling-more-processes-a-viable-alternative-to-using-virtual-partitions)
1. [What is the optimal strategy for scaling in Karafka to handle high consumer lag?](#what-is-the-optimal-strategy-for-scaling-in-karafka-to-handle-high-consumer-lag)
1. [How does Karafka behave under heavy lag, and what should be considered in configuration?](#how-does-karafka-behave-under-heavy-lag-and-what-should-be-considered-in-configuration)
1. [Why don't my autoscaled consumers rebalance partitions when scaling up with multiplexing enabled?](#why-dont-my-autoscaled-consumers-rebalance-partitions-when-scaling-up-with-multiplexing-enabled)

---

## Why is Karafka not doing work in parallel when I started two processes?

Please make sure your topic contains more than one partition. Only then Karafka can distribute the work to more processes. Keep in mind, that all the topics create automatically with the first message sent will always contain only one partition. Use the Admin API to create topics with more partitions.

## What is the optimal number of threads to use?

The optimal number of threads for a specific application depends on various factors, including the number of processors and cores available, the amount of memory available, and the particular tasks the application performs and their type. In general, increasing number of threads brings the most significant benefits for IO-bound operations.

It's recommended to use the number of available cores to determine the optimal number of threads for an application.

When working with Karafka, you also need to take into consideration things that may reduce the number of threads being in use, that is:

- Your topics count.
- Your partitions count.
- Number of processes within a given consumer group.
- To how many topics and partitions a particular process is subscribed to.

Karafka can parallelize work in a couple of scenarios, but unless you are a [Karafka Pro](https://karafka.io/#become-pro) user and you use [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions), in a scenario where your process is assigned to a single topic partition, the work will always happen only in a single thread.

You can read more about Karafka and Karafka Pro concurrency model [here](Consumer-Groups-Concurrency-and-Multithreading).

It's also essential to monitor the performance of the application and the system as a whole while experimenting with different thread counts. This can help you identify bottlenecks and determine the optimal number of threads for the specific use case.

Remember that the optimal number of threads may change as the workload and system resources change over time.

## Why is increasing `concurrency` not helping upon a sudden burst of messages?

Karafka uses multiple threads to process messages from multiple partitions or topics in parallel. If your consumer process has a single topic partition assigned, increasing `concurrency` will not help because there is no work that could be parallelized.

To handle such cases, you can:

- Increase the number of partitions beyond the number of active consumer processes to achieve multiple assignments in a single consumer process. In a case like this, the given process will be able to work in parallel.
- Use [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions) to parallelize the work of a single topic partition.

You can read more about the Karafka concurrency model [here](Consumer-Groups-Concurrency-and-Multithreading).

## How can I make polling faster?

You can decrease the `max_wait_time` Karafka configuration or lower the `max_messages` setting.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other settings...

    # Wait for messages at most 100ms
    config.max_wait_time = 100
    # If you got 10 messages faster than in 100ms also don't wait any longer
    config.max_messages = 10
  end
end
```

## Why do Karafka reports lag when processes are not overloaded and consume data in real-time?

Kafka's consumer lag, which is the delay between a message being written into a Kafka topic and being consumed, is dictated not only by the performance of your consumers but also by how messages are marked as consumed in Kafka. This process of marking messages as consumed is done by committing offsets.

After processing each message or batch, consumers can commit the offset of messages that have been processed, to Kafka, to mark them as consumed. So, Kafka considers the highest offset that a consumer group has committed for a partition as the current position of the consumer group in that partition.

Now, if we look at Karafka, it follows a similar mechanism. In Karafka, by default, offsets are committed automatically in batches after a batch of messages is processed. That means if a batch is still being processed, the messages from that batch are not marked as consumed, even if some of them have already been processed, and hence those messages will still be considered as part of the consumer lag.

This lag will grow with incoming messages, which is why it's not uncommon to see a lag of the size of one or two batches, especially in topics with high data traffic.

To mitigate this situation, you can configure Karafka to prioritize latency over throughput. That means making Karafka commit offsets more frequently, even after each message, to decrease the lag and to fetch data more frequently in smaller batches. But keep in mind that committing offsets more frequently comes with the cost of reduced throughput, as each offset commit is a network call and can slow down the rate at which messages are consumed.

You can adjust this balance between latency and throughput according to your specific use case and the performance characteristics of your Kafka cluster. You could increase the frequency of committing offsets during peak load times and decrease it during off-peak times if it suits your workload pattern.

## Why is my Karafka application consuming more memory than expected?

Several factors may lead to increased memory consumption:

- **Large Payloads**: Handling large message payloads can inherently consume more memory. Remember that Karafka will keep the raw payload alongside newly deserialized information after the message is deserialized.

- **Batch Processing**: This can accumulate memory usage if you're processing large batches containing bigger messages.

- **Memory Leaks**: There might be memory leaks in your application or the libraries you use.

If your problems originate from batch and message sizes, we recommend looking into our [Pro Cleaner API](Pro-Cleaner-API).

## How can I optimize memory usage in Karafka?

- **Use Cleaner API**: The [Cleaner API](Pro-Cleaner-API), a part of Karafka Pro, provides a powerful mechanism to release memory used by message payloads once processed. This becomes particularly beneficial for 10KB or larger payloads, yielding considerable memory savings and ensuring a steadier memory usage pattern.

- **Adjust `librdkafka` Memory Settings**: The underlying library, `librdkafka`, has configurations related to memory usage. Tuning these settings according to your application's needs can optimize the memory footprint. Amongst others you may be interested in looking into the following settings: `fetch.message.max.bytes`, `queued.min.messages`, `queued.max.messages.kbytes` and `receive.message.max.bytes`

- **Modify the `max_messages` Value**: By adjusting the `max_messages` setting to a lower value, you can control the number of messages deserialized in a batch. Smaller batches mean less memory consumption at a given time, although it might mean more frequent fetch operations. Ensure that you balance memory usage with processing efficiency while adjusting this value.

While tuning these settings can help optimize memory usage, it's essential to remember that it may also influence performance, latency, and other operational aspects of your Karafka applications. Balancing the memory and performance trade-offs based on specific application needs is crucial. Always monitor the impacts of changes and adjust accordingly.

## Are Virtual Partitions effective in case of not having IO or not having a lot of data?

Karafka's [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions) are designed to parallelize data processing from a single partition, which can significantly enhance throughput when IO operations are involved. However, if there's minimal IO and not many messages to process, Virtual Partitions may not bring much advantage, as their primary benefit is realized in the presence of IO bottlenecks or large volumes of data. That said, even if your topics have a low average throughput, Virtual Partitions can still be a game-changer when catching up on lags. Virtual Partitions can speed up the catch-up process by processing the backlog of messages concurrently when there's a data buildup due to processing delays.

## Is the "one process per one topic partition" recommendation in Kafka also applicable to Karafka?

Having one process per one topic partition in Kafka is a solid recommendation, especially for CPU-bound work. Here's why: When processing is CPU-intensive, having a single process per partition ensures that each partition gets dedicated computational resources. This prevents any undue contention or resource sharing, maximizing the efficiency of CPU utilization.

However, Karafka's design philosophy and strengths come into play in a slightly different context. Most real-world applications involve IO operations – database reads/writes, network calls, or file system interactions. These operations inherently introduce waiting times, where Karafka stands out. Being multi-threaded, Karafka allows for concurrent processing. So, even when one thread waits for an IO operation, another can actively process data. This means that for many IO-bound applications, consuming a single Karafka process from multiple partitions can be more efficient, maximizing resource utilization during IO waits.

Furthermore, Karafka introduces an additional layer of flexibility with its [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions). Even if you're consuming data from a single topic partition, you can still leverage the power of parallelism using Virtual Partitions. They enable concurrently processing data from a singular topic partition, thus giving you the benefits of multi-threading even in scenarios with fewer actual topic partitions than processing threads.

In summary, while the "one process per partition" recommendation is sound for CPU-intensive tasks when IO operations are the predominant factor, Karafka's multi-threaded design combined with the capability of Virtual Partitions can offer a more efficient processing strategy.

## Does it make sense to have multiple worker threads when operating on one partition in Karafka?

Yes, but only when you employ [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions).

Without utilizing Virtual Partitions, Karafka's behavior is such that it will use, at most, as many worker threads concurrently as there are assigned partitions. This means that if you're operating on a single partition without virtualization, only one worker thread will be actively processing messages at a given time, even if multiple worker threads are available.

However, with Virtual Partitions, you can parallelize data processing even from a single partition. Virtual Partitions allow the data from one Kafka partition to be virtually "split", enabling multiple worker threads to process that data concurrently. This mechanism can be especially beneficial when dealing with IO operations or other tasks that introduce latencies, as other threads can continue processing while one is waiting.

Karafka provides a Web UI where you can monitor several metrics, including threads utilization. This gives you a clear view of how efficiently your threads are being used and can be a helpful tool in determining your setup's effectiveness.

In summary, while operating on a single partition typically uses just one worker thread, integrating Virtual Partitions in Karafka allows you to effectively utilize multiple worker threads, potentially boosting performance and throughput.

## Why don't Virtual Partitions provide me with any performance benefits?

[Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions) in Karafka are primarily designed to increase parallelism when processing messages, which can significantly improve throughput in the right circumstances. However, there are several scenarios where the benefits of Virtual Partitions might not be evident:

1. **Not Enough Messages in Batches**: If there aren't many messages within the batches you're processing, splitting these already-small batches among multiple virtual partitions won't yield noticeable performance gains. There needs to be more work to be shared among the virtual partitions, leading to underutilization.

1. **No IO Involved**: Virtual Partitions shine in scenarios where IO operations (e.g., database reads/writes, network calls) are predominant. These operations often introduce latencies, and with virtual partitions, while one thread waits on an IO operation, another can process data. If your processing doesn't involve IO, the parallelism introduced by virtual partitions might not offer substantial benefits.

1. **Heavy CPU Computations**: If the primary task of your consumer is CPU-intensive computations, then the overhead introduced by managing multiple threads might offset the benefits. CPU-bound tasks usually require dedicated computational resources, and adding more threads (even with virtual partitions) might introduce contention without increasing throughput.

1. **Virtual Partitioner Assigns Data to a Single Virtual Partition**: The purpose of virtual partitions is to distribute messages across multiple virtual sub-partitions for concurrent processing. If your virtual partitioner, for whatever reason, is consistently assigning messages to only one virtual partition, you effectively negate the benefits. This scenario is akin to not using virtual partitions, as all messages would be processed serially in a single "stream".

In conclusion, while Virtual Partitions can be a potent tool for improving throughput in certain scenarios, their utility is context-dependent. It's essential to understand the nature of the work being done, the volume of messages, and the behavior of the virtual partitioner to ascertain the effectiveness of virtual partitions in your setup.

## What can I do to optimize the latency in Karafka?

Optimizing latency in Karafka involves tweaking various configurations and making specific architectural decisions. Here are some strategies to reduce latency:

- **Max Wait Time Adjustments**: The `max_wait_time` parameter determines the maximum time the consumer will block, waiting for sufficient data to come in during a poll before it returns control. By adjusting this value, you can balance between latency and throughput. If end-to-end latency is a primary concern and your consumers want to react quickly to smaller batches of incoming messages, consider reducing the max_wait_time. A shorter wait time means the process will fetch messages more frequently, leading to quicker processing of smaller data batches.

- **Batch Size Adjustments**: Use the `max_messages` parameter to control the number of messages fetched in a single poll. Decreasing the batch size can reduce the time taken to process each batch, potentially reducing end-to-end latency. However, note that smaller batches can also decrease throughput, so balance is key.

- **Increase Consumer Instances**: Scale out by adding more consumer instances to your application. This allows you to process more messages concurrently. However, ensure you have an appropriate number of topic partitions to distribute among the consumers and monitor the utilization of Karafka processes.

- **Leverage Virtual Partitions**: Virtual Partitions can be beneficial if your workload is IO-bound. You can better utilize available resources and potentially reduce processing latency by enabling further parallelization within a single partition.

- **Optimize Message Processing**: Review the actual processing logic in your consumers. Consider optimizing database queries, reducing external service calls, or employing caching mechanisms to speed up processing.

Remember, the best practices for optimizing latency in Karafka will largely depend on the specifics of your use case, workload, and infrastructure. Regularly monitoring, testing, and adjusting based on real-world data will yield the best results.

## What is the maximum recommended concurrency value for Karafka?

For a system with a single topic and a process assigned per partition, there's generally no need for multiple workers. `50` workers are a lot, and you might not fully utilize them because of the overhead from context switching. While Sidekiq and Karafka differ in their internals, not setting concurrency too high is a valid point for both. The same applies to the connection pool.

## Are there concerns about having unused worker threads for a Karafka consumer process?

The overhead of unused worker threads is minimal because they are blocked on pop, which is efficient, so they are considered sleeping. However, maintaining an unused pool of workers can distort the utilization metric, as a scenario where all workers are always busy is regarded as 100% utilized.

## How can you effectively scale Karafka during busy periods?

If you plan to auto-scale for busy periods, be aware that increasing scale might lead to reduced concurrency, especially if you are IO-intensive. With Karafka, how data is polled from Kafka can be a critical factor. For instance, thread utilization might be at most 50% even if you process two partitions in parallel because the batches you are getting consist primarily of data from a single partition. For handling of such cases, we recommend using [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions).

## What are the benefits of using Virtual Partitions (VPs) in Karafka?

[Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions) allow for more concurrent consumption, which could also be achieved by increasing the partition count. However, with Karafka, VPs operate regardless of whether you poll a batch from one or many partitions. This effectively fills up workers with tasks. If you are not well-tuned for polling the right amount of data, lags might reduce concurrency. Utilizing VPs can improve performance because they can parallelize data processing for a single topic partition based on a virtual partitioner key.

## What's the difference between increasing topic partition count and using VPs in terms of concurrency?

Increasing topic partition count and Karafka concurrency (so that total worker threads match the total partitions) can parallelize work in Karafka. This strategy works as long as the assignment has consistent polling characteristics. With VPs, uneven distribution impact is negligible. This is because Karafka VPs can parallelize data processing of a single topic partition based on a virtual partitioner key, compensating for any uneven distribution from polling.

## How do Virtual Partitions compare to multiple subscription groups regarding performance?

Using [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions) is not the same as increasing the number of partitions. You'd need to align the number of processes and match them with partitions to achieve similar results with multiple subscription groups. However, this might increase the number of Kafka connections, potentially leading to misassignments and sub-optimal resource allocation.

## Why Is Kafka Using Only 7 Out of 12 Partitions Despite Specific Settings?

The issue you're encountering typically arises due to how Kafka calculates partition assignments when a key is provided. Kafka uses a hashing function (CRC32 by default) to determine the partition for each key. This function might not evenly distribute keys, especially if the key space is not large or diverse enough.

As discussed, since the partitioner was configured to use the first argument (carrier name) as the key, the diversity and number of unique carrier names directly influence the distribution across partitions. If some carrier names hash the same partition, you will see less than 12 partitions being used.

## How can I ensure that my Karafka consumers process data in parallel?

Karafka utilizes multiple threads to consume and process data, allowing operations across multiple partitions or topics to occur in parallel. However, the perception of sequential processing might occur due to several factors, such as configuration, scale, and system design. To enhance parallel processing:

- **Consumer Groups**: If you require completely independent processing streams, utilize multiple consumer groups. Each consumer group manages its connection, polling, and data handling.

- **Subscription Groups**: You can set up multiple subscription groups within a single consumer group. Each subscription group can subscribe to different topics, enabling parallel data fetching within the same consumer group.

- **Configuration**: Ensure your settings like `max.partition.fetch.bytes` and `max.poll.records are optimized based on your message size and throughput requirements. This helps in fetching data efficiently from multiple partitions.

By properly configuring consumer and subscription groups and optimizing Kafka connection settings, you can achieve effective parallel data processing in Karafka.

## How should I handle the migration to different consumer groups for parallel processing?

Migrating to different consumer groups to facilitate parallel processing involves a few considerations:

- **Offset Management**: When introducing new consumer groups, they typically consume from the latest or earliest offset by default. This behavior can be managed using the `Karafka::Admin#seek_consumer_group` feature in newer Karafka releases, allowing you to specify the starting offset for each new consumer group.

- **Consumer Group Configuration**: Implementing multiple consumer groups or adjusting subscription groups within a consumer group can help distribute the workload more evenly. This setup minimizes the risk of any one consumer group becoming a bottleneck.

- **Testing in Staging**: Before rolling out changes in production, thoroughly test the new consumer group configurations in a staging environment. This helps identify any potential issues with offset handling or data processing delays.

## What are the best practices for setting up consumer groups in Karafka for optimal parallel processing?

Best practices for setting up consumer groups in Karafka to optimize parallel processing include:

Best practices for setting up consumer groups in Karafka to optimize parallel processing include:

- **Dedicated Consumer Groups**: Allocate a consumer group for each logically separate function within your application. This isolation helps in managing the processing load and minimizes the impact of rebalances.

- **Subscription Group Utilization**: Within a consumer group, use subscription groups to handle different topics or partitions. This setup provides flexibility in managing which part of your application handles specific data streams.

- **Resource Allocation**: Ensure that each consumer group and subscription group is allocated adequate resources such as CPU and memory to handle the expected workload. This allocation prevents performance bottlenecks due to resource contention.

- **Monitoring and Scaling**: Regularly monitor the performance of your consumer groups and adjust their configurations as necessary. Utilize Karafka’s monitoring tools to track processing times, throughput, and lag to make informed scaling decisions.

Implementing these best practices will help you fully leverage Karafka’s capabilities for parallel processing, enhancing the throughput and efficiency of your Kafka data pipelines.

## Is Multiplexing an alternative to running multiple Karafka processes but using Threads?

No, multiplexing serves a different use case. It's primarily for handling IO-bound operations, dealing with connections, and polling rather than work distribution and execution. Multiplexing is specifically for connection multiplexing within the same topic. Tuning Karafka processing is complex due to its flexibility. It can be influenced by the nature of your processing, deployment type, and data patterns, and there is no one best solution.

## How can Virtual Partitions help with handling increased consumer lag in Karafka?

Virtual Partitions (VPs) can significantly improve the parallelism of message consumption in Karafka. Suppose you have a topic with 6 partitions and are running 6 processes (each with 1 partition assigned). In that case, the parallelism is limited to one thread per partition. Using VPs, you can further split the data from each partition into multiple virtual partitions, allowing more threads to process the data concurrently. For example, with 5 virtual partitions per physical partition, you can achieve 30 virtual partitions, increasing the throughput and reducing the lag more efficiently.

## Is scaling more processes a viable alternative to using Virtual Partitions?

Scaling processes can help up to the number of partitions available. For instance, with 6 partitions, you can scale up to 6 processes. Beyond that, additional processes will not contribute to processing since Kafka consumer groups assign one partition per process. Each process will run a single thread per partition, which can become IO-constrained, especially with tasks like bulk inserts into Timescale. In contrast, using VPs allows better utilization of threads within the same partitions, providing a cost-effective performance boost without needing to scale processes proportionally.

## What is the optimal strategy for scaling in Karafka to handle high consumer lag?

The optimal strategy depends on your specific processing patterns and data distribution. A balanced approach involves using a combination of more partitions and virtual partitions. For example, with 6 partitions, you could configure 2 processes with VPs that utilize half the concurrency each and a multiplexing factor of 2. This setup can balance cost and performance well, ensuring you have enough headroom to handle lag spikes efficiently.

## How does Karafka behave under heavy lag, and what should be considered in configuration?

Under heavy lag, incorrect settings can reduce Karafka's ability to utilize multiple threads effectively. While Karafka may perform well with multiple threads under normal conditions, heavy lag can force it to operate with reduced concurrency. Configuring Karafka with appropriate settings is crucial to maintaining optimal performance during lag periods. Understanding how to balance threads, processes, and virtual partitions is key to effectively managing high-lag situations.

## Why don't my autoscaled consumers rebalance partitions when scaling up with multiplexing enabled?

This is typically caused by a multiplexing configuration that creates more connections than available partitions. When you use `multiplexing(max: N)`, each multiplexed connection is treated by Kafka as a separate process/consumer. If your `max` value equals or exceeds your partition count, all partitions are already assigned to the existing multiplexed connections, leaving no partitions available for newly scaled consumers.

Here's what may happen:

- Topic has 4 partitions
- Single consumer process with `multiplexing(max: 4)`
- Kafka sees this as 4 separate consumers, each getting 1 partition
- When you scale up by adding more processes, there are no unassigned partitions left

**Solutions:**

**Use min-max multiplexing strategy:**

```ruby
multiplexing(min: 1, max: YOUR_ENV_VARIABLE, boot: 1)
```

This starts with minimal multiplexing (1 connection) and only scales up multiplexing when there's available capacity after at least one minute from the last rebalance.

**Reduce multiplexing max value:**

Set your multiplexing `max` to be less than your partition count, allowing room for additional consumer processes.

**Increase partition count:**

If you need both high multiplexing and multiple processes, consider increasing your topic's partition count.
