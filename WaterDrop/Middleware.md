WaterDrop supports injecting middleware similar to Rack.

Middleware can be used to provide extra functionalities like auto-serialization of data or any other modifications of messages before their validation and dispatch.

Each middleware accepts the message hash as input and expects a message hash as a result.

There are two methods to register middlewares:

- `#prepend` - registers middleware as the first in the order of execution
- `#append` - registers middleware as the last in the order of execution

Below you can find an example middleware that converts the incoming payload into a JSON string by running `#to_json` automatically:

```ruby
class AutoMapper
  def call(message)
    message[:payload] = message[:payload].to_json
    message
  end
end

# Register middleware
producer.middleware.append(AutoMapper.new)

# Dispatch without manual casting
producer.produce_async(topic: 'users', payload: user)
```

!!! note ""

    It is up to the end user to decide whether to modify the provided message or deep copy it and update the newly created one.
