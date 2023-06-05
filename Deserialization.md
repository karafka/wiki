Karafka, by default, assumes you are receiving and sending JSON information.

This means that if you receive, for example, an XML payload, deserialization will fail.

Deserializers are used to convert raw Kafka messages into a workable format. They are used when working with incoming messages and accept the full `message` object as an argument.

You can set a default deserializer that will be used for all the topics, or you can specify a deserializer per topic in the routing.

```ruby
class XmlDeserializer
  def call(message)
    # nil case is for tombstone messages
    return nil if message.raw_payload.nil?

    Hash.from_xml(message.raw_payload)
  end
end

App.routes.draw do
  topic :binary_video_details do
    consumer Videos::DetailsConsumer
    deserializer XmlDeserializer.new
  end
end
```

The default deserializer is `Karafka::Serialization::Json::Deserializer`.

Also, deserializes can use headers and topic values from the message to decode specific formats, for example, Avro:

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

App.routes.draw do
  topic :binary_video_details do
    consumer Videos::DetailsConsumer
    deserializer AvroDeserializer.new(avro: AvroTurf.new)
  end
end
```

## Lazy deserialization

The payload will not be deserialized unless needed. This makes things like metadata-based filtering or raw string-based filtering extremely fast because no data parsing is involved.

Whenever you invoke the `Karafka::Messages::Message#payload` method, the deserialization will happen, and the result will be stored. This means that consecutive `#payload` invocation on the same message won't deserialize it repeatedly.

If you want to access raw payload data, you can use the `Karafka::Messages::Message#raw_payload` method.

Below you can find an example of the elevation of this feature. Any time you expect occurrences of certain characters in a JSON structure, you can quickly pre-filter raw data and only deserialize those that potentially may include what you are looking for.

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

## Handling of tombstone messages

Tombstone messages are messages that contain a valid key, but its value is null. Those messages are used with Kafka topics compaction to eliminate obsolete records.

Whether or not you do plan to use tombstone messages, we highly recommend you supporting them in your custom deserializers:

```ruby
class XmlDeserializer
  def call(message)
    # nil case is for tombstone messages
    return nil if message.raw_payload.nil?

    Hash.from_xml(message.raw_payload)
  end
end
```

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
  deserializer AvroLocalDeserializer.new
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
  deserializer AvroRegistryDeserializer.new
end
```
