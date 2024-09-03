!!! warning "Feature Under Development"

    Please note that this feature is under development and has yet to be released. Stay tuned for updates.

Karafka's Scheduled Messages feature allows users to designate specific times for messages to be sent to particular Kafka topics. This capability ensures that messages are delivered at predetermined times, optimizing workflows and allowing for precise processing and message handling timing in case a message should not arrive immediately.

## How Does It Work?

Karafka's Scheduled Messages feature provides a straightforward approach to scheduling Kafka messages for future delivery, allowing users to set precise timings for when messages should reach the desired topics. Using a specialized API, Karafka allows users to easily specify the delivery time for messages without having to handle the complex scheduling details directly. This is achieved by wrapping the messages in an envelope that includes all necessary scheduling information, which is then managed automatically by Karafka.

Each day at midnight, Karafka's scheduler, a dedicated consumer, reloads and scans a specific Kafka topic designated for storing scheduled messages. This routine includes loading new messages meant for the day, ensuring they are ready for dispatch at specified times. To maintain a seamless and continuous operation, the scheduler dispatches messages at regular intervals, typically every 15 seconds, which is configurable. This ensures that all scheduled messages are delivered when needed.

One key aspect of Karafka's handling of scheduled messages is its treatment of message payloads. It ensures the payload and user headers remain untouched by simply proxy-passing it with added trace headers. This approach allows users to leverage sophisticated scheduling capabilities without needing in-depth knowledge of Kafka's internal mechanisms, making it ideal for applications requiring precise timing control over message processing.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/scheduled_messages/flow.svg" />
</p>
<p align="center">
  <small>*Illustration presenting how Scheduled Messages work.
  </small>
</p>

When Karafka dispatches a scheduled message, it also produces a special tombstone message that goes back to the scheduled messages topic. This tombstone message plays a crucial role in maintaining the reliability and consistency of the messaging system. It serves as a marker to indicate that a particular message has already been dispatched. In case of a system failure or a consumer group rebalance, this tombstone prevents the same message from being sent multiple times, ensuring that messages are processed exactly once.

When Karafka dispatches a scheduled message, it also produces a special tombstone message that goes back to the scheduled messages topic. This tombstone message plays a crucial role in maintaining the reliability and consistency of the messaging system. It serves as a marker to indicate that a particular message has already been dispatched. In case of a system failure or a consumer group rebalance, this tombstone prevents the same message from being sent multiple times, ensuring that messages are processed exactly once.

The tombstone message effectively sets the message payload to null using the same key as the scheduled message. This is recognized by Kafka, which then uses this marker to eventually remove the message from the topic. Kafka's log compaction feature looks for these null payloads and purges them during the cleanup, preventing duplicate processing and optimizing the storage by removing obsolete data. Additionally, this compaction process has the benefit of streamlining Karafka's daily schedule loading. After midnight, when the scheduler re-reads the topic to load the day's schedule, compacted messages marked with tombstone messages and subsequently removed are not even sent from Kafka. This reduces the amount of data the scheduler needs to process, allowing for faster and more efficient loading of the daily schedule, thus enhancing the overall performance and responsiveness of the scheduling system.

## Enabling Scheduled Messages

TBA

### Creating Required Kafka Topics

TBA

### Replication Factor Configuration for the Production Environment

TBA

### Advanced Configuration

TBA

## Scheduling Messages

TBA

### Message Key Uniqueness Management

TBA

### Cancelling Messages

TBA

### Updated Scheduled Message Prior to Its Dispatch

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

TBA
