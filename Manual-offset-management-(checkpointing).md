**Note:** This is an advanced API that you should only use if you know what you're doing.

By default Karafka handles offset commit management for you. Offset is committed:
-  for ```batch_fetching true``` - after you're done consuming all messages from a batch
-  for ```batch_fetching false``` - after you've consumed each message

This approach is great for most of the cases, however there are some situations in which you might need a better control over the offset management.

There are several cases in which this API can be helpful:

- In memory DDD sagas realization,
- Buffering,
- Simulating transactions.

## Configuring Karafka not to automatically mark messages as consumed

In order to use this API, you need to switch the ```automatically_mark_as_consumed``` setting to false, either globally for the whole app:

```ruby
class App < Karafka::App
  setup do |config|
    # Other settings
    config.automatically_mark_as_consumed = false
  end
end
```

or on a per consumer group level:

```ruby
class App < Karafka::App
  consumer_groups.draw do
    consumer_group :events do
      automatically_mark_as_consumed false

      topic :user_events do
        controller EventsController
      end
    end
  end
end
```
## Marking messages as consumed

To mark a certain message as consumed (so in case of crash or restart it won't be consumed again), you need to use the internal consumer API ```#mark_as_consumed``` method:

```ruby
def consume
  # Do something with messages
  EventStore.store(params_batch.parsed)
  # And now mark last message as consumed,
  # so we won't consume any of already processed messages again
  consumer.mark_as_consumed params_batch.to_a.last
end
```

## Example buffer implementation with ```before_stop``` DB flush

When manually controlling the moment of marking message as consumed, it is also worth taking into consideration graceful application termination process.

For some cases it might be a moment in which for example you want to flush the buffer regardless of it not reaching the desired threshold. You can use the ```#mark_as_consumed``` method from all the Karafka callbacks (as long as you received at least one message):

```ruby
class EventsController < ApplicationController
  include Karafka::Controllers::Callbacks

  # Flush to DB only in 1k batches
  FLUSH_SIZE = 1000

  # Before we stop, if there is anything in the buffer, lets import it despite
  # the fact, that it didn't reach the FLUSH_SIZE
  before_stop do
    unless buffer.empty?
      p "importing: #{buffer.count}"
      # Mark last message as consumed, as they are all in the DB
      consumer.mark_as_consumed(buffer.last)
    end
  end

  def consume
    # Unparse and add to buffer
    params_batch.parsed.each { |params| buffer << params }

    # If buffer exceeds the FLUSH_SIZE, it's time to put data into the DB
    if buffer.size >= FLUSH_SIZE
      data = buffer.shift(FLUSH_SIZE)
      p "importing: #{data.count}"
      # Once importing is done, we can mark last message from the imported set
      # as consumed
      consumer.mark_as_consumed(data.last)
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
class CountersController < ApplicationController
  def consume
    params_batch.each_with_index do |params, index|
      # Some business logic here
      # Commit every 10 messages processed
      consumer.mark_as_consumed(params) if index % 10 == 0
    end
  end
end
```
