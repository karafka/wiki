Karafka uses native Ruby threads to handle consumer groups management.

Since each consumer group requires a separate connection and a thread we do this concurrently.

It means, that for each consumer group, you will have one additional thread running.

**Note**: If you're looking for details on multi-process concurrency, you'll be better going to the [Consuming messages](https://github.com/karafka/karafka/wiki/Consuming-messages) section of this Wiki.
