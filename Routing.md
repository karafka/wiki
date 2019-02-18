Routing engine provides an interface to describe how messages from all the topics should be received and consumed/processed.

Due to the dynamic nature of Kafka, there are multiple configuration options you can use, however only few are required.

## Routing DSL organization

Karafka uses consumer groups to subscribe to topics. Each consumer group needs to be subscribed to at least one topic (but you can subscribe with it to as many topics as you want). In order to replicate this concept in our routing DSL, Karafka allows you to configure settings on two levels:

* consumer group level - options that are related to Kafka client and a given consumer group
* topic level - options that need to be set on a per topic level

**Note**: most of the settings (apart from the ```consumer```) are optional and if not configured, will use defaults provided during the [configuration](https://github.com/karafka/karafka/wiki/Configuration) of the app itself.

Karafka provides two ways of defining topics on which you want to listen:

### Karafka 1.0+ consumer group namespaced style (recommended)

In this mode, you can define consumer groups that will be subscribed to a single topic or to multiple topics. This will allow you to group topics based on your use-cases and other factors. It allows you also to overwrite most of the default settings, in case you need to create a per consumer group specific setup (for example to receive data from multiple Kafka clusters).

#### Single topic Karafka 1.0+ consumer group namespace style example

```ruby
App.consumer_groups.draw do
  consumer_group :group_name do
    topic :example do
      consumer ExampleConsumer
    end
  end
end
```

or a shorter version (same logic):

```ruby
App.consumer_groups.draw do
  consumer_group :group_name do
    topic(:example) { consumer ExampleConsumer }
  end
end
```

#### Multiple topics Karafka 1.0+ consumer group namespace style example

```ruby
App.consumer_groups.draw do
  consumer_group :group_name do
    topic :example do
      consumer ExampleConsumer
    end

    topic :example2 do
      consumer Example2Consumer
    end
  end
end
```

or a shorter version (same logic):

```ruby
App.consumer_groups.draw do
  consumer_group :group_name do
    topic(:example) { consumer ExampleConsumer }
    topic(:example2) { consumer Example2Consumer }
  end
end
```

### Karafka 0.5 compatible consumer group per topic style

This used to be the mode Karafka 0.5 was using. It hides the fact, that for each topic a new consumer group is created. In this case, consumer group name is equal to the topic name.

The basic route description requires providing ```consumer``` that should handle it (Karafka will create a separate consumer instance for each ```params``` and/or ```params_batch``` received).

**Note**: In this mode, you cannot use ```consumer_group``` defaults overriding feature.

```ruby
App.consumer_groups.draw do
  topic :example do
    consumer ExampleConsumer
  end

  topic :example2 do
    consumer Example2Consumer
  end
end
```

## Overriding Defaults

Almost all the default settings that are configured can be changed on either ```consumer_group``` or ```topic``` level. This means, that you can provide each consumer group or topic with some details in case you need a non-standard way of doing things (for example you need batch consuming only for a single topic).

**Note**: If you're not sure whether you should override a given setting on a ```consumer_group``` or ```topic``` level, you can look into the [schemas/consumer_group.rb](https://github.com/karafka/karafka/blob/master/lib/karafka/schemas/consumer_group.rb) definitions, that contains all the validation rules for both levels.

## Consumer group level options

Consumer group options allow you to change, the way a particular consumer group behaves. You can override most of the ```config.kafka``` settings there, set up different encryption details and do other crazy stuff.

This level settings override is used primary to change the way consumer group is handling connection and incoming data.

**Note**: If you're not sure whether you should override a given setting on a ```consumer_group``` or ```topic``` level, you can look into the [schemas/consumer_group.rb](https://github.com/karafka/karafka/blob/master/lib/karafka/schemas/consumer_group.rb) definitions, that contains all the validation rules for both levels.

## Topic level options

There are several options you can set inside of the ```topic``` block. All of them except ```consumer``` are optional. Here are the most important once:

| Option               | Value type   | Description                                                                                                       |
|----------------------|--------------|-------------------------------------------------------------------------------------------------------------------|
| [consumer](https://github.com/karafka/karafka/wiki/Consumers)    | Class      | Name of a consumer class that we want to use to consume messages from a given topic |
| [backend](https://github.com/karafka/karafka/wiki/Consuming-messages#backends)    | Symbol      | :inline or :sidekiq depending on where and how you want to consume your messages |
| start_from_beginning | Boolean      | Flag used to tell to decide whether to fetch messages starting at the beginning of the topic or to just fetch and consume new messages that are produced to the topic. |
| [batch_consuming](https://github.com/karafka/karafka/wiki/Consuming-messages)     | Boolean      | Set to ```true``` when you want to consume all the messages at the same time using ```#params_batch```. When ```false```, it will allow you to consume messages similar to standard HTTP requests, using ```#params``` |
| [deserializer](https://github.com/karafka/karafka/wiki/Serialization)               | Class        | Name of a deserializer that we want to use to deserialize the incoming data                                                 |
| [responder](https://github.com/karafka/karafka/wiki/Responders)            | Class        | Name of a responder that we want to use to generate responses to other Kafka topics based on our consumed data   |


```ruby
App.routes.draw do
  consumer_group :videos_consumer do
    topic :binary_video_details do
      consumer Videos::DetailsConsumer
      deserializer Serialization::Binary::Deserializer.new
      responder BinaryVideoProcessingResponder
      backend :inline
      batch_consuming true
    end

    topic :new_videos do
      consumer Videos::NewVideosConsumer
    end
  end
end
```
