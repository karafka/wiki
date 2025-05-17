Periodic Jobs are a feature designed to allow consumers to perform operations at regular intervals, even without new data. This capability is particularly useful for applications that require consistent action, such as window-based operations or maintaining system readiness.

## Using Periodic Jobs

To leverage this functionality, you must enable and configure it within your routing and implement the corresponding `#tick` method in your consumer. Here's how to get started:

### Enabling Periodic Jobs in Routing

To enable periodic jobs for a particular topic, specify it in the routing. This can be done in two ways, depending on your needs:

1. **Using Default**: To use the default settings, enable periodic jobs for your topic as follows:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      # Tick at most once every five seconds
      periodic true
    end
  end
end
```

2. **Custom Arguments**: If the default settings do not meet your requirements, you can always specify each of the options:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      periodic(
        # Tick at most once every 100 milliseconds
        interval: 100,
        # When paused (for any reason) run
        during_pause: true,
        # When consumption error occurred and we back-off and wait, do not run
        during_retry: false
      )
    end
  end
end
```

The following options are available:

<table>
  <tr>
    <th>Option</th>
    <th>Type</th>
    <th>Default</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>:interval</code></td>
    <td>Integer</td>
    <td><code>5000</code></td>
    <td>Minimum interval in milliseconds to run periodic jobs on the given topic.</td>
  </tr>
  <tr>
    <td><code>:during_pause</code></td>
    <td>Boolean, nil</td>
    <td>
      <ul>
        <li>
          <code>true</code> for regular jobs.
        </li>
        <li>
          <code>false</code> for <a href="https://karafka.io/docs/Pro-Long-Running-Jobs/">LRJ</a>
        </li>
      </ul>
    </td>
    <td>Specifies whether periodic jobs should run when the partition is paused.</td>
  </tr>
  <tr>
    <td><code>:during_retry</code></td>
    <td>Boolean, nil</td>
    <td><code>false</code></td>
    <td>Indicates whether periodic jobs should run during a retry flow after an error. Note that <code>:during_pause</code> must also be <code>true</code> for this to function. The default is not to retry during retry flow unless explicitly set.</td>
  </tr>
</table>

### Implementing the `#tick` Method

After enabling periodic jobs in the routing, you must implement a `#tick` method in your consumer. This method is where you define the tasks to be performed at each tick. Here's an example of a consumer with a `#tick` method:

```ruby
class Consumer < Karafka::BaseConsumer
  def consume; end

  def tick
    puts "Look, mom, I'm periodic!"
  end
end
```

In this example, the `#tick` method prints a message, but it could perform any task in a real-world scenario, such as processing data, sending alerts, or updating a database. There are no additional actions required beyond implementing this method.

### Compatibility with Kafka Operations

One of the significant advantages of periodic jobs is that they are fully compatible with regular Kafka-related operations. This means you can perform standard actions within your periodic jobs as you would in a stable consumption context. These operations include:

<table>
  <tr>
    <th>Operation</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>Seeking</td>
    <td>Changing the consumer's position to a specific offset within a partition.</td>
  </tr>
  <tr>
    <td>Pausing and Resuming</td>
    <td>Temporarily halting the consumption of a topic and then resuming it.</td>
  </tr>
  <tr>
    <td>Marking Messages as Consumed</td>
    <td>Indicating that a message has been successfully processed and should not be re-consumed.</td>
  </tr>
  <tr>
    <td>Transactions</td>
    <td>Managing a group of producer and consumer actions as a single atomic operation.</td>
  </tr>
</table>

This compatibility ensures that integrating periodic jobs into your application does not limit your ability to interact with Kafka in the usual ways. It provides a powerful combination of regular message consumption with the ability to perform scheduled tasks, making your applications more flexible and reliable.

Below, you can find an example of a feature-flag / toggle-based processing that allows us to pause and resume processing depending on the toggle state:

```ruby
class Consumer < Karafka::BaseConsumer
  # Week in milliseconds for pausing
  WEEK_IN_MS = 604_800_000

  def consume
    # If flipper is off and we should not process this topic
    unless Flipper.enabled?(:topics_processing, topic.name)
      # We need to make sure we indicate that sleeping is happening because we explicitely
      # wanted it and not because of some system events (LRJ, error, etc)
      @paused_because_of_flipper = true
      # Pause for a long time...
      pause(messages.first.offset, WEEK_IN_MS)
      return
    end

    messages.each do |message|
      Events.persist!(message.payload)
    end
  end

  # During tick we can just check if flipper is enabled and we should resume
  def tick
    # Do nothing if pausing did not happen because of flipper but for other reasons
    return unless @paused_because_of_flipper
    # Do nothing if we are still not supposed to process this topic
    return unless Flipper.enabled?(:topics_processing, topic.name)

    @paused_because_of_flipper = false
    # Resume processing of this topic when it is time
    resume 
  end
end
```

## Polling and Ticking Interdependency

Understanding the interplay between polling and ticking is crucial for effectively managing both message consumption and the execution of periodic jobs. This interdependency ensures that the system not only fetches and processes messages efficiently but also executes regular, time-sensitive tasks even during low or no data activity periods.

!!! note "Timing of Periodic Jobs"

    Remember that periodic jobs in Karafka may start immediately after the Kafka assignment is ready, potentially before the first batch of messages is received. Ensure your `#tick` method is designed to handle this scenario effectively.

    In such scenarios, using the `#used?` method is always recommended. This can be done using a conditional statement that checks if there was even a single batch consumed or scheduled for consumption.

### Polling Mechanism and Its Impact on Ticking

Polling in Karafka refers to the process of retrieving messages from Kafka. This occurs at intervals defined by the `max_wait_time`, which dictates how long the consumer should wait for messages. After each poll operation:

- Karafka stops polling momentarily and yields the fetched messages to the scheduler for distribution and execution.
- In cases where no data is fetched for a given topic partition and periodic jobs are enabled, a periodic job may be scheduled unless the interval is too short.

### Ticking and Periodic Jobs Scheduling

Ticking relates to the scheduling of periodic jobs at regular intervals. The nuances of how ticking works within the polling mechanism are crucial:

- **Interdependency**: The polling intervals directly impact the ticking of periodic jobs. If the polling is infrequent or the message processing time is lengthy, the ticking for periodic jobs will be delayed correspondingly.

- **Minimum Interval Setting**: The interval parameter in periodic jobs denotes the minimum time between executions for a single topic partition. However, due to the interdependency with polling, the actual interval might be longer. Each poll can trigger only one periodic job execution per topic partition.

- **Processing Time Impact**: The duration of message processing can significantly affect ticking. For instance, if a subscription group's message processing blocks polling for an extended period, even a short-interval periodic job will be delayed, running less frequently than configured.

### Managing Overlap in Periodic and Long-Running Jobs

Karafka doesn't start Periodic Jobs for a given topic partition when a Long-Running Job (LRJ) is active by default. However, this doesn't prevent an LRJ from initiating while a periodic job runs, as these are non-blocking and can overlap. While this overlapping can be advantageous for independent tasks, it might cause issues for tasks sharing resources or influencing each other.

To prevent concurrent executions and potential conflicts, consider using the `#synchronize` method. This feature ensures that only one job instance runs simultaneously, safeguarding against overlapping. 

```ruby
class LongRunningConsumer < ApplicationConsumer
  def consume
    # This will ensure that tick and consume won't run at the same time
    synchronize do
      compute_current_state
      flush_to_db
    end
  end

  def tick do
    synchronize do
      compute_current_state
      flush_to_db
    end
  end
end
```

### Strategies for Accurate and Independent Ticking

To maintain accurate and independent ticking, irrespective of polling intervals and message processing times, consider the following approaches:

- **Independent Subscription Groups**: Utilize separate subscription groups for different topics or partitions. This isolates the periodic jobs, preventing the processing time of one group from affecting the ticking of another.

- **Connection Multiplexing**: Implement multiple connections to Kafka within the same application. This ensures that lengthy processing in one part of your application doesn't delay the execution of periodic jobs in another.

- **Long-Running and Non-Blocking Jobs (LRJ/NBJ) Usage**: For scenarios where you are dealing with long-running or non-blocking jobs, it's beneficial to design your tasks so they do not block the main thread. In these cases, the work being processed is non-blocking, meaning that polling and ticking can continue at their configured intervals without being delayed by the processing times of given messages. For topics associated with such jobs, periodic jobs will also become non-blocking and will execute at a consistent and steady frequency. This approach ensures that message processing and periodic tasks can occur seamlessly and independently, maintaining system responsiveness and reliability.

### Persistence of Periodic Jobs During Pauses

By default, Periodic Jobs in Karafka continue to run even when the consumption of a given topic partition is paused. This feature ensures that scheduled tasks maintain their rhythm and execute as configured, regardless of the consumer's state.

Message consumption halts temporarily when a topic partition is paused, typically to manage system load or during maintenance. However, the periodic jobs associated with that partition aren't tied directly to the message flow. They operate on a time-based schedule, independent of whether messages are being consumed. As a result, even in the paused state, periodic jobs continue to tick and execute their tasks.

This behavior is particularly beneficial for maintaining consistent operations like monitoring, reporting, or routine maintenance that need to continue irrespective of the consumer's state. It provides a layer of reliability and consistency, ensuring that vital tasks are not missed and that the system remains up-to-date and responsive.

However, it's crucial to be aware of this persistence to manage system resources effectively and avoid unexpected behavior. Knowing that periodic jobs run continuously allows for better planning and utilization of system capabilities, ensuring that the tasks performed during pauses are necessary and optimized for efficiency.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      # Do not run when given topic partition is paused
      periodic during_pause: false
    end
  end
end
```

### Behavior of Periodic Jobs During Consumption Retries

By default, Karafka's Periodic Jobs are suspended during retry periods following an error in message consumption. This pause in periodic activities helps focus system resources on resolving the error. However, this behavior can be customized based on your application's needs.

Adjust the `during_retry` parameter in the configuration to continue periodic tasks even during retries. Setting this to `true` allows Periodic Jobs to run, potentially aiding in error recovery or ensuring critical operations persist. However, consider the potential impact and complexity this might add to error handling.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      # Run when `#consume` failed and partition is paused and
      # back-off has been applied
      periodic during_retry: true
    end
  end
end
```

### Behaviour on Errors

In Karafka, handling errors occurring in periodic jobs within the `#tick` method is distinct from typical error-handling mechanisms like dead letter queues (DLQ) or retries applicable to the `#consume` method. The primary rationale for this approach is that the `#tick` method's functionality is not contingent on processing more data. Instead, it's designed to execute operations at predetermined intervals, irrespective of data presence.

When an error occurs within the `#tick` method, it doesn't trigger the conventional DLQ or retry mechanisms. This is because periodic jobs are inherently different from standard message consumption; they are not associated with a batch of messages that can be retried. Instead, they are period-triggered actions meant to occur regularly. If an error happens during the execution of a `#tick` method, it doesn't prevent the method from being invoked again at the next scheduled interval. The system is designed to continue with the subsequent ticks, ensuring that periodic tasks maintain their rhythm.

Despite not being subject to DLQ or retries, it's crucial to monitor and manage errors effectively. In Karafka, errors within the `#tick` method are published to the `error.occurred` notification channel. This allows for centralized monitoring and handling of errors. Each error notification event carries a `:type` set to `consumer.tick.error`, distinguishing it clearly as an error from the periodic job's tick operation. This explicit categorization aids in pinpointing the source of errors and facilitates more efficient debugging and error-handling strategies.

By understanding and leveraging this behavior, developers can ensure that their periodic jobs in Karafka are robust and operate smoothly, even in the face of intermittent errors. It also underscores the importance of monitoring and responding to the error.occurred notifications to maintain the health and reliability of the system.

```ruby
class Consumer < Karafka::BaseConsumer
  def consume; end

  def tick
    raise StandardError
  end
end

# Subscribe to only monitor periodic jobs ticking errors
Karafka.monitor.subscribe 'error.occurred' do |event|
  type = event[:type]

  if type == 'consumer.tick.error'
    error = event[:error]
    details = (error.backtrace || []).join("\n")

    puts "Oh no! An error: #{error} of type: #{type} occurred while ticking!"
    puts details
  end
end
```

### Conclusion

Karafka's relationship between polling and ticking is vital for application design. While they are interconnected, with polling intervals impacting the timing of periodic jobs, understanding and leveraging this relationship can lead to more efficient and reliable applications. By acknowledging this interdependency and employing strategies like independent subscription groups or connection multiplexing, you can ensure that periodic tasks are executed as expected, even in complex systems with varying data flow and processing requirements.

## Example Use Cases

- **Toggle Switching for Pausing and Resuming Processing**: Periodic jobs can incorporate a toggle mechanism for pausing and resuming data processing. This is useful for halting operations during maintenance, updates, or expected downtime. For example, a periodic job can automatically disable and later re-enable processing in high-load periods where real-time processing may hinder system performance. This method ensures flexibility and responsiveness, simplifying the management of processing activities without manual intervention or intricate scheduling.

- **Regular Data Reporting**: Generating reports at fixed intervals, even during periods of low or no data activity, ensuring that reports are delivered on schedule.

- Heartbeat Checks: Sending heartbeat messages or performing regular health checks to monitor system status and ensure all components function correctly, even during idle periods.

- **Scheduled Maintenance Tasks**: Performing routine database maintenance tasks, such as indexing or cleanup, regularly without depending on incoming data streams.

- **Updating Static Datasets**: Refreshing static or slowly changing datasets that are used in conjunction with real-time data, ensuring that all processing is done against the most current information.

- **Micro-batch Processing**: Instead of real-time processing, some systems might benefit from micro-batch processing, where messages are collected over time and then processed together. Periodic jobs can trigger these batches at defined intervals.

- **Real-time Stock Market Analysis**: Maintain a rolling window of the most recent 30 minutes of stock market data to analyze patterns and fluctuations. Whether or not new trades are coming in, periodically assess this window to provide traders with up-to-date insights and alerts on potential investment opportunities or risks.

- **Social Media Sentiment Tracking**: Keep a continuous window of the latest hour of social media posts related to a brand or product. Periodically analyze this data to gauge customer sentiment and brand perception, ensuring marketing teams have current feedback to inform strategies and respond to public sentiment trends, regardless of the volume of new posts.

## Summary

Periodic Jobs in Karafka offer a versatile way to perform scheduled tasks at regular intervals, independent of message flow. This feature particularly benefits applications requiring consistent actions, like routine maintenance, data reporting, or heartbeat checks, even during low or no data activity periods.

Periodic Jobs in Karafka provide a powerful tool for ensuring your application remains active and responsive, performing necessary tasks regularly. Whether you're maintaining system readiness, generating reports, or monitoring system status, periodic jobs can help keep your system efficient and reliable.
