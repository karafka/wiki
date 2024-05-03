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

## Round-Robin Distribution Example Middleware

Below, you can find an example of a middleware that implements a round-robin message distribution across available partitions of the selected topic:

```ruby
class Distributor
  # We need the producer to fetch the number of partitions
  # This will make the distributor dynamic, allowing for graceful support of repartitioning
  # We also support the case of non-existing topics just by assigning partition 0.
  def initialize(producer, topics)
    @producer = producer
    @topics = topics
    @cycles = {}
    @partition_counts = {}
    @mutex = Mutex.new
  end

  def call(message)
    topic = message.fetch(:topic)

    # Do nothing unless it is one of the topics we want to round-robin
    return message unless @topics.include?(topic)

    build_iterator(topic)

    # Assign partitions in the round-robin fashion to messages
    message[:partition] = next_partition(topic)
    p message[:partition]

    # Return the morphed message
    message
  end

  private

  # Builds the Ruby iterator we can use to round-robin all the partitions unless it already
  # exists and matches correctly number of partitions
  #
  # @param topic [String]
  def build_iterator(topic)
    partition_count = fetch_partition_count(topic)

    # If we already have number of partitions cached, it means cycle is already prepared
    # as well. If partitions count did not change, we can use it
    return if partition_count == @partition_counts[topic]

    @mutex.synchronize do
      last_partition_id = partition_count - 1
      @cycles[topic] = (0..last_partition_id).cycle
      @partition_counts[topic] = partition_count
    end
  end

  # @param topic [String]
  # @return [Integer] next partition to which dispatch the message
  def next_partition(topic)
    @mutex.synchronize do
      @cycles.fetch(topic).next
    end
  end

  # @param topic [String] topic for which we want to get number of partitions
  # @return [Integer] number of partitions
  #
  # @note `#partition_count` fetched from rdkafka is cached. No need to cache it again
  # @note Will return 1 partition for topics that do not exist
  def fetch_partition_count(topic)
    @producer.partition_count(topic)
  rescue Rdkafka::RdkafkaError => e
    # This erro means topic does not exist, we then assume auto-create and will use 0 for now
    return 1 if e.code == :unknown_topic_or_part

    raise(e)
  end
end

MY_PRODUCER.middleware.append(Distributor.new(MY_PRODUCER, %w[events]))

MY_PRODUCER.produce_async(
  topic: 'events',
  payload: event.to_json
)
```

## Example Use Cases

- **Custom Partitioners**: By implementing [custom partitioning logic](https://karafka.io/docs/WaterDrop-Custom-Partitioners/) within middleware, you gain precise control over how messages are distributed across Kafka partitions. This approach is invaluable for scenarios demanding specific distribution patterns, such as grouping related messages in the same partition to maintain the sequence of events.

- **Automatic Data Serialization**: Middleware can automatically transform complex data structures into a standardized format like JSON or Avro, streamlining the serialization process. This ensures consistent data formatting across messages and keeps serialization logic neatly encapsulated and separate from core business logic.

- **Automatic Headers Injection**: Enriching messages with essential metadata becomes effortless with middleware. Automatically appending headers like message creation timestamps or producer identifiers ensures that each message carries all necessary context, facilitating tasks like tracing and auditing without manual intervention.

- **Message Validation**: Middleware shines in its ability to ensure message integrity by validating each message against specific schemas or business rules before it reaches Kafka. This safeguard mechanism enhances data reliability by preventing invalid data from entering the stream and maintaining the high quality of the data within your topics.

- **Dynamic Routing Logic**: Middleware allows for the dynamic routing of messages based on content or context, directing messages to the appropriate topics or partitions on the fly. This adaptability is crucial in complex systems where message destinations might change based on factors like payload content, workload distribution, or system state, ensuring that the data flow remains efficient and contextually relevant.
