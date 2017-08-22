Routing engine provides an interface to describe how messages from all the topics should be received and processed.

Due to the dynamic nature of Kafka, there are multiple configuration options you can use, however only few are required.

## Routing DSL organization

Karafka uses consumer groups to subscribe to topics. Each consumer group needs to be subscribed to at least one topic (but you can subscribe with it to as many topics as you want). In order to replicate this concept in our routing DSL, Karafka allows you to configure settings on two levels:

* consumer group level - options that are related to Kafka client and a given consumer group
* topic level - options that need to be set on a per topic level

**Note**: most of the settings (apart from the ```controller```) are optional and if not configured, will use defaults provided during the [configuration](https://github.com/karafka/karafka/wiki/Configuration) of the app itself.

Karafka provides two ways of defining topics on which you want to listen:

### Karafka 0.6+ consumer group namespaced style (recommended)

In this mode, you can define consumer groups that will be subscribed to multiple topics. This will allow you to group topics based on your usecases and other factors. It allows you also to overwrite most of the default settings, in case you need to create a per consumer group specific setup (for example to receive data from multiple Kafka clusters).

```ruby
App.consumer_groups.draw do
  consumer_group :group_name do
    topic :example do
      controller ExampleController
    end

    topic :example2 do
      controller Example2Controller
    end
  end
end
```

### Karafka 0.5 compatible consumer group per topic style

This used to be the mode Karafka 0.5 was using. It hides the fact, that for each topic a new consumer group is created. In this case, consumer group name is equal to the topic name.

The basic route description requires providing ```controller``` that should handle it (Karafka will create a separate controller instance for each ```params``` and/or ```params_batch``` received).

**Note**: In this mode, you cannot use ```consumer_group``` defaults overriding feature.

```ruby
App.consumer_groups.draw do
  topic :example do
    controller ExampleController
  end

  topic :example2 do
    controller Example2Controller
  end
end
```

## Overriding defaults

Almost all the default settings that are configured can be changed on either ```consumer_group``` or ```topic``` level. This means, that you can provide each consumer group or topic with some details in case you need a non-standard way of doing things (for example you need batch processing only for a single topic).

**Note**: If you're not sure whether you should override a given setting on a ```consumer_group``` or ```topic``` level, you can look into the [schemas/consumer_group.rb](https://github.com/karafka/karafka/blob/master/lib/karafka/schemas/consumer_group.rb) definitions, that contains all the validation rules for both levels.

## Consumer group level options

Consumer group options allow you to change, the way a particular consumer group behaves. You can override most of the ```config.kafka``` settings there, set up different encryption details and do other crazy stuff. Here are the most important settings:

WIP

**Note**: If you're not sure whether you should override a given setting on a ```consumer_group``` or ```topic``` level, you can look into the [schemas/consumer_group.rb](https://github.com/karafka/karafka/blob/master/lib/karafka/schemas/consumer_group.rb) definitions, that contains all the validation rules for both levels.

## Topic level options

There are several options you can set inside of the ```topic``` block. All of them except ```controller``` are optional. Here are the most important once:

| Option               | Value type   | Description                                                                                                       |
|----------------------|--------------|-------------------------------------------------------------------------------------------------------------------|
| [inline_processing](https://github.com/karafka/karafka/wiki/Processing-messages#inline-processing-without-sidekiq)    | Boolean      | Do we want to perform logic without enqueuing it with Sidekiq (directly and asap) |
| start_from_beginning | Boolean      | Flag used to tell to decide whether to consume messages starting at the beginning of the topic or to just consume new messages that are produced to the topic. |
| [batch_processing](https://github.com/karafka/karafka/wiki/Processing-messages)     | Boolean      | Set to ```true``` when you want to process all the messages at the same time using ```#params_batch```. When ```false```, it will allow you to process messages similar to standard HTTP requests, using ```#params``` |
| [worker](https://github.com/karafka/karafka/wiki/Workers)               | Class        | Name of a worker class that we want to use to schedule perform code                                               |
| [parser](https://github.com/karafka/karafka/wiki/Parsers)               | Class        | Name of a parser class that we want to use to parse incoming data                                                 |
| [responder](https://github.com/karafka/karafka/wiki/Responders)            | Class        | Name of a responder that we want to use to generate responses to other Kafka topics based on our processed data   |


```ruby
App.routes.draw do
  consumer_group :videos_consumer do
    topic :binary_video_details do
      controller Videos::DetailsController
      worker Workers::DetailsWorker
      parser Parsers::BinaryToJson
      interchanger Interchangers::Binary
      responder BinaryVideoProcessingResponder
      inline_processing false
      batch_processing true
    end

    topic :new_videos do
      controller Videos::NewVideosController
    end
  end
end
```