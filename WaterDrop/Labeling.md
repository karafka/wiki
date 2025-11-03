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

!!! warning "Increased Memory Usage with Self-Referencing Labels"
    Be cautious when self-referencing messages using labels, as this practice can lead to increased memory usage; the entire message will be retained in memory until its delivery succeeds or fails. This can significantly escalate memory consumption, particularly in scenarios where you're producing hundreds of thousands of messages.

## Distinguishing Between Sync and Async Producer Errors

A common use-case for labeling is distinguishing between errors that occur from synchronous versus asynchronous message production. Since both `Karafka.producer.produce_sync` and `Karafka.producer.produce_async` trigger the same `error.occurred` notification, you can use labels to differentiate between them.

This is particularly useful when you want to handle errors differently based on the production method. For example, synchronous errors are typically handled immediately with a backtrace, while asynchronous errors might need specialized logging or retry mechanisms.

### Implementation Example

Here's how you can use labels to distinguish between sync and async producer errors:

```ruby
# Label async messages
producer.produce_async(
  topic: 'my-topic',
  payload: 'data',
  label: { type: :async }
)

# Label sync messages
producer.produce_sync(
  topic: 'my-topic',
  payload: 'data',
  label: { type: :sync }
)

# Error handling
producer.monitor.subscribe('error.occurred') do |event|
  if event[:type] == 'librdkafka.dispatch_error'
    report = event[:delivery_report]

    # Only process errors from async messages
    if report.label[:type] == :async
      # This is an async error that needs special handling
      logger.error("Async producer error: #{event[:error]}")
      handle_async_error(event[:error])
    end
    # Sync errors are already handled elsewhere and don't need additional logging
  end
end
```

### Using Labels with Batch Production

Labels also work with batch production methods `produce_many_sync` and `produce_many_async`. Each message in the batch can have its own label:

```ruby
# Async batch production with labels
messages = [
  { topic: 'my-topic', payload: 'data1', label: { type: :async } },
  { topic: 'my-topic', payload: 'data2', label: { type: :async } },
  { topic: 'my-topic', payload: 'data3', label: { type: :async } }
]

handles = producer.produce_many_async(messages)
handles.each { |handle| puts handle.label } # => { type: :async }, { type: :async }, { type: :async }

# Sync batch production with labels
messages = [
  { topic: 'my-topic', payload: 'data1', label: { type: :sync } },
  { topic: 'my-topic', payload: 'data2', label: { type: :sync } },
  { topic: 'my-topic', payload: 'data3', label: { type: :sync } }
]

reports = producer.produce_many_sync(messages)
reports.each { |report| puts report.label } # => { type: :sync }, { type: :sync }, { type: :sync }

# Error handling remains the same - each message's delivery report
# will contain its respective label
producer.monitor.subscribe('error.occurred') do |event|
  if event[:type] == 'librdkafka.dispatch_error'
    report = event[:delivery_report]

    if report.label[:type] == :async
      # Handle async batch errors
      logger.error("Async batch message error: #{event[:error]}")
      handle_async_error(event[:error])
    end
  end
end
```

Using labels to distinguish between sync and async errors provides several advantages:

- **Targeted Error Handling**: Apply different error handling strategies based on the production method
- **Cleaner Logging**: Avoid duplicate logging for sync errors that are already handled
- **Better Monitoring**: Track async-specific failure rates and patterns
- **Simplified Debugging**: Quickly identify whether an error originated from sync or async production

## Conclusion

Labeling in WaterDrop is a powerful feature that enhances message tracking, debugging, and monitoring. By effectively using labels, you can better understand your message flow, quickly address issues, and gather valuable insights into your messaging system's performance.

## See also

- [Monitoring and Logging](WaterDrop-Monitoring-and-Logging) - For comprehensive monitoring and logging strategies
- [Pro Piping](Pro-Piping) - For advanced message routing and transformation with labeling
