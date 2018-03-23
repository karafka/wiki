Karafka uses native Ruby threads to handle consumer groups management.

Since each consumer group requires a separate connection and a thread we do this concurrently.

It means, that for each consumer group, you will have one additional thread running. Since for high-load topics, there is always an IO overhead on transferring data from and to Kafka, this approach allows you to process data concurrently.
