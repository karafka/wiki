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

```shell
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

### Retryable Methods

It's crucial to understand how Karafka handles retries for different methods in the context of error handling and retries. This understanding is essential for effectively managing error scenarios in your Karafka applications. The framework's behavior varies depending on the method invoked:

<table border="1">
  <thead>
    <tr>
      <th>Method</th>
      <th>Retryable</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>    
    <tr>
      <td><code>#consume</code></td>
      <td>Yes</td>
      <td>Retries occur as Karafka implements a back-off policy for this method, suitable for handling transient issues in message processing.</td>
    </tr>
    <tr>
      <td><code>#revoked</code></td>
      <td>No</td>
      <td>No retries, as this method is called when a partition is lost due to reassignment. Retrying in this context is not logical.</td>
    </tr>
    <tr>
      <td><code>#shutdown</code></td>
      <td>No</td>
      <td>Retries are not applicable, as this method indicates the stopping of the process. Retrying during shutdown doesn't align with its purpose.</td>
    </tr>
    <tr>
      <td><code>#tick</code></td>
      <td>No</td>
      <td>Since this method is invoked frequently, retries are unnecessary and could lead to inefficiencies and redundancy.</td>
    </tr>
    <tr>
      <td><code>#eofed</code></td>
      <td>No</td>
      <td>This method is triggered when the end of a partition is reached. Since it's a normal part of processing when a partition is fully read, retries are unnecessary and not applicable.</td>
    </tr>
    <tr>
      <td><code>#wrap</code></td>
      <td>No</td>
      <td>Wraps the entire consumption lifecycle, including framework-level operations and user-defined logic. Must <strong>always</strong> call <code>yield</code> to ensure that all processing, synchronization, and cleanup actions are executed, even in error scenarios.</td>
    </tr>
  </tbody>
</table>

It's important to note that crashes or exceptions in all these methods, including `#consume`, `#revoked`, `#shutdown`, `#tick` and `#eofed`, are reported through Karafka's error notifications system. However, only errors occurring in the `#consume` method are considered retryable. 

Errors in the other methods (`#revoked`, `#shutdown`, `#tick` and `#eofed`) are not subject to retries. They are reported for logging and monitoring purposes, but aside from this notification, they do not disrupt or halt the ongoing processing of messages. This distinction is crucial for understanding how Karafka manages its resilience and stability in the face of errors.

### Altering the Consumer Behaviour upon Reprocessing

The Karafka consumer `#retrying?` method is designed to detect whether we are in retry mode after an error has occurred. This method can be helpful in a variety of use cases where you need to alter the behavior of your application when a message is being retried. For example, you might want to send an alert or notification when a message is being retried, or you might want to branch out and perform a different action based on the fact that the message is being retried. By detecting whether a message is being retried or not, you can gain better control over your application's behavior and make sure that it is able to handle errors in a way that is appropriate for your specific use case.

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      if retrying?
        puts 'We operate after an error'
        puts message.payload
      else
        puts message.payload
      end
    end
  end
end
```

!!! note ""

    Please note that `retrying?` indicates that an error occurred previously, but you may receive fewer or more messages and previously.

In addition to detecting retry scenarios with `#retrying?`, Karafka provides the `#attempt` method for more nuanced control. This method indicates the current attempt, offering opportunities for specific actions or alerts based on the number of retries. This advanced functionality allows tailored behavior adjustments during message processing retries, enhancing error-handling strategies.

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    # Just move on if not possible to fix error after 10 attempts
    # This is just an example, you probably want a more sophisticated flow
    if attempt > 10
      messages.each do |message|
        begin
          Processor.call(message)
        rescue
          nil
        end
      end
    else
      # Do not silence errors so there is a retry
      messages.each do |message|
        Processor.call(message)
      end
    end
  end
end
```

### Error Tracking

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

### Finding the Failing Message

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

!!! note ""

    When doing batch operations, this message may not be the exact cause of the processing error.

### Exponential Backoff

Karafka is configured with `pause_with_exponential_backoff` enabled (`true`) by default. This configuration doubles the timeout period after each pause until a message from the partition is processed successfully. To prevent the timeout from extending indefinitely, `pause_max_timeout` can be set to your preferred maximum duration. By default, this maximum timeout is set to 30 seconds.

Regardless of the error's nature, the Monitoring and Logging feature can track any issues encountered during operation.

A monitoring and logging layer is strongly recommended to ensure prompt notification of errors that arise while processing Kafka messages.

### Pause Offset Selection

Karafka keeps track of the last committed offset alongside Kafka when you mark a message as consumed. This means that after the pause, Karafka will start back from the failed message, not from the first message from the batch. This approach severely reduces the number of messages that must be reprocessed upon errors.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/on_errors_behaviour.svg" />
</p>

!!! note ""

    This behavior is different in the case of Virtual Partitions. Please refer to [this Wiki section](Pro-Virtual-Partitions#behaviour-on-errors) for more details.

## Shutdown

Karafka will wait for `shutdown_timeout` milliseconds before forcefully stopping in case of errors or problems during the shutdown process. If this value is not set, Karafka will wait indefinitely for consumers to finish processing given messages.

Setting this value high enough is highly recommended so that Karafka won't stop itself in the middle of some non-transactional partially finished operations.

## Internal Framework Errors

Karafka handles framework and Kafka-related errors on several layers, ensuring robust and reliable message processing. Most errors are either recovered automatically or retried based on predefined strategies.

### Error Recovery and Retry Mechanisms

Karafka employs multiple layers of error handling to manage issues seamlessly:

- **Framework-Level Recovery**: Errors related to Karafka's internal operations are handled within the framework. This includes automatic retries and recovery procedures to maintain the stability of the message processing flow.
- **Kafka-Related Errors**: Issues originating from Kafka, such as connectivity problems or message fetching errors, are managed through retries and connection resets. Karafka ensures that these errors do not disrupt the overall processing pipeline.

### Final Recovery Strategy

In cases of unexpected errors within the listeners' loops, Karafka applies a final recovery strategy. This strategy involves resetting the client connection and restarting all associated resources. While this mechanism ensures continued operation, it is considered the last layer of defense.

!!! Warning "User Responsibility for Listener Errors"

    Users should **not** rely on the final recovery strategy as a primary error-handling method. Any errors originating from listeners should be deeply investigated and resolved to prevent recurring issues. Proper error management at the listener level is crucial for maintaining the efficiency and reliability of your Karafka application.
