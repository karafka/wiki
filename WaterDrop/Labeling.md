# WaterDrop Labeling

When producing messages with WaterDrop, tracking the progress and status of each message is crucial. There are instances where you'll need to monitor the delivery handle and report and relate them to the specific message that was dispatched. WaterDrop addresses this need with its labeling capability, allowing you to assign label values to each message during production. These labels act as identifiers, linking the message with its delivery report.

## Importance of Labeling

Labeling is an important feature, and we highly recommend utilizing it for enhanced message tracking and management. It provides the following benefits:

1. **Traceability**: Labels provide a straightforward way to trace a message from the point it's produced until it's successfully consumed. This is particularly useful in complex systems where messages pass through various stages and services.

1. **Debugging and Error Handling**: In case of delivery failures or errors, labels help quickly identify the affected messages. Developers can use this information to diagnose issues, understand the context of failures, and implement targeted fixes.

1. **Monitoring and Metrics**: By labeling messages, you can gather detailed metrics about message flow, performance, and delivery success rates. This data is invaluable for maintaining system health and optimizing performance.

1. **Contextual Information**: Labels can carry contextual information about the message, such as its source, intended destination, priority, or type. This enriches the message data and can inform processing logic or routing decisions downstream.

## Assigning and Reading Labels

Using labels is quite straightforward; simply include the label: attribute when producing messages.

```ruby
handle = producer.produce_async(
  topic: 'my-topic',
  payload: 'some data',
  label: 'unique-id'
)
```

You can then reference it from both the delivery handle and the report:

```ruby
handle.label #=> 'unique-id'
report = handle.wait
report.label #=> 'unique-id'
```

And from `error.occurred`, `message.acknowledged`, and `message.purged` (Transactional Producer only):

```ruby
producer.monitor.subscribe('message.acknowledged') do |event|
  report = event[:delivery_report]

  puts "Message with label: #{report.label} was successfully delivered."
end

producer.monitor.subscribe('error.occurred') do |event|
  # There may be other errors without delivery reports in them
  if event[:type] == 'librdkafka.dispatch_error'
    report = event[:delivery_report]

    puts "Message with label: #{report.label} failed to be delivered."
  end
end
```

If desired, you can even self-reference the entire message:

```ruby
message = { topic: 'my-topic', payload: 'some-data' }

# Self reference
message[:label] = message

handle = produce.produce_async(message)
handle.label == message #=> true
report = handle.wait
report.label == message #=> true
```

!!! Warning "Increased Memory Usage with Self-Referencing Labels"

    Be cautious when self-referencing messages using labels, as this practice can lead to increased memory usage; the entire message will be retained in memory until its delivery succeeds or fails. This can significantly escalate memory consumption, particularly in scenarios where you're producing hundreds of thousands of messages.

## Conclusion

Labeling in WaterDrop is a powerful feature that enhances message tracking, debugging, and monitoring. By effectively using labels, you can better understand your message flow, quickly address issues, and gather valuable insights into your messaging system's performance.
