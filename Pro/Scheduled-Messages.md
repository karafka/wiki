!!! Warning "Documentation Under Development"

    The documentation for updating scheduled messages is still under development. Details may be added or refined as the feature evolves. Please check back for the most up-to-date information.

Karafka's Scheduled Messages feature allows users to designate specific times for messages to be sent to particular Kafka topics. This capability ensures that messages are delivered at predetermined times, optimizing workflows and allowing for precise processing and message handling timing in case a message should not arrive immediately.

Conceptually, it works in a similar way to the [ETF1 Kafka Message Scheduler](https://github.com/etf1/kafka-message-scheduler/).

## How Does It Work?

Karafka's Scheduled Messages feature provides a straightforward approach to scheduling Kafka messages for future delivery, allowing users to set precise timings for when messages should reach the desired topics. Using a specialized API, Karafka allows users to easily specify the delivery time for messages without having to handle the complex scheduling details directly. This is achieved by wrapping the messages in an envelope that includes all necessary scheduling information and dispatching them to a special "in-the-middle" topic, which is then managed automatically by Karafka.

Each day at midnight, Karafka's scheduler, a dedicated consumer, reloads and scans a specific Kafka topic designated for storing scheduled messages. This routine includes loading new messages meant for the day, ensuring they are ready for dispatch at specified times. To maintain a seamless and continuous operation, the scheduler dispatches messages at regular intervals, typically every 15 seconds, which is configurable. This ensures that all scheduled messages are delivered when needed.

One key aspect of Karafka's handling of scheduled messages is its treatment of message payloads. It ensures the payload and user headers remain untouched by simply proxy-passing them with added trace headers.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/scheduled_messages/flow.svg" />
</p>
<p align="center">
  <small>*Illustration presenting how Scheduled Messages work.
  </small>
</p>

When Karafka dispatches a scheduled message, it also produces a special tombstone message that goes back to the scheduled messages topic. This tombstone message serves as a marker to indicate that a particular message has already been dispatched. In case of a system failure or a consumer group rebalance, this tombstone prevents the same message from being sent multiple times, ensuring that messages are processed exactly once.

The tombstone message effectively sets the message payload to null using the same key as the scheduled message. This is recognized by Kafka, which then uses this marker to eventually remove the message from the schedules topic. Kafka's log compaction feature looks for these null payloads and purges them during the cleanup, preventing duplicate processing and optimizing the storage by removing obsolete data. Additionally, this compaction process has the benefit of streamlining Karafka's daily schedule loading. After midnight, when the scheduler re-reads the topic to load the day's schedule, compacted messages marked with tombstone messages and subsequently removed are not even sent from Kafka. This reduces the amount of data the scheduler needs to process, allowing for faster and more efficient loading of the daily schedule, thus enhancing the overall performance and responsiveness of the scheduling system.

## Enabling Scheduled Messages

Karafka provides a convenient API to facilitate the scheduling of messages directly within your routing configuration. By invoking the `#scheduled_messages` method, you can easily set up a consumer group and topics dedicated to handling your scheduled messages. This setup involves minimal configuration from the user's end and leverages Karafka's built-in declarative topics API for needed topics management.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    scheduled_messages('scheduled_messages_topic_name')
  end
end
```

Karafka will automatically set up the necessary configurations for this topic and the states topic, including:

- Enabling specific serializers and deserializers tailored for handling scheduled message formats.
- Configuring Kafka consumer settings that are optimized for message scheduling, such as enabling manual offset management and log compaction policies.
- Establishing periodic execution checks to ensure messages are dispatched according to their scheduled times.

This approach simplifies setting up scheduled messages, making them accessible without requiring deep dives into Kafka's configuration details.

### Creating Required Kafka Topics

When `scheduled_messages` is invoked, this command will automatically create appropriate entries for Karafka [Declarative Topics](https://karafka.io/docs/Declarative-Topics/). This means that all you need to do is to run the:

```bash
bundle exec karafka topics migrate
```

Two appropriate topics with the needed configuration will be created.

If you do not use Declarative Topics, please make sure to create those topics manually with below settings:

<table>
  <thead>
    <tr>
      <th>Topic name</th>
      <th>Settings</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>YOUR_SCHEDULED_TOPIC_NAME</td>
      <td>
        <ul>
          <li>
            partitions: <code>5</code>
          </li>
          <li>
            replication factor: aligned with your company policy
          </li>
          <li>
            <code>'cleanup.policy': 'compact'</code>
          </li>
          <li>
            <code>'min.cleanable.dirty.ratio': 0.1</code>
          </li>
          <li>
            <code>'segment.ms': 3600000 # 1 hour</code>
          </li>
          <li>
            <code>'delete.retention.ms': 3600000 # 1 hour</code>
          </li>
          <li>
            <code>'segment.bytes': 52428800 # 50 MB</code>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>YOUR_SCHEDULED_TOPIC_NAME_states</td>
      <td>
        <ul>
          <li>
            partitions: <code>5</code>
          </li>
          <li>
            replication factor: aligned with your company policy
          </li>
          <li>
            <code>'cleanup.policy': 'compact'</code>
          </li>
          <li>
            <code>'min.cleanable.dirty.ratio': 0.1</code>
          </li>
          <li>
            <code>'segment.ms': 3600000 # 1 hour</code>
          </li>
          <li>
            <code>'delete.retention.ms': 3600000 # 1 hour</code>
          </li>
          <li>
            <code>'segment.bytes': 52428800 # 50 MB</code>
          </li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

!!! Warning "Topic Partition Consistency Required"

    When manually creating or reconfiguring topics for scheduled messages, ensure that both topics have the **same** number of partitions. This consistency is crucial for maintaining the integrity and reliability of the message scheduling and state tracking processes.

### Replication Factor Configuration for the Production Environment

Setting the replication factor for Kafka topics used by the scheduled messages feature to more than 1 in production environments is crucial. The replication factor determines how many copies of the data are stored across different Kafka brokers. Having a replication factor greater than 1 ensures that the data is highly available and fault-tolerant, even in the case of broker failures.

For example, if you set a replication factor of 3, Kafka will store the data on three different brokers. If one broker goes down, the data is still accessible from the other two brokers, ensuring that your recurring tasks continue to operate without interruption.

Here's an example of how to reconfigure the scheduled messages topics so they have replication factor of 3:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    scheduled_messages(:scheduled_messages) do |schedules_topic, states_topic|
      schedules_topic.config.replication_factor = 2
      states_topic.config.replication_factor = 2
    end
  end
end
```

### Advanced Configuration

TBA

## Scheduling Messages

To schedule a message, you must wrap your regular message content and additional scheduling information. This is done using the `Karafka::Pro::ScheduledMessages.schedule` method. This method requires you to prepare the message just as you would for a standard Kafka message, but instead of sending it directly to a producer, you wrap it to include scheduling details.

Below, you can find exact details on how to do this:

1. **Prepare Your Message**: Construct your message payload and any associated headers as usual for a Kafka message.

```ruby
message = {
  topic: 'events',
  payload: { type: 'inserted', count: 123 }.to_json
}
```

2. **Define the Delivery Time**: Determine when the message should be dispatched. This time is specified as a Unix epoch timestamp and passed as the epoch parameter.

```ruby
# Make sure to use a Unix timestamp format
future_unix_epoch_time = 15.minutes.from_now.to_i
```

3. **Wrap the Message**: Use the schedule method to wrap your message with the scheduling details:

```ruby
enveloped = Karafka::Pro::ScheduledMessages.schedule(
  message: message,
  epoch: future_unix_epoch_time,
  envelope: {
    # The Kafka topic designated for scheduled messages
    # Please read other sections on the envelope details available
    topic: 'scheduled_messages_topic'
  }
)
```

4. **Dispatch the Wrapped Message**: Once the message is wrapped with all required scheduling details, the resulting hash represents a fully prepared scheduled message. This message can then be dispatched like any other message in Karafka:

```ruby
Karafka.producer.produce_async(enveloped)
```

This call places the wrapped message into the designated scheduling topic, which remains until the specified epoch time is reached. At that time, Karafka's internal scheduling mechanism automatically processes and dispatches the message to its intended destination.

### Message Key Uniqueness and Ordering Management

When using this feature, it is crucial to understand dispatched messages keys and their uniqueness operations. Each message sent to the scheduler must have a distinct key within its partition to ensure accurate scheduling and prevent any potential overlaps or errors during the dispatch process.

By default, Karafka generates a unique key for each scheduled message envelope. This key is a combination of the topic to which the message will eventually be dispatched and a UUID. The formula used is something akin to: "{target_topic}-{UUID}". This key is then assigned to the `:key` field in the envelope, ensuring that each message is uniquely identified within the scheduling system.

This generated key serves multiple purposes:

- **Uniqueness**: Guarantees that each message can be uniquely identified and retrieved.

- **Management**: Facilitates updating or canceling the scheduled dispatch of the message.

Suppose the original message contains `partition_key` or a direct `partition` reference. In that case, Karafka will also attempt to use any of those values as the envelope `partition_key` to ensure that consecutive messages with the same details are always dispatched to the same partition and later sent to a target topic in order.

If you prefer to use your key instead of relying on the auto-generated key, you can provide your chosen key directly in the envelope. When you specify your key this way, Karafka will use it without generating a new one. This approach allows you to maintain consistency or alignment with other systems or data structures you might be using:

```ruby
enveloped = Karafka::Pro::ScheduledMessages.schedule(
  message: message,
  epoch: future_unix_epoch_time,
  envelope: {
    topic: 'scheduled_messages_topic',
    # You can set key
    key: 'anything you want',
    # As well as the partition key
    partition_key: 'anything'
  }
)
```

!!! Warning "Ensure Unique Custom Keys"

     The custom key you use must remain unique within the scheduler topic's partition context. Reusing the same key for multiple messages in the same partition is not advisable, as each subsequent message will overwrite the previous one in the scheduling system, regardless of their scheduled times.

If you must ensure that particular messages are dispatched in a specific order, you can utilize the `partition_key` field in the envelope. While the key may still be automatically generated to maintain uniqueness, setting the `partition_key` to a value that matches the underlying message key ensures that:

- All related messages (sharing the same raw message key) are dispatched to the same partition.
- The order of messages is preserved as per the sequence of their scheduling.

This strategy leverages Kafka's partitioning mechanism, providing a predictable processing order. Messages with the same `partition_key` are guaranteed to be sent to the same partition and thus processed in the order they were sent:

### Cancelling Scheduled Messages

Karafka provides a straightforward mechanism to cancel scheduled messages before they are dispatched. This capability is essential for scenarios where conditions change after a message has been scheduled and the message is no longer required or needs to be replaced.

To cancel a scheduled message, you will utilize the `#cancel` method provided by Karafka's Scheduled Messages feature. This method lets you specify the unique key of the message you want to cancel. This key should be the same as the one used in the message envelope when the message was originally scheduled.

To cancel a scheduled message:

1. **Identify the Message Key**: Locate the unique key of the message you intend to cancel. This is the key that was specified or generated when the message was initially scheduled.

2. **Specify the Topic**: Provide the topic where the scheduled message resides. This is essential because Karafka can handle multiple scheduling topics, and specifying the correct topic ensures the message is accurately identified and targeted for cancellation.

3. **Invoke the `cancel` Method**: Use the `cancel` method to create a cancellation request for the scheduled message. This method requires the unique key and the topic to formulate the cancellation command properly.

```ruby
cancellation_message = Karafka::Pro::ScheduledMessages.cancel(
  key: 'your_message_key',
  envelope: { topic: 'your_scheduled_messages_topic' }
)
```

4. **Dispatch the Cancellation Message**: After generating the cancellation message, it must be dispatched using Karafka's producer to ensure the cancellation is processed. This step finalizes the cancellation by publishing the tombstone message to the scheduling topic.

```ruby
Karafka.producer.produce_sync(cancellation_message)
```

The unique key is critical in the cancellation process for several reasons:

- **Targeting the Correct Message**: It ensures that the exact message intended for cancellation is correctly identified.

- **Avoiding Conflicts**: By maintaining unique keys for each message, you prevent potential issues where multiple messages might be inadvertently affected by a single cancellation command.

!!! Hint "Custom Keys and Automatic Key Generation"

    When scheduling a message, if you choose to use a custom key or rely on the automatically generated key by Karafka, it's important to use the same key consistently for both scheduling and canceling the message. This consistency helps prevent errors and ensures that the correct message is targeted for cancellation.

!!! Hint "Handling Cancellations with `partition_key`"

If the message was scheduled with a `partition_key` to maintain a specific order or partition consistency, it is advisable to use the same `partition_key` during cancellation. This practice helps manage related messages within the same partition effectively and maintains the order and integrity of operations within that partition.

### Updating Scheduled Messages

Karafka's Scheduled Messages feature allows updating messages that have already been scheduled but not yet dispatched. This functionality is crucial when a scheduled message's content, timing, or conditions need to be modified before its dispatch.

Updating a scheduled message in Karafka involves a straightforward process similar to scheduling a new message, with a key distinction: you must use the same unique envelope key used for the original scheduling. This ensures that the new message parameters overwrite the old ones in the scheduling system.

To update the scheduled message:

1. **Identify the Original Envelope Key**: Use the same envelope key that was assigned during the initial scheduling of the message. This key is crucial for targeting the correct message for updates.

1. **Prepare the Updated Message**: Create the new message payload as you would for any Kafka message. Include any changes to the message content or any additional headers needed.

1. **Set the New Dispatch Time**: If the timing needs to be changed, determine the new dispatch time. This time should be specified as a Unix epoch timestamp.

1. **Use the `schedule` Method**: Employ the `schedule` method to wrap your updated message with the scheduling details, using the same key and specifying the new or unchanged dispatch time:

```ruby
updated_message = Karafka::Pro::ScheduledMessages.schedule(
  message: new_message_to_replace_old,
  epoch: new_future_unix_epoch_time,
  envelope: {
    topic: 'scheduled_messages_topic',
    # Same key as the original message
    key: original_envelope_key
  }
)
```

1. **Dispatch the Updated Message**: Send the updated message using Karafka’s producer. This step replaces the original scheduled message with the new content and timing in the scheduling system:

```ruby
Karafka.producer.produce_async(updated_message)
```

## Monitoring and Metrics

TBA

## Web UI Management

TBA

## Error Handling and Retries

TBA

## Warranties

TBA

### Transactional Support

TBA

## Limitations

TBA

### Dispatch Order and Race-Conditions

TBA

## Production Deployment

TBA

## External Producers Support

TBA

## Alternatives

When considering alternatives to Scheduled Messages feature, two other options provide distinct approaches to delaying or controlling the timing of message processing: [Delayed Topics](https://karafka.io/docs/Pro-Delayed-Topics/) and [Piping](https://karafka.io/docs/Pro-Piping). Each method has its own advantages and use cases, depending on the specific requirements of your application, so they may also be a viable option worth considering.

### Delayed Topics

Delayed Topics in Karafka provide a mechanism to delay message consumption from specific topics for a set period of time. This is useful when you need to delay message processing globally for a topic without scheduling each message individually.

- **How It Works**: By setting a delay on a topic, Karafka pauses consumption for a specified time before processing the messages. Other topics and partitions are unaffected, allowing for efficient resource utilization.

- **Use Cases**: Delayed Processing is ideal for scenarios like retry mechanisms, buffer periods for additional processing or validation, or temporary postponement during peak traffic.

**Pros**:

- Simple to set up using the `delay_by` option on topics.
- Causes no global lag since only the designated topic is delayed.
- Particularly useful when messages need consistent delays across the entire topic.

**Cons**:

- Delay applies to all messages in the topic uniformly.
- Lack of fine-grained control for scheduling individual messages at specific times.

### Delayed Piping

[Piping](https://karafka.io/docs/Pro-Piping/) with [Delayed Topics](https://karafka.io/docs/Pro-Delayed-Topics/) offers an advanced alternative to Scheduled Messages by leveraging both Delayed Processing and Piping to create "time buckets." With this approach, you can create multiple delayed topics (e.g., `messages_5m`, `messages_30m`, `messages_1h`) that act as buffers for different delay durations. Once the delay period expires, messages are piped from these delayed topics to their final destination for processing.

Use Cases:

- **Batch Processing**: When processing time-sensitive data that needs to be delayed by different amounts of time (e.g., 5 minutes, 30 minutes, 1 hour) before final processing, using time buckets is an efficient approach.

- **Time-Windowed Actions**: Triggering actions based on elapsed time (e.g., after 30 minutes or 1 hour) can be easily orchestrated with delayed topics and piping.

- **Throttling or Rate Limiting**: You can effectively manage load or rate-limit processes by distributing messages into time buckets over different periods.

**Pros**:

- Flexibility to create multiple time delays for different types of messages.
- Allows you to group delayed messages into "buckets" based on their time requirements.
- Seamless integration of delayed processing with piping ensures that messages are forwarded to their final destination once their delay expires.
- Simplifies complex workflows that require messages to be processed after various time intervals.

**Cons**:

- More configuration is required, as you need to manage multiple topics for different time delays.
- Timing is still dependent on topic-level delays, so more sophisticated scheduling might be required to fine-tune control over individual messages (beyond the bucket-level delay).

### Choosing Between Alternatives

- **Scheduled Messages**: Best for cases where you need precise control over the exact dispatch time for individual messages.

- **Delayed Processing**: The right choice when you need to delay the processing of all messages in a topic by a uniform time period, providing a sense of reassurance and organization.

- **Piping with Delayed Topics**: Ideal when you need time-bucketed delays for messages (e.g., 5 minutes, 30 minutes, 1 hour) and want messages to be forwarded to a final destination after their respective delays.

## Example Use-Cases

- **Regulatory Compliance Reports**: Schedule a message to deliver a critical compliance report right before the audit deadline, ensuring all data is fresh and the submission is timely without last-minute rushes.

- **Data Processing Kickoff**: Send a scheduled message to initiate a complex ETL process at the start of a financial quarter, ensuring data is processed at the right moment for analysis and reporting.

- **SLA Compliance Check**: Set up a message to trigger an SLA compliance verification exactly when a new service level agreement goes into effect, automating the monitoring process without manual setup each time.

- **Resource Scaling for Event Peaks**: Automate infrastructure scaling by scheduling messages to increase cloud resources just hours before anticipated high-traffic events like online sales or product launches.

- **Personalized User Engagement**: Schedule a message to send a personalized offer to a user on their anniversary of joining your service, enhancing personal connection and loyalty.

- **Feature Activation**: At the start of a promotional period, use a scheduled message to activate a new application feature for all users, ensuring synchronized access for all users.

- **Cache Expiration and Refresh**: Schedule a message to trigger the refresh of a specific cache segment right before its set expiration time. This ensures data remains current without manual monitoring and maintains system performance and reliability.
