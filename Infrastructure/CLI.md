Karafka has a simple CLI built in. It provides the following commands:

<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>help</code></td>
      <td>Describe available commands</td>
    </tr>
    <tr>
      <td><code>console</code></td>
      <td>Start the Karafka irb console similar to the Rails console (short-cut alias: "c")</td>
    </tr>
    <tr>
      <td><code>info</code></td>
      <td>Print configuration details and other options of your application</td>
    </tr>
    <tr>
      <td><code>install</code></td>
      <td>Installs all required things for Karafka application in current directory</td>
    </tr>
    <tr>
      <td><code>server</code></td>
      <td>Start the Karafka server (short-cut aliases: "s", "consumer")</td>
    </tr>
    <tr>
      <td><code>swarm</code></td>
      <td>Start the Karafka server in the swarm mode (multiple forked processes)</td>
    </tr>
    <tr>
      <td><code>topics</code></td>
      <td>Allows for topics management (create, delete, repartition, reset, migrate, align, plan)</td>
    </tr>
    <tr>
      <td><code>topics health</code></td>
      <td>Check Kafka topics for replication and durability issues (Pro)</td>
    </tr>
    <tr>
      <td><code>vps</code></td>
      <td>Display Virtual Partitions Estimator reports (Pro)</td>
    </tr>
  </tbody>
</table>

All the commands are executed the same way:

```shell
bundle exec karafka [COMMAND]
```

To list all available commands with a short description of each, run:

```shell
bundle exec karafka help
```

## Karafka server

### Limiting consumer groups used per process

Karafka supports having multiple consumer groups within a single application. You can run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--include-consumer-groups``` server flag as follows:

```shell
bundle exec karafka server --include-consumer-groups group_name1,group_name3
```

If you specify none, by default, all will run.

You can also exclude certain consumer groups by using the `--exclude-consumer-groups` flag:

```shell
bundle exec karafka server --exclude-consumer-groups group_name2,group_name3
```

### Limiting subscription groups used per process

Karafka supports having multiple subscription groups within a single application. You can run multiple Karafka instances, specifying subscription groups that should be running per each process using the ```--include-subscription-groups``` server flag as follows:

```shell
bundle exec karafka server --include-subscription-groups group_name1,group_name3
```

If you specify none, by default, all will run.

You can also exclude certain subscription groups by using the `--exclude-subscription-groups` flag:

```shell
bundle exec karafka server --exclude-subscription-groups group_name2,group_name3
```

!!! note "Handling Multiplexed Subscription Groups in CLI Commands"

    [Multiplexed](Pro-Consumer-Groups-Multiplexing) subscription group replicas share the same name; multiplexing does not add any postfix to it. Use the subscription group's own name, the same one you would use without multiplexing, when including or excluding it via CLI flags.

### Limiting topics used per process

Karafka supports having multiple topics within a single application. You can run multiple Karafka instances, specifying topics that should be running per each process using the ```--include-topics``` server flag as follows:

```shell
bundle exec karafka server --include-topics topic_name1,topic_name3
```

If you specify none, by default, all will run.

You can also exclude certain topics by using the `--exclude-topics` flag:

```shell
bundle exec karafka server --exclude-topics topic_name2,topic_name5
```

### Using Wildcard Patterns

The `--include-*` and `--exclude-*` server flags for consumer groups, subscription groups and topics accept wildcard patterns in addition to literal names. Karafka treats a value as a pattern when it contains `*`, `?`, `[` or `]`, and matches it like a file name glob. A value without these characters must match the name exactly.

```shell
# Run all consumer groups except those whose names start with app-a-
bundle exec karafka server --exclude-consumer-groups 'app-a-*'

# Mix patterns and literal names
bundle exec karafka server --include-topics 'orders_*',payments
```

Karafka does not check wildcard patterns against your routing, so a pattern that matches nothing does not cause an unknown name error. If no topics remain to subscribe to, the server still refuses to start. When a name matches both an inclusion and an exclusion, inclusion wins, the same as with literal names.

With [Routing Patterns](Pro-Routing-Patterns), topic filters match a pattern by its name, the same as literal names do, so a wildcard can include or exclude whole patterns.

## Karafka Topics Health

!!! info "`topics health` Is a Pro Command"

    The `topics health` command is part of [Karafka Pro](https://karafka.io/#become-pro).

The `topics health` command analyzes your Kafka topics for replication and durability issues. It inspects each topic's replication factor and `min.insync.replicas` setting to detect potential risks.

```shell
bundle exec karafka topics health
```

The command checks for the following conditions:

- **No Redundancy** - Topics with a replication factor of 1, meaning no replicas exist. Any single broker failure will cause data loss.
- **Zero Fault Tolerance** - Topics where the replication factor is less than or equal to `min.insync.replicas`, meaning no broker can fail without causing the topic to become unavailable for writes when producers use `acks=all`.
- **Low Durability** - Topics where `min.insync.replicas` is set to 1, meaning acknowledged writes using `acks=all` only require a single broker, increasing the risk of data loss if that broker fails before replication completes.

Each finding is printed as it is found (in cluster order, not grouped by severity), shown in red for critical issues or yellow for warnings. After all topics are checked, if any issues were found, a generic recommendations summary is printed, covering increasing the replication factor, raising `min.insync.replicas`, and keeping the replication factor above `min.insync.replicas` for fault tolerance. If no issues were found, a single "All topics are healthy" confirmation is printed instead.

## Karafka Info

The `info` command prints the Karafka, Ruby and `karafka-rdkafka` versions, the consumer, share and subscription group counts, the workers count, the client id, the boot file, the environment and the license details:

```shell
bundle exec karafka info
```

Add the `--extended` flag to also print the routing tree, the global application config and the effective Kafka config:

```shell
bundle exec karafka info --extended
```

The extended output adds three sections:

- **Routing** - each consumer group and share group with its state (active or inactive) and its active features. For each subscription group: its name, position, state, `kafka[group.id]`, `max_messages`, `max_wait_time` and, when multiplexing is used, its `min`, `max` and `boot` values. For each topic: its consumer, `max_messages`, `max_wait_time`, `initial_offset`, `consumer_persistence`, pause settings, its own `kafka` settings (when set) and active features.
- **Config** - the global settings: `client_id`, `group_id`, `concurrency`, `max_messages`, `max_wait_time`, `initial_offset`, `shutdown_timeout`, `consumer_persistence`, pause settings, `strict_topics_namespacing` and `strict_declarative_topics`.
- **Kafka Config** - the global `kafka` settings.

!!! info "Sensitive Kafka Values Are Redacted"

    Karafka prints `[REDACTED]` instead of the value of each `kafka` setting whose name contains `password`, `passphrase`, `secret`, `token`, `sasl.oauthbearer.client`, `private.key.pem`, `ssl.key.pem` or `ssl_key` (case-insensitive). This applies to the Kafka Config section and to the per-topic `kafka` settings. Karafka does not redact other values, so `ssl.certificate.pem` and `ssl.ca.pem` are printed.

## Karafka Virtual Partitions

!!! info "`vps` Is a Pro Command"

    The `vps` command is part of [Karafka Pro](https://karafka.io/#become-pro).

The `vps` command (long name: `virtual_partitions`) displays the JSON reports of the [Virtual Partitions Estimator](Pro-Consumer-Groups-Virtual-Partitions#estimating-the-benefit) as plain text. It applies to consumer groups only. Generate the report first from the Karafka console:

```ruby
Karafka::Pro::Processing::ConsumerGroups::VirtualPartitions::Estimator
  .new
  .call('orders', target_file: 'report.json')
```

Then display it:

```shell
# Reads the consumer_groups.virtual_partitions.estimator.report_file path ("report.json" by default)
bundle exec karafka vps estimate-report

# Reads the given file
bundle exec karafka vps estimate-report path/to/report.json
```

`estimate-report` is the default action, so `bundle exec karafka vps` does the same. `bundle exec karafka vps help` lists the available actions.

The report shows the settings used and a table with the stats of each partition. It then shows a summary with the score, the verdict and suggestions. It ends with the limitations of the estimate: the same processing cost for each message and a worker pool shared with other partitions and topics. For the meaning of the values, see [Reading the Result](Pro-Consumer-Groups-Virtual-Partitions#reading-the-result).

When the report cannot be displayed:

- A missing file raises `Errno::ENOENT`.
- A file that is not valid JSON raises `JSON::ParserError`.
- A report that does not pass validation prints the validation errors on one line and exits with code 1. A report with the format version of another Karafka version is one example.

## Karafka Swarm

Swarm has its own section. You can read about it [here](Infrastructure-Swarm-Multi-Process).

## Declarative Topics

Declarative Topics managament via the CLI has its own section. You can read about that [here](Infrastructure-Declarative-Topics).

## Routing Patterns

Routing Patterns managament via the CLI has its own section. You can read about that [here](Pro-Routing-Patterns#limiting-patterns-used-per-process).

## See Also

- [Getting Started](Basics-Getting-Started) - Initial setup and basic CLI usage
- [Deployment](Infrastructure-Deployment) - Using CLI commands in production environments
- [Env Variables](Infrastructure-Env-Variables) - Environment variables affecting CLI behavior
