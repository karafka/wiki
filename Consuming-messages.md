Depending on your application and/or consumer group settings, Karafka's consumer can consume messages in two modes:

* Batch messages consuming - allows you to use ```#params_batch``` method that will contain an array of messages
* Single message consuming - allows you to use ```#params``` method that will always contain a single message. You can think of this mode, as an equivalent to a standard HTTP way of doing things.

Which mode you decide to use strongly depends on your business logic.

**Note**: ```batch_consuming``` and ```batch_fetching``` aren't the same. Please visit the [config](https://github.com/karafka/karafka/wiki/Configuration) section of this Wiki for an explanation.

### Accessing the message payload

Each Karafka message, whether it is accesed from the ```#params_batch``` or directly via the ```#params``` method includes additional metadata information that comes either from the Karafka framework or from the Kafka cluster.

In order to access the Kafka message payload you need to use the `#payload` method. It will parse and return the message payload.

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    params_batch.each do |message|
      puts "Message payload: #{message.payload}"
    end
  end
end
```

### Batch messages consuming

When the batch consuming mode is enabled, a single ```#consume``` method will receive a batch of messages from Kafka (although they will always be from a single partition of a single topic). You can access them using the ```#params_batch``` method as presented:

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    params_batch.each do |message|
      User.create!(message.payload['user'])
    end
  end
end
```

Keep in mind, that ```params_batch``` is not just a simple array. The messages inside are **lazy** parsed upon the first usage, so you shouldn't directly flush them into DB. To do so, please use the ```parse!``` params batch method to parse all the messages:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    EventStore.store(params_batch.parse!)
  end
end
```

Parsing will be automatically performed as well if you decide to map parameters (or use any Enumerable module method):

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    EventStore.store params_batch.map { |message| message.payload['user'] }
  end
end
```

This was implemented that way because there are cases, in which based on some external parameters you may want to drop consuming of a given batch or some particular messages. If so, then why would you even want to parse them in the first place? :)

If you are not interested in the additional `#params` metadata, you can use the `#payloads` method to access only the Kafka messages payload:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    EventStore.store params_batch.payloads
  end
end
```

### Single message consuming

In this mode, Karafka's consumer will consume messages separately, one after another. You can think of it as an equivalent of a typical HTTP request processing consumer. Inside of your ```#consume``` method, you will be able to use the ```#params``` method and it will contain a single Kafka message in it.

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    puts params #=> { 'parsed' =>true, 'topic' => 'example', 'partition' => 0, ... }
    User.create!(params.payload['user'])
  end
end
```

## Backends

Due to different scenarios and cases when working with Kafka messages, Karafka supports using backends that allow you to choose, where you want to consume your data:

* ```:inline``` - default mode that will consume messages right after they were received by Karafka
* ```:sidekiq``` - mode in which Karafka will schedule a background Sidekiq job to consume given message or messages in a background worker. To use Sidekiq backend, please follow the instructions in the README of [Karafka Sidekiq Backend](https://github.com/karafka/karafka-sidekiq-backend) repository.

You can just set the ```backend``` setting in your config file (to make it a default) or you can set it per topic in your routing.

```ruby
# Per app
class App < Karafka::App
  setup do |config|
    config.backend = :inline
  end
end

# Per topic
App.consumer_groups.draw do
  consumer_group :group_name do
    topic :example do
      consumer ExampleConsumer
      backend :sidekiq
    end

    topic :example2 do
      consumer Example2Consumer
      backend :inline
    end
  end
end
```
