1. [Does Karafka require Ruby on Rails?](https://github.com/karafka/karafka/wiki/FAQ#does-karafka-require-ruby-on-rails)
2. [Are Karafka consumers HTTP consumers?](https://github.com/karafka/karafka/wiki/FAQ#are-karafka-consumers-http-consumers)
3. [Why there is an ApplicationConsumer mentioned in the Wiki?](https://github.com/karafka/karafka/wiki/FAQ#why-there-is-an-applicationconsumer-mentioned-in-the-wiki)
4. [Does Karafka require Redis and/or Sidekiq to work?](https://github.com/karafka/karafka/wiki/FAQ#does-karafka-require-redis-andor-sidekiq-to-work)
5. [Could a HTTP consumer also process a consumed message through the Karafka router?](https://github.com/karafka/karafka/wiki/FAQ#could-a-http-consumer-also-process-a-consumed-message-through-the-karafka-router)
6. [What if I would have a conflicting HTTP and Karafka consumers?](https://github.com/karafka/karafka/wiki/FAQ#what-if-i-would-have-a-conflicting-http-and-karafka-consumers)
7. [Does Karafka require a separate process running?](https://github.com/karafka/karafka/wiki/FAQ#does-karafka-require-a-separate-process-running)
8. [I get NoMethodError: undefined method 'to_hash' when receiving JSON that contains an array.](https://github.com/karafka/karafka/wiki/FAQ#i-get-nomethoderror-undefined-method-to_hash-when-receiving-json-that-contains-an-array)
9. [Can I start Karafka process with only particular consumer groups running for given topics?](https://github.com/karafka/karafka/wiki/FAQ#can-i-start-karafka-process-with-only-particular-consumer-groups-running-for-given-topics)

### Does Karafka require Ruby on Rails?

**No**. Karafka is a fully independent framework that can operate in a standalone mode. It can be easily integrated with any Ruby based application, including those written with Ruby on Rails. For more details, please follow the [Integrating with Ruby on Rails and other frameworks](https://github.com/karafka/karafka/wiki/Integrating-with-Ruby-on-Rails-and-other-frameworks) Wiki section.

### Are Karafka consumers HTTP consumers?

**No**. Karafka is a Kafka framework that follows __some__ of the common naming conventions. Karafka consumers aren't based on any HTTP framework and work using Kafka API.

### Why there is used to be an ApplicationController mentioned in the Wiki and some articles?

You can name the main application consumer with any name. You can even call it ```ApplicationController``` or anything else you want. Karafka will sort that out, as long as your root application consumer inherits from the ```Karafka::BaseConsumer```. It's not related to Ruby on Rails controllers. Karafka framework used to use the ```*Controller``` naming convention up until Karafka 1.2 where it was changed because many people had problems with name colisions.

### Does Karafka require Redis and/or Sidekiq to work?

**No**. Karafka is a standalone framework, with an additional process that will be used to consume Kafka messages. You can however use [Karafka Sidekiq Backend](https://github.com/karafka/karafka-sidekiq-backend) if you would like to outsource your Kafka messages processing to Sidekiq workers.

### Could a HTTP consumer also process a consumed message through the Karafka router?

**No**. Kafka messages can be consumed only using Karafka consumers. You cannot use your Ruby on Rails HTTP consumers to consume Kafka messages, as Karafka is **not** a HTTP Kafka proxy. Karafka uses Kafka API for messages consumption.

### What if I would have a conflicting HTTP and Karafka consumers?

Just name one of them differently. Karafka consumers are way more flexible in terms of naming, as you can name them whatever you want, as long as they inherit from the ```Karafka::BaseConsumer```. For example, you can use the ```Consumer``` convention and have ```ApplicationConsumer``` and other consumers that inherit from it. Please refer to the [Consumers](https://github.com/karafka/karafka/wiki/Consumers) Wiki section for a detailed explanation.

### Does Karafka require a separate process running?

**Yes**. Karafka  requires a separate process to be running (Karafka server) to consume and process messages. You can read about it in the [Consuming messages](https://github.com/karafka/karafka/wiki/Consuming-messages) section of the Wiki.

### I get ```NoMethodError: undefined method 'to_hash'``` when receiving JSON that contains an array.

It is not a bug. Default Karafka parser assumes, that you send atomic JSON hash/struct/dict data. Please review [this](https://github.com/karafka/karafka/issues/223) issue and see [Parsers](https://github.com/karafka/karafka/wiki/Parsers) Wiki page on how to implement your own parser.

### Can I start Karafka process with only particular consumer groups running for given topics?

Yes. Karafka allows you to listen with a single consumer group on multiple topics, which means, that you can tune up number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as followed:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```