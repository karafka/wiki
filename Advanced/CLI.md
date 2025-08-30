Karafka has a simple CLI built in. It provides the following commands:

| Command        | Description                                                                       |
|----------------|-----------------------------------------------------------------------------------|
| help [COMMAND] | Describe available commands or one specific command                               |
| console        | Start the Karafka irb console similar to the Rails console (short-cut alias: "c") |
| info           | Print configuration details and other options of your application                 |
| install        | Installs all required things for Karafka application in current directory         |
| server         | Start the Karafka server (short-cut aliases: "s", "consumer")                     |
| swarm          | Start the Karafka server in the swarm mode (multiple forked processes)            |
| topics         | Allows for topics management (create, delete, repartition, reset, migrate)        |

All the commands are executed the same way:

```shell
bundle exec karafka [COMMAND]
```

If you need more details about each of the CLI commands, you can execute the following command:

```shell
bundle exec karafka help [COMMAND]
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

    When using CLI commands to include or exclude subscription groups, it is important to remember that [multiplexed](Pro-Multiplexing) subscription group names carry a `_multiplex_NR` postfix matching the multiplexing level. This postfix distinguishes these groups from others and ensures proper identification and handling within the system. For accurate command execution, always verify and include the correct `_multiplex_NR` postfix for the intended multiplexed subscription groups.

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

## Karafka Swarm

Swarm has its own section. You can read about it [here](Swarm-Multi-Process).

## Declarative Topics

Declarative Topics managament via the CLI has its own section. You can read about that [here](Declarative-Topics).

## Routing Patterns

Routing Patterns managament via the CLI has its own section. You can read about that [here](Pro-Routing-Patterns#limiting-patterns-used-per-process).
