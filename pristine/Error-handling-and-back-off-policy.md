Karafka's behavior upon errors is pretty predictable. There are three stages in which the Karafka server can be:

- Initialization
- Runtime
- Shutdown

Depending on the state, Karafka behaves differently upon encountering exceptions.

## Initialization

Any error that occurs during the `initialization` phase of the `karafka server` will crash it immediately. This also includes critical configuration errors:

```ruby
class KarafkaApp < Karafka::App
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

If a situation like that occurs, Karafka will exit with exit code **1**.

## Runtime

Karafka has a couple of isolation layers that prevent it from being affected by **any** errors or exceptions from the application code.

In any case, as long as system resources (like memory) are available, the Karafka process will **never** crash upon application errors. Also, threads for particular consumer groups and workers are isolated, so as long as you don't do any cross-consumer group work, they won't impact each other in any way.

When processing messages from a Kafka topic, your code may raise any exception inherited from `StandardError`. The cause is typically because of one of the following reasons:

- Your business logic does not behave as you think it should.
- The message being processed is somehow malformed or is in an invalid format.
- You're using external resources such as a database or a network API that are temporarily unavailable.

Your exception will propagate to the framework if not caught and handled within your application code. Karafka will stop processing messages from this topic partition, back off, and wait for a given time defined by the `pause_timeout` setting. This allows the consumer to continue processing messages from other partitions that may not be impacted by the problem while still making sure not to drop the original message. After that time, it will **retry**, processing the same message again. Single Kafka topic partition messages must be processed in order. That's why Karafka will **never** skip any messages.

### Error tracking

Karafka, in the runtime stage, publishes sync and async errors (any that would occur in background threads) to the monitor on an `error.occurred` channel. This allows you to connect any type of error logging or instrumentation by yourself:

```ruby
Karafka.monitor.subscribe 'error.occurred' do |event|
  type = event[:type]
  error = event[:error]
  details = (error.backtrace || []).join("\n")

  puts "Oh no! An error: #{error} of type: #{type} occurred!"
  puts details
end
```

### Dead Letter Queue

Karafka provides out-of-the-box Dead Letter Queue pattern implementation that can be used to move failing messages to a separate topic.

You can read about it [here](Dead-Letter-Queue).

#### Finding the failing message

Whenever a `consumer.consume.error` error occurs, Karafka will publish the `seek_offset` alongside other things. It contains the offset of the first uncommitted message in the `messages` batch.

```ruby
Karafka.monitor.subscribe 'error.occurred' do |event|
  type = event[:type]
  error = event[:error]

  # Skip any other error types
  next unless type == 'consumer.consume.error'

  messages = event[:caller].messages
  seek_offset = event[:seek_offset]

  failing_message = messages.find { |message| message.offset == seek_offset }

  puts "We have failed while processing message with offset: #{failing_message.offset}"
end
```

**Note**: When doing batch operations, this message may not be the exact cause of the processing error.

### Exponential backoff

If needed, you can also use exponential backoff. If `pause_with_exponential_backoff` is enabled, each subsequent pause will cause the timeout to double until a message from the partition has been successfully processed. To not double the time indefinitely, you can please set `pause_max_timeout` to whatever you consider max pause.

Regardless of the error nature, you can always use the [Monitoring and logging](Monitoring-and-logging) to track any problems during work time.

It is highly recommended to have a monitoring and logging layer to notify you about errors that occur while processing Kafka messages.

### Pause offset selection

Karafka keeps track of the last committed offset alongside Kafka when you mark a message as consumed. This means that after the pause, Karafka will start back from the failed message, not from the first message from the batch. This approach severely reduces the number of messages that must be reprocessed upon errors.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/on_errors_behaviour.svg" />
</p>

**Note**: This behavior is different in the case of Virtual Partitions. Please refer to [this Wiki section](Pro-Virtual-Partitions#behaviour-on-errors) for more details.

## Shutdown

Karafka will wait for `shutdown_timeout` milliseconds before forcefully stopping in case of errors or problems during the shutdown process. If this value is not set, Karafka will wait indefinitely for consumers to finish processing given messages.

Setting this value high enough is highly recommended so that Karafka won't stop itself in the middle of some non-transactional partially finished operations.
