Karafka by default assumes, you are receiving and sending JSON information.

This means, that if you receive for example an XML payload, deserialization will fail.

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
