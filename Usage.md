**Warning:** This WIKI page describes the 0.5 version. Sorry for the inconvenience.

### Table of Contents
  - [Routing](#routing)
      - [Topic](#topic)
      - [Group](#group)
      - [Worker](#worker)
      - [Parser](#parser)
      - [Interchanger](#interchanger)
      - [Responder](#responder)
      - [Inline mode flag](#inline-mode-flag)
      - [Batch mode flag](#batch-mode-flag)
      - [Start from beginning flag](#start-from-beginning-flag)
  - [Receiving messages](#receiving-messages)
      - [Processing messages directly (without Sidekiq)](#processing-messages-directly-without-sidekiq)

### Routing

Routing engine provides an interface to describe how messages from all the topics should be handled. To start using it, just use the *draw* method on routes:

```ruby
App.routes.draw do
  topic :example do
    controller ExampleController
  end
end
```

The basic route description requires providing *topic* and *controller* that should handle it (Karafka will create a separate controller instance for each request).

There are also several other methods available (optional):

  - *group* - symbol/string with a group name. Groups are used to cluster applications
  - *worker* - Class name - name of a worker class that we want to use to schedule perform code
  - *parser* - Class name - name of a parser class that we want to use to parse incoming data
  - *interchanger* - Class name - name of a interchanger class that we want to use to format data that we put/fetch into/from *#perform_async*
  - *responder* - Class name - name of a responder that we want to use to generate responses to other Kafka topics based on our processed data
  - *inline_mode* - Boolean - Do we want to perform logic without enqueuing it with Sidekiq (directly and asap) - overwrites global app setting
  - *batch_mode* - Boolean - Handle the incoming messages in batch, or one at a time - overwrites global app setting
  - *start_from_beginning* - Boolean - Flag used to tell to decide whether to consume messages starting at the beginning of the topic or to just consume new messages that are produced to the topic.

```ruby
App.routes.draw do
  topic :binary_video_details do
    group :composed_application
    controller Videos::DetailsController
    worker Workers::DetailsWorker
    parser Parsers::BinaryToJson
    interchanger Interchangers::Binary
    responder BinaryVideoProcessingResponder
    inline_mode true
    batch_mode true
    start_from_beginning false
  end

  topic :new_videos do
    controller Videos::NewVideosController
  end
end
```

See description below for more details on each of them.

##### Topic

 - *topic* - symbol/string with a topic that we want to route

```ruby
topic :incoming_messages do
  # Details about how to handle this topic should go here
end
```

Topic is the root point of each route. Keep in mind that:

  - All topic names must be unique in a single Karafka application
  - Topics names are being validated because Kafka does not accept some characters
  - If you don't specify a group, it will be built based on the topic and application name

##### Group

 - *group* - symbol/string with a group name. Groups are used to cluster applications

Optionally you can use **group** method to define group for this topic. Use it if you want to build many applications that will share the same Kafka group. Otherwise it will just build it based on the **topic** and application name. If you're not planning to build applications that will load-balance messages between many different applications (but between one applications many processes), you may want not to define it and allow the framework to define it for you.

```ruby
topic :incoming_messages do
  group :load_balanced_group
  controller MessagesController
end
```

Note that a single group can be used only in a single topic.

##### Worker

 - *worker* - Class name - name of a worker class that we want to use to schedule perform code

Karafka by default will build a worker that will correspond to each of your controllers (so you will have a pair - controller and a worker). All of them will inherit from **ApplicationWorker** and will share all its settings.

To run Sidekiq you should have sidekiq.yml file in *config* folder. The example of sidekiq.yml file will be generated to config/sidekiq.yml.example once you run **bundle exec karafka install**.

However, if you want to use a raw Sidekiq worker (without any Karafka additional magic), or you want to use SidekiqPro (or any other queuing engine that has the same API as Sidekiq), you can assign your own custom worker:

```ruby
topic :incoming_messages do
  controller MessagesController
  worker MyCustomWorker
end
```

Note that even then, you need to specify a controller that will schedule a background task.

Custom workers need to provide a **#perform_async** method. It needs to accept two arguments:

 - *topic* - first argument is a current topic from which a given message comes
 - *params* - all the params that came from Kafka + additional metadata. This data format might be changed if you use custom interchangers. Otherwise it will be an instance of Karafka::Params::Params.

Keep in mind, that params might be in two states: parsed or unparsed when passed to #perform_async. This means, that if you use custom interchangers and/or custom workers, you might want to look into Karafka's sources to see exactly how it works.

##### Parser

 - *parser* - Class name - name of a parser class that we want to use to serialize and deserialize incoming and outgoing data.

Karafka by default will parse messages with a Json parser. If you want to change this behaviour you need to set a custom parser for each route. Parser needs to have a following class methods:

  - *parse* - method used to parse incoming string into an object/hash
  - *generate* - method used in responders in order to convert objects into strings that have desired format

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

##### Interchanger

 - *interchanger* - Class name - name of an interchanger class that we want to use to format data that we put/fetch into/from #perform_async.

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

##### Responder

  - *responder* - Class name - name of a responder that we want to use to generate responses to other Kafka topics based on our processed data.

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

##### Inline mode flag

Inline mode flag allows you to disable Sidekiq usage by performing your #perform method business logic in the main Karafka server process.

This flag be useful when you want to:

  - process messages one by one in a single flow
  - process messages as soon as possible (without Sidekiq delay)

Note: Keep in mind, that by using this, you can significantly slow down Karafka. You also loose all the advantages of Sidekiq processing (reentrancy, retries, etc).

##### Batch mode flag

Batch mode allows you to increase the overall throughput of your kafka consumer by handling incoming messages in batches, instead of one at a time.

Note: The downside of increasing throughput is a slight increase in latency. Also keep in mind, that the client commits the offset of the batch's messages only **after** the entire batch has been scheduled into Sidekiq (or processed in case of inline mode).

##### Start from beginning flag

Flag used to tell to decide whether to consume messages starting at the beginning of the topic or to just consume new messages that are produced to the topic. 

Note: Once the consumer group has checkpointed its progress in the topic's partitions, the consumers will always start from the checkpointed offsets, regardless of start_from_beginning. As such, this setting only applies when the consumer initially starts consuming from a topic.

### Receiving messages

Karafka framework has a long running server process that is responsible for receiving messages.

To start Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

Karafka server can be daemonized with the **--daemon** flag:

```
bundle exec karafka server --daemon
```

#### Processing messages directly (without Sidekiq)

If you don't want to use Sidekiq for processing and you would rather process messages directly in the main Karafka server process, you can do that by setting the *inline* flag either on an app level:

```ruby
class App < Karafka::App
  setup do |config|
    config.inline_mode = true
    # Rest of the config
  end
end
```

or per route (when you want to treat some routes in a different way):

```ruby
App.routes.draw do
  topic :binary_video_details do
    controller Videos::DetailsController
    inline_mode true
  end
end
```

Note: it can slow Karafka down significantly if you do heavy stuff that way.