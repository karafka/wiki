1. [Does Karafka require Ruby on Rails?](#does-karafka-require-ruby-on-rails)
2. [Why there used to be an ApplicationController mentioned in the Wiki and some articles?](#why-there-used-to-be-an-applicationcontroller-mentioned-in-the-wiki-and-some-articles)
3. [Does Karafka require Redis and/or Sidekiq to work?](#does-karafka-require-redis-andor-sidekiq-to-work)
4. [Could an HTTP controller also consume a fetched message through the Karafka router?](#could-an-http-controller-also-consume-a-fetched-message-through-the-karafka-router)
5. [Does Karafka require a separate process running?](#does-karafka-require-a-separate-process-running)
6. [Can I start Karafka process with only particular consumer groups running for given topics?](#can-i-start-karafka-process-with-only-particular-consumer-groups-running-for-given-topics)
7. [Can I use ```#seek``` to start processing topics partition from a certain point?](#can-i-use-seek-to-start-processing-topics-partition-from-a-certain-point)
8. [Why Karafka does not pre-initialize consumers so all the callbacks can be executed in their context?](#why-karafka-does-not-pre-initialize-consumers-so-all-the-callbacks-can-be-executed-in-their-context)
9. [Why Karafka does not restart dead PG connections?](#why-karafka-does-not-restart-dead-pg-connections)
10. [Does Karafka require gems to be thread-safe?](#does-karafka-require-gems-to-be-thread-safe)
11. [When Karafka is loaded via railtie in test env, SimpleCov does not track code changes](#when-karafka-is-loaded-via-a-railtie-in-test-env-simplecov-does-not-track-code-changes)
12. [Can I use Thread.current to store data in between batches?](#can-i-use-threadcurrent-to-store-data-between-batches)
13. [Why Karafka process does not pick up newly created topics until restarted?](#why-karafka-process-does-not-pick-up-newly-created-topics-until-restarted)
14. [Why is Karafka not doing work in parallel when I started two processes?](#why-is-karafka-not-doing-work-in-parallel-when-i-started-two-processes)
15. [Can I remove a topic while the Karafka server is running?](#can-i-remove-a-topic-while-the-karafka-server-is-running)
16. [What is a forceful Karafka stop?](#what-is-a-forceful-karafka-stop)
17. [Can I use AWS MSK Serverless with IAM authentication?](#can-i-use-aws-msk-serverless-with-iam-authentication)
18. [Why can't I connect to Kafka from another Docker container?](#why-cant-i-connect-to-kafka-from-another-docker-container)
19. [How can I configure multiple bootstrap servers?](#how-can-i-configure-multiple-bootstrap-servers)
20. [Why, when using `cooperative-sticky` rebalance strategy, all topics get revoked on rebalance?](#why-when-using-cooperative-sticky-rebalance-strategy-all-topics-get-revoked-on-rebalance)
21. [What will happen with uncommitted offsets during a rebalance?](#what-will-happen-with-uncommitted-offsets-during-a-rebalance)
22. [Can I use Karafka with Ruby on Rails as a part of an internal gem?](#can-i-use-karafka-with-ruby-on-rails-as-a-part-of-an-internal-gem)
23. [Can I skip messages on errors?](#can-i-skip-messages-on-errors)
24. [What does static consumer fenced by other consumer with same group.instance.id mean?](#what-does-static-consumer-fenced-by-other-consumer-with-same-groupinstanceid-mean)
25. [Why, in the Long-Running Jobs case, `#revoked` is executed even if `#consume` did not run because of revocation?](#why-in-the-long-running-jobs-case-revoked-is-executed-even-if-consume-did-not-run-because-of-revocation)
26. [Why am I seeing `Rdkafka::RdkafkaError (Local: Timed out (timed_out)` error when producing larger quantities of messages?](#why-am-i-seeing-rdkafkardkafkaerror-local-timed-out-timed_out-error-when-producing-larger-quantities-of-messages)
27. [Do I need to use `#revoked?` when not using Long-Running jobs?](#do-i-need-to-check-revoked-when-not-using-long-running-jobs)
28. [Can I consume from more than one Kafka cluster at the same time?](#can-i-consume-from-more-than-one-kafka-cluster-simultaneously)
29. [Why Karafka uses `karafka-rdkafka` instead of `rdkafka` directly?](#why-karafka-uses-karafka-rdkafka-instead-of-rdkafka-directly)

## Does Karafka require Ruby on Rails?

**No**. Karafka is a fully independent framework that can operate in a standalone mode. It can be easily integrated with any Ruby-based application, including those written with Ruby on Rails. Please follow the [Integrating with Ruby on Rails and other frameworks](https://github.com/karafka/karafka/wiki/Integrating-with-Ruby-on-Rails-and-other-frameworks) Wiki section.

## Why there used to be an ApplicationController mentioned in the Wiki and some articles?

You can name the main application consumer with any name. You can even call it ```ApplicationController``` or anything else you want. Karafka will sort that out, as long as your root application consumer inherits from the ```Karafka::BaseConsumer```. It's not related to Ruby on Rails controllers. Karafka framework used to use the ```*Controller``` naming convention up until Karafka 1.2 where it was changed because many people had problems with name collisions.

## Does Karafka require Redis and/or Sidekiq to work?

**No**. Karafka is a standalone framework, with an additional process that will be used to consume Kafka messages.

## Could an HTTP controller also consume a fetched message through the Karafka router?

**No**. Kafka messages can be consumed only using Karafka consumers. You cannot use your Ruby on Rails HTTP consumers to consume Kafka messages, as Karafka is **not** an HTTP Kafka proxy. Karafka uses Kafka API for messages consumption.

## Does Karafka require a separate process running?

**Yes**. Karafka  requires a separate process to be running (Karafka server) to consume and process messages. You can read about it in the [Consuming messages](https://github.com/karafka/karafka/wiki/Consuming-messages) section of the Wiki.

## Can I start Karafka process with only particular consumer groups running for given topics?

Yes. Karafka allows you to listen with a single consumer group on multiple topics, which means that you can tune up the number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as follows:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```

## Can I use ```#seek``` to start processing topics partition from a certain point?

Karafka has a ```#seek``` consumer method that can be used to do that.

## Why Karafka does not pre-initializes consumers prior to first message from a given topic being received?

Because Karafka does not have knowledge about the whole topology of a given Kafka cluster. We work on what we receive dynamically building consumers when it is required.

## Why Karafka does not restart dead PG connections?

Karafka starting from `2.0.16` will automatically clean dead ActiveRecord connections. No extra action is needed.

## Does Karafka require gems to be thread-safe?

Yes. Karafka uses multiple threads to process data, similar to how Puma or Sidekiq does it. The same rules apply.

## When Karafka is loaded via a railtie in test env, SimpleCov does not track code changes

Karafka hooks with railtie to load `karafka.rb`. Simplecov **needs** to be required [before](https://github.com/simplecov-ruby/simplecov#getting-started=) any code is loaded.

## Can I use Thread.current to store data between batches?

**No**. The first available thread will pick up work from the queue to better distribute work. This means that you should **not** use `Thread.current` for any type of data storage.


## Why Karafka process does not pick up newly created topics until restarted?

- Karafka in the `development` mode will refresh cluster metadata every 5 seconds. It means that it will detect topic changes fairly fast.
- Karafka in `production` will refresh cluster metadata every 5 minutes. It is recommended to create production topics before running consumers.

The frequency of cluster metadata refreshes can be changed via `topic.metadata.refresh.interval.ms` in the `kafka` config section.

## Why is Karafka not doing work in parallel when I started two processes?

Please make sure your topic contains more than one partition. Only then Karafka can distribute the work to more processes. Keep in mind, that all the topics create automatically with the first message sent will always contain only one partition. Use the Admin API to create topics with more partitions.


## Can I remove a topic while the Karafka server is running?

**Not recommended**. You may encounter the following errors if you decide to do so:

```
ERROR -- : librdkafka internal error occurred: Local: Unknown partition (unknown_partition)
ERROR -- : 
INFO -- : rdkafka: [thrd:main]: Topic extractor partition count changed from 1 to 0
ERROR -- : librdkafka internal error occurred: Broker: Unknown topic or partition (unknown_topic_or_part)
```

It is recommended to stop Karafka server instances and then remove and recreate the topic.

## What is a forceful Karafka stop?

When you attempt to stop Karafka, you may notice the following information in your logs:

```bash
Received SIGINT system signal
Stopping Karafka server
Forceful Karafka server stop
```

When you ask Karafka to stop, it will wait for all the currently running jobs to finish. The `shutdown_timeout` configuration setting limits the time it waits. After this time passes and any work in listeners or workers are still being performed, Karafka will attempt to forcefully close itself, stopping all the work in the middle. If you see it happen, it means you need to either:

- extend the `shutdown_timeout` value to match your processing patterns
- debug your code to check what is causing the extensive processing beyond the `shutdown_timeout`

In any case, it is **not** recommended to ignore this if it happens frequently.

## Can I use AWS MSK Serverless with IAM authentication?

No. IAM is a custom authentication engine that is not a part of the Kafka protocol and is not supported by `librdkafka`.

Karafka supports the standard SASL + SSL mechanisms available for MSK. You can read more about it [here](Deployment#aws-msk-cluster-setup).

## Why can't I connect to Kafka from another Docker container?

You need to modify the `docker-compose.yml` `KAFKA_ADVERTISED_HOST_NAME` value. You can read more about it [here](Setting-up-Kafka#connecting-to-kafka-from-other-docker-containers).

## How can I configure multiple bootstrap servers?

You need to define them comma-separated under `kafka` `bootstrap.servers` configuration key:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_application'

    # This value needs to be a string string with comma separated servers
    config.kafka = {
      'bootstrap.servers': 'server1.address:9092, server2.address:9092'
    }
  end
end
```

## Why, when using `cooperative-sticky` rebalance strategy, all topics get revoked on rebalance?

This behavior can occur if you are using blocking `mark_as_consumed!` method and the offsets commit happens during rebalance. When using `cooperative-sticky` we recommend using `mark_as_consumed` instead.

## What will happen with uncommitted offsets during a rebalance?

When using `mark_as_consumed`, offsets are stored locally and periodically flushed to Kafka asynchronously.

Upon rebalance, all uncommitted offsets will be committed before a given partition is re-assigned.

## Can I use Karafka with Ruby on Rails as a part of an internal gem?

Karafka 2.0 has [Rails auto-detection](https://github.com/karafka/karafka/blob/78ea23f7044b81b7e0c74bb02ad3d2e5a5fa1b7c/lib/karafka/railtie.rb#L19), and it is loaded early, so some components may be available later, e.g., when ApplicationConsumer inherits from BaseConsumer that is provided by the separate gem that needs an initializer.

Moreover, despite the same code base, some processes (`rails s`, `rails db:migrate`, `sidekiq s`) may not need to know about karafka, and there is no need to load it.

The problem is presented in [this](https://github.com/karafka/example-apps/pull/190) example app PR.

To mitigate this, you can create an empty karafka bootfile. With a file structure like this:
```
+-- karafka_root_dir
|   +-- karafka.rb     # default bootfile (empty file)
|   +-- karafka_app.rb # real bootfile with Karafka::App definition and other stuff
|   +-- ...
```

It is possible to postpone the definition of the Karafka app and do it manually whenever & wherever the user wants (`karafka_app.rb` could be loaded for example, in some initializer).

```ruby
# karafka_app.rb

class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_application'
    ...
  end
end

# config/initializers/karafka_init.rb

require 'karafka_root_dir/karafka_app'
```

Still not a perfect solution because karafka gem is still loaded.

**Note**: This description was prepared by [AleksanderSzyszka](https://github.com/AleksanderSzyszka).

## Can I skip messages on errors?

Karafka Pro can skip messages non-recoverable upon errors as a part of the Enhanced Dead Letter Queue feature. You can read about this ability [here](Pro-Enhanced-Dead-Letter-Queue#disabling-dispatch).

## What does static consumer fenced by other consumer with same group.instance.id mean?

If you see such messages in your logs:

```bash
Fatal error: Broker: Static consumer fenced by other consumer with same group.instance.id
```

It can mean two things:

1. You are using the Karafka version before `2.0.20`. If that is the case, please upgrade.
2. Your `group.instance.id` is not unique within your consumer group. You must always ensure that the value you assign to `group.instance.id` is unique within the whole consumer group, not unique per process or machine.

## Why, in the Long-Running Jobs case, `#revoked` is executed even if `#consume` did not run because of revocation?

The `#revoked` will be executed even though the `#consume` did not run upon revocation because `#revoked` can be used to teardown resources initialized prop to `#consume`. For example, for things initialized in a custom `initialize` method.

## Why am I seeing `Rdkafka::RdkafkaError (Local: Timed out (timed_out)` error when producing larger quantities of messages?

If you are seeing following error:

```ruby
Rdkafka::RdkafkaError (Local: Timed out (timed_out)
```

It may mean one of four things:

1. High probability: Broker can't keep up with the produce rate.
2. High probability if you use `partition_key`: Broker is temporarily overloaded and cannot return info about the topic structure. A retry mechanism has been implemented in WaterDrop `2.4.4` to mitigate this.
3. Low probability: Slow network connection.
4. Low probability: SSL configuration issue. In this case, no messages would reach the broker.

WaterDrop dispatches messages to `librdkafka` and `librdkafka` constructs message sets out of it. By default, it does it every five milliseconds. If you are producing messages fast, it may become inefficient for Kafka because it has to deal with separate incoming message sets and needs to keep up. Please consider increasing the ` queue.buffering.max.ms`, so the batches are constructed less often and are bigger.

Additionally, you may also:

- Dispatch smaller batches using `#produce_many_sync`.Effectively it will throttle the process that way.
- Establish a limit on how many messages you want to dispatch at once. This will prevent you from scenarios where you accidentally flush too much. If you dispatch based on an array of samples, you can do it that way:

```ruby
data_to_dispatch.each_slice(2_00) do |data_slice|
  Karafka.producer.produce_many_sync(data_slice)
end
```

## Do I need to check `#revoked?` when not using Long-Running jobs?

In a stable system, **no**. The Karafka default [offset management](Offset-management) strategy should be more than enough. It ensures that after batch processing as well as upon rebalances, before partition reassignment, all the offsets are committed.

You can read about Karafka's revocation/rebalance behaviors [here](Offset-management) and [here](Consuming-messages#detecting-revocation-midway).

## Can I consume from more than one Kafka cluster simultaneously?

**Yes**. Karafka allows you to redefine `kafka` settings on a per-topic basis. You can create separate consumer groups to consume from separate clusters:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    consumer_group :group_name do
      topic :example do
        kafka('bootstrap.servers': 'cluster1:9092')
        consumer ExampleConsumer
      end

      topic :example2 do
        kafka('bootstrap.servers': 'cluster1:9092')
        consumer ExampleConsumer2
      end
    end

    consumer_group :group_name2 do
      topic :example3 do
        kafka('bootstrap.servers': 'cluster2:9092')
        consumer Example2Consumer3
      end
    end
  end
end
```

## Why Karafka uses `karafka-rdkafka` instead of `rdkafka` directly?

We release our version of the `rdkafka` gem to ensure it meets our quality and stability standards. That way, we ensure that unexpected `rdkafka` releases will not break the Karafka ecosystem.
