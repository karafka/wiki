Karafka uses native Ruby threads to handle consumer groups management.

Since each consumer group requires a separate connection and a thread we do this concurrently.

It means, that for each consumer group, you will have one additional thread running. Since for high-load topics, there is always an IO overhead on transferring data from and to Kafka, this approach allows you to process data concurrently.

It's also worth pointing out, that each consumer group will have one additional thread running created by [Ruby-Kafka](https://github.com/zendesk/ruby-kafka) driver itself, dedicated to async messages consumption. Overall it means that for each consumer group, there will be two additional threads running within a Ruby process.

### How does one scale Karafka to multiple threads per consumer group?

The consumer group will run __your__ business logic within a single thread, however the data is being prefetched from a separate topic, utilizing the Ruby GIL property of not locking on IO. That means, that most of the time you should have data upfront in case of a lag.

If you run more than a single process, the processing will distribute evenly across all the processes.

Let's take following scenario:

- Single topic
- 6 partitions

When you run a single Karafka process with a single consumer group it will consume all the partitions.

However if you run 2 processes each of them will consume 3 partitions.

If you run 7 or more processes, beyond the number of partitions, those will be left redundant.