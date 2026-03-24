1. [Why am I seeing `Rdkafka::RdkafkaError (Local: Timed out (timed_out)` error when producing larger quantities of messages?](#why-am-i-seeing-rdkafkardkafkaerror-local-timed-out-timed_out-error-when-producing-larger-quantities-of-messages)
1. [Can I use several producers with different configurations with Karafka?](#can-i-use-several-producers-with-different-configurations-with-karafka)
1. [Is there a way to run Karafka in a producer-only mode?](#is-there-a-way-to-run-karafka-in-a-producer-only-mode)
1. [Why am I getting the `can't alloc thread (ThreadError)` error from the producer?](#why-am-i-getting-the-cant-alloc-thread-threaderror-error-from-the-producer)
1. [Can I intercept WaterDrop messages in tests?](#can-i-intercept-waterdrop-messages-in-tests)
1. [What is the difference between `partition_key` and `key` in the WaterDrop gem?](#what-is-the-difference-between-partition_key-and-key-in-the-waterdrop-gem)
1. [How can I make sure, that `Karafka.producer` does not block/delay my processing?](#how-can-i-make-sure-that-karafkaproducer-does-not-blockdelay-my-processing)
1. [Can `at_exit` be used to close the WaterDrop producer?](#can-at_exit-be-used-to-close-the-waterdrop-producer)
1. [What is the difference between WaterDrop's `max_payload_size` and librdkafka's `message.max.bytes`?](#what-is-the-difference-between-waterdrops-max_payload_size-and-librdkafkas-messagemaxbytes)
1. [Why am I getting `WaterDrop::Errors::ProduceError`, and how can I know the underlying cause?](#why-am-i-getting-waterdroperrorsproduceerror-and-how-can-i-know-the-underlying-cause)
1. [Why does WaterDrop hang when I attempt to close it?](#why-does-waterdrop-hang-when-i-attempt-to-close-it)
1. [What can be done to log why the `produce_sync` has failed?](#what-can-be-done-to-log-why-the-produce_sync-has-failed)
1. [Can I use a Karafka producer without setting up a consumer?](#can-i-use-a-karafka-producer-without-setting-up-a-consumer)
1. [Where can I find producer idempotence settings?](#where-can-i-find-producer-idempotence-settings)
1. [Can I use `Karafka.producer` to produce messages that will then be consumed by ActiveJob jobs?](#can-i-use-karafkaproducer-to-produce-messages-that-will-then-be-consumed-by-activejob-jobs)
1. [Can I use `Karafka.producer` from within ActiveJob jobs running in the karafka server?](#can-i-use-karafkaproducer-from-within-activejob-jobs-running-in-the-karafka-server)
1. [Do you recommend using the singleton producer in Karafka for all apps/consumers/jobs in a system?](#do-you-recommend-using-the-singleton-producer-in-karafka-for-all-appsconsumersjobs-in-a-system)
1. [Is it acceptable to declare short-living producers in each app/jobs as needed?](#is-it-acceptable-to-declare-short-living-producers-in-each-appjobs-as-needed)
1. [What are the consequences if you call a `#produce_async` and immediately close the producer afterward?](#what-are-the-consequences-if-you-call-a-produce_async-and-immediately-close-the-producer-afterward)
1. [Is it problematic if a developer creates a new producer, calls `#produce_async`, and then closes the producer whenever they need to send a message?](#is-it-problematic-if-a-developer-creates-a-new-producer-calls-produce_async-and-then-closes-the-producer-whenever-they-need-to-send-a-message)
1. [Could the async process remain open somewhere, even after the producer has been closed?](#could-the-async-process-remain-open-somewhere-even-after-the-producer-has-been-closed)
1. [Could a single producer be saturated, and if so, what kind of max rate of message production would be the limit?](#could-a-single-producer-be-saturated-and-if-so-what-kind-of-max-rate-of-message-production-would-be-the-limit)
1. [How does the batching process in WaterDrop works?](#how-does-the-batching-process-in-waterdrop-works)
1. [Can you control the batching process in WaterDrop?](#can-you-control-the-batching-process-in-waterdrop)
1. [How can I namespace messages for producing in Karafka?](#how-can-i-namespace-messages-for-producing-in-karafka)
1. [Does librdkafka queue messages when using Waterdrop's `#produce_sync` method?](#does-librdkafka-queue-messages-when-using-waterdrops-produce_sync-method)
1. [How reliable is the Waterdrop async produce? Will messages be recovered if the Karafka process dies before producing the message?](#how-reliable-is-the-waterdrop-async-produce-will-messages-be-recovered-if-the-karafka-process-dies-before-producing-the-message)
1. [Will WaterDrop start dropping messages upon librdkafka buffer overflow?](#will-waterdrop-start-dropping-messages-upon-librdkafka-buffer-overflow)
1. [Is there any way to measure message sizes post-compression in Waterdrop?](#is-there-any-way-to-measure-message-sizes-post-compression-in-waterdrop)
1. [What are some good default settings for sending large "trace" batches of messages for load testing?](#what-are-some-good-default-settings-for-sending-large-trace-batches-of-messages-for-load-testing)
1. [Is it worth pursuing transactions for a low throughput but high-importance topic?](#is-it-worth-pursuing-transactions-for-a-low-throughput-but-high-importance-topic)
1. [Does the Waterdrop producer retry to deliver messages after errors such as `librdkafka.error` and `librdkafka.dispatch_error`, or are the messages lost?](#does-the-waterdrop-producer-retry-to-deliver-messages-after-errors-such-as-librdkafkaerror-and-librdkafkadispatch_error-or-are-the-messages-lost)
1. [In a Rails request, can I publish a message asynchronously, continue the request, and block at the end to wait for the publish to finish?](#in-a-rails-request-can-i-publish-a-message-asynchronously-continue-the-request-and-block-at-the-end-to-wait-for-the-publish-to-finish)
1. [Why do I see WaterDrop error events but no raised exceptions in sync producer?](#why-do-i-see-waterdrop-error-events-but-no-raised-exceptions-in-sync-producer)
1. [What's the difference between `key` and `partition_key` in WaterDrop?](#whats-the-difference-between-key-and-partition_key-in-waterdrop)
1. [How can I distinguish between sync and async producer errors in the `error.occurred` notification?](#how-can-i-distinguish-between-sync-and-async-producer-errors-in-the-erroroccurred-notification)
1. [How do I produce messages to a secondary Kafka cluster?](#how-do-i-produce-messages-to-a-secondary-kafka-cluster)

---

## Why am I seeing `Rdkafka::RdkafkaError (Local: Timed out (timed_out)` error when producing larger quantities of messages?

If you are seeing following error:

```ruby
Rdkafka::RdkafkaError (Local: Timed out (timed_out)
```

It may mean one of four things:

1. High probability: Broker can't keep up with the produce rate.
1. High probability if you use `partition_key`: Broker is temporarily overloaded and cannot return info about the topic structure. A retry mechanism has been implemented in WaterDrop `2.4.4` to mitigate this.
1. Low probability: Slow network connection.
1. Low probability: SSL configuration issue. In this case, no messages would reach the broker.

WaterDrop dispatches messages to `librdkafka` and `librdkafka` constructs message sets out of it. By default, it does it every five milliseconds. If you are producing messages fast, it may become inefficient for Kafka because it has to deal with separate incoming message sets and needs to keep up. Please consider increasing the `queue.buffering.max.ms`, so the batches are constructed less often and are bigger.

Additionally, you may also:

- Dispatch smaller batches using `#produce_many_sync`.Effectively it will throttle the process that way.
- Establish a limit on how many messages you want to dispatch at once. This will prevent you from scenarios where you accidentally flush too much. If you dispatch based on an array of samples, you can do it that way:

```ruby
data_to_dispatch.each_slice(2_00) do |data_slice|
  Karafka.producer.produce_many_sync(data_slice)
end
```

## Can I use several producers with different configurations with Karafka?

**Yes**. You can create as many producers as you want using [WaterDrop API](WaterDrop-Getting-Started) directly:

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
1. Producers should be closed before the process shutdown to ensure proper resource finalization.
1. You need to instrument each producer using the WaterDrop instrumentation API.
1. Karafka itself uses the `Karafka#producer` internal reasons such as error tracking, DLQ dispatches, and more. This means that the default producer instance should be configured to operate within the scope of Karafka's internal functionalities.

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

You can read more about producer shutdown [here](Basics-Producing-Messages#producer-shutdown).

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

## What is the difference between `partition_key` and `key` in the WaterDrop gem?

In the WaterDrop gem, `partition_key` and `key` are two distinct options that can be used to set message keys, but they have different purposes and work slightly differently.

- `partition_key` is used to determine the partition to which a message is sent and computes the destination partition in the Ruby process using the configured `partitioner` algorithm. The partitioner calculates a hash value based on the partition_key value and uses this hash value to select a partition for the message.
- `key` is an optional property that can be set for a message. The Kafka broker uses the message key for log compaction, which ensures that only the latest message for a specific key is retained in the topic. Unless partition is explicitly provided via `partition` or `partition_key`, the `key` value will also be used for partition assignment.

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

You can read more about this [here](Basics-Producing-Messages#producer-shutdown).

## What is the difference between WaterDrop's `max_payload_size` and librdkafka's `message.max.bytes`?

WaterDrop's `max_payload_size` and librdkafka's `message.max.bytes` are both settings related to message size in Kafka, but they play distinct roles and operate at different stages.

WaterDrop's `max_payload_size` is a configuration parameter employed for internal validation within the WaterDrop producer library. This setting is used to limit the size of the messages before they're dispatched. If a message exceeds the `max_payload_size`, an error is raised, preventing the dispatch attempt. This setting helps ensure that you don't send messages larger than intended.

On the other hand, librdkafka's `message.max.bytes` configuration is concerned with the Kafka protocol's message size. It represents the maximum permissible size of a message in line with the Kafka protocol, and the librdkafka library validates it. Essentially, it determines the maximum size of a ProduceRequest in Kafka.

It's advisable to align these two settings to maintain consistency between the maximum payload size defined by WaterDrop and the Kafka protocol. To ensure that larger-than-expected messages are not accepted, it's beneficial to set the `max_payload_size` in WaterDrop. And for `message.max.bytes` in librdkafka, you might want to set it to the same value or even higher, bearing in mind its role in the Kafka protocol.

There are a few nuances to be aware of, which are often seen as "edge cases." One notable aspect is that the producer checks the uncompressed size of a message against the `message.max.bytes` setting while the broker validates the compressed size.

Another noteworthy point is that if you set `message.max.bytes` to a low yet acceptable value, it could affect the batching process of librdkafka. Specifically, librdkafka might not be able to build larger message batches, leading to data being sent in much smaller batches, sometimes even as small as a single message. This could consequently limit the throughput.

A detailed discussion on this topic can be found on this [GitHub thread](https://github.com/confluentinc/librdkafka/issues/3246). Please note that this discussion remains open, indicating this topic's complexity and continuous exploration.

Lastly, while the term `message.max.bytes` may not be intuitively understandable, its role in managing message size within the Kafka ecosystem is crucial.

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

If you're having trouble sending messages, a good debugging step is to set up a new producer with a shorter `message.timeout.ms` kafka setting. This means `librdkafka` won't keep retrying for long, and you'll see the main issue faster.

```ruby
# Create a producer configuration based on the Karafka one
producer_kafka_cfg = ::Karafka::Setup::AttributesMap.producer(
  Karafka::App.config.kafka.dup
)

# Set the message timeout to five seconds to get the underlying error fast
producer_kafka_cfg[:'message.timeout.ms'] = 5_000

# Build a producer
producer = ::WaterDrop::Producer.new do |p_config|
  p_config.kafka = producer_kafka_cfg
  p_config.logger = Karafka::App.config.logger
end

# Print all async errors details
producer.monitor.subscribe('error.occurred') do |event|
  p event
  p event[:error]
end

# Try to dispatch message to the topic with which you have problem
#
# Please note, that we use `#produce_async` here and wait.
# That's because we do not want to crash the execution but instead wait on
# the async error to appear.
producer.produce_async(
  topic: 'problematic_topic',
  payload: 'test'
)

# Wait for the async error (if any)
# librdkafka will give up after 5 seconds, so this should be more than enough
sleep(30)
```

## Why does WaterDrop hang when I attempt to close it?

WaterDrop works so that when the producer is requested to be closed, it triggers a process to flush out all the remaining messages in its buffers. The process is synchronous, meaning that it will hold the termination of the application until all the messages in the buffer are either delivered successfully or evicted from the queue.

If Kafka is down, WaterDrop will still attempt to wait before closing for as long as there is even a single message in the queue. This waiting time is governed by the `message.timeout.ms` setting in the Kafka configuration. This setting determines how long the `librdkafka` library should keep the message in the queue and how long it should retry to deliver it. By default, this is set to 5 minutes.

Effectively, this means that if the Kafka cluster is down, WaterDrop will not terminate or give up on delivering the messages until after this default timeout period of 5 minutes. This ensures maximum efforts are made to deliver the messages even under difficult circumstances.

If a message is eventually evicted from the queue due to unsuccessful delivery, an error is emitted via the `error.occurred` channel in the WaterDrop's instrumentation bus. This allows developers to catch, handle, and log these events, giving them insight into any issues that might be causing message delivery failures.

In summary, the hanging issue you are experiencing when attempting to close WaterDrop is a designed behavior intended to ensure all buffered messages are delivered to Kafka before the client stops, even if the Kafka cluster is temporarily unavailable.

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

!!! note

    `error.occurred` will also include any errors originating from `librdkafka` for synchronous operations, including those that are raised back to the end user.

## Can I use a Karafka producer without setting up a consumer?

Yes, it's possible to use a Karafka producer without a consumer in two ways:

1. You can use WaterDrop, a standalone Karafka component for producing Kafka messages. WaterDrop was explicitly designed for use cases where only message production is required, with no need for consumption.

1. Alternatively, if you have Karafka already in your application, avoid running the `karafka server` command, as it won't make sense without any topics to consume. You can run other processes and produce messages from them. In scenarios like that, there is no need to define any routes. `Karafka#producer` should operate without any problems.

Remember, if you're using Karafka without a consumer and encounter errors, ensure your consumer is set to inactive (active false), and refrain from running commands that necessitate a consumer, such as karafka server.

## Where can I find producer idempotence settings?

They are located in the WaterDrop wiki [idempotence section](WaterDrop-Configuration#idempotence).

## Can I use `Karafka.producer` to produce messages that will then be consumed by ActiveJob jobs?

You cannot use `Karafka#producer` to produce messages that will then be consumed by ActiveJob jobs. The reason is that when integrating ActiveJob with Karafka, you should use ActiveJob's scheduling API, specifically `Job.perform_later`, and not the Karafka producer methods.

Attempting to use the Karafka producer to send messages for ActiveJob consumption results in mismatches and errors. Karafka's ActiveJob integration has its way of handling messages internally, and how those messages look and what is being sent is abstracted away from the developer. The developer's responsibility is to stick with the ActiveJob APIs.

When you want to consume a message produced by an external source, it is not the domain of ActiveJob anymore. That would be regular Karafka consuming, which is different from job scheduling and execution with ActiveJob.

## Can I use `Karafka.producer` from within ActiveJob jobs running in the karafka server?

**Yes**, any ActiveJob job running in the karafka server can access and use the `Karafka.producer`.

## Do you recommend using the singleton producer in Karafka for all apps/consumers/jobs in a system?

Yes, unless you use transactions. In that case, you can use a connection pool. Using a long-living pool is fine.

## Is it acceptable to declare short-living producers in each app/jobs as needed?

It's not recommended to have a short-lived producer or per job class (e.g., 20 job classes and 20 producers). Instead, create producers that vary with usage or settings, not per class.

## What are the consequences if you call a `#produce_async` and immediately close the producer afterward?

No consequences. WaterDrop will wait until it is delivered because it knows the internal queue state.

## Is it problematic if a developer creates a new producer, calls `#produce_async`, and then closes the producer whenever they need to send a message?

**Yes**, this is problematic. WaterDrop producers are designed to be long-lived. Creating short-lived Kafka connections can be expensive.

## Could the async process remain open somewhere, even after the producer has been closed?

No.

## Could a single producer be saturated, and if so, what kind of max rate of message production would be the limit?

This depends on factors like your cluster, number of topics, number of partitions, and how and where you send the messages. However, you can get up to 100k messages per second from a single producer instance.

## How does the batching process in WaterDrop works?

Waterdrop and librdkafka batch messages under the hood and dispatch in groups. There's an internal queue limit you can set. If exceeded, a backoff will occur.

## Can you control the batching process in WaterDrop?

It auto-batches the requests. If the queue is full, a throttle will kick in. You can also configure WaterDrop to wait on queue full errors. The general approach is to dispatch in batches (or in transactions) and wait on batches or finalize a transaction.

## How can I namespace messages for producing in Karafka?

You can namespace messages topics for producing automatically in Karafka by leveraging the [middleware in WaterDrop](WaterDrop-Middleware) to transform the destination topics.

## Does librdkafka queue messages when using Waterdrop's `#produce_sync` method?

Yes, librdkafka does queue messages internally. Even when WaterDrop does not use additional queues to accumulate messages before passing them to librdkafka, librdkafka maintains an internal queue. This queue is used to build message batches that are dispatched to the appropriate brokers.

By default, librdkafka flushes this internal queue every `5` milliseconds. This means that when you call `#produce_sync`, the message is moved to librdkafka's internal queue, flushed within this 5ms window. The synchronous produce call waits for the result of this flush.

Waterdrop also manages buffer overflows for this internal queue in synchronous and asynchronous modes. Depending on the Waterdrop configuration, it will handle retries appropriately in case of overflows or raise an error.

## How reliable is the Waterdrop async produce? Will messages be recovered if the Karafka process dies before producing the message?

The Waterdrop async produce is not reliable in terms of message recovery if the Karafka process dies before producing the message. If the process is killed while a message is being sent to Kafka, the message will be lost. This applies to both asynchronous and synchronous message production. This, however, is not specific to Kafka. SQL database transactions in the middle of being sent will also be interrupted, as will any other type of communication that did not finish.

For improved performance and reliability, you might want to consider using the Karafka transactional producer. This feature can enhance the efficiency and robustness of your message production workflow.

## Will WaterDrop start dropping messages upon librdkafka buffer overflow?

By default, WaterDrop will not drop messages when the librdkafka buffer overflows. Instead, it has a built-in mechanism to handle such situations by backing off and retrying the message production.

When WaterDrop detects that the librdkafka queue is full, an exception will not be immediately raised. Instead, it waits for a specified amount of time before attempting to resend the message. This backoff period allows librdkafka to dispatch previously buffered messages, freeing up space in the queue. During this waiting period, an error is logged in the `error.occurred` notification pipeline. While this error is recoverable, frequent occurrences might indicate underlying issues that need to be addressed.

If the queue remains full even after the backoff period, WaterDrop will continue to retry sending the message until there is enough space. This retry mechanism ensures that messages are not lost.

This behavior can be aligned by changing appropriate configuration settings.

## Is there any way to measure message sizes post-compression in Waterdrop?

Waterdrop metrics do not provide direct measurements for post-compression message sizes.

To estimate message sizes post-client compression, you can use the `txmsgs` and `txbytes` metrics in Waterdrop instrumentation. These metrics provide information per topic partition and can give you a reasonable estimate of the message sizes after compression if the compression occurs on the client side.

## What are some good default settings for sending large "trace" batches of messages for load testing?

You can use the `produce_many_sync` method to send large batches of messages, as it tends to avoid buffer overflows and performs well even with default settings. You might also want to increase the `queue.buffering.max.ms` setting. Consider dispatching multi-partition messages to delegate faster if you have a larger cluster.

## Is it worth pursuing transactions for a low throughput but high-importance topic?

Yes, for low throughput but high-importance topics, it is advisable to use transactions. Transactions ensure that operations are tied together and can be managed atomically, reducing the risk of data inconsistency. Even though the finalization of a transaction is synchronous, it provides an additional layer of reliability for critical data flows.

## Does the Waterdrop producer retry to deliver messages after errors such as `librdkafka.error` and `librdkafka.dispatch_error`, or are the messages lost?

It depends on the type of error. Waterdrop will retry the delivery for intermediate errors, such as network issues. However, for final errors like an unknown partition, the message will not be retried. If a message is purged, you should receive a final error notification indicating the purge.

## In a Rails request, can I publish a message asynchronously, continue the request, and block at the end to wait for the publish to finish?

Yes, you can publish a message asynchronously using Waterdrop. You can get the handler for the async publish and wait on it before the response is returned. This approach ensures that the request continues while the publish happens in parallel. It blocks only at the end to ensure the publish is complete.

## Why do I see WaterDrop error events but no raised exceptions in sync producer?

This behavior is by design and relates to WaterDrop's sophisticated error handling model. Here's why this happens:

1. Retryable vs. Fatal Errors

    - WaterDrop distinguishes between intermediate retryable errors and fatal errors
    - Many errors (like network glitches) are considered retryable
    - These errors are logged but don't necessarily cause the operation to fail

1. Recovery Process

    - As long as a message isn't purged from dispatch, WaterDrop will attempt to deliver it
    - If WaterDrop can recover before the message purge time, the produce_sync operation will still succeed
    - Background errors are emitted to inform you about these recovery attempts

1. Why This Matters

    - You want to know about intermediate issues (like socket disconnects) as they might indicate underlying cluster problems
    - However, if WaterDrop successfully recovers and delivers the message, there's no need to raise an exception
    - The operation ultimately succeeded from the user's perspective

For example, if there's a temporary network disconnection:

1. The error event is emitted and logged
1. WaterDrop reestablishes the connection
1. The message is successfully delivered
1. No exception is raised because the operation ultimately succeeded

For more detailed information about WaterDrop's error handling model, refer to [this](WaterDrop-Error-Handling) documentation.

## What's the difference between `key` and `partition_key` in WaterDrop?

When producing messages with WaterDrop, you have the option to specify both a `key` and a `partition_key`:

```ruby
# Using both key and partition_key
producer.produce_async(
  topic: 'orders',
  payload: order.to_json,
  key: order.id.to_s,
  partition_key: order.customer_id.to_s
)
```

These two parameters serve different purposes:

### Key

The `key` parameter sets the actual Kafka message key stored with the message. This key:

- Is used by Kafka for log compaction (if enabled on the topic)
- Can be accessed by consumers when processing the message
- Is included in the message payload that gets stored in Kafka

### Partition Key

The `partition_key` parameter is only used to determine which partition the message should be sent to. It:

- Is used solely for the partitioning algorithm
- Is not stored with the message in Kafka
- Allows you to control message distribution across partitions without affecting the message key

When only `key` is provided, WaterDrop uses it for both purposes - as the stored message key and for partition determination. When both are specified, `partition_key` precedes partition selection, while `key` is still stored with the message.

This separation is particularly useful when:

- You need messages with different keys to end up in the same partition (for ordering)
- You want to use a different attribute for partition selection than what makes sense as a logical message key
- You need to change how messages are partitioned without affecting downstream consumers that rely on the message key

Remember that messages with the same `partition_key` (or `key` if no `partition_key` is specified) will always be routed to the same partition, ensuring ordered processing within that data subset.

## How can I distinguish between sync and async producer errors in the `error.occurred` notification?

Both `produce_sync` and `produce_async` trigger the same `error.occurred` notification, making it difficult to distinguish between them. Since sync errors are typically already handled with backtraces, you can use WaterDrop's [labeling](WaterDrop-Labeling) feature to differentiate async errors that need special logging. Label your async messages and check for those labels in the error handler to process only async errors. See the [detailed guide](WaterDrop-Labeling#distinguishing-between-sync-and-async-producer-errors) on distinguishing between sync and async producer errors for implementation examples.

## How do I produce messages to a secondary Kafka cluster?

When working with multiple Kafka clusters, `Karafka.producer` always targets the primary cluster. To produce messages to a secondary cluster, create a dedicated WaterDrop producer instance configured for that cluster and use it directly:

```ruby
# Create a producer for the secondary cluster (typically in an initializer)
SECONDARY_CLUSTER_PRODUCER = WaterDrop::Producer.new do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'secondary-cluster.example.com:9092',
    'request.required.acks': 1
  }
end

# Use it to produce messages
SECONDARY_CLUSTER_PRODUCER.produce_async(
  topic: 'events',
  payload: { event: 'user_created' }.to_json
)

# Or synchronously
SECONDARY_CLUSTER_PRODUCER.produce_sync(
  topic: 'events',
  payload: { event: 'user_created' }.to_json
)
```

For detailed configuration and considerations when working with multiple clusters, see the [Multi-Cluster Setup](Infrastructure-Multi-Cluster-Setup) documentation.
