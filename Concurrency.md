Karafka uses [Celluloid](https://celluloid.io/) actors to handle consumer groups management.

Since each consumer group requires a separate connection and a thread we do this concurrently.

It means, that for each consumer group, you will have one additional thread running.

Karafka allows you to listen with a single consumer group on multiple topics, which means, that you can tune up number of threads that Karafka server runs, accordingly to your needs.