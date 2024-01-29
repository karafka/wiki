# WaterDrop Middleware

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

!!! note "Message Mutability"

    It is up to the end user to decide whether to modify the provided message or deep copy it and update the newly created one.

## Example Use Cases

- **Custom Partitioners**: By implementing custom partitioning logic within middleware, you gain precise control over how messages are distributed across Kafka partitions. This approach is invaluable for scenarios demanding specific distribution patterns, such as grouping related messages in the same partition to maintain the sequence of events.

- **Automatic Data Serialization**: Middleware can automatically transform complex data structures into a standardized format like JSON or Avro, streamlining the serialization process. This ensures consistent data formatting across messages and keeps serialization logic neatly encapsulated and separate from core business logic.

- **Automatic Headers Injection**: Enriching messages with essential metadata becomes effortless with middleware. Automatically appending headers like message creation timestamps or producer identifiers ensures that each message carries all necessary context, facilitating tasks like tracing and auditing without manual intervention.

- **Message Validation**: Middleware shines in its ability to ensure message integrity by validating each message against specific schemas or business rules before it reaches Kafka. This safeguard mechanism enhances data reliability by preventing invalid data from entering the stream and maintaining the high quality of the data within your topics.

- **Dynamic Routing Logic**: Middleware allows for the dynamic routing of messages based on content or context, directing messages to the appropriate topics or partitions on the fly. This adaptability is crucial in complex systems where message destinations might change based on factors like payload content, workload distribution, or system state, ensuring that the data flow remains efficient and contextually relevant.
