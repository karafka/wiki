Controllers should inherit from the **ApplicationController** (or any other controller that inherits from **Karafka::BaseController**). You need to define a ```#perform``` method that will execute your business logic code.

```ruby
class UsersController < ApplicationController
  def perform
    # business logic goes here
  end
end
```

## Controllers callbacks

You can add any number of ```before_enqueue``` callbacks. It can be a method or a block.
before_enqueue acts in a similar way to Rails before_action so it should perform "lightweight" operations. You have access to ```#params_batch``` and ```#params``` inside of it. Based on them you can define which data you want to process and which you do not.

**Warning**: keep in mind, that all *before_enqueue* blocks/methods are executed after messages are received. This is executed right after receiving the incoming messages. This means, that if you perform "heavy duty" operations there, Karafka might slow down significantly, especially if you use :inline ```processing adapter```.

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
## Controller topic method

If for any case, your logic is dependent on some routing details, you can access them from the controller using the ```#topic``` method. You could use it for example, in case you want to perform a different logic within a single controller, based on the topic from which your messages come:

```ruby
class UsersController < ApplicationController
  def perform
    send(:"topic_#{topic.name}")
  end

  def topic_a
    # do something
  end

  def topic_b
    # do something else if it's a "b" topic
  end
end
```

If you're interested in all the details that are stored in the topic, you can extract all of them at once, by using the ```#to_h``` method:

```ruby
class UsersController < ApplicationController
  def perform
    puts topic.to_h #=> { processing_adapter: :inline, name: 'x', worker: nil, ... }
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
