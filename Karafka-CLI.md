### Karafka CLI

Karafka has a simple CLI built in. It provides following commands:

| Command        | Description                                                               |
|----------------|---------------------------------------------------------------------------|
| help [COMMAND] | Describe available commands or one specific command                       |
| console        | Start the Karafka console (short-cut alias: "c")                          |
| flow           | Print application data flow (incoming => outgoing)                        |
| info           | Print configuration details and other options of your application         |
| install        | Installs all required things for Karafka application in current directory |
| routes         | Print out all defined routes in alphabetical order                        |
| server         | Start the Karafka server (short-cut alias: "s")                           |
| worker         | Start the Karafka Sidekiq worker (short-cut alias: "w")                   |

All the commands are executed the same way:

```
bundle exec karafka [COMMAND]
```

If you need more details about each of the CLI commands, you can execute following command:

```
  bundle exec karafka help [COMMAND]
```
