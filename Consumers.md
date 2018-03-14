Consumers should inherit from the **ApplicationConsumer** (or any other consumer that inherits from **Karafka::BaseConsumer**). You need to define a ```#consume``` method that will execute your business logic code.

```ruby
# You can name it whatever you want instead of ApplicationConsumer
ApplicationConsumer = Class.new(Karafka::BaseConsumer)

class UsersConsumer < ApplicationConsumer
  def consume
    # business logic goes here
  end
end
```

## Consumers naming convention

You can name the main application consumer with any name. You can call it **ApplicationConsumer** or anything else you want. Karafka will sort that out, as long as your root application consumer inherits from the **Karafka::BaseConsumer**.

## Consumer topic method

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
    puts topic.to_h #=> { backend: :inline, name: 'x', ... }
  end
end
```
