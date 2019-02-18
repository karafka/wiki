Consumer callbacks (that are just events under the hood) can be used to trigger some actions on certain moments of Karafka messages receiving flow. You can use them for additional actions that need to take place at certain moments. They are not available by default, as we don't want to provide functionalities that are not required by users by default.

In order to be able to use them, you need to include ```Karafka::Consumers::Callbacks``` module into your consumer class:

```ruby
class ExamplesConsumer < Karafka::BaseConsumer
  include Karafka::Consumers::Callbacks

  after_fetch do
    # Some logic here
  end

  def consume
    # some logic here
  end
end
```

Currently following consumer callbacks are available:

- [after_fetch](#after_fetch) - executed right after we fetch messages from Kafka but before the main logic kicks in
- [before_stop](#before_stop) - executed before the shutdown process kicks in. Really useful if you use manual offset management
- [after_poll](#after_poll) - executed after **each** attempt to fetch messages from Kafka (even when there is no data)
- [before_poll](#before_poll) - executed before **each** attempt to fetch messages from Kafka (even when there is no data)

**Warning**: Keep in mind, that despite the backend consuming engine you will use, the callbacks will always be triggered inside of the Karafka server process.

**Warning**: Note, that callbacks will only be triggered by topics that received at least a single message. This applies to all the callbacks, including the ```before_poll``` and ```after_poll```.

#### after_fetch

Callback that will be executed **after** we fetch messages from Kafka, but before they are consumed.

Here are some of the examples of how to use the ```after_fetch``` callback:

```ruby
# @example Create a consumer with a block after_fetch
class ExampleConsumer < Karafka::BaseConsumer
  include Karafka::Consumers::Callbacks

  after_fetch do
    params_batch.each do |params|
      params['wednesday'] = Date.today.wednesday?
    end
  end

  def consume
    # some logic here
  end
end

# @example Create a consumer with a method after_fetch
class ExampleConsumer < Karafka::BaseConsumer
  include Karafka::Consumers::Callbacks

  after_fetch :after_fetch_method

  def consume
    # some logic here
  end

  private

  def after_fetch_method
    params_batch.each do |params|
      params['wednesday'] = Date.today.wednesday?
    end
  end
end
```

#### before_stop

Callback that will be executed **before** the Karafka process stops. It can be used to mark message as consumed for manual offset management or to perform any cleaning or maintenance there might be. This can be really useful if we normalize data streams and import in batches and we want to import also the last, incomplete batch upon shutdown.

```ruby
# @example Create a consumer with a block before_stop
class ExampleConsumer < Karafka::BaseConsumer
  include Karafka::Consumers::Callbacks

  FLUSH_THRESHOLD = 1000

  before_stop do
    # Buffer might not be complete after each messages fetch but we still may
    # want to commit this data before we stop the process
    return if @buffer.empty?
    EventStore.import @buffer
  end

  def consume
    @buffer ||= []
    @buffer += params_batch.deserialize!

    if @buffer.size >= FLUSH_THRESHOLD
      EventStore.import @buffer
      @buffer = []
    end
  end
end
```

#### before_poll

Callback that will be executed **before** each attempt to fetch messages from Kafka. Note, that it will be performed regardless whether there are messages in Kafka. It can be used to perform additional logic for resource availability checking or anything else that would have an impact on the messages consumption.

```ruby
# @example Create a consumer with a block before_poll
class ExampleConsumer < Karafka::BaseConsumer
  include Karafka::Consumers::Callbacks

  before_poll do
    @attempts ||= 0
    @atempts += 1
  end

  private

  def consume
    Karafka.logger.debug "This is consumption after the #{@attempts} poll"
  end
end

# @example Create a consumer with a method before_poll
class ExampleConsumer < Karafka::BaseConsumer
  include Karafka::Consumers::Callbacks

  before_poll :before_poll_method

  def consume
  end

  private

  def before_poll_method
  end
end
```

#### after_poll

Callback that will be executed **after** each attempt to fetch messages from Kafka. Note, that it will be performed regardless of whether there were messages in Kafka. It acts exactly the same way as the ```before_poll``` but after the fetch and the messages consumption.
