The Dead Letter Queue feature provides a systematic way of dealing with persistent consumption errors that may require a different handling approach while allowing you to continue processing.

While consuming data, not everything may go as intended. When an error occurs in Karafka, by default, the framework will apply a back-off strategy and will try again and again. Some errors, however, may be non-recoverable. For example, a broken JSON payload will not be fixed by parsing it again. Messages with non-recoverable errors can be safely moved and analyzed later without interrupting the flow of other valid messages.

And this is where the Dead Letter Queue pattern shines.

A Dead Letter Queue in Karafka is a feature that, when enabled, will transfer problematic messages into a separate topic allowing you to continue processing even upon errors.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/dlq_example_flow.png" />
</p>
<p align="center">
  <small>*This example illustrates a simple DLQ flow with a processing retry.
  </small>
</p>

## Using Dead Letter Queue

The only thing you need to add to your setup is the `dead_letter_queue` definition for topics for which you want to enable it:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        # Name of the target topic where problematic messages should be moved to
        topic: 'dead_messages',
        # How many times we should retry processing with a back-off before
        # moving the message to the DLQ topic and continuing the work
        #
        # If set to zero, will not retry at all.
        max_retries: 2
      )
    end
  end
end
```

Once enabled, after the defined number of retries, problematic messages will be moved to a separate topic unblocking the processing.

## Disabling retries

If you do not want to retry processing at all upon errors, you can set the `max_retries` value to `0`:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      dead_letter_queue(
        topic: 'dead_messages',
        max_retries: 0
      )
    end
  end
end
```

Messages will never be re-processed with the following settings and will be moved without retries to the DLQ topic.

## Disabling dispatch

For some use cases, you may want to skip messages after retries without dispatching them to an alternative topic.

This functionality is available in Karafka Pro, and you can read about it [here](Pro-Enhanced-Dead-Letter-Queue#disabling-dispatch).

## Dispatch warranties

Messages dispatched to the DLQ topic preserve both `payload` and `headers`. They do **not** follow any partitioning strategy and will be distributed randomly.

Please note that the original offset, partition, and topic information will **not** be preserved. If you need those, we recommend you use the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue).

If you need messages dispatched to the DLQ topic to preserve order, you either need to use a DLQ topic with a single partition, or you need to use the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) implementation.

## Manual DLQ dispatch

When the Dead Letter Queue is enabled, Karafka will provide you with an additional method called `#dispatch_to_dlq` that you can use to transfer messages to the DLQ topic. You can use it if you encounter messages you do not want to deal with but do not want to raise an exception:

```ruby
class OrdersStatesConsumer
  def consume
    messages.each do |message|
      if EventContract.valid?(message.payload)
        EventsImporter.import(message.payload)
      else
        # Skip on messages that are not valid without raising an exception
        dispatch_to_dlq(message)
      end

      mark_as_consumed(message)
    end
  end
end
```

## Monitoring and instrumentation

Each time a message is moved to the Dead Letter Queue topic, it will emit a `dead_letter_queue.dispatched` with a `message` key.

You can use it to enrich your instrumentation and monitoring:

```ruby
Karafka.monitor.subscribe('dead_letter_queue.dispatched') do |event|
  message = event[:message]

  topic = message.topic
  partition = message.partition
  offset = message.offset

  puts "Oh no! We gave up on this flunky message: #{topic}/#{partition}/#{offset}"
end
```

## Batch processing limitations

At the moment, DLQ does **not** have the ability to skip whole batches. For scenarios where the collective outcome of messages operations is causing errors, Karafka will skip one after another. This means that you may encounter "flickering", where seemingly valid messages are being moved to the DLQ before reaching the corrupted one.

If skipping batches is something you would utilize, please get in touch with us so we can understand your use cases and possibly introduce this functionality.

## Pro Enhanced Dead Letter Queue

We highly recommend you check out the [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue), especially if you:

- expect a higher quantity of messages being moved to the DLQ topic,
- need to preserve original topic, partition, and offset,
- need to preserve the ordering of messages,
- want to have a DLQ topic with several partitions.

## Features compatibility

### Usage with ActiveJob

The Dead Letter Queue feature can be used with ActiveJob. The only thing worth keeping is that the `#payload` of the transferred message will be the serialized job.

### Usage with Manual Offset Management

The Dead Letter Queue feature can be used with Manual Offset Management. The only implication is that Karafka will **not** commit the offset when skipping messages.
