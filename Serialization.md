Karafka by default assumes, you are receiving and sending JSON information.

This means, that if you receive for example an XML payload, deserialization will fail.

## Deserializers

Deserializers are used to convert raw Kafka messages into a workable format. They are used when working with **incoming** data and takes full params object.

You can set a default deserializer that will be used for all the topics, or you can specify a deserializer per topic in the routing.

```ruby
class XmlDeserializer
  def call(params)
    Hash.from_xml(params.raw_payload)
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

  def call(params)
    avro.decode(params.raw_payload, subject: params.headers['message_type'])
  end
end

App.routes.draw do
  topic :binary_video_details do
    consumer Videos::DetailsConsumer
    deserializer AvroDeserializer.new(avro: AvroTurf.new)
  end
end
```

## Serializers

Serializers are used when you send data using [Responders](https://github.com/karafka/karafka/wiki/Responders). They are responsible for converting your Ruby data into a proper format you wish to use to exchange data using Kafka. By default `Karafka::Serialization::Json::Serializer` will convert your data into JSON format.

You can set a default serializer that will be used for all the topics, or you can specify a serializer per topic in the responder definition.

```ruby
class XmlSerializer
  def call(object)
    object.to_xml
  end
end

class ExampleResponder < ApplicationResponder
  topic :users_notified, serializer: XmlSerializer.new

  def respond(user)
    respond_to :users_notified, user
  end
end
```
