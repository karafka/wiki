1. [Does Karafka require Ruby on Rails?](#does-karafka-require-ruby-on-rails)
1. [Does Karafka require Redis and/or Sidekiq to work?](#does-karafka-require-redis-andor-sidekiq-to-work)
1. [Does Karafka require a separate process running?](#does-karafka-require-a-separate-process-running)
1. [Can I start Karafka process with only particular consumer groups running for given topics?](#can-i-start-karafka-process-with-only-particular-consumer-groups-running-for-given-topics)
1. [Does Karafka restart dead PG connections?](#does-karafka-restart-dead-pg-connections)
1. [Does Karafka require gems to be thread-safe?](#does-karafka-require-gems-to-be-thread-safe)
1. [Why Karafka process does not pick up newly created topics until restarted?](#why-karafka-process-does-not-pick-up-newly-created-topics-until-restarted)
1. [Can I remove a topic while the Karafka server is running?](#can-i-remove-a-topic-while-the-karafka-server-is-running)
1. [What is a forceful Karafka stop?](#what-is-a-forceful-karafka-stop)
1. [Can I use AWS MSK Serverless with IAM authentication?](#can-i-use-aws-msk-serverless-with-iam-authentication)
1. [How can I configure multiple bootstrap servers?](#how-can-i-configure-multiple-bootstrap-servers)
1. [Can I use Karafka with Ruby on Rails as a part of an internal gem?](#can-i-use-karafka-with-ruby-on-rails-as-a-part-of-an-internal-gem)
1. [Can I consume from more than one Kafka cluster simultaneously?](#can-i-consume-from-more-than-one-kafka-cluster-simultaneously)
1. [What is Karafka `client_id` used for?](#what-is-karafka-client_id-used-for)
1. [How can I increase Kafka and Karafka max message size?](#how-can-i-increase-kafka-and-karafka-max-message-size)
1. [Can Karafka ask Kafka to list available topics?](#can-karafka-ask-kafka-to-list-available-topics)
1. [Why am I seeing a "needs to be consistent namespacing style" error?](#why-am-i-seeing-a-needs-to-be-consistent-namespacing-style-error)
1. [Should I TSTP, wait a while, then send TERM or set a longer `shutdown_timeout` and only send a TERM signal?](#should-i-tstp-wait-a-while-then-send-term-or-set-a-longer-shutdown_timeout-and-only-send-a-term-signal)
1. [Can I dynamically add consumer groups and topics to a running Karafka process?](#can-i-dynamically-add-consumer-groups-and-topics-to-a-running-karafka-process)
1. [Do you provide an upgrade support when upgrading from EOL versions?](#do-you-provide-an-upgrade-support-when-upgrading-from-eol-versions)
1. [Why there are so many Karafka strategies in the codebase?](#why-there-are-so-many-karafka-strategies-in-the-codebase)
1. [Can you actively ping the cluster from Karafka to check the cluster availability?](#can-you-actively-ping-the-cluster-from-karafka-to-check-the-cluster-availability)
1. [How do I specify Karafka's environment?](#how-do-i-specify-karafkas-environment)
1. [How can I configure WaterDrop with SCRAM?](#how-can-i-configure-waterdrop-with-scram)
1. [How can I set up WaterDrop with SCRAM?](#how-can-i-set-up-waterdrop-with-scram)
1. [Can I use `rdkafka` and `karafka-rdkafka` together in the same project?](#can-i-use-rdkafka-and-karafka-rdkafka-together-in-the-same-project)
1. [Why am I getting the `all topic names within a single consumer group must be unique` error?](#why-am-i-getting-the-all-topic-names-within-a-single-consumer-group-must-be-unique-error)
1. [What is the release schedule for Karafka and its components?](#what-is-the-release-schedule-for-karafka-and-its-components)
1. [How can I control or limit the number of PostgreSQL database connections when using Karafka?](#how-can-i-control-or-limit-the-number-of-postgresql-database-connections-when-using-karafka)
1. [Is it recommended to add the `waterdrop` gem to the Gemfile, or just `karafka` and `karafka-testing`?](#is-it-recommended-to-add-the-waterdrop-gem-to-the-gemfile-or-just-karafka-and-karafka-testing)
1. [Does Karafka store the Kafka server address anywhere, and are any extra steps required to make it work after changing the server IP/hostname?](#does-karafka-store-the-kafka-server-address-anywhere-and-are-any-extra-steps-required-to-make-it-work-after-changing-the-server-iphostname)
1. [Is there a good way to quiet down `bundle exec karafka server` extensive logging in development?](#is-there-a-good-way-to-quiet-down-bundle-exec-karafka-server-extensive-logging-in-development)
1. [Why am I getting the `all topic names within a single consumer group must be unique` error when changing the location of the boot file using `KARAFKA_BOOT_FILE`?](#why-am-i-getting-the-all-topic-names-within-a-single-consumer-group-must-be-unique-error-when-changing-the-location-of-the-boot-file-using-karafka_boot_file)
1. [What does the `strict_topics_namespacing` configuration setting control?](#what-does-the-strict_topics_namespacing-configuration-setting-control)
1. [Why does Karafka routing accept consumer classes rather than instances?](#why-does-karafka-routing-accept-consumer-classes-rather-than-instances)
1. [Why does Karafka define routing separate from consumer classes, unlike Sidekiq or Racecar?](#why-does-karafka-define-routing-separate-from-consumer-classes-unlike-sidekiq-or-racecar)
1. [Does Karafka Pro support Apache Avro?](#does-karafka-pro-support-apache-avro)
1. [Does rdkafka-ruby support schema registry patterns with magic bytes for serialization/deserialization?](#does-rdkafka-ruby-support-schema-registry-patterns-with-magic-bytes-for-serializationdeserialization)

---

## Does Karafka require Ruby on Rails?

**No**. Karafka is a fully independent framework that can operate in a standalone mode. It can be easily integrated with any Ruby-based application, including those written with Ruby on Rails. Please follow the [Integrating with Ruby on Rails and other frameworks](Infrastructure-Integrating-with-Ruby-on-Rails-and-other-frameworks) documentation.

## Does Karafka require Redis and/or Sidekiq to work?

**No**. Karafka is a standalone framework, with an additional process that will be used to consume Kafka messages.

## Does Karafka require a separate process running?

No, however, it is **recommended**. By default, Karafka requires a separate process (Karafka server) to consume and process messages. You can read about it in the [Consuming messages](Basics-Consuming-Messages) section of the documentation.

Karafka can also be embedded within another process so you do not need to run a separate process. You can read about it [here](Infrastructure-Embedding).

## Can I start Karafka process with only particular consumer groups running for given topics?

Yes. Karafka allows you to listen with a single consumer group on multiple topics, which means that you can tune up the number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--include-consumer-groups``` server flag as follows:

```shell
bundle exec karafka server --include-consumer-groups group_name1 group_name3
```

You can also exclude particular groups the same way:

```shell
bundle exec karafka server --exclude-consumer-groups group_name1 group_name3
```

Visit the [CLI](Infrastructure-CLI) section of our docs to learn more about how to limit the scope of things to which the server subscribes.

## Does Karafka restart dead PG connections?

Karafka will automatically release no longer used ActiveRecord connections. They should be handled and reconnected by the Rails connection reaper. You can implement custom logic to reconnect them yourself if needed beyond the reaping frequency. More details on that can be found [here](Infrastructure-Active-Record-Connections-Management#dealing-with-dead-database-connections).

## Does Karafka require gems to be thread-safe?

Yes. Karafka uses multiple threads to process data, similar to how Puma or Sidekiq does it. The same rules apply.

## Why Karafka process does not pick up newly created topics until restarted?

- Karafka in the `development` mode will refresh cluster metadata every 5 seconds. It means that it will detect topic changes fairly fast.
- Karafka in `production` will refresh cluster metadata every 5 minutes. It is recommended to create production topics before running consumers.

The frequency of cluster metadata refreshes can be changed via `topic.metadata.refresh.interval.ms` in the `kafka` config section.

## Can I remove a topic while the Karafka server is running?

**Not recommended**. You may encounter the following errors if you decide to do so:

```text
ERROR -- : librdkafka internal error occurred: Local: Unknown partition (unknown_partition)
ERROR -- :
INFO -- : rdkafka: [thrd:main]: Topic extractor partition count changed from 1 to 0
ERROR -- : librdkafka internal error occurred: Broker: Unknown topic or partition (unknown_topic_or_part)
```

It is recommended to stop Karafka server instances and then remove and recreate the topic.

## What is a forceful Karafka stop?

When you attempt to stop Karafka, you may notice the following information in your logs:

```shell
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

Karafka supports following methods that work with AWS MSK:

- [Standard SASL + SSL mechanisms](Infrastructure-Deployment#aws-msk-cluster-setup).
- [Custom OAuth Token Providers](Infrastructure-Deployment#custom-oauth-token-providers) flow.

## How can I configure multiple bootstrap servers?

You need to define them comma-separated under `kafka` `bootstrap.servers` configuration key:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"

    # This value needs to be a string string with comma separated servers
    config.kafka = {
      'bootstrap.servers': 'server1.address:9092, server2.address:9092'
    }
  end
end
```

## Can I use Karafka with Ruby on Rails as a part of an internal gem?

Karafka has Rails auto-detection and loads early, so some components may be available later, e.g., when ApplicationConsumer inherits from BaseConsumer that is provided by the separate gem that needs an initializer.

Moreover, despite the same code base, some processes (`rails s`, `rails db:migrate`, `sidekiq s`) may not need to know about karafka, and there is no need to load it.

The problem is presented in [this](https://github.com/karafka/example-apps/pull/190) example app PR.

To mitigate this, you can create an empty karafka bootfile. With a file structure like this:

```text
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
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"
    ...
  end
end

# config/initializers/karafka_init.rb

require 'karafka_root_dir/karafka_app'
```

Still not a perfect solution because karafka gem is still loaded.

!!! note

    This description was prepared by [AleksanderSzyszka](https://github.com/AleksanderSzyszka).

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

Please note that if your cluster configuration is complex, you may want to use set it up in the root scope and then alter it on a per-topic basis:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'enable.ssl.certificate.verification': kafka_config.ssl_verify_hostname,
      'security.protocol': kafka_config.security_protocol,
      'statistics.interval.ms': 1_000,
      'ssl.key.password': kafka_config.auth[:cert_key_password],
      'ssl.key.pem': Base64.decode64(kafka_config.auth[:base64_cert_key_pem]),
      'ssl.certificate.pem': Base64.decode64(kafka_config.auth[:base64_client_cert_pem]),
      'ssl.ca.pem': Base64.decode64(kafka_config.auth[:base64_ca_cert_pem])
    }
    end
  end

  routes.draw do
    consumer_group :related_reviews do
      topic :reviews do
        target.kafka[:'bootstrap.servers'] = CLUSTERS[:related_reviews][:brokers]&.join(',')
        consumer ReviewsConsumer
      end
    end

    consumer_group :related_products do
      topic :products do
        target.kafka[:'bootstrap.servers'] = CLUSTERS[:related_products][:brokers]&.join(',')
        consumer RelatedProductsConsumer
      end
    end
  end
end
```

Also, please remember that those settings apply to consumers **only**. `Karafka#producer` will **always** produce to the default cluster using the default settings. This may be confusing when working with things like [Dead Letter Queue](Consumer-Groups-Dead-Letter-Queue) as the producer will produce the default cluster DLQ topic despite the origin cluster. You can read more about that behavior [here](Basics-Producing-Messages#producing-to-multiple-clusters).

## What is Karafka `client_id` used for?

Karafka `client_id` is, by default, used for populating the Kafka `client.id` value.

Kafka `client.id` is a string passed to the server when making requests. This allows the server to track the source of requests beyond just IP/port by including a logical application identifier in server-side request logging. The `client.id` should be unique for each application instance to enable effective debugging and operational monitoring.

## How can I increase Kafka and Karafka max message size?

To make Kafka accept messages bigger than 1MB, you must change both Kafka and Karafka configurations.

To increase the maximum accepted payload size in Kafka, you can adjust the `message.max.bytes` and `replica.fetch.max.bytes` configuration parameters in the server.properties file. These parameters controls the maximum size of a message the Kafka broker will accept.

To allow WaterDrop (Karafka producer) to send bigger messages, you need to:

- set the `max_payload_size` config option to value in bytes matching your maximum expected payload.
- set `kafka` scoped `message.max.bytes` to the same value.

You can do this by [reconfiguring WaterDrop](WaterDrop-Reconfiguration) during Karafka setup:

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

!!! note

    If you do not allow bigger payloads and try to send them, you will end up with one of the following errors:

```ruby
WaterDrop::Errors::MessageInvalidError {:payload=>"is more than `max_payload_size` config value"}
```

or

```ruby
Rdkafka::RdkafkaError (Broker: Message size too large (msg_size_too_large)):
```

## Can Karafka ask Kafka to list available topics?

Yes. You can use admin API to do this:

```ruby
# Get cluster info and list all the topics
info = Karafka::Admin.cluster_info

puts info.topics.map { |topic| topic[:topic_name] }.join(', ')
```

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

## Can I dynamically add consumer groups and topics to a running Karafka process?

No. It is not possible. Changes like this require `karafka server` restart.

## Do you provide an upgrade support when upgrading from EOL versions?

While we always try to help anyone from the Karafka community with their problems, extensive upgrade support requiring involvement is part of our [Pro Support](Pro-Support#upgrade-support) offering.

## Why there are so many Karafka strategies in the codebase?

Karafka provides several different strategies for consuming messages from Kafka, each with its own trade-offs and use cases. The reason for this is to give developers the flexibility to choose the strategy that best fits their specific requirements, and another reason is code simplification. Particular strategies often differ with one or two lines of code, but those changes significantly impact how Karafka operates. With separate strategies, each case is handled independently and can be debugged and understood in isolation.

But why would Karafka need multiple strategies in the codebase? The answer lies in the diverse range of use cases that Karafka is designed to support.

By supporting multiple strategies in the codebase, Karafka can cater to a wide range of use cases and provide developers with the flexibility they need to build the applications they want.

## Can you actively ping the cluster from Karafka to check the cluster availability?

**Yes**, you can use Karafka's Admin API to retrieve cluster information and check the reachability of the Kafka cluster. The `Karafka::Admin.cluster_info` method can be used to retrieve metadata about the Kafka cluster, including details about brokers, topics, and partitions.

If the method call is successful, it indicates that the Karafka application was able to connect to the Kafka cluster and retrieve metadata about the brokers and topics. However, it's important to note that this does not necessarily mean everything with the cluster is okay.

"Kafka being up" is a rather complex matter. Many factors can affect the overall health and performance of a Kafka cluster, including network issues, broker failures, and misconfigured settings. Therefore, it's essential to use additional monitoring and alerting mechanisms to ensure the reliability and availability of your Kafka cluster.

You can read more about this topic [here](https://github.com/confluentinc/librdkafka/wiki/FAQ#is-kafka-up).

## How do I specify Karafka's environment?

Karafka uses the `KARAFKA_ENV` variable for that; if missing, it will try to detect it. You can read more about this topic [here](Infrastructure-Env-Variables).

## How can I configure WaterDrop with SCRAM?

You can use the same setup as the one used by Karafka, described [here](Infrastructure-Deployment#karafka-configuration-for-aws-msk-sasl-ssl).

## How can I set up WaterDrop with SCRAM?

You can configure it the same way as Karafka support for SCRAM described [here](Infrastructure-Deployment#karafka-configuration-for-aws-msk-sasl-ssl).

## Can I use `rdkafka` and `karafka-rdkafka` together in the same project?

**No**. `karafka-rdkafka` is a fork of `rdkafka` that includes many stability and performance enhancements while having a compatible API. If you try to use both, they will conflict with each other.

## Why am I getting the `all topic names within a single consumer group must be unique` error?

If you are seeing the following error when starting Karafka:

```shell
{:topics=>"all topic names within a single consumer group must be unique"}
(Karafka::Errors::InvalidConfigurationError)
```

it indicates that you have duplicate topic names in your configuration of the same consumer group.

In Karafka, each topic within a consumer group should have a unique name. This requirement is in place because each consumer within a consumer group reads from a unique partition of a specific topic. If there are duplicate topic names, then the consumers will not be able to distinguish between these topics.

To solve this issue, you need to ensure that all topic names within a single consumer group in your Karafka configuration are unique.

## What is the release schedule for Karafka and its components?

Karafka and Karafka Pro do not follow a fixed official release schedule. Instead:

- Releases containing breaking changes are rolled out once they are fully documented, and migration guides are prepared.

- New features are released as soon as they are ready and thoroughly documented.

- Bug fixes that don't involve API changes are released immediately.

We prioritize bugs and critical performance improvements to ensure optimal user experience and software performance. It's worth noting that most bugs are identified, reproduced, and fixed within seven days from the initial report acknowledgment.

## How can I control or limit the number of PostgreSQL database connections when using Karafka?

Karafka, by itself, does not manage PostgreSQL or any other database connections directly.

## Is it recommended to add the `waterdrop` gem to the Gemfile, or just `karafka` and `karafka-testing`?

Adding the `waterdrop` gem to the Gemfile is unnecessary since `karafka` already depends on `waterdrop`. Karafka will ensure it selects the most compatible version of `waterdrop` on its own.

## Does Karafka store the Kafka server address anywhere, and are any extra steps required to make it work after changing the server IP/hostname?

Karafka does not persistently store the Kafka server address or cache any information about the cluster's IP addresses or hostnames. The issue you're experiencing is likely due to your cluster setup, as Karafka performs discovery based on the initial host address provided in the `config.kafka` setup. Upon startup, Karafka uses this initial address to discover the rest of the cluster. Ensure your configurations are correctly updated across your Docker setup, and restart the process to clear any temporary caches. Karafka has no intrinsic knowledge of AWS hosts or any hardcoded cluster information; it relies entirely on the configuration provided at startup.

## Is there a good way to quiet down `bundle exec karafka server` extensive logging in development?

Yes. You can set `log_polling` to `false` for the `LoggerListener` as follows:

```ruby
Karafka.monitor.subscribe(
  Karafka::Instrumentation::LoggerListener.new(
    # When set to false, polling will not be logged
    # This makes logging in development less extensive
    log_polling: false
  )
)
```

## Why am I getting the `all topic names within a single consumer group must be unique` error when changing the location of the boot file using `KARAFKA_BOOT_FILE`?

You're seeing this error most likely because you have moved the `karafka.rb` file to a location that is automatically loaded, meaning that it is loaded and used by the Karafka framework and also by the framework of your choice. In the case of Ruby on Rails, it may be so if you've placed your `karafka.rb`, for example, inside the `config/initializers` directory.

## What does the `strict_topics_namespacing` configuration setting control?

The `strict_topics_namespacing` configuration in Karafka enforces consistent naming for topics by ensuring they use either dots (`.`) or underscores (`_`) but not a mix of both in a topic name. This validation helps prevent inconsistencies in topic names, which is crucial because inconsistent namespacing can lead to issues like Kafka metrics reporting name collisions. Such collisions occur because Kafka uses these characters to structure metric names, and mixing them can cause metrics to overlap or be misinterpreted, leading to inaccurate monitoring and difficulties in managing Kafka topics. By enabling `strict_topics_namespacing`, you ensure that all topic names follow a uniform pattern, avoiding these potential problems. This validation can be turned off by setting `config.strict_topics_namespacing` to false if your environment does not require uniform naming.

## Why does Karafka routing accept consumer classes rather than instances?

Karafka routing requires that you provide a consumer class reference rather than a consumer instance:

```ruby
# Correct approach
topic :topic_name do
  consumer ConsumerClass
end

# Incorrect approach
topic :topic_name do
  consumer ConsumerClass.new  # This will not work
end
```

This design decision offers several important benefits:

1. **Instance lifecycle management**: Karafka needs to control when and how consumer instances are created to properly manage the message processing lifecycle.

1. **Resource management**: By controlling instantiation, Karafka ensures proper resource cleanup after message processing is complete.

1. **Concurrency considerations**: When running with multiple threads or processes, Karafka creates separate consumer instances for each concurrent execution unit to maintain thread safety.

1. **Configuration integration**: Class-based routing allows Karafka to apply configuration and middleware to the class before instantiation.

This pattern follows the principle of Inversion of Control (IoC), where the framework controls object creation rather than the application code. It's similar to how other Ruby frameworks (like Rails) reference controllers by class in routes, not by instances.

## Why does Karafka define routing separate from consumer classes, unlike Sidekiq or Racecar?

Unlike frameworks such as Sidekiq or Racecar, where message-processing destinations are defined directly within classes, Karafka uses a separate routing layer that maps topics to consumer classes:

```ruby
# Karafka approach - separate routing definition
App.routes.draw do
  topic :orders do
    consumer OrdersConsumer
  end

  topic :notifications do
    consumer NotificationsConsumer
  end
end

# vs. embedded approach (not used in Karafka)
class OrdersConsumer
  subscribes_to :orders
  # ...
end
```

This deliberate architectural decision provides several significant benefits:

1. **Consumer reusability**: The same consumer class can be used with multiple topics without modification. This enables powerful patterns where a single processing implementation can handle data from various sources.

1. **Multi-level configuration**: Karafka's routing system allows configuration at different levels of abstraction:

    - Consumer group level
    - Subscription group level
    - Topic level

1. **Separation of concerns**: Routing (what to consume) is separated from consumption logic (how to process). This creates cleaner, more maintainable code.

1. **Dynamic routing capabilities**: The routing layer can be extended with logic that determines routes based on runtime conditions.

1. **Enhanced testing**: Consumers can be tested independently from their routing configuration, improving unit test isolation.

1. **Flexibility for complex setups**: The separate routing layer provides much better organization and clarity for advanced Kafka deployments with many topics and consumers.

This approach follows established software architecture principles and provides significantly more flexibility when working with complex Kafka-based systems, especially as your application grows.

## Does Karafka Pro support Apache Avro?

**Yes**, Karafka supports Apache Avro serialization through the `avro` gem, though this gem is maintained independently:

**Current Status:**

- **Active Support**: The `avro` gem is currently well-maintained and actively supported
- **Full Integration**: Karafka works seamlessly with Avro serialization for both producers and consumers
- **Production Ready**: Many Karafka users successfully use Avro in production environments

**Contingency Planning:**

- **Adoption Commitment**: If the `avro` gem becomes unmaintained, we will adopt and maintain it to ensure continued support
- **Alternative Solutions**: We monitor alternative Avro libraries and can recommend migrations if needed
- **Enterprise Priority**: Enterprise customers using Avro receive priority support for any Avro-related issues

**Implementation Support:**

- Detailed documentation for Avro integration
- Examples and best practices for Avro usage with Karafka
- Support for complex Avro schemas and schema evolution
- Performance optimization guidance for Avro serialization

## Does rdkafka-ruby support schema registry patterns with magic bytes for serialization/deserialization?

**No**, rdkafka-ruby (and by extension Karafka and WaterDrop) does not include built-in support for schema registry patterns or magic byte framing logic. These libraries focus exclusively on Kafka protocol operations and do not handle message serialization formats or schema management.

rdkafka-ruby is a pure Kafka protocol binding that remains agnostic about your data format. It treats message payloads as opaque byte streams, which provides maximum flexibility for any serialization approach.

When consuming messages, you can manually deserialize using `raw_payload` or configure a custom deserializer. For detailed examples and best practices, see the [Deserialization](Consumer-Groups-Deserialization) documentation.
