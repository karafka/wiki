1. [Does Karafka require Ruby on Rails?](#does-karafka-require-ruby-on-rails)
2. [Why there used to be an ApplicationController mentioned in the Wiki and some articles?](#why-there-used-to-be-an-applicationcontroller-mentioned-in-the-wiki-and-some-articles)
3. [Does Karafka require Redis and/or Sidekiq to work?](#does-karafka-require-redis-andor-sidekiq-to-work)
4. [Could an HTTP controller also consume a fetched message through the Karafka router?](#could-an-http-controller-also-consume-a-fetched-message-through-the-karafka-router)
5. [Does Karafka require a separate process running?](#does-karafka-require-a-separate-process-running)
6. [Can I start Karafka process with only particular consumer groups running for given topics?](#can-i-start-karafka-process-with-only-particular-consumer-groups-running-for-given-topics)
7. [Can I use ```#seek``` to start processing topics partition from a certain point?](#can-i-use-seek-to-start-processing-topics-partition-from-a-certain-point)
8. [Why Karafka does not pre-initialize consumers so all the callbacks can be executed in their context?](#why-karafka-does-not-pre-initialize-consumers-so-all-the-callbacks-can-be-executed-in-their-context)
9. [Racecar breaks Rails loading including Karafka when trying to migrate from one to another](#racecar-breaks-rails-loading-including-karafka-when-trying-to-migrate-from-one-to-another)
10. [Why Karafka does not restart dead PG connections?](#why-karafka-does-not-restart-dead-pg-connections)
11. [Does Karafka require gems to be thread-safe?](#does-karafka-require-gems-to-be-thread-safe)
12. [How does one scale karafka to multiple threads per consumer group? Can it be achieved by running multiple processes of Karafka?](#how-does-one-scale-karafka-to-multiple-threads-per-consumer-group-can-it-be-achieved-by-running-multiple-processes-of-karafka)

### Does Karafka require Ruby on Rails?

**No**. Karafka is a fully independent framework that can operate in a standalone mode. It can be easily integrated with any Ruby-based application, including those written with Ruby on Rails. For more details, please follow the [Integrating with Ruby on Rails and other frameworks](https://github.com/karafka/karafka/wiki/Integrating-with-Ruby-on-Rails-and-other-frameworks) Wiki section.

### Why there used to be an ApplicationController mentioned in the Wiki and some articles?

You can name the main application consumer with any name. You can even call it ```ApplicationController``` or anything else you want. Karafka will sort that out, as long as your root application consumer inherits from the ```Karafka::BaseConsumer```. It's not related to Ruby on Rails controllers. Karafka framework used to use the ```*Controller``` naming convention up until Karafka 1.2 where it was changed because many people had problems with name colisions.

### Does Karafka require Redis and/or Sidekiq to work?

**No**. Karafka is a standalone framework, with an additional process that will be used to consume Kafka messages. You can however use [Karafka Sidekiq Backend](https://github.com/karafka/karafka-sidekiq-backend) if you would like to outsource your Kafka messages processing to Sidekiq workers.

### Could an HTTP controller also consume a fetched message through the Karafka router?

**No**. Kafka messages can be consumed only using Karafka consumers. You cannot use your Ruby on Rails HTTP consumers to consume Kafka messages, as Karafka is **not** an HTTP Kafka proxy. Karafka uses Kafka API for messages consumption.

### Does Karafka require a separate process running?

**Yes**. Karafka  requires a separate process to be running (Karafka server) to consume and process messages. You can read about it in the [Consuming messages](https://github.com/karafka/karafka/wiki/Consuming-messages) section of the Wiki.

### Can I start Karafka process with only particular consumer groups running for given topics?

Yes. Karafka allows you to listen with a single consumer group on multiple topics, which means, that you can tune up the number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as followed:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```

### Can I use ```#seek``` to start processing topics partition from a certain point?

Karafka provices a ```#seek``` client method that can be used to do that. Due to the fact, that Karafka is a long-running process, this option needs to be set up as a callback executed before fetching starts per each consumer group. Please refer to the [#before_fetch_loop](https://github.com/karafka/karafka/wiki/Controller-callbacks#before_fetch_loop) Wiki section for more details.

### Why Karafka does not pre-initialize consumers so all the callbacks can be executed in their context?

Because Karafka does not have knowledge about the whole topology of a given Kafka cluster. We work on what we receive dynamically building consumers when it is required.

### Racecar breaks Rails loading including Karafka when trying to migrate from one to another

This issue has been described [here](https://github.com/karafka/karafka/issues/295).

Racecar under the hood detects that you want Rails by... trying to load Rails. If it is able to, will run the whole app before other things are loaded. In most cases, this won't cause any trouble but from time to time... well it does.

To fix that (as long as you want to use both at the same time), please add the ```return unless Rails.application``` in your ```karafka.rb``` accordingly:

```ruby
# Ruby on Rails setup
ENV['RAILS_ENV'] ||= 'development'
ENV['KARAFKA_ENV'] = ENV['RAILS_ENV']
require ::File.expand_path('../config/environment', __FILE__)

return unless Rails.application

Rails.application.eager_load!
```

### Why Karafka does not restart dead PG connections?

This is an expected behavior because Karafka is meant to be transaction supporting system with long living consumers.

Please see [this](https://github.com/karafka/karafka/wiki/Problems-and-Troubleshooting#why-karafka-does-not-restart-dead-pg-connections) troubleshooting page for a more extensive explanation of this behavior.

### Does Karafka require gems to be thread-safe?

For most of the time *no*. The only case for which any library that you use should be thread-safe, is a case where you run multiple consumer groups from withing a single Karafka process. As long as you don't do that, neither your libraries nor code needs to be thread-safe.

### How does one scale karafka to multiple threads per consumer group? Can it be achieved by running multiple processes of Karafka?

Yes. Longer explanation can be found [here](https://github.com/karafka/karafka/wiki/Concurrency#how-does-one-scale-karafka-to-multiple-threads-per-consumer-group).