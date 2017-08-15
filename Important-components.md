Apart from the internal implementation, Karafka is combined from the following components  programmers mostly will work with:

  - Controllers - objects that are responsible for processing incoming messages (either one by one or in batches)
  - Responders - objects that are responsible for sending responses based on the processed data
  - Workers - objects that execute data processing using Sidekiq backend (optional - you can process everything in the main Karafka server process, without using Sidekiq at all)

### Table of Contents

  - [Controllers](#controllers)
      - [Controllers callbacks](#controllers-callbacks)
      - [Dynamic worker selection](#dynamic-worker-selection)
  - [Responders](#responders)
      - [Registering topics](#registering-topics)
      - [Responding on topics](#responding-on-topics)
      - [Response validation](#response-validation)
      - [Response partitioning](#response-partitioning)

### Controllers

Controllers should inherit from **ApplicationController** (or any other controller that inherits from **Karafka::BaseController**). If you don't want to use custom workers (and except some particular cases you don't need to), you need to define a **#perform** method that will execute your business logic code.

```ruby
class UsersController < ApplicationController
  # If you don't use inline_processing mode, execution will be enqueued in
  # Sidekiq. In that case, Karafka will schedule automatically a proper job
  # and execute this logic in the background
  def perform
    User.create(params[:user])
  end
end
```

#### Controllers callbacks

You can add any number of *before_enqueue* callbacks. It can be a method or a block.
before_enqueue acts in a similar way to Rails before_action so it should perform "lightweight" operations. You have access to ```params_batch``` and ```params``` inside of it. Based on them you can define which data you want to process and which you do not.

**Warning**: keep in mind, that all *before_enqueue* blocks/methods are executed after messages are received. This is executed right after receiving the incoming messages. This means, that if you perform "heavy duty" operations there, Karafka might slow down significantly, especially if you use the ```inline_processing``` mode.

If any of callbacks throws :abort - *perform* method will be executed (the execution chain will stop).

Once you run a consumer - messages from Kafka server will be send to a proper controller (based on its topic id).

Presented example controller will accept incoming messages from a Kafka topic named :karafka_topic

```ruby
  class TestController < ApplicationController
    # before_enqueue has access to received params.
    # You can modify them before enqueuing it to sidekiq.
    before_enqueue {
      params.merge!(received_time: Time.now.to_s)
    }

    before_enqueue :validate_params

    def perform
      Service.new.add_to_queue(params[:message])
    end

    private

   # We will not enqueue to Sidekiq those messages, which were sent
   # from sum method and return too high message for our purpose.
   def validate_params
     throw(:abort) unless params['message'].to_i > 50 && params['method'] != 'sum'
   end
end
```

#### Dynamic worker selection

When you work with Karafka, you may want to schedule part of the jobs to a different worker based on the incoming params. This can be achieved by reassigning topics worker in the *#before_enqueue* block:

```ruby
before_enqueue do
  self.topic.worker = (params[:important] ? FastWorker : SlowWorker)
end
```


### Responders

Responders are used to design and control response flow that comes from a single controller action. You might be familiar with a #respond_with Rails controller method. In Karafka it is an entrypoint to a responder *#respond*.

Having a responders layer helps you prevent bugs when you design a receive-respond applications that handle multiple incoming and outgoing topics. Responders also provide a security layer that allows you to control that the flow is as you intended. It will raise an exception if you didn't respond to all the topics that you wanted to respond to.

Here's a simple responder example:

```ruby
class ExampleResponder < ApplicationResponder
  topic :users_notified

  def respond(user)
    respond_to :users_notified, user
  end
end
```

When passing data back to Kafka, responder uses parser **#generate** method to convert message object to a string. It will use parser of a route for which a current message was directed. By default it uses Karafka::Parsers::Json parser.

Note: You can use responders outside of controllers scope, however it is not recommended because then, they won't be listed when executing **karafka flow** CLI command.

#### Registering topics

In order to maintain order in topics organization, before you can send data to a given topic, you need to register it. To do that, just execute *#topic* method with a topic name and optional settings during responder initialization:

```ruby
class ExampleResponder < ApplicationResponder
  topic :regular_topic
  topic :optional_topic, required: false
  topic :multiple_use_topic, multiple_usage: true
end
```

*#topic* method accepts following settings:

| Option         | Type    | Default | Description                                                                                                |
|----------------|---------|---------|------------------------------------------------------------------------------------------------------------|
| required       | Boolean | true    | Should we raise an error when a topic was not used (if required)                                           |
| multiple_usage | Boolean | false   | Should we raise an error when during a single response flow we sent more than one message to a given topic |

#### Responding on topics

When you receive a single HTTP request, you generate a single HTTP response. This logic does not apply to Karafka. You can respond on as many topics as you want (or on none).

To handle responding, you need to define *#respond* instance method. This method should accept the same amount of arguments passed into *#respond_with* method.

In order to send a message to a given topic, you have to use **#respond_to** method that accepts two arguments:

  - topic name (Symbol)
  - data you want to send (if data is not string, responder will try to run #to_json method on the incoming data)

```ruby
# respond_with user, profile

class ExampleResponder < ApplicationResponder
  topic :regular_topic
  topic :optional_topic, required: false

  def respond(user, profile)
    respond_to :regular_topic, user

    if user.registered?
      respond_to :optional_topic, profile
    end
  end
end
```

#### Response validation

In order to ensure the dataflow is as intended, responder will validate what and where was sent, making sure that:

  - Only topics that were registered were used (no typos, etc.)
  - Only a single message was sent to a topic that was registered without a **multiple_usage** flag
  - Any topic that was registered with **required** flag (default behavior) has been used

This is an automatic process and does not require any triggers.

#### Response partitioning

Kafka topics are partitioned, which means that  you can assing messages to partitions based on your business logic. To do so from responders, you can pass one of the following keyword arguments as a last option of a **#respond_to** method:

* partition - use it when you want to send a given message to a certain partition
* partition_key - use it when you want to ensure that a certain group of messages is delivered to the same partition, but you don't which partition it will be.

```ruby
class ExampleResponder < ApplicationResponder
  topic :regular_topic
  topic :different_topic

  def respond(user, profile)
    respond_to :regular_topic, user, partition: 12
    # This will send user details to a partition based on the first letter
    # of login which means that for example all users with login starting
    # with "a" will go to the same partition on the different_topic
    respond_to :different_topic, user, partition_key: user.login[0].downcase
  end
end
```

If no keys are passed, the producer will randomly assign a partition.