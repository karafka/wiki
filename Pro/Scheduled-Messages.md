!!! warning "Feature Under Development"

    Please note that this feature is under development and has yet to be released. Stay tuned for updates.

Karafka's Scheduled Messages feature allows users to designate specific times for messages to be sent to particular Kafka topics. This capability ensures that messages are delivered at predetermined times, optimizing workflows and allowing for precise processing and message handling timing in case a message should not arrive immediately.

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

TBA

### Updating Scheduled Messages

TBA

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

TBA

### Delayed Processing

TBA

### Delayed Piping

TBA

## Example Use-Cases

- **Regulatory Compliance Reports**: Schedule a message to deliver a critical compliance report right before the audit deadline, ensuring all data is fresh and the submission is timely without last-minute rushes.

- **Data Processing Kickoff**: Send a scheduled message to initiate a complex ETL process at the start of a financial quarter, ensuring data is processed at the right moment for analysis and reporting.

- **SLA Compliance Check**: Set up a message to trigger an SLA compliance verification exactly when a new service level agreement goes into effect, automating the monitoring process without manual setup each time.

- **Resource Scaling for Event Peaks**: Automate infrastructure scaling by scheduling messages to increase cloud resources just hours before anticipated high-traffic events like online sales or product launches.

- **Personalized User Engagement**: Schedule a message to send a personalized offer to a user on their anniversary of joining your service, enhancing personal connection and loyalty.

- **Feature Activation**: At the start of a promotional period, use a scheduled message to activate a new application feature for all users, ensuring synchronized access for all users.

- **Cache Expiration and Refresh**: Schedule a message to trigger the refresh of a specific cache segment right before its set expiration time. This ensures data remains current without manual monitoring and maintains system performance and reliability.
