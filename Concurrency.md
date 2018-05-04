Karafka uses native Ruby threads to handle consumer groups management.

Since each consumer group requires a separate connection and a thread we do this concurrently.

It means, that for each consumer group, you will have one additional thread running. Since for high-load topics, there is always an IO overhead on transferring data from and to Kafka, this approach allows you to process data concurrently.

It's also worth pointing out, that each consumer group will have one additional thread running created by [Ruby-Kafka](https://github.com/zendesk/ruby-kafka) driver itself, dedicated to async messages consumption. Overall it means that for each consumer group, there will be two additional threads running within a Ruby process.