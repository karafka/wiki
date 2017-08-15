Controllers should inherit from the **ApplicationController** (or any other controller that inherits from **Karafka::BaseController**). You need to define a ```#perform``` method that will execute your business logic code.

```ruby
class UsersController < ApplicationController
  def perform
    # business logic goes here
  end
end
```

## Controller operation modes

Depending on your application and/or consumer group settings, Karafka's controller can process messages in two modes:

* Batch messages processing - allows you to use ```#params_batch``` method that will contain an array of messages
* Single message processing - allows you to use ```#params``` method that will always contain a single message

Which mode you decide to use strongly depends on your business logic.

**Note**: ```batch_processing``` and ```batch_consuming``` aren't the same. Please visit the [config](https://github.com/karafka/karafka/wiki/Setup) section of this Wiki for an explanation.

### Batch messages processing

When the batch processing mode is enabled, a single ```#perform``` method will receive a batch of messages from Kafka (although they will always be from a single partition of a single topic). You can access them using the ```#params_batch``` method as presented:

```ruby
class UsersController < ApplicationController
  def perform
    params_batch.each do |message|
      User.create!(message[:user])
    end
  end
end
```

Keep in mind, that ```params_batch``` is not just a simple array. The messages inside are **lazy** parsed upon first usage, so you cannot directly flush it into DB. To do so, please use the ```#parsed``` params batch method to parse all the messages:

```ruby
class UsersController < ApplicationController
  def perform
    EventStore.store(params_batch.parsed)
  end
end
```

Parsing will be automatically performed as well, if you decide to map parameters (or use any Enumerable module method):

```ruby
class UsersController < ApplicationController
  def perform
    EventStore.store(params_batch.map { |param| param[:user] })
  end
end
```

### Single message processing

In this mode, Karafka's controller will process messages separately, one after another. You can think of it as a equivalent of a typical HTTP request processing controller. Inside of your ```#perform``` method, you will be able to use the ```#params``` method and it will contain a single Kafka message in it.

```ruby
class UsersController < ApplicationController
  def perform
    User.create!(params[:user])
  end
end
```

## Controllers callbacks

You can add any number of ```before_enqueue``` callbacks. It can be a method or a block.
before_enqueue acts in a similar way to Rails before_action so it should perform "lightweight" operations. You have access to ```#params_batch``` and ```#params``` inside of it. Based on them you can define which data you want to process and which you do not.

**Warning**: keep in mind, that all *before_enqueue* blocks/methods are executed after messages are received. This is executed right after receiving the incoming messages. This means, that if you perform "heavy duty" operations there, Karafka might slow down significantly, especially if you use the ```inline_processing``` mode.

If any of callbacks throws :abort - ```#perform``` method will be executed (the execution chain will stop).

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

## Dynamic worker selection

When you work with Karafka, you may want to schedule part of the jobs to a different worker based on the incoming params. This can be achieved by reassigning topics worker in the *#before_enqueue* block:

```ruby
before_enqueue do
  self.topic.worker = (params[:important] ? FastWorker : SlowWorker)
end
```
