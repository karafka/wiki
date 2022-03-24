Consumers should inherit from the **ApplicationConsumer** (or any other consumer that inherits from **Karafka::BaseConsumer**). You need to define a ```#consume``` method that will execute your business logic code against a batch of messages.

Karafka fetches and consumes messages in batches by default.

## Consuming messages

Karafka framework has a long-running server process that is responsible for fetching and consuming messages.

To start Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

Karafka server can be also started with a limited set of consumer groups to work with. This is useful when you want to have a multi-process environment:

```bash
# This karafka server will be consuming only with listed consumer groups
# If you don't provide consumer groups, Karafka will connect using all of them
bundle exec karafka server --consumer-groups=events users
```

### In batches

Data fetched from Kafka is accessible using the `#messages` method. The returned object is an enumerable that contains received data as well as additional information that can be useful during the processing.

In order to access the payload of your messages, you can use the `#payload` method available for each received message:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    # Print all the payloads one after another
    messages.each do |message|
      puts message.payload
    end
  end
end
```

You can also access all the payloads together to elevate things like batch DB operations available for some of the ORMs:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    # Insert all the events at once with a single query
    Event.insert_all messages.payloads
  end
end
```

### One at a time

While we encourage you to process data in batches to elevate in-memory computation and many DBs batch APIs, you may end up wanting to process messages one at a time.

You can achieve this by defining a base consumer with such a capability:

```ruby
class SingleMessageBaseConsumer < Karafka::BaseConsumer
  attr_reader :message

  def consume
    messages.each do |message|
      @message = message
      consume_one
    end

    # This could be moved into the loop but would slow down the processing, it's a trade-off
    # between retrying the batch and processing performance
    mark_as_consumed(messages.last)
  end
end

class Consumer < SingleMessageBaseConsumer
  def consume_one
    puts "I received following message: #{message.payload}"
  end
end
```

### Topic details

If for any case, your logic is dependent on some routing details, you can access them from the consumer using the ```#topic``` method. You could use it for example, in case you want to perform a different logic within a single consumer, based on the topic from which your messages come:

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
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
class UsersConsumer < ApplicationConsumer
  def consume
    puts topic.to_h #=> { name: 'x', ... }
  end
end
```

### Batch metadata

### Starting from earliest or latest offset



















## Accessing the message payload

Each Karafka message, whether it is accesed from the ```#params_batch``` or directly via the ```#params``` method includes additional metadata information that comes either from the Karafka framework or from the Kafka cluster.

In order to access the Kafka message payload you need to use the `#payload` method. It will deserialize and return the message payload.

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    params_batch.each do |message|
      puts "Message payload: #{message.payload}"
    end
  end
end
```

## Batch messages consuming

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

Keep in mind, that ```params_batch``` is not just a simple array. The messages inside are **lazy** deserialized upon the first usage, so you shouldn't directly flush them into DB. To do so, please use the ```deserialize!``` params batch method to deserialize all the messages:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    EventStore.store(params_batch.deserialize!)
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

If you are not interested in the additional `#params` metadata, you can use the `#payloads` method to access only the Kafka messages deserialized payload:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    EventStore.store params_batch.payloads
  end
end
```

## Single message consuming

In this mode, Karafka's consumer will consume messages separately, one after another. You can think of it as an equivalent of a typical HTTP request processing consumer. Inside of your ```#consume``` method, you will be able to use the ```#params``` method and it will contain a single Kafka message in it.

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    puts params #=> { 'deserialized' =>true, 'topic' => 'example', 'partition' => 0, ... }
    User.create!(params.payload['user'])
  end
end
```
