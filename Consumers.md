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

## Consumer batch metadata method

When in `batch_fetching` mode, while fetching data from the Kafka cluster, additional information is being received. This details are available using the `#batch_metadata` consumer method.

```ruby
class UsersConsumer < ApplicationConsumer
  def consume
    puts batch_metadata #=> { batch_size: 200, topic: 'events', partition: 2 }
  end
end
```
