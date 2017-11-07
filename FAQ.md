## Does Karafka require Ruby on Rails?

**No**. Karafka is a fully independent framework that can operate in a standalone mode. It can be easily integrated with any Ruby based application, including those written with Ruby on Rails. For more details, please follow the [Integrating with Ruby on Rails and other frameworks](https://github.com/karafka/karafka/wiki/Integrating-with-Ruby-on-Rails-and-other-frameworks) Wiki section.

## Are Karafka controllers HTTP controllers?

**No**. Karafka is a Kafka framework that follows __some__ of the common naming conventions. Karafka controllers aren't based on any HTTP framework and work using Kafka API.

## Why there is an ApplicationController mentioned in the Wiki?

You can name the main application controller with any name. You can even call it ```ApplicationConsumer``` or anything else you want. Karafka will sort that out, as long as your root application controller inherits from the ```Karafka::BaseController```. It's not related to Ruby on Rails controllers, and if you find that problematic, just name it ```ApplicationConsumer```, create a separate ```app/consumers``` directory and use it.

## Does Karafka require Redis and/or Sidekiq to work?

**No**. Karafka is a standalone framework, with an additional process that will be used to consume Kafka messages. You can however use [Karafka Sidekiq Backend](https://github.com/karafka/karafka-sidekiq-backend) if you would like to outsource your Kafka messages processing to Sidekiq workers.

## Could an HTTP controller also process a consumed message through the Karafka router?

**No**. Kafka messages can be consumed only using Karafka controllers. You cannot use your Ruby on Rails HTTP controllers to consume Kafka messages, as Karafka is **not** a HTTP Kafka proxy. Karafka uses Kafka API for messages consumption.

## What if I would have a conflicting HTTP and Karafka controllers?

Just name one of them differently. Karafka controllers are way more flexible in terms of naming, as you can name them whatever you want, as long as they inherit from the ```Karafka::BaseController```. For example, you can use the ```Consumer``` convention and have ```ApplicationConsumer``` and other consumers that inherit from it. Please refer to the [Controllers](https://github.com/karafka/karafka/wiki/Controllers) Wiki section for a detailed explanation.

## Does Karafka require a separate process running?

**Yes**. Karafka  requires a separate process to be running (Karafka server) to consume and process messages. You can read about it in the [Consuming messages](https://github.com/karafka/karafka/wiki/Consuming-messages) section of the Wiki.

## I get ```NoMethodError: undefined method 'to_hash'``` when receiving JSON that contains an array.

It is not a bug. Default Karafka parser assumes, that you send atomic JSON hash/struct/dict data. Please review [this](https://github.com/karafka/karafka/issues/223) issue and see [Parsers](https://github.com/karafka/karafka/wiki/Parsers) Wiki page on how to implement your own parser.