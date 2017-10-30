Callbacks can be used to trigger some actions on certain moments of Karafka messages receiving flow. You can use if for additional actions that need to take place at certain moments. They are not included by default, as we don't want to provide functionalities that are not required by users by default.

In order to be able to use them, you need to include ```Karafka::Controllers::Callbacks``` module into your controller class:

```ruby
class ExamplesController < Karafka::BaseController
  include Karafka::Controllers::Callbacks

  after_fetched do
    # Some logic here
  end

  def consume
    # some logic here
  end
end
```

Currently following callbacks are available:

- after_fetched - executed right after we fetch messages from Kafka but before the main logic kicks in
- before_shutdown - executed before the shutdown process kicks in. Really useful if you use manual offset management
- after_poll - executed after **each** attempt to fetch messages from Kafka (even when there is no data)
- before_poll - executed before **each** attempt to fetch messages from Kafka (even when there is no data)

**Warning**: Keep in mind, that despite the backend consuming engine you will use, the callbacks will always be triggered inside of the Karafka server process.

## after_fetched

Callback that will be executed **after** we fetch messages from Kafka, but before they are consumed.

Note that if ```after_fetched``` throws abort, the chain will be stopped and the consuming of a given message / messages batch won't continue. It means that for backend based engines it can be used as a way to control what goes and what goes not into the backend queue.

Here are some of the examples on how to use the ```after_fetched``` callback:

```ruby
# @example Create a controller with a block after_fetched
class ExampleController < Karafka::BaseController
  after_fetched do
    # Here we should have some checking logic
    # If throw(:abort) is returned, won't schedule a consume action
  end

  def consume
    # some logic here
  end
end

# @example Create a controller with a method after_fetched
class ExampleController < Karafka::BaseController
  after_fetched :after_fetched_method
  def consume
    # some logic here
  end

  private

  def after_fetched_method
    # Here we should have some checking logic
    # If throw(:abort) is returned, won't schedule a consume action
  end
end
```

## before_stop

Callback that will be executed **before** the Karafka process stops. It can be used to mark message as consumed for manual offset management or to perform any cleaning or maintenance there might be. This can be really useful if we normalize data streams and import in batches and we want to import also the last, incomplete batch upon shutdown.

```ruby
# @example Create a controller with a block before_stop
class ExampleController < Karafka::BaseController
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

## before_poll

Callbacak that will be executed **before** each attempt to fetch messages from Kafka. Note, that it will be performed regardless whether there are messages in Kafka. It can be used to perform additional logic for resource availability checking or anything else that would have an impact on the messages consumption.

```ruby
# @example Create a controller with a block before_poll
class ExampleController < Karafka::BaseController
  before_poll do
    @attempts ||= 0
    @atempts += 1
  end

  private

  def consume
    Karafka.logger.debug "This is consumption after the #{@attempts} poll"
  end
end

# @example Create a controller with a method before_poll
class ExampleController < Karafka::BaseController
  before_poll :before_poll_method

  def consume
  end

  private

  def after_fetchedbefore_poll_method
  end
end
```

## after_poll

Callbacak that will be executed **after** each attempt to fetch messages from Kafka. Note, that it will be performed regardless whether there were messages in Kafka. It acts exactly the same way as the ```before_poll``` but after the fetch and the messages consumption.
