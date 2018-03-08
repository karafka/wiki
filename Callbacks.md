## Callback types

Due to the fact, that some of the things happen in Karafka outside of consumers scope, there are two types of callbacks available:

- [Lifecycle callbacks](#lifecycle-callbacks) - callbacks that are triggered during various moments in the Karafka framework lifecycle. They can be used to configure additional software dependent on Karafka settings or to do one-time stuff that needs to happen before consumers are created.
- [Consumer callbacks](#consumer-callbacks) - callbacks that are triggered during various stages of messages flow

### Lifecycle callbacks

Lifecycle callbacks can be used in various situations, for example to configure external software or run additional one-time commands before messages receiving flow starts.

Currently following consumer callbacks are available:

- [after_init](#after_init) - executed after the framework and all it's internal parts have been configured and after all dynamically built classes are already in-memory
- [before_fetch_loop](#before_fetch_loop) - executed before we start fetching messages in each of the consumers groups

#### after_init

Callback that will be executed **once** per process, right after all the framework components are ready (including those dynamically built). It can be used for example to configure some external components that can be based on Karafka internal settings.

```ruby
class App < Karafka::App
  # Setup and other things...

  # Once everything is loaded and done, assign Karafka app logger as a Sidekiq logger
  # @note This example does not use config details, but you can use all the config values
  #   to setup your external components
  after_init do |_config|
    Sidekiq::Logging.logger = Karafka::App.logger
  end
```

#### before_fetch_loop

Callback that will be executed **once** per each consumer group per process, before we start receiving messages. This is a great place if you need to use seek Kafka functionality to reprocess already fetched messages again.

**Note**: Keep in mind, that this is a per process configuration (not per consumer) so you need to check if a provided consumer_group (if you use multiple) is the one you want to seek against.

```ruby
class App < Karafka::App
  # Setup and other things...

  # Moves the offset back to 100 message, so we can reprocess messages again
  # @note If you use multiple consumers group, make sure you execute ```#seek``` on a client of
  #   a proper consumer group not on all of them
  before_fetch_loop do |consumer_group, client|
    topic = 'my_topic'
    partition = 0
    offset = 100

    if consumer_group.topics.map(&:name).include?(topic)
      client.seek(topic, partition, offset)
    end
  end
end
```

### Consumer callbacks

Consumer callbacks can be used to trigger some actions on certain moments of Karafka messages receiving flow. You can use them for additional actions that need to take place at certain moments. They are not available by default, as we don't want to provide functionalities that are not required by users by default.

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

**Warning**: Note, that callbacks will only be triggered for topics that received at least a single message. This applies to all the callbacks, including the ```before_poll``` and ```after_poll```.

#### after_fetch

Callback that will be executed **after** we fetch messages from Kafka, but before they are consumed.

Here are some of the examples on how to use the ```after_fetch``` callback:

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
    @buffer += params_batch.parsed

    if @buffer.size >= FLUSH_THRESHOLD
      EventStore.import @buffer
      @buffer = []
    end
  end
end
```

#### before_poll

Callbacak that will be executed **before** each attempt to fetch messages from Kafka. Note, that it will be performed regardless whether there are messages in Kafka. It can be used to perform additional logic for resource availability checking or anything else that would have an impact on the messages consumption.

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

Callback that will be executed **after** each attempt to fetch messages from Kafka. Note, that it will be performed regardless whether there were messages in Kafka. It acts exactly the same way as the ```before_poll``` but after the fetch and the messages consumption.
