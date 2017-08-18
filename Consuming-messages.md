Karafka framework has a long running server process that is responsible for consuming messages.

To start Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

Karafka server can be daemonized with the --daemon flag:

```bash
bundle exec karafka server --daemon
```

**Note**: Keep in mind, that consuming modes are not the same thing as processing modes. Consuming modes describe the way data is being pulled out of Kafka, while processing modes describe how you will be able to interact with this data.

## Consuming modes

Karafka supports two consuming modes:

* ```batch_consuming false``` - in that mode, Karafka will consume one message after another from Kafka.
* ```batch_consuming true```- in that mode, Karafka will consume multiple messages in batches. You can limit number of messages consumed in a single batch, my using the ```max_bytes_per_partition``` configuration option.

Below you can see the difference in between those two:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/consuming_modes.png" alt="Karafka consuming modes" />
</p>

Each of the modes has it's own advantages and disadvantages. If you need help on deciding which road you should go, please visit our [Gitter](https://gitter.im/karafka/karafka) channel and ask for help.