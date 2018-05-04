Karafka's behavior upon errors is pretty predictable. There are 3 stages in which Karafka server can be:

- Initialization
- Runtime
- Shutdown

Depending on the state Karafka behaves differently upon encountering exceptions.

## Initialization

Any error that occurs during the `initialization` phase of the `karafka server` will crash it immediately. This includes also critical configuration errors:

```ruby
class App < Karafka::App
  setup do |config|
    # Client id must always be present
    config.client_id = nil
  end
end
```

```bash
bundle exec karafka server
bundler: failed to load command: karafka
Karafka::Errors::InvalidConfiguration: {:client_id=>["must be filled"]}
```

If situation like that occurs, Karafka will exit with exit code **1**.

## Runtime

Karafka has couple of isolation layers that prevent it from being affected by **any** errors or exceptions from the application code.

At any case, as long as system resources (like memory) are available, Karafka process will **never** crash upon application exceptions. Also, threads for particular consumer groups are completely isolated, so as long as you don't do any cross consumer group work, they won't impact each other in any way.

When processing messages from a Kafka topic, your code may raise any exception. The cause is typically because of one of the following reasons:

- You're business logic does not behave the way you think it should.
- The message being processed is somehow malformed or is in an invalid format.
- You're using some external resources such as a database or a network API that are temporarily unavailable.

If not caught and handled within your application code, your exception will propagate to the framework. Karafka will stop processing messages from this topic partition, back off and wait for a given period of time defined by the `pause_timeout` [config](https://github.com/karafka/karafka/blob/master/lib/karafka/setup/config.rb#L77) setting. This allows the consumer to continue processing messages from other partitions that may not be impacted by the problem while still making sure to not drop the original message. After that period of time, it will **retry** processing same message again. Single Kafka topic partition messages must be processed in order, that's why Karafka will **never** skip any messages.

### Exponential back off

If needed, you can also use exponential back off. If `pause_exponential_backoff` is enabled, each subsequent pause will cause the timeout to double until a message from the partition has been successfully processed. In order not to double the time indefinitely you can, please set `pause_max_timeout` to whatever you consider max pause.

Regardless of the error nature, you can always use the [Monitoring and logging](https://github.com/karafka/karafka/wiki/Monitoring-and-logging) to track any problems that occur during the work time.

It is highly recommended to have a monitoring and logging layer in place, so you get notified about errors that occur while processing Kafka messages.

## Shutdown

In case of errors or problems that occur during the shutdown process, Karafka will wait for `shutdown_timeout` seconds before forcefully stopping. Note, that if this value is not set, Karafka will wait indefinitely for consumers to finish processing given messages.

It is highly recommended to set this value high enough, so Karafka won't stop itself in the middle of some non-transactional partially finished operations.