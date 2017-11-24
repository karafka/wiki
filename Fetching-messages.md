Karafka framework has a long running server process that is responsible for fetching and consuming messages.

To start Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

Karafka server can be daemonized with the --daemon flag:

```bash
bundle exec karafka server --daemon
```

Karafka server can be also started with a limited set of consumer groups to work with. This is useful when you want to have a multi-process environment:

```bash
# This karafka server will be consuming only with listed consumer groups
# If you don't provide consumer groups, Karafka will connect using all of them
bundle exec karafka server --consumer-groups=events users
```

**Note**: Keep in mind, that fetching modes are not the same thing as consuming modes. Fetching modes describe the way data is being pulled out of Kafka, while consuming modes describe how you will be able to interact with this data.

## Fetching modes

Karafka supports two fetching modes:

* ```batch_fetching false``` - in that mode, Karafka will fetch one message after another from Kafka.
* ```batch_fetching true```- in that mode, Karafka will fetch multiple messages in batches. You can limit number of messages fetched in a single batch, my using the ```max_bytes_per_partition``` configuration option.

Below you can see the difference in between those two:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/fetching_modes.png" alt="Karafka consuming modes" />
</p>

Each of the modes has it's own advantages and disadvantages. If you need help on deciding which road you should go, please visit our [Gitter](https://gitter.im/karafka/karafka) channel and ask for help.

## Starting particular consumer groups per process

Karafka allows you to listen with a single consumer group on multiple topics, which means, that you can tune up number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as followed:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```