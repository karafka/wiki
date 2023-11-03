By default, Karafka handles offset commit management for you. The offset is automatically committed:

- frequently (defaults to once every 5 seconds) - defined by the `auto.commit.interval.ms` setting on the `kafka` level.
- during the shutdown after all processing is done.
- during the rebalance after all the blocking processing and before the new assignment distribution.

This approach is excellent for most cases and should provide a minimum number of scenarios where reprocessing would happen during normal operations. However, there are some situations where you might need better control over offset management.

## Manual offset management

There are several cases in which this API can be helpful:

- In memory of the DDD sagas realization,
- Buffering,
- Simulating transactions.

### Configuring Karafka not to mark messages as consumed automatically

To use this API, you need to switch the ```manual_offset_management``` setting to `true` on a per topic basis:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    consumer_group :events do
      # manual_offset_management false

      topic :user_events do
        consumer EventsConsumer
        manual_offset_management true
      end
    end
  end
end
```
### Marking messages as consumed and committing offsets

To mark a certain message as consumed (so in case of a crash or restart, it won't be consumed again), you can use one of two marking methods:

- ```#mark_as_consumed``` - for a non-blocking eventual offset commitment.
- ```#mark_as_consumed!``` - for a blocking offset commitment that will stop the processing flow to ensure that the offset has been stored. This is not recommended for most scenarios, as Karafka will automatically commit the most recent offsets upon rebalance and shutdown.

```ruby
def consume
  # Do something with messages
  EventStore.store(messages.payloads)
  # And now mark the last message as consumed,
  # so we won't consume any of the already processed messages again
  mark_as_consumed! messages.last
end
```

Both `#mark_as_consumed` and `#mark_as_consumed!` return a boolean value indicating whether your consumer instance still owns the given topic partition. If there was a rebalance and the partition is no longer owned by a consumer, the value returned will be `false`. You can use this result to stop processing early:

```ruby
def consume
  messages.each do |message|
    puts "Processing #{message.topic}/#{message.partition} #{message.offset}"

    # Do not process further if we no longer own partition
    return unless mark_as_consumed(message)
  end
end
```

Karafka offers two additional methods to commit already stored but not committed offsets to Kafka: `#commit_offsets` and `#commit_offsets!`. 

These two methods allow you to manage your consumer's offsets, ensuring Kafka knows the last message your consumer has processed.

- `#commit_offsets`: This method is asynchronous. It sends a request to the Kafka brokers to commit the offsets but immediately gets confirmation. Instead, it returns immediately, which allows your consumer to continue processing other messages without delay. The result of the commit request (whether successful or not) is not immediately known but can be checked using the `#revoked?` method.
- `#commit_offsets!`: In contrast, this method is synchronous. It sends a request to commit the offsets and waits for a response from the Kafka brokers. This means your consumer pauses and waits for the brokers to acknowledge the commit request. The method will return a boolean value indicating the operation's success - true if the commit was successful and false if it was not. This can be helpful when you need to ensure that the offsets have been committed before moving forward.

Remember, both `#commit_offsets` and `#commit_offsets!` only commit offsets that have already been stored. Storing an offset signifies that a message has been processed, so ensure you have correctly stored the offsets before attempting to commit them to Kafka.

### Example buffer implementation with ```shutdown``` DB flush

When manually controlling the moment of marking the message as consumed, it is also worth taking into consideration graceful application termination process.

For some cases, it might be a moment in which, for example, you want to flush the buffer regardless of it not reaching the desired threshold. You can use the ```#mark_as_consumed``` also from the `#shutdown` method:

```ruby
class EventsConsumer < ApplicationConsumer
  # Flush to DB only in 1k batches
  FLUSH_SIZE = 1000

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

  # Before we stop, if there is anything in the buffer, let's import it despite
  # the fact, that it didn't reach the FLUSH_SIZE
  def shutdown
    unless buffer.empty?
      p "importing: #{buffer.count}"
      # Mark last message as consumed, as they are all in the DB
      mark_as_consumed!(buffer.last)
    end
  end

  def buffer
    @buffer ||= []
  end
end
```

## Mixing manual and automatic offset management

You can still take advantage of this API even when using automatic offset management. For example, you may want to commit the offset manually after a certain number of messages are consumed from a batch:

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
