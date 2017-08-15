It's quite common when using Kafka, to treat applications as parts of a bigger pipeline (similarly to Bash pipeline) and forward processing results to other applications. Karafka provides two ways of dealing with that:

  - Using [Responders](https://github.com/karafka/karafka/wiki/Responders)
  - Using WaterDrop directly

Each of them has it's own advantages and disadvantages and it strongly depends on your application business logic which one will be better. The recommended (and way more elegant) way is to use responders for that.

#### Using responders (recommended)

**Note**: If you want more details on how responders work, there's a dedicated [Wiki section](https://github.com/karafka/karafka/wiki/Responders) for that.

One of the main differences when you respond to a Kafka message instead of a HTTP response, is that the response can be sent to many topics (instead of one HTTP response per one request) and that the data that is being sent can be different for different topics. That's why a simple ```#respond_to``` would not be enough.

In order to go beyond this limitation, Karafka uses responder objects that are responsible for sending data to other Kafka topics.

By default, if you name a responder with the same name as a controller, it will be detected automatically:

```ruby
module Users
  class CreateController < ApplicationController
    def perform
      # You can provide as many objects as you want to respond_with as long as
      # a responders #respond method accepts the same amount
      respond_with User.create(params[:user])
    end
  end

  class CreateResponder < ApplicationResponder
    topic :user_created

    def respond(user)
      respond_to :user_created, user
    end
  end
end
```

The appropriate responder will be used automatically when you invoke the ```#respond_with``` controller method.

Why did we separate the response layer from the controller layer? Because sometimes when you respond to multiple topics conditionally, that logic can be really complex and it is way better to manage and test it in isolation.

For more details about responders DSL, please visit the responders Wiki page.

#### Using WaterDrop directly

It is not recommended (as it breaks responders validations and makes it harder to track data flow), but if you want to send messages outside of Karafka responders, you can to use the **WaterDrop** gem directly.

Example usage:

```ruby
message = WaterDrop::Message.new('topic', 'message')
message.send!

message = WaterDrop::Message.new('topic', { user_id: 1 }.to_json)
message.send!
```

Please follow [WaterDrop README](https://github.com/karafka/waterdrop/blob/master/README.md) for more details on how to use it.