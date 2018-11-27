It's quite common when using Kafka, to treat applications as parts of a bigger pipeline (similarly to Bash pipeline) and forward processing results to other applications. Karafka provides two ways of dealing with that:

  - Using [Responders](https://github.com/karafka/karafka/wiki/Responders) - recommended
  - Using [WaterDrop](https://github.com/karafka/waterdrop) directly

Each of them has it's own advantages and disadvantages and it strongly depends on your application business logic which one will be better. The recommended (and way more elegant) way is to use responders for that.

## Using responders (recommended)

**Note**: If you want more details on how responders work, there's a dedicated [Wiki section](https://github.com/karafka/karafka/wiki/Responders) for that.

One of the main differences when you respond to a Kafka message instead of a HTTP response, is that the response can be sent to many topics (instead of one HTTP response per one request) and that the data that is being sent can be different for different topics. That's why a simple ```#respond_to``` would not be enough.

In order to go beyond this limitation, Karafka uses responder objects that are responsible for sending data to other Kafka topics.

### Using responders from within Karafka consumers

By default, if you name a responder with the same name as a Karafka consumer, it will be detected automatically:

```ruby
module Users
  class CreateConsumer < ApplicationConsumer
    def consume
      # You can provide as many objects as you want to respond_with as long as
      # a responders #respond method accepts the same amount
      respond_with User.create(params.value['user'])
    end
  end

  # Consumer and responder don't need to be in the same file. It is just an example
  class CreateResponder < ApplicationResponder
    topic :user_created

    def respond(user)
      respond_to :user_created, user
    end
  end
end
```

The appropriate responder will be used automatically when you invoke the ```#respond_with``` consumer method.

Why did we separate the response layer from the consumer layer? Because sometimes when you respond to multiple topics conditionally, that logic can be really complex and it is way better to manage and test it in isolation.


### Using responders directly from any place in the codebase

You can also use responders outside of Karafka consumers (for example directly from Ruby on Rails controllers) by using the responder ```#call``` method:

```ruby
class ExampleResponder < ApplicationResponder
  topic :users_notified

  def respond(user)
    respond_to :users_notified, user, key: user.id
  end
end

# This way of running responders allows you to use it from any place in your codebase
ExampleResponder.call(User.last)
```

For more details about responders DSL, please visit the responders Wiki page.

## Using WaterDrop directly

It is not recommended (as it breaks responders validations and makes it harder to track data flow), but if you want to send messages outside of Karafka responders, you can to use the **WaterDrop** gem directly.

Example usage:

```ruby
WaterDrop::SyncProducer.call('message', topic: 'topic')
WaterDrop::SyncProducer.call({ user_id: 1 }.to_json, topic: 'topic')
# Or using the async producer
WaterDrop::AsyncProducer.call('message', topic: 'topic')
WaterDrop::AsyncProducer.call({ user_id: 1 }.to_json, topic: 'topic')
```

Please follow [WaterDrop README](https://github.com/karafka/waterdrop/blob/master/README.md) for more details on how to use it.
