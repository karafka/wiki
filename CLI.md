Karafka has a simple CLI built in. It provides following commands:

| Command        | Description                                                               |
|----------------|---------------------------------------------------------------------------|
| help [COMMAND] | Describe available commands or one specific command                       |
| console        | Start the Karafka console (short-cut alias: "c")                          |
| flow           | Print application data flow (incoming => outgoing)                        |
| info           | Print configuration details and other options of your application         |
| install        | Installs all required things for Karafka application in current directory |
| server         | Start the Karafka server (short-cut alias: "s")                           |

All the commands are executed the same way:

```
bundle exec karafka [COMMAND]
```

If you need more details about each of the CLI commands, you can execute following command:

```
  bundle exec karafka help [COMMAND]
```


## Karafka server

### Starting particular consumer groups per process

Karafka allows you to listen with a single consumer group on multiple topics, which means, that you can tune up number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as followed:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```