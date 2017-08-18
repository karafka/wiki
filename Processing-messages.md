Depending on your application and/or consumer group settings, Karafka's controller can process messages in two modes:

* Batch messages processing - allows you to use ```#params_batch``` method that will contain an array of messages
* Single message processing - allows you to use ```#params``` method that will always contain a single message. You can think of this mode, as an equivalent to a standard HTTP way of doing things.

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

Keep in mind, that ```params_batch``` is not just a simple array. The messages inside are **lazy** parsed upon first usage, so you shouldn't directly flush them into DB. To do so, please use the ```#parsed``` params batch method to parse all the messages:

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

This was implemented that way, because there are cases, in which based on some external parameters you may want to drop processing of a given batch. If so, then why would you even want to parse them in the first place? :)

### Single message processing

In this mode, Karafka's controller will process messages separately, one after another. You can think of it as a equivalent of a typical HTTP request processing controller. Inside of your ```#perform``` method, you will be able to use the ```#params``` method and it will contain a single Kafka message in it.

```ruby
class UsersController < ApplicationController
  def perform
    puts params #=> { 'parsed' =>true, 'topic' => 'example', 'partition' => 0, ... }
    User.create!(params[:user])
  end
end
```
