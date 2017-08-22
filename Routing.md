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

## Consumer group level options

WIP

## Topic level options

There are several options you can set inside of the ```topic``` block. All of them except ```controller``` are optional:

  - ```inline_processing``` - Boolean - Do we want to perform logic without enqueuing it with Sidekiq (directly and asap) - overwrites global app setting
  - ```batch_processing``` - Boolean - Set to ```true``` when you want to process all the messages at the same time using ```#params_batch```. When ```false```, it will allow you to process messages similar to standard HTTP requests, using ```#params```
  - ```worker``` - Class name - name of a worker class that we want to use to schedule perform code
  - ```parser``` - Class name - name of a parser class that we want to use to parse incoming data
  - ```interchanger``` - Class name - name of a interchanger class that we want to use to format data that we put/fetch into/from ```#perform_async```
  - ```responder``` - Class name - name of a responder that we want to use to generate responses to other Kafka topics based on our processed data

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

See description below for more details on each of them.

### Inline processing flag

Inline processing flag allows you to disable Sidekiq usage by performing your #perform method business logic in the main Karafka server process.

This flag be useful when you want to:

  - process messages one by one in a single flow
  - process messages as soon as possible (without Sidekiq delay)

### Batch processing flag

WIP

### Worker

 - ```worker``` - Class name - name of a worker class that we want to use to schedule perform code

Karafka by default will build a worker that will correspond to each of your controllers (so you will have a pair - controller and a worker). All of them will inherit from **ApplicationWorker** and will share all its settings.

To run Sidekiq you should have sidekiq.yml file in *config* folder. The example of ```sidekiq.yml``` file will be generated to config/sidekiq.yml.example once you run ```bundle exec karafka install```.

However, if you want to use a raw Sidekiq worker (without any Karafka additional magic), or you want to use SidekiqPro (or any other queuing engine that has the same API as Sidekiq), you can assign your own custom worker:

```ruby
topic :incoming_messages do
  controller MessagesController
  worker MyCustomWorker
end
```

Note that even then, you need to specify a controller that will schedule a background task.

Custom workers need to provide a ```#perform_async``` method. It needs to accept two arguments:

 - ```topic``` - first argument is a current topic from which a given message comes
 - ```params``` - all the params that came from Kafka + additional metadata. This data format might be changed if you use custom interchangers. Otherwise it will be an instance of Karafka::Params::Params.

Keep in mind, that params might be in two states: parsed or unparsed when passed to #perform_async. This means, that if you use custom interchangers and/or custom workers, you might want to look into Karafka's sources to see exactly how it works.

### Parser

 - ```parser``` - Class name - name of a parser class that we want to use to serialize and deserialize incoming and outgoing data.

Karafka by default will parse messages with a Json parser. If you want to change this behaviour you need to set a custom parser for each route. Parser needs to have a following class methods:

  - ```#parse``` - method used to parse incoming string into an object/hash
  - ```#generate``` - method used in responders in order to convert objects into strings that have desired format

and raise an error that is a ::Karafka::Errors::ParserError descendant when problem appears during the parsing process.

```ruby
class XmlParser
  class ParserError < ::Karafka::Errors::ParserError; end

  def self.parse(message)
    Hash.from_xml(message)
  rescue REXML::ParseException
    raise ParserError
  end

  def self.generate(object)
    object.to_xml
  end
end

App.routes.draw do
  topic :binary_video_details do
    controller Videos::DetailsController
    parser XmlParser
  end
end
```

Note that parsing failure won't stop the application flow. Instead, Karafka will assign the raw message inside the :message key of params. That way you can handle raw message inside the Sidekiq worker (you can implement error detection, etc. - any "heavy" parsing logic can and should be implemented there).

### Interchanger

 - ```interchanger``` - Class name - name of an interchanger class that we want to use to format data that we put/fetch into/from #perform_async.

Custom interchangers target issues with non-standard (binary, etc.) data that we want to store when we do #perform_async. This data might be corrupted when fetched in a worker (see [this](https://github.com/karafka/karafka/issues/30) issue). With custom interchangers, you can encode/compress data before it is being passed to scheduling and decode/decompress it when it gets into the worker.

**Warning**: if you decide to use slow interchangers, they might significantly slow down Karafka.

```ruby
class Base64Interchanger
  class << self
    def load(params)
      Base64.encode64(Marshal.dump(params))
    end

    def parse(params)
      Marshal.load(Base64.decode64(params))
    end
  end
end

topic :binary_video_details do
  controller Videos::DetailsController
  interchanger Base64Interchanger
end
```

### Responder

  - ```responder``` - Class name - name of a responder that we want to use to generate responses to other Kafka topics based on our processed data.

Responders are used to design the response that should be generated and sent to proper Kafka topics, once processing is done. It allows programmers to build not only data-consuming apps, but to build apps that consume data and, then, based on the business logic output send this processed data onwards (similarly to how Bash pipelines work).

```ruby
class Responder < ApplicationResponder
  topic :users_created
  topic :profiles_created

  def respond(user, profile)
    respond_to :users_created, user
    respond_to :profiles_created, profile
  end
end
```

For more details about responders, please go to the [using responders](#using-responders) section.