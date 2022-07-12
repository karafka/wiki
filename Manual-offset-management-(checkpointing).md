**Note:** This is an advanced API that you should only use if you know what you're doing.

By default, Karafka handles offset commit management for you. The offset is committed after you're done consuming all the messages from a batch.

This approach is great for most of the cases, however, there are some situations in which you might need a better control over the offset management.

There are several cases in which this API can be helpful:

- In memory DDD sagas realization,
- Buffering,
- Simulating transactions.

## Configuring Karafka not to automatically mark messages as consumed

In order to use this API, you need to switch the ```manual_offset_management``` setting to `true`, either globally for the whole app:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other settings
    config.kafka.manual_offset_management = true
  end
end
```

or on a per consumer group level:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    consumer_group :events do
      manual_offset_management false

      topic :user_events do
        consumer EventsConsumer
      end
    end
  end
end
```
## Marking messages as consumed

To mark a certain message as consumed (so in case of a crash or restart it won't be consumed again), you can use one of two marking methods:

- ```#mark_as_consumed``` - for a non-blocking eventual offset commitment.
- ```#mark_as_consumed!``` - for a blocking offset commitment that will stop the processing flow to ensure, that the offset has been stored.

```ruby
def consume
  # Do something with messages
  EventStore.store(messages.payloads)
  # And now mark last message as consumed,
  # so we won't consume any of already processed messages again
  mark_as_consumed! messages.last
end
```

## Example buffer implementation with ```shutdown``` DB flush

When manually controlling the moment of marking the message as consumed, it is also worth taking into consideration graceful application termination process.

For some cases, it might be a moment in which for example you want to flush the buffer regardless of it not reaching the desired threshold. You can use the ```#mark_as_consumed``` also from the `#shutdown` method:

```ruby
class EventsConsumer < ApplicationConsumer
  # Flush to DB only in 1k batches
  FLUSH_SIZE = 1000

  # Before we stop, if there is anything in the buffer, let's import it despite
  # the fact, that it didn't reach the FLUSH_SIZE
  before_stop do
    unless buffer.empty?
      p "importing: #{buffer.count}"
      # Mark last message as consumed, as they are all in the DB
      mark_as_consumed!(buffer.last)
    end
  end

  def consume
    # Unparse and add to buffer
    messages.each { |message| buffer << message }

    # If buffer exceeds the FLUSH_SIZE, it's time to put data into the DB
    if buffer.size >= FLUSH_SIZE
      data = buffer.shift(FLUSH_SIZE)
      p "importing: #{data.count}"
      # Once importing is done, we can mark last message from the imported set
      # as consumed
      mark_as_consumed!(data.last)
    end
  end

  def buffer
    @buffer ||= []
  end
end
```

## Mixing manual and automatic offset management

Even when using the automatic offset management, you can still take advantage of this API. For example, you may want to commit the offset manually after a certain number of messages consumed from a batch:

```ruby
class CountersConsumer < ApplicationConsumer
  def consume
    messages.each_with_index do |message, index|
      # Some business logic here
      # Commit every 10 messages processed
      mark_as_consumed(message) if index % 10 == 0
    end
  end
end
```
