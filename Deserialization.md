Karafka by default assumes, you are receiving and sending JSON information.

This means, that if you receive for example an XML payload, deserialization will fail.

Deserializers are used to convert raw Kafka messages into a workable format. They are used when working with incoming messages and accept full `message` object as an argument.

You can set a default deserializer that will be used for all the topics, or you can specify a deserializer per topic in the routing.

```ruby
class XmlDeserializer
  def call(message)
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

Also, deserializes can use headers and topic values from the message for decode specific formats, for example, Avro:

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

Payload will not be deserialized unless needed. This makes things like metadata based filtering or raw string based filtering extremely fast because no data parsing is involved.

Whenever you invoke the `Karafka::Messages::Message#payload` method, the deserialization will happen and the result of it will be stored. This means that consecutive `#payload` invocation on the same message won't deserialize it over and over again.

In case you would want to access raw payload data, you can use the `Karafka::Messages::Message#raw_payload` method.

Below you can find an example of elevation of this feature. Any time you expect occurences of certain characters in a JSON structure, you can quickly pre-filter raw data and only deserialize those that potentially may include what you are looking for.

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
