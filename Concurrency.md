Karafka uses [Celluloid](https://celluloid.io/) actors to handle consumer groups management.

Since each consumer group requires a separate connection and a thread we do this concurrently.

It means, that for each consumer group, you will have one additional thread running.

Karafka allows you to listen with a single consumer group on multiple topics, which means, that you can tune up number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as followed:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```