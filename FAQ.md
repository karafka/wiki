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
57. [Do you provide an upgrade support when upgrading from EOL versions?](#do-you-provide-an-upgrade-support-when-upgrading-from-eol-versions)
58. [Why there are so many Karafka strategies in the codebase?](#why-there-are-so-many-karafka-strategies-in-the-codebase)
59. [Why am I having problems running Karafka and Karafka Web with remote Kafka?](#why-after-moving-from-racecar-to-karafka-my-confluent-datadog-integration-stopped-working)
60. [Why after moving from Racecar to Karafka, my Confluent Datadog integration stopped working?](#why-after-moving-from-racecar-to-karafka-my-confluent-datadog-integration-stopped-working)
61. [Why am I getting `env: can't execute 'bash'` when installing Karafka in an Alpine Docker?](#why-am-i-getting-env-cant-execute-bash-when-installing-karafka-in-an-alpine-docker)
62. [Can I intercept WaterDrop messages in tests?](#can-i-intercept-waterdrop-messages-in-tests)
63. [Does Karafka Expiring Messages remove messages from Kafka?](#does-karafka-expiring-messages-remove-messages-from-kafka)
64. [Can you actively ping the cluster from Karafka to check the cluster availability?](#can-you-actively-ping-the-cluster-from-karafka-to-check-the-cluster-availability)
65. [How do I specify Karafka's environment?](#how-do-i-specify-karafkas-environment)
66. [How can I configure WaterDrop with SCRAM?](#how-can-i-configure-waterdrop-with-scram)
67. [Why am I getting a `Local: Broker transport failure (transport)` error with the `Disconnected` info?](#why-am-i-getting-a-local-broker-transport-failure-transport-error-with-the-disconnected-info)
68. [Why am I getting a `All broker connections are down (all_brokers_down)` error together with the `Disconnected` info?](#why-am-i-getting-a-all-broker-connections-are-down-all_brokers_down-error-together-with-the-disconnected-info)
69. [What is the difference between `partition_key` and `key` in the WaterDrop gem?](#what-is-the-difference-between-partition_key-and-key-in-the-waterdrop-gem)
70. [How can I set up WaterDrop with SCRAM?](#how-can-i-set-up-waterdrop-with-scram)
71. [Is there a way to mark messages as consumed in bulk?](#is-there-a-way-to-mark-messages-as-consumed-in-bulk)
72. [How can I consume all the messages from a Kafka topic without a consumer process?](#how-can-i-consume-all-the-messages-from-a-kafka-topic-without-a-consumer-process)
73. [What does `Broker: Invalid message (invalid_msg)` error mean?](#what-does-broker-invalid-message-invalid_msg-error-mean)
74. [Is there an option in Karafka to re-consume all the messages from a topic even though all were already consumed?](#is-there-an-option-in-karafka-to-re-consume-all-the-messages-from-a-topic-even-though-all-were-already-consumed)
75. [How can I make sure, that `Karafka.producer` does not block/delay my processing?](#how-can-i-make-sure-that-karafkaproducer-does-not-blockdelay-my-processing)
76. [Can `at_exit` be used to close the WaterDrop producer?](#can-at_exit-be-used-to-close-the-waterdrop-producer)
77. [Why, when DLQ is used with `max_retries` set to `0`, Karafka also applies a back-off?](#why-when-dlq-is-used-with-max_retries-set-to-0-karafka-also-applies-a-back-off)
78. [Can I use `rdkafka` and `karafka-rdkafka` together in the same project?](#can-i-use-rdkafka-and-karafka-rdkafka-together-in-the-same-project)
79. [Does using consumer `#seek` resets the committed offset?](#does-using-consumer-seek-resets-the-committed-offset)
80. [Is it recommended to use public consumer methods from outside the consumer?](#is-it-recommended-to-use-public-consumer-methods-from-outside-the-consumer)
81. [Why do I see `SASL authentication error` after AWS MSK finished the `Heal cluster` operation?](#why-do-i-see-sasl-authentication-error-after-aws-msk-finished-the-heal-cluster-operation)
82. [Why Karafka and WaterDrop are behaving differently than `rdkafka`?](#why-do-i-see-sasl-authentication-error-after-aws-msk-finished-the-heal-cluster-operation)
83. [Why am I seeing `Inconsistent group protocol` in Karafka logs?](#why-am-i-seeing-inconsistent-group-protocol-in-karafka-logs)
84. [What is the difference between WaterDrop's `max_payload_size` and librdkafka's `message.max.bytes`?](#what-is-the-difference-between-waterdrops-max_payload_size-and-librdkafkas-messagemaxbytes)
85. [What are consumer groups used for?](#what-are-consumer-groups-used-for)
86. [Why am I getting the `all topic names within a single consumer group must be unique` error?](#why-am-i-getting-the-all-topic-names-within-a-single-consumer-group-must-be-unique-error)
87. [Why am I getting `WaterDrop::Errors::ProduceError`, and how can I know the underlying cause?](#why-am-i-getting-waterdroperrorsproduceerror-and-how-can-i-know-the-underlying-cause)
88. [Can extra information be added to the messages dispatched to the DLQ?](#can-extra-information-be-added-to-the-messages-dispatched-to-the-dlq)
89. [Why does WaterDrop hang when I attempt to close it?](#why-does-waterdrop-hang-when-i-attempt-to-close-it)
90. [Why Karafka commits offsets on rebalances and librdafka does not?](#why-karafka-commits-offsets-on-rebalances-and-librdafka-does-not)
91. [What is Karafka's assignment strategy for topics and partitions?](#what-is-karafkas-assignment-strategy-for-topics-and-partitions)
92. [Why can't I see the assignment strategy/protocol for some Karafka consumer groups?](#why-cant-i-see-the-assignment-strategyprotocol-for-some-karafka-consumer-groups)
93. [What can be done to log why the `produce_sync` has failed?](#what-can-be-done-to-log-why-the-produce_sync-has-failed)
94. [Can I password-protect Karafka Web UI?](#can-i-password-protect-karafka-web-ui)
95. [Can I use a Karafka producer without setting up a consumer?](#can-i-use-a-karafka-producer-without-setting-up-a-consumer)
96. [What will happen when a message is dispatched to a dead letter queue topic that does not exist?](#what-will-happen-when-a-message-is-dispatched-to-a-dead-letter-queue-topic-that-does-not-exist)
97. [Why do Karafka reports lag when processes are not overloaded and consume data in real-time?](#why-do-karafka-reports-lag-when-processes-are-not-overloaded-and-consume-data-in-real-time)
98. [Does Kafka guarantee message processing orders within a single partition for single or multiple topics? And does this mean Kafka topics consumption run on a single thread?](#does-kafka-guarantee-message-processing-orders-within-a-single-partition-for-single-or-multiple-topics-and-does-this-mean-kafka-topics-consumption-run-on-a-single-thread)
99. [Why can I produce messages to my local Kafka docker instance but cannot consume?](#why-can-i-produce-messages-to-my-local-kafka-docker-instance-but-cannot-consume)
100. [What is the release schedule for Karafka and its components?](#what-is-the-release-schedule-for-karafka-and-its-components)
101. [Can I pass custom parameters during consumer initialization?](#can-i-pass-custom-parameters-during-consumer-initialization)
102. [Where can I find producer idempotence settings?](#where-can-i-find-producer-idempotence-settings)
103. [How can I control or limit the number of PostgreSQL database connections when using Karafka?](#how-can-i-control-or-limit-the-number-of-postgresql-database-connections-when-using-karafka)
104. [Why is my Karafka application consuming more memory than expected?](#why-is-my-karafka-application-consuming-more-memory-than-expected)
105. [How can I optimize memory usage in Karafka?](#how-can-i-optimize-memory-usage-in-karafka)
106. [Why am I getting `No such file or directory - ps (Errno::ENOENT)` from the Web UI?](#why-am-i-getting-no-such-file-or-directory-ps-errnoenoent-from-the-web-ui)
107. [Can I retrieve all records produced in a single topic using Karafka?](#can-i-retrieve-all-records-produced-in-a-single-topic-using-karafka)
108. [How can I get the total number of messages in a topic?](#how-can-i-get-the-total-number-of-messages-in-a-topic)
109. [Why am I getting `Broker: Group authorization failed (group_authorization_failed)` when using Admin API or the Web UI?](#why-am-i-getting-broker-group-authorization-failed-group_authorization_failed-when-using-admin-api-or-the-web-ui)
110. [Why am I getting an `ArgumentError: undefined class/module YAML::Syck` when trying to install `karafka-license`?](#why-am-i-getting-an-argumenterror-undefined-classmodule-yamlsyck-when-trying-to-install-karafka-license)

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

Karafka 2.x has [Rails auto-detection](https://github.com/karafka/karafka/blob/78ea23f7044b81b7e0c74bb02ad3d2e5a5fa1b7c/lib/karafka/railtie.rb#L19), and it is loaded early, so some components may be available later, e.g., when ApplicationConsumer inherits from BaseConsumer that is provided by the separate gem that needs an initializer.

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

- Building ids for consumer groups using the default [consumer mapper](https://karafka.io/docs/Consumer-mappers).
- Populating kafka `client.id` value.

kafka `client.id` is a string passed to the server when making requests. This is to track the source of requests beyond just IP/port by allowing a logical application name to be included in server-side request logging.

Therefore the `client_id` should be shared across multiple instances in a cluster or horizontally scaled application but distinct for each application.

**Note**: If you're using the default consumer group mapper in Karafka, altering the `client_id` will rename consumer groups, leading to the reconsumption of all subscribed topics. Exercise caution and avoid modifying the `client_id` unless intentional reprocessing of all messages is desired.

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

You can read more about sync [here](https://ruby-doc.org/3.2.0/IO.html#method-i-sync).


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

You can use Karafka Web UI or Karafka Admin API to inspect your cluster topics and ensure that the requested topic and partition exist.

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

Overall, while it is technically possible to create the necessary topics for the Karafka Web UI manually, it is generally recommended to use the `karafka-web install` command instead.

If you need to create them manually, please include the settings listed [here](https://karafka.io/docs/Web-UI-Getting-Started/).

## Can I consume messages from a Rake task?

**Yes**. Karafka Pro provides the [Iterator API](Pro-Iterator-API) that allows you to run one-off consumptions inline from within Rake tasks and any other Ruby processes.

## Do you provide an upgrade support when upgrading from EOL versions?

While we always try to help anyone from the Karafka community with their problems, extensive upgrade support requiring involvement is part of our [Pro Support](Pro-Support#upgrade-support) offering.

## Why there are so many Karafka strategies in the codebase?

Karafka provides several different strategies for consuming messages from Kafka, each with its own trade-offs and use cases. The reason for this is to give developers the flexibility to choose the strategy that best fits their specific requirements, and another reason is code simplification. Particular strategies often differ with one or two lines of code, but those changes significantly impact how Karafka operates. With separate strategies, each case is handled independently and can be debugged and understood in isolation.

But why would Karafka need multiple strategies in the codebase? The answer lies in the diverse range of use cases that Karafka is designed to support.

By supporting multiple strategies in the codebase, Karafka can cater to a wide range of use cases and provide developers with the flexibility they need to build the applications they want.

## Why am I having problems running Karafka and Karafka Web with remote Kafka?

Karafka and librdkafka are not designed to work over unstable and slow network connections, and these libraries contain internal timeouts on network operations that slow networks may impact. As a result, it is recommended to use a local Docker-based Kafka instance for local development. We are aware of this issue and are actively working to make these timeouts configurable in the future. Using a local Kafka instance for local development can help you avoid network-related problems and ensure a smoother development experience.

## Why after moving from Racecar to Karafka, my Confluent Datadog integration stopped working?

If you have moved from Racecar to Karafka and your Confluent Datadog integration has stopped working, the consumer group name may not be aligned between the two. It is important to ensure that the consumer group name is the same in Racecar and Karafka. We recommend using a [custom consumer group mapper](https://karafka.io/docs/Consumer-mappers) that does not inject the application name, as this can cause a mismatch:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Aligns consumer group naming with Racecar
    config.consumer_mapper = ->(raw_consumer_group_name) { raw_consumer_group_name }
  end
end
```

Another possible reason for the delay in reporting to Datadog is that when a new consumer group is introduced, Confluent reports things with a delay to Datadog. This is because the new consumer group needs to be registered with Confluent before it can start reporting metrics to Datadog.

To ensure a smoother monitoring experience, we recommend enabling [Karafka Datadog integration](https://karafka.io/docs/Monitoring-and-logging#datadog-and-statsd-integration). It will allow you to easily monitor your Karafka operations and ensure everything is running smoothly. An out-of-the-box dashboard can be imported to Datadog for overseeing Karafka operations. This dashboard provides detailed metrics and insights into your Karafka operations, making identifying and resolving issues easier.

## Why am I getting `env: can't execute 'bash'` when installing Karafka in an Alpine Docker?

If you encounter the following error:

```
========================================================================
env: can't execute 'bash': No such file or directory
========================================================================
rake aborted!
Failed to complete configure task
/app/vendor/bundle/ruby/2.7.0/gems/mini_portile2-2.8.0/lib/mini_portile2/mini_portile.rb:460:in
`block in execute'
```

you need to make sure that your Alpine-based image includes bash. Alpine Linux Docker image by default does **not** include it. To add it, please make sure to add this line before you run the `bundle install` process:

```bash
RUN apk update && apk add bash
```

## Can I intercept WaterDrop messages in tests?

**Yes**. You need to configure WaterDrop producer to use the `karafka-testing` spec dummy client:

```ruby
require 'karafka/testing/errors'
require 'karafka/testing/spec_consumer_client'

RSpec.describe MyTestedLib do
  subject(:my_lib) { described_class.new }

  let(:karafka_producer_client) { Karafka::Testing::SpecProducerClient.new(self) }

  before do
    allow(MY_KARAFKA_PRODUCER).to receive(:client).and_return(karafka_producer_client)
  end

  it 'expect to dispatch one message' do
    my_lib.do_something

    expect(karafka_producer_client.messages.count).to eq(1)
  end
end
```

You can find the `SpecProducerClient` API [here](https://karafka.io/docs/code/karafka-testing/Karafka/Testing/SpecProducerClient.html).

## Does Karafka Expiring Messages remove messages from Kafka?

When a message is produced to a Kafka topic, it is stored in Kafka until it expires based on the retention policy of the topic. The retention policy determines how long messages are kept in Kafka before they are deleted.

Karafka's [Expiring Messages](https://karafka.io/docs/Pro-Expiring-Messages) functionality removes messages from Karafka's internal processing queue after a specified amount of time has passed since the message was produced. This functionality is useful when processing messages with a limited lifetime, such as messages with time-sensitive data or messages that should not be processed after a certain amount of time has passed.

However, it's important to note that Karafka's Expiring Messages functionality does not remove messages from Kafka itself, and it only removes messages from Karafka's internal processing queue. Therefore, the retention policy of the Kafka topic will still apply, and the message will remain in Kafka until it expires based on the topic's retention policy.

To set the retention policy of a Kafka topic, you can use Kafka's built-in retention policies or configure custom retention policies using the [declarative topics](https://karafka.io/docs/Topics-management-and-administration#declarative-topics) functionality. By configuring the retention policy, you can control how long messages are kept in Kafka before they are deleted, regardless of whether Karafka has processed them or not.

## Can you actively ping the cluster from Karafka to check the cluster availability?

**Yes**, you can use Karafka's Admin API to retrieve cluster information and check the reachability of the Kafka cluster. The `Karafka::Admin.cluster_info` method can be used to retrieve metadata about the Kafka cluster, including details about brokers, topics, and partitions.

If the method call is successful, it indicates that the Karafka application was able to connect to the Kafka cluster and retrieve metadata about the brokers and topics. However, it's important to note that this does not necessarily mean everything with the cluster is okay.

"Kafka being up" is a rather complex matter. Many factors can affect the overall health and performance of a Kafka cluster, including network issues, broker failures, and misconfigured settings. Therefore, it's essential to use additional monitoring and alerting mechanisms to ensure the reliability and availability of your Kafka cluster.

You can read more about this topic [here](https://github.com/confluentinc/librdkafka/wiki/FAQ#is-kafka-up).

## How do I specify Karafka's environment?

Karafka uses the `KARAFKA_ENV` variable for that; if missing, it will try to detect it. You can read more about this topic [here](https://karafka.io/docs/Env-Variables/).


## How can I configure WaterDrop with SCRAM?

You can use the same setup as the one used by Karafka, described [here](https://karafka.io/docs/Deployment#karafka-configuration-for-aws-msk-sasl-ssl).

## Why am I getting a `Local: Broker transport failure (transport)` error with the `Disconnected` info?

If you are seeing following or similar error:

```
rdkafka: [thrd:node_url]: node_url: Disconnected (after 660461ms in state UP)
librdkafka internal error occurred: Local: Broker transport failure (transport)
```

The error message you mentioned may be related to the connection reaper in Kafka disconnecting because the TCP socket has been idle for a long time. The connection reaper is a mechanism in Kafka that monitors the idle TCP connections and disconnects them if they exceed a specific time limit. This is done to free up resources on the broker side and to prevent the accumulation of inactive connections.

If the client application is not sending or receiving data over the TCP connection for a long time, the connection reaper may kick in and disconnect the client from the broker.

However, this disconnection does not mean that any produced data will be lost. When the client application reconnects to the broker, it can resume sending or receiving messages from where it left off. 

Suppose your data production patterns are not stable, and there are times when your client application is not producing any data to Kafka for over 10 minutes. In that case, you may want to consider setting the `log.connection.close` value to `false` in your configuration. This configuration parameter controls whether the client logs a message when a connection is closed by the broker. By default, the client will log a message indicating that the connection was closed, which can generate false alarms if the connection was closed due to inactivity by the connection reaper.

Setting `log.connection.close` to false will suppress these log messages and prevent the error from being raised. It's important to note that even if you set `log.connection.close` to `false,` critical non-recoverable errors that occur in Karafka and WaterDrop will still be reported via the instrumentation pipeline.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_application'

    config.kafka = {
      # other settings...
      'log.connection.close': false
    }
  end
end
```

Please note that you can control the `connections.max.idle.ms` on both Kafka and Karafka consumer / WaterDrop producer basis.

You can read more about this issue [here](https://github.com/confluentinc/librdkafka/wiki/FAQ#why-am-i-seeing-receive-failed-disconnected).

## Why am I getting a `All broker connections are down (all_brokers_down)` error together with the `Disconnected` info?

When you see both the `Disconnected` error and the `all_brokers_down` error, it means that the TCP connection to the cluster was closed and that you no longer have any active connections.

Please read the explanation of the previous question to understand the reasons and get tips on mitigating this issue.

```
rdkafka: [thrd:node_url]: node_url: Disconnected (after 660461ms in state UP)
librdkafka internal error occurred: Local: Broker transport failure (transport)
Error occurred: Local: All broker connections are down (all_brokers_down) - librdkafka.error
```

## What is the difference between `partition_key` and `key` in the WaterDrop gem?

In the WaterDrop gem, `partition_key` and `key` are two distinct options that can be used to set message keys, but they have different purposes and work slightly differently.

- `partition_key` is used to determine the partition to which a message is sent and computes the destination partition in the Ruby process using the configured `partitioner` algorithm. The partitioner calculates a hash value based on the partition_key value and uses this hash value to select a partition for the message.
- `key` is an optional property that can be set for a message. The Kafka broker uses the message key for log compaction, which ensures that only the latest message for a specific key is retained in the topic. Unless partition is explicitly provided via `partition` or `partition_key`, the `key` value will also be used for partition assignment. 

## How can I set up WaterDrop with SCRAM?

You can configure it the same way as Karafka support for SCRAM described [here](https://karafka.io/docs/Deployment#karafka-configuration-for-aws-msk-sasl-ssl).

## Is there a way to mark messages as consumed in bulk?

In Kafka, there is no explicit need to mark messages as "consumed" in bulk because Kafka's offset mechanism takes care of this automatically.

The moment you consume a message from a specific topic partition at a particular offset, Kafka considers all previous messages up to that offset as consumed.

Kafka maintains a commit log that records the offset of each message within a topic partition. When a consumer reads messages from a partition, it keeps track of the offset of the last consumed message. This offset is then used to resume consumption from the same point if the consumer restarts or fails.

When you mark a message as consumed with a higher offset, it implies that all previous messages with lower offsets have been successfully processed and considered consumed. Kafka's offset mechanism ensures that the consumer's offset is moved accordingly, indicating that those messages have been processed.

While Kafka's offset mechanism automatically tracks the progress of message consumption and allows you to resume from the last consumed offset, there can be scenarios where explicitly marking each message as consumed becomes beneficial. This is particularly relevant when messages are processed sequentially, with a significant time gap between consuming each message.

In such cases, marking each message as consumed provides finer-grained control over the consuming progress. By explicitly acknowledging the consumption of each message, you ensure that even if a crash or failure occurs during processing, the consumer can resume from the last successfully processed message.

Here's an explanation of the benefits of marking each message as consumed:

- Granular Progress Tracking: Marking each message as consumed allows you to have a more detailed view of the processing progress. You can precisely identify the last processed message and easily determine the remaining messages that need to be processed.

- Enhanced Fault Tolerance: In the event of a crash or failure, explicitly marking each message as consumed ensures that the consumer can restart from the last processed message rather than starting from the beginning or relying solely on the offset mechanism. This reduces duplicated processing and improves fault tolerance.

- Handling Long-running Processing: If the processing time for each message is significant, explicitly marking them as consumed provides better visibility into the progress. It allows you to identify any potential bottlenecks or delays in processing and take appropriate actions if needed.

**Note**: When using Karafka [Virtual Partitions](/docs/Pro-Virtual-Partitions/), it is recommended to mark each message as consumed due to how [Virtual Offset Management](https://karafka.io/docs/Pro-Virtual-Partitions#virtual-offset-management) works.

## How can I consume all the messages from a Kafka topic without a consumer process?

Karafka has an Iterator API for that. You can read about it [here](https://karafka.io/docs/Pro-Iterator-API/).

## What does `Broker: Invalid message (invalid_msg)` error mean?

If you see the following error in your error tracking system:

```
ERROR -- : Listener fetch loop error: Broker: Invalid message (invalid_msg)
ERROR -- : gems/karafka-rdkafka-0.12.1/lib/rdkafka/consumer.rb:432:in `poll'
ERROR -- : gems/karafka-2.0.41/lib/karafka/connection/client.rb:368:in `poll'
```

It indicates that the broker contains a message that it cannot parse or understand. This error usually occurs when there is a mismatch or inconsistency in the format or structure of the message or when the message is corrupted.

It is advised to check the Kafka logs around the polling time, as it may be a Kafka issue. You may encounter the following or similar errors:

```
org.apache.kafka.common.errors.CorruptRecordException:
  Found record size 0 smaller than minimum record overhead (14)
  in file /var/lib/my_topic-0/00000000000019077350.log.
```

This exception indicates a record has failed its internal CRC check; this generally indicates network or disk corruption.

## Is there an option in Karafka to re-consume all the messages from a topic even though all were already consumed?

Yes.

There are a few ways to do that:

1. Use the [Iterator API](https://karafka.io/docs/Pro-Iterator-API/) to run a one-time job alongside your regular Karafka consumption.
2. Use the `#seek` consumer method in combination with [Admin watermark API](https://karafka.io/docs/Topics-management-and-administration#reading-the-watermark-offsets) to move to the first offset and re-consume all the data.
3. Create a new consumer group that will start from the beginning.

## How can I make sure, that `Karafka.producer` does not block/delay my processing?

To ensure that Karafka.producer does not block or delay your processing, you can utilize the `produce_async` and `produce_many_async`. These methods only block the execution flow if the underlying `librdkafka` queue is full.

By default, if the queue is full, Karafka will enter a backoff state and wait for a specified time before retrying. The `wait_backoff_on_queue_full` and `wait_timeout_on_queue_full` settings in your Karafka configuration file control this behavior. If you want to disable the waiting behavior altogether, you can set the `wait_on_queue_full` option to `false`.

Additionally, you can adjust the `message.timeout.ms` setting in `librdkafka` settings to potentially ignore the delivery handles of dispatched messages. By appropriately setting this value, you can reduce the time spent waiting for delivery confirmation, thus avoiding potential delays in your processing pipeline.

When `wait_on_queue_full` is disabled and the queue becomes full, the producer will raise an exception. It's important to catch and handle this exception appropriately. You can ignore the exception if you don't want it to disrupt the execution flow of your program.

Here's an example of how you can use `produce_async` and handle the exception:

```ruby
begin
  Karafka.producer.produce_async(topic: topic, payload: payload)
rescue Rdkafka::RdkafkaError do |e|
  raise unless e.code == :queue_full
end
```

If you aim for maximum performance in your Karafka application, you can disable metrics collection by setting the `statistics.interval.ms` configuration to `0`. Doing so effectively disables the collection and emission of statistics data. This can be beneficial in scenarios where every bit of performance matters and you want to minimize any overhead caused by metric aggregation. However, it's important to note that disabling metrics collection will also prevent the Karafka Web UI from collecting important information, such as producer errors, including those in background threads. Therefore, consider the trade-off between performance optimization and the loss of detailed error tracking when deciding whether to disable metrics collection.

## Can `at_exit` be used to close the WaterDrop producer?

`at_exit` is a Ruby method that allows you to register a block of code to be executed when the program is about to exit. It can be used for performing cleanup tasks or finalizing resources. However, using `at_exit` to close the WaterDrop producer in Karafka is not recommended.

Instead of relying on `at_exit`, it is generally better to handle the cleanup and proper closing of the WaterDrop producer explicitly in your code. For example, you can use signal handlers from other Ruby libraries like Sidekiq or Puma.

You can read more about this [here](https://karafka.io/docs/Producing-messages/#producer-shutdown).

## Why, when DLQ is used with `max_retries` set to `0`, Karafka also applies a back-off?

Even when no retries are requested, applying a back-off strategy is crucial in maintaining system stability and preventing system overload.

When Karafka encounters an error processing a message, it might be due to a temporary or intermittent issue. Even if retries are not set, the system needs a moment to recover and stabilize after an error before moving on to the next message.

By applying a back-off strategy, Karafka ensures that a pause is introduced between the occurrence of the error and the dispatch of the message to the Dead Letter Queue (DLQ) or the processing of the next message. This brief pause allows the system's resources to recover.
For instance, if the error were due to a sudden spike in CPU usage, the back-off time would give the CPU a chance to cool down. If the error was due to a momentary network issue, the pause allows time for the network to stabilize.

Without the back-off mechanism, even if retries are not requested, Karafka would move on to the next message immediately after an error. If errors are frequent, this could lead to the system getting into a state where it is constantly encountering errors and never getting a chance to recover. This, in turn, could lead to an overload of the system, causing degraded performance or even a complete system crash.

## Can I use `rdkafka` and `karafka-rdkafka` together in the same project?

**No**. `karafka-rdkafka` is a fork of `rdkafka` that includes many stability and performance enhancements while having a compatible API. If you try to use both, they will conflict with each other.

## Does using consumer `#seek` resets the committed offset?

No, using the `#seek` method in a Karafka consumer does not reset the committed offset.

In Karafka, the `#seek` method is used to manually set the position of the next record that should be fetched, i.e., it changes the current position of the consumer. However, it does not affect the committed offset stored in Kafka.

The committed offset is the position of the last record that Kafka will not read again in the event of recovery or failover. 

So, you can think of the position set by `#seek` as a volatile, in-memory value, while the committed offset is a more durable, stored value.

## Is it recommended to use public consumer methods from outside the consumer?

In general, it is not recommended to use public consumer methods from outside the consumer in Karafka.

Karafka is designed to handle the concurrent processing of messages. Directly calling consumer methods from outside the consumer could result in race conditions or other concurrency issues if not done carefully.

The only exception is when you are using Karafka instrumentation API. However, it is still not recommended to invoke any methods or operations that would result in consumer state changes.

## Why do I see `SASL authentication error` after AWS MSK finished the `Heal cluster` operation?

Healing means that Amazon MSK is running an internal operation, like replacing an unhealthy broker. For example, the broker might be unresponsive. During this stage, under certain circumstances, the MSK permissions may be not restored correctly. We recommend that you reassign them back if the problem persists.

## Why Karafka and WaterDrop are behaving differently than `rdkafka`?

1. **`rdkafka-ruby` lack of instrumentation callbacks hooks by default**: By default, `rdkafka` does not include instrumentation callback hooks. This means that it does not publish asynchronous errors unless explicitly configured to do so. On the other hand, Karafka and WaterDrop, provide a unified instrumentation framework that reports errors, even those happening asynchronously, by default.

2. **WaterDrop and Karafka use `karafka-rdkafka`, which is patched and provides specific improvements**: Both WaterDrop and Karafka use a variant of `rdkafka-ruby`, known as `karafka-rdkafka`. This version is patched, meaning it includes improvements and modifications that the standard `rdkafka-ruby` client does not. These patches may offer enhanced performance, additional features, and/or bug fixes that can impact how the two systems behaves.

3. **Different setup conditions**: Comparing different Kafka clients or frameworks can be like comparing apples to oranges if they aren't set up under the same conditions. Factors such as client configuration, Kafka cluster configuration, network latency, message sizes, targeted topics, and batching settings can significantly influence the behavior and performance of Kafka clients. Therefore, when you notice a discrepancy between the behavior of `rdkafka-ruby` and Karafka or WaterDrop, it might be because the conditions they are running under are not identical. To make a fair comparison, ensure that they are configured similarly and are running under the same conditions.

In summary, while `rdkafka-ruby`, Karafka, and WaterDrop all provide ways to interact with Kafka from a Ruby environment, differences in their design, their handling of errors, and the conditions under which they are run can result in different behavior. Always consider these factors when evaluating or troubleshooting these systems.

## Why am I seeing `Inconsistent group protocol` in Karafka logs?

Seeing an `Inconsistent group protocol` message in your Karafka logs indicates a mismatch in the protocol type or version among the members of a Kafka consumer group.

In Kafka, a consumer group consists of one or more consumers that jointly consume data from a topic. These consumers communicate with the Kafka broker and coordinate with each other to consume different partitions of the data. This coordination process is managed using group protocols.

An `Inconsistent group protocol` error typically arises in the following scenarios:

- **Different consumers within the same group are using different protocol types or versions**: Kafka supports several group protocols for consumer coordination, such as range or round-robin. If different consumers within the same group are configured with varying protocols or versions, this inconsistency will cause an error. Make sure all consumers in the group are using the same protocol.

- **A mix of consumers with different session timeouts**: When consumers in a group have different session timeout settings, they may not always be in sync, leading to this error. Ensure all consumers have the same session timeout setting.
Misconfiguration during consumer setup: If you have recently made changes to your consumer setup, you might have inadvertently introduced a configuration that causes this error. Review your configuration changes to ensure consistency.

Consistency in consumer configuration within a group is vital to prevent this error. Review your consumers' settings and configurations to ensure they use the same group protocol, and adjust if necessary.

## What is the difference between WaterDrop's `max_payload_size` and librdkafka's `message.max.bytes`?

WaterDrop's `max_payload_size` and librdkafka's `message.max.bytes` are both settings related to message size in Kafka, but they play distinct roles and operate at different stages.

WaterDrop's `max_payload_size` is a configuration parameter employed for internal validation within the WaterDrop producer library. This setting is used to limit the size of the messages before they're dispatched. If a message exceeds the `max_payload_size`, an error is raised, preventing the dispatch attempt. This setting helps ensure that you don't send messages larger than intended.

On the other hand, librdkafka's `message.max.bytes` configuration is concerned with the Kafka protocol's message size. It represents the maximum permissible size of a message in line with the Kafka protocol, and the librdkafka library validates it. Essentially, it determines the maximum size of a ProduceRequest in Kafka.

It's advisable to align these two settings to maintain consistency between the maximum payload size defined by WaterDrop and the Kafka protocol. To ensure that larger-than-expected messages are not accepted, it's beneficial to set the `max_payload_size` in WaterDrop. And for `message.max.bytes` in librdkafka, you might want to set it to the same value or even higher, bearing in mind its role in the Kafka protocol.

There are a few nuances to be aware of, which are often seen as "edge cases." One notable aspect is that the producer checks the uncompressed size of a message against the `message.max.bytes` setting while the broker validates the compressed size.

Another noteworthy point is that if you set `message.max.bytes` to a low yet acceptable value, it could affect the batching process of librdkafka. Specifically, librdkafka might not be able to build larger message batches, leading to data being sent in much smaller batches, sometimes even as small as a single message. This could consequently limit the throughput.

A detailed discussion on this topic can be found on this GitHub thread: https://github.com/confluentinc/librdkafka/issues/3246. Please note that this discussion remains open, indicating this topic's complexity and continuous exploration.

Lastly, while the term `message.max.bytes` may not be intuitively understandable, its role in managing message size within the Kafka ecosystem is crucial.

## What are consumer groups used for?

Consumer groups in Kafka are used to achieve parallel processing, high throughput, fault tolerance, and scalability in consuming messages from Kafka topics. They enable distributing of the workload among multiple consumers within a group, ensuring efficient processing and uninterrupted operation even in the presence of failures. In general, for 90% of cases, one consumer group is used per Karafka application. Using multiple consumer groups in a single app can be beneficial if you want to consume the same topic multiple times, structure your app for future division into microservices or introduce parallel consumption.

## Why am I getting the `all topic names within a single consumer group must be unique` error?

If you are seeing the following error when starting Karafka:

```
{:topics=>"all topic names within a single consumer group must be unique"}
(Karafka::Errors::InvalidConfigurationError)
```

it indicates that you have duplicate topic names in your configuration of the same consumer group.

In Karafka, each topic within a consumer group should have a unique name. This requirement is in place because each consumer within a consumer group reads from a unique partition of a specific topic. If there are duplicate topic names, then the consumers will not be able to distinguish between these topics.

To solve this issue, you need to ensure that all topic names within a single consumer group in your Karafka configuration are unique.

## Why am I getting `WaterDrop::Errors::ProduceError`, and how can I know the underlying cause?

The specifics of why you're encountering this error will depend on the context of your use of WaterDrop and Kafka. Here are some possible causes:

- Kafka is not running or unreachable: Ensure that Kafka is running and accessible from your application. If your application is running in a different environment (e.g., Docker, a different server, etc.), ensure there are no networking issues preventing communication.

- Invalid configuration: Your WaterDrop and/or Kafka configuration may be incorrect. This could involve things like incorrect broker addresses, authentication details, etc.

- Kafka topic does not exist: If you're trying to produce to a topic that doesn't exist, and if topic auto-creation is not enabled in your Kafka settings, the message production will fail.

- Kafka cluster is overloaded or has insufficient resources: If Kafka is not able to handle the volume of messages being produced, this error may occur.

- Kafka cluster is in a remote location with significant latency: Apache Kafka is designed to handle high-volume real-time data streams with low latency. If your Kafka cluster is located in a geographically distant location from your application or the network connectivity between your application and the Kafka cluster could be better, you may experience high latency. This can cause a variety of issues, including `WaterDrop::Errors::ProduceError`.

- Access Control Lists (ACLs) misconfiguration: ACLs control the permissions for Kafka resources; incorrect configurations might prevent messages from being produced or consumed. To diagnose, verify your Kafka ACLs settings to ensure your producer has the correct permissions for the operations it's trying to perform.

When you receive the `WaterDrop::Errors::ProduceError` error, you can check the underlying cause by invoking the `#cause` method on the received error:

```ruby
error = nil

begin
  Karafka.producer.produce_sync(topic: 'topic', payload: 'payload')
rescue WaterDrop::Errors::ProduceError => e
  error = e
end

puts error.cause

#<Rdkafka::AbstractHandle::WaitTimeoutError: Waiting for delivery timed out after 5 seconds>
```

Please note that in the case of the `WaitTimeoutError`, the message may actually be delivered but in a more extended time because of the network or other issues. Always instrument your producers to ensure that you are notified about errors occurring in Karafka and WaterDrop internal background threads as well.

The exact cause can often be determined by examining the error message and stack trace accompanying the `WaterDrop::Errors::ProduceError`. Also, check the Kafka logs for more information. If the error message or logs aren't clear, you should debug your code or configuration to identify the problem.

## Can extra information be added to the messages dispatched to the DLQ?

**Yes**. Karafka Enhanced DLQ provides the ability to add custom details to any message dispatched to the DLQ. You can read about this feature [here](https://karafka.io/docs/Pro-Enhanced-Dead-Letter-Queue/#adding-custom-details-to-the-dlq-message).

## Why does WaterDrop hang when I attempt to close it?

WaterDrop works so that when the producer is requested to be closed, it triggers a process to flush out all the remaining messages in its buffers. The process is synchronous, meaning that it will hold the termination of the application until all the messages in the buffer are either delivered successfully or evicted from the queue.

If Kafka is down, WaterDrop will still attempt to wait before closing for as long as there is even a single message in the queue. This waiting time is governed by the `message.timeout.ms` setting in the Kafka configuration. This setting determines how long the `librdkafka` library should keep the message in the queue and how long it should retry to deliver it. By default, this is set to 5 minutes.

Effectively, this means that if the Kafka cluster is down, WaterDrop will not terminate or give up on delivering the messages until after this default timeout period of 5 minutes. This ensures maximum efforts are made to deliver the messages even under difficult circumstances.

If a message is eventually evicted from the queue due to unsuccessful delivery, an error is emitted via the `error.occurred` channel in the WaterDrop's instrumentation bus. This allows developers to catch, handle, and log these events, giving them insight into any issues that might be causing message delivery failures.

In summary, the hanging issue you are experiencing when attempting to close WaterDrop is a designed behavior intended to ensure all buffered messages are delivered to Kafka before the client stops, even if the Kafka cluster is temporarily unavailable.

## Why Karafka commits offsets on rebalances and `librdafka` does not?

Why Karafka commits offsets on rebalances and `librdafka` does not?

While Karafka uses `librdkafa` under the hood, they serve slightly purposes and follow different design principles.

Karafka is designed with certain assumptions, such as auto-committing offsets, to simplify its usage for Ruby developers. One of the key decisions is to commit offsets on rebalances and assume that the offset management is done using Kafka itself with optional additional offset storage when needed. The reason behind this is to ensure that messages are processed only once in the case of a group rebalance. By committing offsets on rebalances, Karafka tries to ensure at-least-once delivery. That is, every message will be processed at least once, and no message will be lost, which is a typical requirement in many data processing tasks.

On the other hand, `librdkafka` is a C library that implements the Apache Kafka protocol. It's designed to be more flexible and to offer more control to the user. It doesn't commit offsets on rebalances by default because it gives power to the application developer to decide when and how to commit offsets and where to store them. Depending on the specific requirements of your application, you may want to handle offsets differently.

So the difference between the two libraries is mainly due to their different design principles and target audiences: Karafka is more opinionated and tries to simplify usage for Ruby developers, while `librdkafka` is more flexible and provides more control to the user but at the same time requires much more knowledge and effort.

## What is Karafka's assignment strategy for topics and partitions?

As of Karafka `2.0`, the default assignment strategy is `range`, which means that it attempts to assign partitions contiguously. For instance, if you have ten partitions and two consumers, then the first consumer might be assigned partitions 0-4, and the second consumer would be given partitions 5-9.

The `range` strategy has some advantages over the `round-robin` strategy, where partitions are distributed evenly but not contiguously among consumers.

Since data is often related within the same partition, `range` can keep related data processing within the same consumer, which could lead to benefits like better caching or business logic efficiencies. This can be useful, for example, to join records from two topics with the same number of partitions and the same key-partitioning logic.

The assignment strategy is not a one-size-fits-all solution and can be changed based on the specific use case. If you want to change the assignment strategy in Karafka, you can set the `partition.assignment.strategy` configuration value to either `range`, `roundrobin` or `cooperative-sticky`. It's important to consider your particular use case, the number of consumers, and the nature of your data when choosing your assignment strategy.

## Why can't I see the assignment strategy/protocol for some Karafka consumer groups?

The assignment strategy or protocol for a Karafka consumer group might not be visible if a topic is empty, no data has been consumed, and no offsets were stored. These conditions indicate that no data has been produced to the topic and no consumer group has read any data, leaving no record of consumed data.

In such cases, Kafka doesn't have any information to establish an assignment strategy. Hence, it remains invisible until data is produced, consumed, and offsets are committed.

## What can be done to log why the `produce_sync` has failed?

WaterDrop allows you to listen to all errors that occur while producing messages and in its internal background threads. Things like reconnecting to Kafka upon network errors and others unrelated to publishing messages are all available under error.occurred notification key. You can subscribe to this event to ensure your setup is healthy and without any problems that would otherwise go unnoticed as long as messages are delivered:

```ruby
Karafka.producer.monitor.subscribe('error.occurred') do |event|
  error = event[:error]

  p "WaterDrop error occurred: #{error}"
end

# Run this code without Kafka cluster
loop do
  Karafka.producer.produce_async(topic: 'events', payload: 'data')

  sleep(1)
end

# After you stop your Kafka cluster, you will see a lot of those:
#
# WaterDrop error occurred: Local: Broker transport failure (transport)
#
# WaterDrop error occurred: Local: Broker transport failure (transport)
```

It is also recommended to check if the standard `LoggerListener` is enabled for the producer in your `karafka.rb`:

```ruby
Karafka.producer.monitor.subscribe(
  WaterDrop::Instrumentation::LoggerListener.new(Karafka.logger)
)
```

**Note**: `error.occurred` will also include any errors originating from `librdkafka` for synchronous operations, including those that are raised back to the end user.

## Can I password-protect Karafka Web UI?

**Yes**, you can password-protect the Karafka Web UI, and it is highly recommended. Adding a layer of password protection adds a level of security to the interface, reducing the risk of unauthorized access to your data, configurations, and system settings.

Karafka provides ways to implement password protection, and you can find detailed steps and guidelines [here](https://karafka.io/docs/Web-UI-Getting-Started/#authentication).

## Can I use a Karafka producer without setting up a consumer?

Yes, it's possible to use a Karafka producer without a consumer in two ways:

1. You can use [WaterDrop](https://github.com/karafka/waterdrop), a standalone Karafka component for producing Kafka messages. WaterDrop was explicitly designed for use cases where only message production is required, with no need for consumption.

2. Alternatively, if you have Karafka already in your application, avoid running the `karafka server` command, as it won't make sense without any topics to consume. You can run other processes and produce messages from them. In scenarios like that, there is no need to define any routes. `Karafka#producer` should operate without any problems.

Remember, if you're using Karafka without a consumer and encounter errors, ensure your consumer is set to inactive (active false), and refrain from running commands that necessitate a consumer, such as karafka server.

## What will happen when a message is dispatched to a dead letter queue topic that does not exist?

When a message is dispatched to a [dead letter queue](https://karafka.io/docs/Dead-Letter-Queue/) (DLQ) topic that does not exist in Apache Kafka, the behavior largely depends on the `auto.create.topics.enable` Kafka configuration setting and the permissions of the Kafka broker. If `auto.create.topics.enable` is `true`, Kafka will automatically create the non-existent DLQ topic with one partition using the broker's default configurations, and the message will then be stored in the new topic.

On the other hand, if `auto.create.topics.enable` is set to `false`, Kafka will not auto-create the topic, and instead, an error will be raised when trying to produce to the non-existent DLQ topic. This error could be a topic authorization exception if the client doesn't have permission to create topics or `unknown_topic_or_part` if the topic doesn't exist and auto-creation is disabled. 

Note that in production environments, `auto.create.topics.enable` is often set to `false` to prevent unintended topic creation.

For effective management of DLQs in Kafka, we recommend using Karafka's [Declarative Topics](https://karafka.io/docs/Topics-management-and-administration/#declarative-topics), where you declare your topics in your code. This gives you more control over the specifics of each topic, such as the number of partitions and replication factors, and helps you avoid unintended topic creation. It also aids in efficiently managing and monitoring DLQs in your Kafka ecosystem.

Below you can find an example routing that includes a DLQ declaration as well as a declarative definition of the target DLQ topic:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic 'events' do
      config(
        partitions: 6,
        replication_factor: 3,
        'retention.ms': 31 * 86_400_000 # 31 days in ms,
        'cleanup.policy': 'delete'
      )

      consumer EventsConsumer

      dead_letter_queue(
        topic: 'dlq',
        max_retries: 2
      )
    end

    topic 'dlq' do
      config(
        partitions: 2,
        replication_factor: 2,
        'retention.ms': 31 * 86_400_000 # 31 days in ms,
      )

      # Set to false because of no automatic DLQ handling
      active false
    end
  end
end
```

## Why do Karafka reports lag when processes are not overloaded and consume data in real-time?

Kafka's consumer lag, which is the delay between a message being written into a Kafka topic and being consumed, is dictated not only by the performance of your consumers but also by how messages are marked as consumed in Kafka. This process of marking messages as consumed is done by committing offsets.

After processing each message or batch, consumers can commit the offset of messages that have been processed, to Kafka, to mark them as consumed. So, Kafka considers the highest offset that a consumer group has committed for a partition as the current position of the consumer group in that partition.

Now, if we look at Karafka, it follows a similar mechanism. In Karafka, by default, offsets are committed automatically in batches after a batch of messages is processed. That means if a batch is still being processed, the messages from that batch are not marked as consumed, even if some of them have already been processed, and hence those messages will still be considered as part of the consumer lag.

This lag will grow with incoming messages, which is why it's not uncommon to see a lag of the size of one or two batches, especially in topics with high data traffic.

To mitigate this situation, you can configure Karafka to prioritize latency over throughput. That means making Karafka commit offsets more frequently, even after each message, to decrease the lag and to fetch data more frequently in smaller batches. But keep in mind that committing offsets more frequently comes with the cost of reduced throughput, as each offset commit is a network call and can slow down the rate at which messages are consumed.

You can adjust this balance between latency and throughput according to your specific use case and the performance characteristics of your Kafka cluster. You could increase the frequency of committing offsets during peak load times and decrease it during off-peak times if it suits your workload pattern.

## Does Kafka guarantee message processing orders within a single partition for single or multiple topics? And does this mean Kafka topics consumption run on a single thread?

Yes, within Kafka, the order of message processing is guaranteed for messages within a single partition, irrespective of whether you're dealing with one or multiple topics. However, this doesn't imply that all Kafka topics run on a single thread. In contrast, Karafka allows for multithreaded processing of topics, making it possible to process multiple topics or partitions concurrently. In some cases, you can even process data from one topic partition concurrently.

## Why can I produce messages to my local Kafka docker instance but cannot consume?

There are several potential reasons why you can produce messages to your local Kafka Docker instance but cannot consume them. Here are some of the common issues and how to resolve them:

1. **Network Issues**: Docker's networking can cause problems if not configured correctly. Make sure your Kafka and Zookeeper instances can communicate with each other. Use the docker inspect command to examine the network settings of your containers.

2. **Configuration Errors**: Incorrect settings in Kafka configuration files, such as the `server.properties` file, could lead to this issue. Make sure that you've configured things like the `advertised.listeners` property correctly.

3. **Incorrect Consumer Group**: If you're consuming messages from a topic that a different consumer has already consumed in the same group, you won't see any messages. Kafka uses consumer groups to manage which messages have been consumed. You should use a new group or reset the offset of the existing group.

4. **Security Protocols**: If you've set up your Kafka instance with security protocols like SSL/TLS or SASL, you'll need to ensure that your consumer is correctly configured to use these protocols.

5. **Offset Issue**: The consumer might be reading from an offset where no messages exist. This often happens if the offset is set to the latest, but the messages were produced before the consumer started. Try consuming from the earliest offset to see if this resolves the issue.

6. **Zookeeper Connection Issue**: Sometimes, the issue could be a faulty connection between Kafka and Zookeeper. Ensure that your Zookeeper instance is running without issues.

Remember, these issues are common, so don't worry if you face them. Persistence and careful debugging are key in these situations.

If you're looking for a Kafka setup that doesn't require Zookeeper, consider using KRaft (KRaft is short for Kafka Raft mode), a mode in which Kafka operates in a self-managed way without Zookeeper. This new mode introduced in Kafka `2.8.0` allows you to reduce the operational complexity by eliminating the Zookeeper dependency.

## What is the release schedule for Karafka and its components?

Karafka and Karafka Pro do not follow a fixed official release schedule. Instead:

- Releases containing breaking changes are rolled out once they are fully documented, and migration guides are prepared.

- New features are released as soon as they are ready and thoroughly documented.

- Bug fixes that don't involve API changes are released immediately.

We prioritize bugs and critical performance improvements to ensure optimal user experience and software performance. It's worth noting that most bugs are identified, reproduced, and fixed within seven days from the initial report acknowledgment.

## Can I pass custom parameters during consumer initialization?

**No**. In Karafka, consumers are typically created within the standard lifecycle of Kafka operations, after messages are polled but before they are consumed. This creation happens in the listener loop before work is delegated to the workers' queue.

- You have the flexibility to modify the `#initialize` method. However, there are some nuances to note:

- You can redefine the `#initialize` but not define it with arguments, i.e., `def initialize(args)` is not allowed.

- If you redefine `#initialize`, you **need** to call `super`.

- While you can perform actions during initialization, be cautious not to overload this phase with heavy tasks or large resource loads like extensive caches. This is because the initialization happens in the listener loop thread, and any extensive process here could block message consumption.

- If there's a minor delay (a few seconds) during initialization, it's acceptable.

Furthermore, with no arguments in the initialize method, this API structure is designed for your customization, and there are no plans to change this in the foreseeable future.

## Where can I find producer idempotence settings?

They are located in the WaterDrop wiki [idempotence section](https://github.com/karafka/waterdrop#idempotence).

## How can I control or limit the number of PostgreSQL database connections when using Karafka?

Karafka, by itself, does not manage PostgreSQL or any other database connections directly. More details about that are available [here](https://karafka.io/docs/Concurrency-and-multithreading/#database-connections-usage).

## Why is my Karafka application consuming more memory than expected?

Several factors may lead to increased memory consumption:

- **Large Payloads**: Handling large message payloads can inherently consume more memory. Remember that Karafka will keep the raw payload alongside newly deserialized information after the message is deserialized.

- **Batch Processing**: This can accumulate memory usage if you're processing large batches containing bigger messages.

- **Memory Leaks**: There might be memory leaks in your application or the libraries you use.

If your problems originate from batch and message sizes, we recommend looking into our [Pro Cleaner API](https://karafka.io/docs/Pro-Cleaner-API/).

## How can I optimize memory usage in Karafka?

- **Use Cleaner API**: The [Cleaner API](https://karafka.io/docs/Pro-Cleaner-API), a part of Karafka Pro, provides a powerful mechanism to release memory used by message payloads once processed. This becomes particularly beneficial for 10KB or larger payloads, yielding considerable memory savings and ensuring a steadier memory usage pattern.

- **Adjust `librdkafka` Memory Settings**: The underlying library, `librdkafka`, has configurations related to memory usage. Tuning these settings according to your application's needs can optimize the memory footprint. Amongst others you may be interested in looking into the following settings: `fetch.message.max.bytes`, `queued.min.messages`, `queued.max.messages.kbytes` and `receive.message.max.bytes`

- **Modify the `max_messages` Value**: By adjusting the `max_messages` setting to a lower value, you can control the number of messages deserialized in a batch. Smaller batches mean less memory consumption at a given time, although it might mean more frequent fetch operations. Ensure that you balance memory usage with processing efficiency while adjusting this value.

While tuning these settings can help optimize memory usage, it's essential to remember that it may also influence performance, latency, and other operational aspects of your Karafka applications. Balancing the memory and performance trade-offs based on specific application needs is crucial. Always monitor the impacts of changes and adjust accordingly.

## Why am I getting `No such file or directory - ps (Errno::ENOENT)` from the Web UI?

If you are seeing the following error:

```bash
INFO pid=1 tid=gl9 Running Karafka 2.2.0 server
#<Thread:0x0000aaab008cc9d0 karafka-2.2.0/lib/karafka/helpers/async.rb:25 run>
# terminated with exception (report_on_exception is true):
Traceback (most recent call last):
17: lib/karafka/helpers/async.rb:28:in `block in async_call'
16: lib/karafka/connection/listener.rb:48:in `call'
15: lib/karafka/core/monitoring/monitor.rb:34:in `instrument'
14: lib/karafka/core/monitoring/notifications.rb:101:in `instrument'
13: lib/karafka/core/monitoring/notifications.rb:101:in `each'
12: lib/karafka/core/monitoring/notifications.rb:105:in `block in instrument'
11: lib/karafka/web/tracking/consumers/listeners/status.rb:18:in \
  `on_connection_listener_before_fetch_loop'
10: lib/forwardable.rb:238:in `report'
 9: lib/karafka/web/tracking/consumers/reporter.rb:35:in `report'
 8: lib/karafka/web/tracking/consumers/reporter.rb:35:in `synchronize'
 7: lib/karafka/web/tracking/consumers/reporter.rb:45:in `block in report'
 6: lib/karafka/web/tracking/consumers/sampler.rb:68:in `to_report'
 5: lib/karafka/web/tracking/consumers/sampler.rb:163:in `memory_total_usage'
 4: lib/karafka/web/tracking/memoized_shell.rb:32:in `call'
 3: open3.rb:342:in `capture2'
 2: open3.rb:159:in `popen2'
 1: open3.rb:213:in `popen_run'
/usr/lib/ruby/2.7.0/open3.rb:213:in `spawn': No such file or directory - ps (Errno::ENOENT)
```

it typically indicates that the Karafka Web UI is trying to execute the `ps` command but the system cannot locate it. This can occur for a few reasons:

- **The Command is Not Installed**: The required command (`ps` in this instance) may not be installed on your system. This is less likely if you are on a standard Linux or macOS setup because `ps` is usually a default command. However, minimal Docker images or other restricted environments might not have these common utilities by default.

- **PATH Environment Variable**: The environment in which your Web UI runs might need to set its PATH variable up correctly to include the directory where the `ps` command resides.

- **Restricted Permissions**: It could be a permission issue. The process/user running the Web UI may not have the necessary permissions to execute the `ps` command.

Please ensure you have **all** the Karafka Web UI required OS commands installed and executable. A complete list of the OS dependencies can be found [here](https://karafka.io/docs/Web-UI-Getting-Started/#external-shellos-required-commands).

## Can I retrieve all records produced in a single topic using Karafka?

Yes, you can consume all records from a specific topic in Karafka by setting up a new consumer for that topic or using the [Iterator API](https://karafka.io/docs/Pro-Iterator-API). 

If your primary aim is to get the count of messages, you might have to maintain a counter as you consume the messages.

If you are performing a one-time operation of that nature, Iterator API will be much better:

```ruby
iterator = Karafka::Pro::Iterator.new('my_topic_name')

i = 0
iterator.each do
  puts i+= 1
end
```

## How can I get the total number of messages in a topic?

Getting the exact number of messages in a Kafka topic is more complicated due to the nature of Kafka's distributed log system and features such as log compaction. However, there are a few methods you can use:

1. Using the `Karafa::Admin#read_watermark_offsets` to get offsets for each partition and summing them:

```ruby
Karafka::Admin
  .cluster_info
  .topics
  .find { |top| top[:topic_name] == 'my_topic_name' }
  .then { |topic| topic.fetch(:partitions) }
  .size
  .times
  .sum do |partition_id|
    offsets = Karafka::Admin.read_watermark_offsets('my_topic_name', partition_id)
    offsets.last - offsets.first
  end
```

2. Using the [Iterator API](https://karafka.io/docs/Pro-Iterator-API/) and counting all the messages:

```ruby
iterator = Karafka::Pro::Iterator.new('my_topic_name')

i = 0
iterator.each do
  puts i+= 1
end
```

The first approach offers rapid results, especially for topics with substantial messages. However, its accuracy may be compromised by factors such as log compaction. Conversely, the second method promises greater precision, but it's important to note that it could necessitate extensive data transfer and potentially operate at a reduced speed.

## Why am I getting `Broker: Group authorization failed (group_authorization_failed)` when using Admin API or the Web UI?

If you are seeing the following error

```bash
Broker: Group authorization failed (group_authorization_failed)
```

it most likely arises when there's an authorization issue related to the consumer group in your Kafka setup. This error indicates the lack of the necessary permissions for the consumer group to perform certain operations.

When using the Admin API or the Web UI in the context of Karafka, you are operating under the consumer group named `CLIENT_ID_karafka_admin` where the `CLIENT_ID` value equals `config.client_id`. Assuming your `client_id` is set to `my_app`, the full name of the consumer group will be `my_app_karafka_admin`.

Please review and update your Kafka ACLs or broker configurations to ensure this group has all the permissions it needs.

## Why am I getting an `ArgumentError: undefined class/module YAML::Syck` when trying to install `karafka-license`?

The error `ArgumentError: undefined class/module YAML::Syck` you're seeing when trying to install `karafka-license` is not directly related to the `karafka-license` gem. It's important to note that `karafka-license` does not serialize data using `YAML::Syck`.

Instead, this error is a manifestation of a known bug within the Bundler and the Ruby gems ecosystem. During the installation of `karafka-license`, other gems may also be installed or rebuilt, triggering this issue.

To address and potentially resolve this problem, you can update your system gems to the most recent version, which doesn't have this bug. You can do this by running:
```bash
gem update --system
```

Once you've done this, attempt to install the `karafka-license` gem again. If the problem persists, please get in touch with us.
