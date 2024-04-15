Karafka provides extensive support for custom deserialization processes that accommodate various data representations in your Kafka messages. This guide outlines how Karafka facilitates payload deserialization and extends to deserializing message keys and headers, offering broad flexibility in handling Kafka data. Additionally, it introduces the concept of lazy deserialization, which optimizes performance by delaying the deserialization process until the data is actually needed.

## Deserializers for Payload, Key, and Headers

Deserializers transform the raw data of Kafka messages (payload, key, and headers) into a format your application can process. You can configure default deserializers or specify custom deserializers for each topic within your routes configuration.

Each type of deserializer in Karafka accepts different parameters within the `#call` method and is expected to return a specific type of deserialized data. Below is a brief description of what each deserializer receives and is expected to return:

<table>
  <tr>
    <th>Deserializer Type</th>
    <th>Receives</th>
    <th>Expects Return</th>
    <th>Input Data Method</th>
  </tr>
  <tr>
    <td>Payload Deserializer</td>
    <td><code>Karafka::Messages::Message</code></td>
    <td>Deserialized Payload</td>
    <td><code>#raw_payload</code></td>
  </tr>
  <tr>
    <td>Key Deserializer</td>
    <td><code>Karafka::Messages::Metadata</code></td>
    <td>Deserialized Key</td>
    <td><code>#raw_key</code></td>
  </tr>
  <tr>
    <td>Headers Deserializer</td>
    <td><code>Karafka::Messages::Metadata</code></td>
    <td>Deserialized Headers Hash</td>
    <td><code>#raw_headers</code></td>
  </tr>
</table>

Below you can find an example of a payload XML deserializer:

```ruby
class XmlDeserializer
  def call(message)
    # nil case is for tombstone messages
    return nil if message.raw_payload.nil?

    Hash.from_xml(message.raw_payload)
  end
end
```

## Default Deserializers

Karafka makes specific assumptions about incoming data format, setting defaults for how payloads, keys, and headers are handled unless explicitly overridden by custom deserializers. Here are the default behaviors:

- **Payload**: Karafka assumes the message payload is in JSON format. This default deserializer automatically parses the raw payload from JSON into a Ruby hash, catering to common data interchange practices and supporting the tombstone event format.

- **Key**: By default, the key remains as a raw string. This approach is practical for most applications where the key is used primarily as an identifier or a partitioning token within Kafka.

- **Headers**: Headers are also kept in their original format by default. Karafka treats headers as a hash with string keys and string values, which is typical for transmitting metadata associated with the message.

## Configuring Deserializers

### Setting Defaults

In Karafka, you can configure default deserializers for all topics by utilizing the `#defaults` block within your routing configuration. This is particularly useful if your application generally handles messages in a specific format and you wish to apply a consistent deserialization approach across multiple topics.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  defaults do
    deserializers(
      payload: JsonDeserializer.new,
      key: StringDeserializer.new,
      headers: HashDeserializer.new
    )
  end
end
```

Suppose a specific deserializer is not set for a given element (payload, key, or headers). In that case, Karafka will revert to using the predefined defaults: JSON for payloads, raw strings for keys, and unchanged hashes for headers.

### Custom Per-Topic Deserializers

While setting default deserializers is a reliable way to maintain consistency across an application, Karafka's true power lies in its flexibility. It allows for detailed customization by configuring deserializers for individual topics, a feature that becomes invaluable when dealing with topics that require specific data handling procedures or when integrating with external systems that use varied data formats.

To set deserializers for a specific topic, you use the deserializers method within the topic configuration block in your routing setup. This allows you to define unique deserialization logic for the payload, key, and headers of messages consumed from that topic.

Here's an example of how to configure deserializes for individual topics:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :financial_transactions do
      consumer TransactionsConsumer

      deserializers(
        payload: AvroDeserializer.new,
        key: IntegerDeserializer.new,
        headers: JsonDeserializer.new
      )
    end

    topic :system_logs do
      consumer LogsConsumer
      deserializers(
        payload: TextDeserializer.new
        # Uses the default framework deserializers
      )
    end
  end
end
```

!!! Warning "Per-Topic Deserializer Overrides"

    When you configure deserializers for a specific topic using the `#deserializers` method and do not include deserializers for all components (payload, key, headers), be aware that Karafka treats the `#deserializers` block as atomic. This means that for any component not explicitly defined within the topic's `#deserializers` block, Karafka will revert to using the framework's built-in defaults, **not** the overrides specified in the `#defaults` block.

## Context Aware Deserialization

In more complex messaging environments, a message's content and format can vary significantly based on its context, such as the topic or specific headers associated with it. Karafka supports context-aware deserialization, where the deserialization logic can adjust dynamically based on additional information from the message itself, enhancing flexibility and robustness in message processing.

Deserializers in Karafka can access the full context of a message, including its headers and the topic it belongs to. This capability allows for dynamic adjustments in the deserialization process based on this context, such as selecting a specific schema or method for decoding the message data. An everyday use case for this is with formats like Avro, where a message header may indicate the schema needed to decode a message.

```ruby
class AvroDeserializer
  attr_reader :avro

  def initialize(avro: avro)
    @avro = avro
  end

  def call(message)
    avro.decode(message.raw_payload, subject: message.headers['message_type'])
  end
end

class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :binary_video_details do
      consumer Videos::DetailsConsumer

      deserializers(
        payload: AvroDeserializer.new(avro: AvroTurf.new)
      )
    end
  end
end
```

## Lazy Deserialization

In Karafka, lazy deserialization extends beyond the payload to include both the message key and headers. This feature enhances performance by delaying the conversion of raw message data into a usable format until it is explicitly required. This approach is especially beneficial for operations such as metadata-based filtering or when dealing with large datasets where minimizing processing overhead is crucial.

Karafka defers the deserialization for the payload, key, and headers. Here's how each component is handled:

- **Payload**: Deserialization occurs when the `Karafka::Messages::Message#payload` method is invoked for the first time. The deserialized data is cached, so subsequent accesses do not trigger re-deserialization.

- **Key**: Similar to payloads, keys are deserialized on the first invocation of the `Karafka::Messages::Message#key` method, with the result cached for future accesses.

- **Headers**: Headers are deserialized upon the first call to `Karafka::Messages::Message#headers`. The deserialized headers are stored to prevent redundant processing.

Access to the raw data for each component is also provided without triggering deserialization:

- `Karafka::Messages::Message#raw_payload` for payloads,
- `Karafka::Messages::Message#raw_key` for keys,
- `Karafka::Messages::Message#raw_headers` for headers.

Here's an expanded example that illustrates the use of lazy deserialization across all components of a message. This example filters messages based on the content of the raw payload and headers, then processes and prints data from the deserialized payload and key:

```ruby
class EventsConsumer < ApplicationConsumer
  def consume
    messages
      # Limit data amount using raw payload string based scanning
      .select { _1.raw_payload.include?('signature') }
      # Deserialize
      .map(&:payload)
      # Look for data with particular key
      .select { _1.keys.include?('signature') }
      # extract what you were looking for
      .map { _1.fetch('signature') }
      # Print only those
      .each { puts _1 }
  end
end
```

Lazy deserialization provides following benefits:

- **Performance Optimization**: By avoiding unnecessary deserialization, Karafka minimizes CPU usage and speeds up processing times, especially in filter-heavy applications.

- **Resource Efficiency**: Memory usage is optimized as only necessary data is processed and stored after deserialization.

- **Flexibility and Control**: Developers have more control over when and how data is processed, allowing for customized handling based on the content of the messages.

Lazy deserialization in Karafka provides a robust mechanism for managing data processing in a Kafka-based messaging environment. It ensures that applications remain efficient and responsive even as data volume and complexity grow.

## Handling of Tombstone Messages

In Apache Kafka, tombstone messages are specific messages with the message key present, but the payload is null. These messages serve a critical role in Kafka's log compaction feature, which reduces the size of the log by removing outdated records. A tombstone message indicates that any previous messages with the same key should be considered deleted or obsolete, allowing Kafka to maintain only the most current data state for each key.

Even if your current application logic does not specifically handle or generate tombstone messages, it is important to design your systems to accommodate them. This ensures that your application can correctly interpret and react to data streams that might include tombstone messages, particularly when integrating with other systems or when changes to data handling policies are implemented.

When creating custom deserializers, you should explicitly manage the possibility of encountering tombstone messages. The deserializer should be able to gracefully handle `nil` payloads without causing errors or unintended behavior in the application. Here is how you can implement this in a custom XML deserializer:

```ruby
class XmlDeserializer
  def call(message)
    # Check for tombstone messages where the payload is nil
    return nil if message.raw_payload.nil?

    # Proceed with deserialization if the payload is not nil
    Hash.from_xml(message.raw_payload)
  end
end
```

By properly managing tombstone messages in your Kafka consumers, you can ensure that your application remains stable and consistent, even when dealing with evolving data states facilitated by Kafka’s log compaction feature.

## Apache Avro

[Apache Avro](https://avro.apache.org/) is a data serialization system developed by the Apache Foundation, used widely in the Big Data and cloud computing field. It provides a compact, fast, binary data format with rich data structures. Its schema evolution capability allows for flexibility in data reading and writing, with old software being able to read new data and vice versa. This language-agnostic system aids efficient data interchange between programs and supports a seamless and efficient way of data storage, encoding, and decoding.

From the perspective of the Karafka framework, Avro is a serialization and deserialization layer, and there are no special things that are required to use it aside from making sure that you both serialize and deserialize your data using it.

In other words, Avro is used to convert complex data structures into a format that can be easily transported over the network or stored, and later be converted back into the original data structure. This is crucial when working with Kafka, as data often needs to be sent between different services or stored for later use.

The Ruby ecosystem offers an excellent gem for working with Avro called `avro_turf`. This gem provides a simple and effective way to encode and decode data using Avro, and it's compatible with both local filesystem schemas and schema registries.

Let's explain these two concepts:

1. **Local Filesystem Schemas**: When using Avro, you define how your data should be structured using schemas. These schemas are often stored as `.avsc` files on your local filesystem. `avro_turf` can read these schema files and use them to encode your data into Avro's binary format or decode binary data back into its original form.

2. **Schema Registry**: A Schema Registry is a server that stores Avro schemas in a central location. It is handy in a microservice architecture where many services may need to share and access common schemas. Keeping your Avro schemas in a Schema Registry allows different services to look up the schema associated with a particular version of data, ensuring that data can be correctly decoded even as your schemas evolve.

### Serialization using Avro

#### Local Filesystem Schemas

To serialize data with Avro and `avro_turf` for use with Karafka, you'll first need to define an Avro schema for the data you want to send. Once you have the schema, you need to create an Avro reference object, point it to your schema and ensure that during deserialization, Karafka knows which schema to use:

```ruby
avro = AvroTurf.new(schemas_path: 'app/schemas/')
message = avro.encode(
  { 'full_name' => 'Jane Doe', 'age' => 28 },
  schema_name: 'person',
  validate: true
)

Karafka.producer.produce_async(
  topic: 'people',
  payload: message,
  # indicate type of schema in the message headers
  headers: { message_type: 'person' }
)
```

#### Schema Registry

In case of a schema registry, you also need to connect to it and select the expected subject of serialization:

```ruby
avro = AvroTurf::Messaging.new(registry_url: 'http://0.0.0.0:8081')

message = avro.encode(
  { 'title' => 'hello, world' },
  subject: 'greeting',
  version: 1
)

Karafka.producer.produce_async(
  topic: 'greeting',
  payload: message
)
```

When working with a schema registry, there is no need for a `message_type` definition, as it will be auto-detected.

#### Abstracting Avro serialization

If you frequently use Avro for serialization and deserialization with Karafka, creating a wrapper around the Karafka producer can be beneficial. This wrapper can handle the Avro serialization before producing messages to Kafka, reducing redundancy and making your code more concise and manageable:

```ruby
class AvroProducer
  # Point this to your schemas location
  AVRO = AvroTurf.new(schemas_path: 'app/schemas/')

  class << self
    def produce_async(topic, data, schema)
      message = AVRO.encode(
        data,
        schema_name: schema_name,
        validate: true
      )

      Karafka.producer.produce_async(
        topic: topic,
        payload: message,
        headers: { message_type: schema }
      )
    end
  end
end

AvroProducer.produce_async(
  'people',
  { 'full_name' => 'Jane Doe', 'age' => 28 },
  'person'
)
```

### Deserialization using Avro

When receiving Avro-encoded messages in a Karafka consumer, you'll need to deserialize these messages back into a usable form. One efficient way to handle this is by creating a custom Karafka deserializer.

#### Local Filesystem Schemas

Create your Avro deserializer:

```ruby
class AvroLocalDeserializer
  AVRO = AvroTurf.new(schemas_path: 'app/schemas/')

  def call(message)
    AVRO.decode(
      message.raw_payload,
      schema_name: message.headers['message_type']
    )
  end
end
```

And indicate that a given topic contains Avro data in your routing setup:

```ruby
topic :person do
  consumer PersonConsumer
  deserializers(
    payload: AvroLocalDeserializer.new
  )
end
```

#### Schema Registry

Create your Avro deserializer:

```ruby
class AvroRegistryDeserializer
  # Note, that in a production system you may want to pass authorized Avro reference
  AVRO = AvroTurf::Messaging.new(registry_url: 'http://0.0.0.0:8081')

  def call(message)
    AVRO.decode(
      message.raw_payload
    )
  end
end
```

And indicate that a given topic contains Avro data in your routing setup:

```ruby
topic :person do
  consumer PersonConsumer
  deserializers(
    payload: AvroRegistryDeserializer.new
  )
end
```
