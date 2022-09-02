The routing engine provides an interface to describe how messages from all the topics should be received and consumed.

Due to the dynamic nature of Kafka, you can use multiple configuration options; however, only a few are required.

## Routing DSL organization

Karafka uses consumer groups to subscribe to topics. Each consumer group needs to be subscribed to at least one topic (but you can subscribe with it too as many topics as you want). To replicate this concept in our routing DSL, Karafka allows you to configure settings on two levels:

* settings level - root settings that will be used everywhere
* topic level - options that need to be set on a per topic level or overrides to options set on a root level

**Note**: most of the settings (apart from the ```consumer```) are optional and if not configured, will use defaults provided during the [configuration](https://github.com/karafka/karafka/wiki/Configuration) of the app itself.

Karafka provides two ways of defining topics on which you want to listen:

### Single consumer group with multiple topics mode

In this mode, Karafka will create a single consumer group to which all the topics will belong.

It is recommended for most of the use-cases and can be changed later.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :example do
      consumer ExampleConsumer
    end

    topic :example2 do
      consumer Example2Consumer
    end
  end
end
```

### Multiple consumer groups mode

In this mode, Karafka will use a single consumer group per each of the topics defined within a single `#consumer_group` block.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    consumer_group :group_name do
      topic :example do
        consumer ExampleConsumer
      end

      topic :example2 do
        consumer ExampleConsumer2
      end
    end

    consumer_group :group_name2 do
      topic :example3 do
        consumer Example2Consumer3
      end
    end
  end
end
```

## Overriding Defaults

Almost all the default settings configured can be changed on either on the ```topic``` level. This means that you can provide each topic with some details in case you need a non-standard way of doing things (for example, you need batch consuming only for a single topic).

## Topic level options

There are several options you can set inside of the ```topic``` block. All of them except ```consumer``` are optional. Here are the most important once:

| Option               | Value type   | Description                                                                                                       |
|----------------------|--------------|-------------------------------------------------------------------------------------------------------------------|
| [consumer](https://github.com/karafka/karafka/wiki/Consumers)    | Class      | Name of a consumer class that we want to use to consume messages from a given topic |
| [deserializer](https://github.com/karafka/karafka/wiki/Deserialization)               | Class        | Name of a deserializer that we want to use to deserialize the incoming data                                                 |
| [manual_offset_management](https://github.com/karafka/karafka/wiki/Manual-offset-management)               | Boolean        | Should Karafka automatically mark messages as consumed or not |
| [subscription_group](https://github.com/karafka/karafka/wiki/Concurrency-and-multithreading/#parallel-kafka-connections-within-a-single-consumer-group-subscription-groups)               | String        | Identifier to make Karafka create a separate subscription group for a given topic |


```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    consumer_group :videos_consumer do
      topic :binary_video_details do
        consumer Videos::DetailsConsumer
        deserializer Serialization::Binary::Deserializer.new
      end

      topic :new_videos do
        consumer Videos::NewVideosConsumer
      end
    end
  end
end
```
