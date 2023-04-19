1. [Does Karafka require Ruby on Rails?](#does-karafka-require-ruby-on-rails)
2. [Why there used to be an ApplicationController mentioned in the Wiki and some articles?](#why-there-used-to-be-an-applicationcontroller-mentioned-in-the-wiki-and-some-articles)
3. [Does Karafka require Redis and/or Sidekiq to work?](#does-karafka-require-redis-andor-sidekiq-to-work)
4. [Could an HTTP controller also consume a fetched message through the Karafka router?](#could-an-http-controller-also-consume-a-fetched-message-through-the-karafka-router)
5. [Does Karafka require a separate process running?](#does-karafka-require-a-separate-process-running)
6. [Can I start Karafka process with only particular consumer groups running for given topics?](#can-i-start-karafka-process-with-only-particular-consumer-groups-running-for-given-topics)
7. [Can I use ```#seek``` to start processing topics partition from a certain point?](#can-i-use-seek-to-start-processing-topics-partition-from-a-certain-point)
8. [Why Karafka does not pre-initializes consumers prior to first message from a given topic being received?](#why-karafka-does-not-pre-initializes-consumers-prior-to-first-message-from-a-given-topic-being-received)
9. [Does Karafka restart dead PG connections?](#does-karafka-restart-dead-pg-connections)
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
30. [Why am I seeing an `Implement this in a subclass` error?](#why-am-i-seeing-an-implement-this-in-a-subclass-error)
31. [What is Karafka `client_id` used for?](#what-is-karafka-client_id-used-for)
32. [How can I increase Kafka and Karafka max message size?](#how-can-i-increase-kafka-and-karafka-max-message-size)
33. [Why do DLQ messages in my system keep disappearing?](#why-do-dlq-messages-in-my-system-keep-disappearing)
34. [What is the optimal number of threads to use?](#what-is-the-optimal-number-of-threads-to-use)
35. [Can I use several producers with different configurations with Karafka?](#can-i-use-several-producers-with-different-configurations-with-karafka)
36. [What is the Unsupported value "SSL" for configuration property "security.protocol": OpenSSL not available at build time?](#what-is-the-unsupported-value-ssl-for-configuration-property-securityprotocol-openssl-not-available-at-build-time)
37. [Can Karafka ask Kafka to list available topics?](#can-karafka-ask-kafka-to-list-available-topics)
38. [Why Karafka prints some of the logs with a time delay?](#why-karafka-prints-some-of-the-logs-with-a-time-delay)
39. [Why is increasing `concurrency` not helping upon a sudden burst of messages?](#why-is-increasing-concurrency-not-helping-upon-a-sudden-burst-of-messages)
40. [Why am I seeing a "needs to be consistent namespacing style" error?](#why-am-i-seeing-a-needs-to-be-consistent-namespacing-style-error)
41. [Why, despite setting `initial_offset` to `earliest`, Karafka is not picking up messages from the beginning?](#why-despite-setting-initial_offset-to-earliest-karafka-is-not-picking-up-messages-from-the-beginning)
42. [Should I TSTP, wait a while, then send TERM or set a longer `shutdown_timeout` and only send a TERM signal?](#should-i-tstp-wait-a-while-then-send-term-or-set-a-longer-shutdown_timeout-and-only-send-a-term-signal)
43. [Why am I getting `error:0A000086:SSL routines::certificate verify failed` after upgrading Karafka?](#why-am-i-getting-error0a000086ssl-routinescertificate-verify-failed-after-upgrading-karafka)
44. [Why am I seeing a `karafka_admin` consumer group with a constant lag present?](#why-am-i-seeing-a-karafka_admin-consumer-group-with-a-constant-lag-present)
45. [Can I consume the same topic independently using two consumers within the same application?](#can-i-consume-the-same-topic-independently-using-two-consumers-within-the-same-application)
46. [Why am I seeing Broker failed to validate record (invalid_record) error?](#why-am-i-seeing-broker-failed-to-validate-record-invalid_record-error)
47. [How can I make polling faster?](#how-can-i-make-polling-faster)
48. [Can I dynamically add consumer groups and topics to a running Karafka process?](#can-i-dynamically-add-consumer-groups-and-topics-to-a-running-karafka-process)
49. [Can a consumer instance be called multiple times from multiple threads?](#can-a-consumer-instance-be-called-multiple-times-from-multiple-threads)
50. [Can multiple threads reuse a single consumer instance?](#can-multiple-threads-reuse-a-single-consumer-instance)
51. [What does `Broker: Unknown topic or partition` error mean?](#what-does-broker-unknown-topic-or-partition-error-mean)
52. [Why some of consumer subscriptions are not visible in the Web UI?](#why-some-of-consumer-subscriptions-are-not-visible-in-the-web-ui)
53. [Is there a way to run Karafka in a producer-only mode?](#is-there-a-way-to-run-karafka-in-a-producer-only-mode)
54. [Why am I getting the `can't alloc thread (ThreadError)` error from the producer?](#why-am-i-getting-the-cant-alloc-thread-threaderror-error-from-the-producer)
55. [Can I create all the topics needed by the Web UI manually?](#can-i-create-all-the-topics-needed-by-the-web-ui-manually)
56. [Can I consume messages from a Rake task?](#can-i-consume-messages-from-a-rake-task)

## Does Karafka require Ruby on Rails?

**No**. Karafka is a fully independent framework that can operate in a standalone mode. It can be easily integrated with any Ruby-based application, including those written with Ruby on Rails. Please follow the [Integrating with Ruby on Rails and other frameworks](https://github.com/karafka/karafka/wiki/Integrating-with-Ruby-on-Rails-and-other-frameworks) Wiki section.

## Why there used to be an ApplicationController mentioned in the Wiki and some articles?

You can name the main application consumer with any name. You can even call it ```ApplicationController``` or anything else you want. Karafka will sort that out, as long as your root application consumer inherits from the ```Karafka::BaseConsumer```. It's not related to Ruby on Rails controllers. Karafka framework used to use the ```*Controller``` naming convention up until Karafka 1.2 where it was changed because many people had problems with name collisions.

## Does Karafka require Redis and/or Sidekiq to work?

**No**. Karafka is a standalone framework, with an additional process that will be used to consume Kafka messages.

## Could an HTTP controller also consume a fetched message through the Karafka router?

**No**. Kafka messages can be consumed only using Karafka consumers. You cannot use your Ruby on Rails HTTP consumers to consume Kafka messages, as Karafka is **not** an HTTP Kafka proxy. Karafka uses Kafka API for messages consumption.

## Does Karafka require a separate process running?

No, however, it is **recommended**. By default, Karafka requires a separate process (Karafka server) to consume and process messages. You can read about it in the [Consuming messages](https://github.com/karafka/karafka/wiki/Consuming-messages) section of the Wiki.

Karafka can also be embedded within another process so you do not need to run a separate process. You can read about it [here](Embedding).

## Can I start Karafka process with only particular consumer groups running for given topics?

Yes. Karafka allows you to listen with a single consumer group on multiple topics, which means that you can tune up the number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--include-consumer-groups``` server flag as follows:

```bash
bundle exec karafka server --include-consumer-groups group_name1 group_name3
```

You can also exclude particular groups the same way:

```bash
bundle exec karafka server --exclude-consumer-groups group_name1 group_name3
```

Visit the [CLI](CLI) section of our docs to learn more about how to limit the scope of things to which the server subscribes.

## Can I use ```#seek``` to start processing topics partition from a certain point?

Karafka has a ```#seek``` consumer method that can be used to do that.

## Why Karafka does not pre-initializes consumers prior to first message from a given topic being received?

Because Karafka does not have knowledge about the whole topology of a given Kafka cluster. We work on what we receive dynamically building consumers when it is required.

## Does Karafka restart dead PG connections?

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

## Why am I seeing an `Implement this in a subclass` error?

```bash
[bc01b9e1535f] Consume job for ExampleConsumer on my_topic started
Worker processing failed due to an error: Implement this in a subclass
```

This error occurs when you have defined your consumer but without a `#consume` method:

**BAD**:

```ruby
class ExampleConsumer < Karafka::BaseConsumer
  # No consumption method
end
```

**GOOD**:

```ruby
class ExampleConsumer < Karafka::BaseConsumer
  def consume
    messages.each do |message|
      puts message.payload
    end
  end
end
```

## What is Karafka `client_id` used for?

Karafka `client_id` is, by default, used for two things:

- Building ids for consumer groups using the default [consumer mapper](Consumer-mappers).
- Populating kafka `client.id` value.

kafka `client.id` is a string passed to the server when making requests. This is to track the source of requests beyond just IP/port by allowing a logical application name to be included in server-side request logging.

Therefore the `client_id` should be shared across multiple instances in a cluster or horizontally scaled application but distinct for each application.

## How can I increase Kafka and Karafka max message size?

To make Kafka accept messages bigger than 1MB, you must change both Kafka and Karafka configurations.

To increase the maximum accepted payload size in Kafka, you can adjust the `message.max.bytes` and `replica.fetch.max.bytes` configuration parameters in the server.properties file. These parameters controls the maximum size of a message the Kafka broker will accept.

To allow [WaterDrop](https://github.com/karafka/waterdrop) (Karafka producer) to send bigger messages, you need to:

- set the `max_payload_size` config option to value in bytes matching your maximum expected payload.
- set `kafka` scoped `message.max.bytes` to the same value.

You can do this by [reconfiguring WaterDrop](WaterDrop-reconfiguration) during Karafka setup:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.producer = ::WaterDrop::Producer.new do |producer_config|
      # Use all the settings already defined for consumer by default
      producer_config.kafka = ::Karafka::Setup::AttributesMap.producer(config.kafka.dup)
      producer_config.logger = config.logger

      # Alter things you want to alter
      producer_config.max_payload_size = 1_000_000_000
      producer_config.kafka[:'message.max.bytes'] = 1_000_000_000
    end
  end
end
```

It is essential to keep in mind that increasing the maximum payload size may impact the performance of your Kafka cluster, so you should carefully consider the trade-offs before making any changes.

Note: If you do not allow bigger payloads and try to send them, you will end up with one of the following errors:

```ruby
WaterDrop::Errors::MessageInvalidError {:payload=>"is more than `max_payload_size` config value"}
```

or

```ruby
Rdkafka::RdkafkaError (Broker: Message size too large (msg_size_too_large)):
```

## Why do DLQ messages in my system keep disappearing?

DLQ messages may disappear due to many reasons. Some possible causes include the following:

- The DLQ topic has a retention policy that causes them to expire and be deleted.
- The DLQ topic is a compacted topic, which only retains the last message with a given key.
- The messages are being produced to a DLQ topic with a replication factor of 1, which means that if the broker storing the messages goes down, the messages will be lost.

For more details, please look at the [Compacting limitations](Dead-Letter-Queue#compacting-limitations) section of the DLQ documentation.

## What is the optimal number of threads to use?

The optimal number of threads for a specific application depends on various factors, including the number of processors and cores available, the amount of memory available, and the particular tasks the application performs and their type. In general, increasing number of threads brings the most significant benefits for IO-bound operations.

It's recommended to use the number of available cores to determine the optimal number of threads for an application.

When working with Karafka, you also need to take into consideration things that may reduce the number of threads being in use, that is:

- Your topics count.
- Your partitions count.
- Number of processes within a given consumer group.
- To how many topics and partitions a particular process is subscribed to.

Karafka can parallelize work in a couple of scenarios, but unless you are a [Karafka Pro](https://karafka.io/#become-pro) user and you use [Virtual Partitions](/docs/Pro-Virtual-Partitions), in a scenario where your process is assigned to a single topic partition, the work will always happen only in a single thread.

You can read more about Karafka and Karafka Pro concurrency model [here](Concurrency-and-multithreading).

It's also essential to monitor the performance of the application and the system as a whole while experimenting with different thread counts. This can help you identify bottlenecks and determine the optimal number of threads for the specific use case.

Remember that the optimal number of threads may change as the workload and system resources change over time.

## Can I use several producers with different configurations with Karafka?

**Yes**. You can create as many producers as you want using [WaterDrop API](https://github.com/karafka/waterdrop#setup) directly:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'request.required.acks': 1
  }
end
```

and you can use them.

There are a few things to keep in mind, though:

1. Producers should be long-lived.
2. Producers should be closed before the process shutdown to ensure proper resource finalization.
3. You need to instrument each producer using the WaterDrop instrumentation API.
4. Karafka itself uses the `Karafka#producer` internal reasons such as error tracking, DLQ dispatches, and more. This means that the default producer instance should be configured to operate within the scope of Karafka's internal functionalities.

## What is the Unsupported value "SSL" for configuration property "security.protocol": OpenSSL not available at build time?

If you are seeing the following error:

```bash
`validate!':
{:kafka=>"Unsupported value "SSL" for configuration property "security.protocol":
 OpenSSL not available at build time"} (Karafka::Errors::InvalidConfigurationError)
```

It means you want to use SSL, but `librdkafka` was built without it. You have to:

1. Uninstal it by running `gem remove karafka-rdkafka`
2. Install `openssl` (OS dependant but for macos, that would be `brew install openssl`)
3. Run `bundle install` again, so `librdkafka` is recompiled with SSL support.

## Can Karafka ask Kafka to list available topics?

Yes. You can use admin API to do this:

```ruby
# Get cluster info and list all the topics
info = Karafka::Admin.cluster_info

puts info.topics.map { |topic| topic[:topic_name] }.join(', ')
```

## Why Karafka prints some of the logs with a time delay?

Karafka `LoggerListener` dispatches messages to the logger immediately. You may be encountering buffering in the stdout itself. This is done because IO operations are slow, and usually it makes more sense to avoid writing every single character immediately to the console.

To avoid this behavior and instead write immediately to stdout, you can set it to a sync mode:

```ruby
$stdout.sync = true
```

You can read more about sync [here](https://ruby-doc.org/3.2.0/IO.html#method-i-sync-3D).


## Why is increasing `concurrency` not helping upon a sudden burst of messages?

Karafka uses multiple threads to process messages from multiple partitions or topics in parallel. If your consumer process has a single topic partition assigned, increasing `concurrency` will not help because there is no work that could be parallelized.

To handle such cases, you can:

- Increase the number of partitions beyond the number of active consumer processes to achieve multiple assignments in a single consumer process. In a case like this, the given process will be able to work in parallel.
- Use [Virtual Partitions](Pro-Virtual-Partitions) to parallelize the work of a single topic partition.

You can read more about the Karafka concurrency model [here](Concurrency-and-multithreading).

## Why am I seeing a "needs to be consistent namespacing style" error?

Due to limitations in metric names, topics with a period (`.`) or underscore (`_`) could collide. To avoid issues, it is best to use either but not both.

Karafka validates that your topics' names are consistent to minimize the collision risk. If you work with pre-existing topics, you can disable this check by setting `config.strict_topics_namespacing` value to `false`:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Do not validate topics naming consistency
    config.strict_topics_namespacing = false
  end
end
```

## Why, despite setting `initial_offset` to `earliest`, Karafka is not picking up messages from the beginning?

There are a few reasons why Karafka may not be picking up messages from the beginning, even if you set `initial_offset` to `earliest`:

1. Consumer group already exists: If the consumer group you are using to consume messages already exists, Karafka will not start consuming from the beginning by default. Instead, it will start consuming from the last committed offset for that group. To start from the beginning, you need to reset the offsets for the consumer group using the Kafka CLI or using the Karafka consumer `#seek` method.
2. Topic retention period: If the messages you are trying to consume are older than the retention period of the topic, they may have already been deleted from Kafka. In this case, setting `initial_offset` to `earliest` will not allow you to consume those messages.
3. Message timestamps: If the messages you are trying to consume have timestamps that are older than the retention period of the topic, they may have already been deleted from Kafka. In this case, even setting `initial_offset` to `earliest` will not allow you to consume those messages.
4. Kafka configuration: There may be a misconfiguration in your Kafka setup that is preventing Karafka from consuming messages from the beginning. For example, the `log.retention.ms` or `log.retention.bytes` settings may be set too low, causing messages to be deleted before you can consume them.

To troubleshoot the issue, you can try:

- changing the Karafka `client_id` temporarily,
- renaming the consumer group,
- resetting the offsets for the consumer group using `#seek`,
- checking the retention period for the topic,
- verifying the messages timestamps,
- reviewing your Kafka configuration to ensure it is correctly set up for your use case.

## Should I TSTP, wait a while, then send TERM or set a longer `shutdown_timeout` and only send a TERM signal?

This depends on many factors:

- do you use `cooperative.sticky` rebalance strategy?
- do you use static group memberships?
- do you do rolling deploys or all at once?
- are your jobs long-running?
- are you ok with intermediate rebalances?

The general rule is that if you want to ensure all of your current work finishes before you stop Karafka or that there won't be any short-lived rebalances, it is recommended to use `TSTP` and wait. When Karafka receives `TSTP` signal, it moves into a `quiet` mode. It won't accept any new work, but **all** the currently running and locally enqueued jobs will be finished. It will also **not** close any connections to Kafka, which means that rebalance will not be triggered.

If you want to ensure that the shutdown always finishes in a given time, you should set the `shutdown_timeout` accordingly and use `TERM`, keeping in mind it may cause a forceful shutdown which kills the currently running jobs.

If you decide to do a full deployment, you can send `TSTP` to all the processes, wait for all the work to be done (you can monitor if using the [Web UI](Web-UI-Getting-Started)), and then stop the processes using `TERM`.


## Why am I getting `error:0A000086:SSL routines::certificate verify failed` after upgrading Karafka?

If you are getting following error after upgrading `karafka` and `karafka-core`:

```bash
SSL handshake failed: error:0A000086:SSL routines::certificate verify failed:  
broker certificate could not be verified, verify that ssl.ca.location is correctly configured or  
root CA certificates are installed (brew install openssl) (after 170ms in state SSL_HANDSHAKE)
```

Please set `ssl.endpoint.identification.algorithm` to `false` in your configuration:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      # Other settings...
      'ssl.endpoint.identification.algorithm': false
    }
  end
end
```

## Why am I seeing a `karafka_admin` consumer group with a constant lag present?

The `karafka_admin` consumer group was created when using certain admin API operations. After upgrading to karafka `2.0.37` or higher, this consumer group is no longer needed and can be safely removed.

## Can I consume the same topic independently using two consumers within the same application?

Yes. You can define independent consumer groups operating within the same application. Let's say you want to consume messages from a topic called `event` using two consumers. You can do this as follows:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    consumer_group :db_storage do
      topic :events do
        consumer DbFlusherConsumer
      end
    end

    consumer_group :s3_storage do
      topic :events do
        consumer S3StoringConsumer
      end
    end
  end
end
```

Such a setup will ensure that both of them can be processed independently in parallel. Error handling, dead letter queue, and all the other per-topic behaviors will remain independent despite consuming the same topic.

## Why am I seeing Broker failed to validate record (invalid_record) error?

The error `Broker failed to validate record (invalid_record)` in Kafka means that the broker received a record that it could not accept. This error can occur if the record is malformed or does not conform to the schema expected by the broker.

There are several reasons why a Kafka broker might reject some messages:

- Invalid message format: If the message format does not match the expected format of the topic, the broker may reject the message.
- Missing message key. If you use log compaction as your `cleanup.policy` Kafka will require you to provide the key. Log compaction ensures that Kafka will always retain at least the last known value for each message key within the log of data for a single topic partition. If you enable compaction for a topic, messages without a key may be rejected.
- Schema validation failure: If the message contains data that does not conform to the schema, the broker may reject the message. This can happen if the schema has changed or the data was not properly validated before being sent to Kafka.
- Authorization failure: If the client does not have the required permissions to write to the topic, the broker may reject the message.
- Broker capacity limitations: If the broker has limited resources and cannot handle the incoming message traffic, it may reject some messages.

To resolve this error, it is essential to identify the root cause of the issue. Checking the message format and schema, ensuring proper authorization and permission, checking broker capacity, and addressing network issues can help resolve the issue. Additionally, monitoring Karafka logs to identify and resolve problems as quickly as possible is crucial.

## How can I make polling faster?

You can decrease the `max_wait_time` Karafka configuration or lower the `max_messages` setting.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other settings...

    # Wait for messages at most 100ms
    config.max_wait_time = 100
    # If you got 10 messages faster than in 100ms also don't wait any longer
    config.max_messages = 10
  end
end
```

## Can I dynamically add consumer groups and topics to a running Karafka process?

No. It is not possible. Changes like this require `karafka server` restart.

## Can a consumer instance be called multiple times from multiple threads?

**No**. Given consumer object instance will never be called/used from multiple threads simultaneously. Karafka ensures that a single consumer instance is always used from a single thread. Other threads may call the consumer object for coordination, but this is unrelated to your code.

## Can multiple threads reuse a single consumer instance?

A single consumer instance can perform work in many threads but only in one simultaneously. Karafka does **not** guarantee that consecutive batches of messages will be processed in the same thread, but it **does** ensure that the same consumer instance will process successive batches. A single consumer instance will **never** process any work in parallel.

## What does `Broker: Unknown topic or partition` error mean?

`The Broker: Unknown topic or partition` error typically indicates that the Kafka broker cannot find the specified topic or partition that the client is trying to access.

There are several possible reasons why this error might occur:

- The topic or partition may not exist on the broker. Double-check that the topic and partition you are trying to access exists on the Kafka cluster you are connecting to.
- The topic or partition may still need to be created. If you are trying to access a topic or partition that has not been created yet, you will need to create it before you can use it.
- The client may not have permission to access the topic or partition. Ensure that the client has the necessary permissions to read from or write to the topic or partition you are trying to access.
- The client may be using an incorrect topic or partition name. Ensure you use the correct topic or partition name in your client code.

You can use Karafka Web-UI or Karafka Admin API to inspect your cluster topics and ensure that the requested topic and partition exist.


## Why some of consumer subscriptions are not visible in the Web UI?

If some of your Karafka consumer subscriptions are not visible in the Karafka Web UI, there could be a few reasons for this:

- You are using Karafka Web older than the `0.4.1` version. Older Karafka Web UI versions used to only shows subscriptions that have at least one message processed.
- The consumer group that the subscription belongs to is not active. Karafka only displays active consumer groups in the Web UI. Make - sure that your consumer group is up and running.
The subscription is not properly configured. Ensure that your subscription is appropriately defined, has the correct topic, and is active.
- There is a delay in the Karafka Web UI updating its data. Karafka Web UI may take a few seconds to update its data, especially if many subscriptions or messages are being processed.

If none of these reasons explain why your subscriptions are not visible in the Karafka Web UI, you may need to investigate further and check your Karafka logs for any errors or warnings.

## Is there a way to run Karafka in a producer-only mode?

Yes, it is possible to run Karafka in producer-only mode. Karafka will not consume any messages from Kafka in this mode but only produce messages to Kafka.

To run Karafka in producer-only mode, do not define any topics for consumption or set all of them as inactive:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    # Leave this empty or set `active false` for all the topics
  end
end
```

With this configuration, Karafka will not create any consumer groups and will only initialize the `Karafka.producer`.

Keep in mind that with this configuration, you will not be able to start `karafka server` but you will be able to access `Karafka.producer` from other processes like Puma or Sidekiq.

## Why am I getting the `can't alloc thread (ThreadError)` error from the producer?

If you see this error from your Ruby process that is **not** a running Karafka process, you did not close the producer before finishing the process.

It is recommended to **always** run `Karafka.producer.close` before finishing processes like rake tasks, Puma server, or Sidekiq, so Karafka producer has a chance to dispatch all pending messages and gracefully close.

You can read more about producer shutdown [here](Producing-messages#producer-shutdown).

## Can I create all the topics needed by the Web UI manually?

While it is possible to create the necessary topics manually using the Kafka command-line tools, it is generally recommended to use the `bundle exec karafka-web install` command instead.

This is because the `karafka-web install` command ensures that the topics are created with the correct configuration settings, including the appropriate number of partitions, retention policies, and other critical parameters for efficient and reliable message processing. If you create the topics manually, there is a risk that you may miss some configuration settings or make mistakes that can cause performance or stability issues.

Overall, while it is technically possible to create the necessary topics for the Karafka Web-UI manually, it is generally recommended to use the `karafka-web install` command instead.

If you need to create them manually, please include the settings listed [here](https://karafka.io/docs/Web-UI-Getting-Started/).

## Can I consume messages from a Rake task?

**Yes**. Karafka Pro provides the [Iterator API](Pro-Iterator-API) that allows you to run one-off consumptions inline from within Rake tasks and any other Ruby processes.
