# This document is valid only for the threads branch

Callbacks can be used to trigger some actions on certain moments of Karafka messages receiving flow. You can use if for additional actions that need to take place at certain moments. They are not included by default, as we don't want to provide functionalities that are not required by users by default.

In order to be able to use them, you need to include ```Karafka::Controllers::Callbacks``` module into your controller class:

```ruby
class ExamplesController < Karafka::BaseController
  include Karafka::Controllers::Callbacks

  after_received do
    # Some logic here
  end

  def perform
    # some logic here
  end
end
```

Currently following callbacks are available:

- after_received - executed right after we receive messages from Kafka but before the main logic kicks in
- after_poll - executed after **each** attempt to receive messages from Kafka (even when there is no data)
- before_poll - executed before **each** attempt to receive messages from Kafka (even when there is no data)
- before_shutdown - executed before the shutdown process kicks in. Really useful if you use manual offset management

**Warning**: Keep in mind, that despite the backend processing engine you will use, the callbacks will always be triggered inside of the Karafka server process.

## after_received

Callback that will be executed **after** we receive messages from Kafka, but before they are processed.

Note that if ```after_received``` throws abort, the chain will be stopped and the processing of a given message / messages batch won't continue. It means that for backend based engines it can be used as a way to control what goes and what goes not into the backend queue.

Here are some of the examples on how to use the ```after_received``` callback:

```ruby
# @example Create a controller with a block after_received
class ExampleController < Karafka::BaseController
  after_received do
    # Here we should have some checking logic
    # If throw(:abort) is returned, won't schedule a perform action
  end
  def perform
    # some logic here
  end
end

# @example Create a controller with a method after_received
class ExampleController < Karafka::BaseController
  after_received :after_received_method
  def perform
    # some logic here
  end
  private
  def after_received_method
    # Here we should have some checking logic
    # If throw(:abort) is returned, won't schedule a perform action
  end
end

## before_poll

WIP

## after_poll

WIP

## before_stop

WIP
