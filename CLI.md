Karafka has a simple CLI built in. It provides the following commands:

| Command        | Description                                                                       |
|----------------|-----------------------------------------------------------------------------------|
| help [COMMAND] | Describe available commands or one specific command                               |
| console        | Start the Karafka irb console similar to the Rails console (short-cut alias: "c") |
| info           | Print configuration details and other options of your application                 |
| install        | Installs all required things for Karafka application in current directory         |
| server         | Start the Karafka server (short-cut alias: "s")                                   |

All the commands are executed the same way:

```
bundle exec karafka [COMMAND]
```

If you need more details about each of the CLI commands, you can execute the following command:

```
bundle exec karafka help [COMMAND]
```

## Karafka server

### Running particular consumer groups per process

Karafka supports having multiple consumer groups within a single application. You can run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as follows:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```

If you specify none, by default, all will run.

### Running particular subscription groups per process

Karafka supports having multiple subscription groups within a single application. You can run multiple Karafka instances, specifying subscription groups that should be running per each process using the ```--subscription_groups``` server flag as follows:

```bash
bundle exec karafka server --subscription_groups group_name1 group_name3
```

### Running particular topics per process

Karafka supports having multiple topics within a single application. You can run multiple Karafka instances, specifying topics that should be running per each process using the ```--topics``` server flag as follows:

```bash
bundle exec karafka server --topics topic1 topic2
```
