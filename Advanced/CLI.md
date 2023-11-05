Karafka has a simple CLI built in. It provides the following commands:

| Command        | Description                                                                       |
|----------------|-----------------------------------------------------------------------------------|
| help [COMMAND] | Describe available commands or one specific command                               |
| console        | Start the Karafka irb console similar to the Rails console (short-cut alias: "c") |
| info           | Print configuration details and other options of your application                 |
| install        | Installs all required things for Karafka application in current directory         |
| server         | Start the Karafka server (short-cut aliases: "s", "consumer")                     |
| topics         | Allows for topics management (create, delete, repartition, reset, migrate)        |

All the commands are executed the same way:

```
bundle exec karafka [COMMAND]
```

If you need more details about each of the CLI commands, you can execute the following command:

```
bundle exec karafka help [COMMAND]
```

## Karafka server

### Limiting consumer groups used per process

Karafka supports having multiple consumer groups within a single application. You can run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--include-consumer-groups``` server flag as follows:

```bash
bundle exec karafka server --include-consumer-groups group_name1 group_name3
```

If you specify none, by default, all will run.

You can also exclude certain consumer groups by using the `--exclude-consumer-groups` flag:

```bash
bundle exec karafka server --exclude-consumer-groups group_name2
```

### Limiting subscription groups used per process

Karafka supports having multiple subscription groups within a single application. You can run multiple Karafka instances, specifying subscription groups that should be running per each process using the ```--include-subscription-groups``` server flag as follows:

```bash
bundle exec karafka server --include-subscription-groups group_name1 group_name3
```

If you specify none, by default, all will run.

You can also exclude certain subscription groups by using the `--exclude-subscription-groups` flag:

```bash
bundle exec karafka server --exclude-subscription-groups group_name2
```

### Limiting topics used per process

Karafka supports having multiple topics within a single application. You can run multiple Karafka instances, specifying topics that should be running per each process using the ```--include-topics``` server flag as follows:

```bash
bundle exec karafka server --include-topics topic_name1 topic_name3
```

If you specify none, by default, all will run.

You can also exclude certain topics by using the `--exclude-topics` flag:

```bash
bundle exec karafka server --exclude-topics topic_name2
```

## Declarative Topics

Declarative Topics managament via the CLI has its own section. You can read about that [here](Topics-management-and-administration#declarative-topics).

## Routing Patterns

Routing Patterns managament via the CLI has its own section. You can read about that [here](Pro-Routing-Patterns#limiting-patterns-used-per-process).
