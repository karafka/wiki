This document was created in response to recurring community questions and confusion around Karafka's double-processing or missed message behaviors. While it's understandable given the complexity of message-driven systems, it's important to clarify up front:

- **There are no confirmed bugs in the most recent version of Karafka** (at the time of writing) that cause unintended double-processing or skipped messages. If you observe such behavior and can reliably reproduce it, please open an issue with a minimal test case.

- Karafka includes a **comprehensive integration test suite**, which features a dedicated assertion layer ensuring:
    - Messages are not fetched more than once.
    - A single consumer instance never processes messages from different topics or partitions.
    - Kafka protocol semantics (like ordering and delivery guarantees) are respected.

Despite this, users sometimes report what they believe is double-processing or missing messages. In every confirmed case to date except one, the root cause has been either:

- Misunderstanding of consumption semantics.
- Improper offset management.
- Non-thread-safe or unsafe consumer code.
- Non-idempotent producer with network issues.
- Misconfigured deployments (e.g., multiple consumer groups unintentionally).

This guide aims to help you systematically identify, debug, and resolve these issues.

## Overview

Karafka defaults to **at-least-once delivery semantics**, which means that under normal operating conditions and proper usage, **each message will be delivered and processed once**. This assumes no crashes, correct offset handling, and thread-safe consumer logic.

Karafka also supports other Kafka delivery semantics:

- **Exactly-once semantics (EOS)** — via Kafka transactions, which ensure atomicity between offset commits and message production.
- **At-most-once semantics** — by committing offsets *before* processing. This guarantees no duplication but may lead to message loss if a crash occurs during processing.

When used correctly and under healthy conditions (no ungraceful termination), Karafka, with at least one semantics, will process each message **once and only once**, even without transactions.

## Architecture And Lifecycle

!!! Tip "Introductory Overview"

    This section provides a high-level introduction to Karafka's architecture and lifecycle. For more comprehensive details on Karafka's internal mechanisms, configuration options, and operational best practices, please refer to other sections of this documentation where these concepts are explored in greater depth.

Karafka is a multi-threaded Kafka consumer framework for Ruby/Rails applications. Understanding its internals will help pinpoint where duplicates arise:

- **Consumer Group and Partitions**: Karafka consumers typically run as a separate process (via `karafka server`). They join a Kafka **consumer group**, dividing topic partitions among instances. If you run multiple Karafka processes (for scaling or high availability) under the **same** group ID, Kafka will assign each partition to only one process at a time (preventing duplicates). If processes use different group IDs, each group will receive all messages (causing intentional duplicates). Always ensure all instances use the same group for load-balanced consumption.

- **Threads and Concurrency**: Within a Karafka process, **multiple** Ruby threads may be spawned to fetch and consume messages in parallel (controlled amongst others by `Karafka::App.config.concurrency`). By default, Karafka uses threads to process different partitions and topics concurrently. Each partition's messages are processed in order, and Karafka preserves partition ordering by not processing multiple messages from the same partition at the same time (unless using advanced features like Virtual Partitions). This means concurrency > 1 mainly improves throughput when consuming multiple partitions or topics simultaneously. **All code must be thread-safe**, as Karafka shares the process among threads much like a Puma or Sidekiq. Non-thread-safe code can cause race conditions and unpredictable behavior (including potential double processing or missed acknowledgments).

- **Message Fetching and Batching**: Karafka fetches messages from Kafka (often in batches) and hands them to your consumer class's `#consume` method. By default, Karafka may buffer a certain number of messages (controlled by settings like `max_messages`). Batch processing means your `#consume` method will receive an array of messages you typically iterate over. Karafka's default is to fetch as many as possible up to `max_messages` or within `max_wait_time` to maximize throughput.

- **Offset Acknowledgement (Commit)**: After processing messages, the consumer must commit the offsets of those messages back to Kafka's broker to mark them as processed (so the group doesn't redeliver them on the next session). Karafka auto-commits offsets by default at regular intervals (every 5 seconds via Kafka's `auto.commit.interval.ms`) and at graceful shutdown or right before a rebalance occurs. Essentially, Karafka will periodically checkpoint how far it has read. If the process crashes or a rebalance happens before an offset is committed, those messages may be redelivered to this or another consumer - hence, duplicates. Karafka's design mitigates this by also committing to orderly rebalances and shutdowns, but unexpected crashes or forced terminations can still result in uncommitted messages being reprocessed.

- **Exactly-Once Option**: For critical workflows that absolutely cannot tolerate duplicates, Karafka supports Kafka transactions (Exactly-Once Semantics). This ties the offset commit to producing a result in one atomic operation. However, using transactions is more complex and beyond the scope of most consumer-only scenarios.

Understanding this lifecycle, we can see that double-processing usually indicates something went wrong between message receipt and offset commit – often due to errors, timeouts, or miscoordination in this flow.

## Common Causes of Double Message Processing

Several issues (usually user or configuration errors) can interrupt the normal flow and lead to a message being processed twice. Below, we detail each cause and how it arises, using real-world examples.

### Improper Offset Committing or Acknowledgement

If offsets aren’t committed at the correct time or in the proper way, Kafka may think messages haven’t been processed and resend them.

#### Misusing Manual Offset Management

Karafka allows turning off auto-offset commits (`manual_offset_management(true)` per topic) so you can call `mark_as_consumed` or `mark_as_consumed!` in your code at precise points. This is powerful but dangerous if forgotten.

**Example**: You disable auto commits to implement a custom flow but forget to call `mark_as_consumed` after processing. The consumer will never commit those messages. All those messages will be delivered again on the next restart, causing duplicates. Always mark messages as consumed (or re-enable auto commits) when using manual mode. If you use `mark_as_consumed` (non-bang), remember it’s asynchronous (just flags for later commit); using `mark_as_consumed!` commits immediately but at a performance cost.

```ruby
# This example illustrates incorrect setup
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders do
      consumer OrdersConsumer
      # Auto marking disabled
      manual_offset_management(true)
    end
  end
end

class OrdersConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      process(message)
      # mark_as_consumed is missing — offsets will never be committed!
    end
  end
end
```

#### Committing Offsets Too Early or Out of Sync

The offset should be committed after a message (or batch) is fully processed. If one mistakenly commits an offset before processing (or commits a higher offset while some messages are still in progress), and then the app crashes during processing, those in-flight messages won’t be reprocessed (resulting in lost messages, not duplicates). Conversely, committing too late (or not at all) leads to replays.

**Example**: A developer manually calls `mark_as_consumed` before processing, causing some messages to be marked as consumed before processing potentially. This can confuse which messages are processed. The rule is to commit only after successful processing, never before. If unsure, rely on Karafka’s automatic commits, which are designed to happen after batch processing is complete.

```ruby
# This example illustrates incorrect setup
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders do
      consumer OrdersConsumer
      manual_offset_management(true)
    end
  end
end

class OrdersConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      # This marks the message as consumed *before* it's processed.
      mark_as_consumed(message)

      # If the process crashes here, the message is lost - offset was already committed
      process(message)
    end
  end
end
```

### Unhandled Exceptions in Consumer Code

Runtime errors in your consumer logic are a very common cause of double-processing. Karafka has built-in retry/backoff behavior: if your consume method raises an exception, Karafka will not commit the offsets for that batch (since it didn't complete successfully) and will retry the message(s) after a pause from the last committed offset. This is by design: it prevents data loss but means the failed message (and potentially others in the same batch) will be processed again.

#### Exceptions on Individual Messages With Automatic Marking

If you process messages in a loop without per-message marking and one message triggers an error, Karafka treats the whole batch as failed by default.

Example: Your consumer does `messages.each { |m| handle(m) }` and `#handle` throws an error on the 3rd message. The first two messages were processed, but their offsets haven't been committed yet (since Karafka commits them after the batch). Karafka catches the error, logs it, and will retry from the 1st message's offset on the next attempt. Result: The first two messages will be delivered again along with the third, causing duplicates for those two. To mitigate this, make your processing robust per message. You can rescue exceptions around the single message to ensure the batch continues for others, or use `#mark_as_consumed` as you go to commit offsets for messages that succeeded before the error. Karafka Pro's Virtual Partitions feature even handles this scenario by skipping already consumed messages on retry to avoid duplicates.

```ruby
# This example illustrates incorrect setup
class OrdersConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      # will crash on e.g. 3rd message
      raise 'Boom' if message.payload == 'fail'  # simulate a broken message
    end
  end
end
```

!!! Tip "Use Karafka Monitoring Hooks to Debug Consumer Failures"
    
    Use Karafka's monitoring hooks to debug these scenarios. Subscribe to the `error.occurred` event to get detailed info whenever a consumer error happens.

### Non-Thread-Safe Code or Shared Resource Issues

Because Karafka runs concurrently, any code that isn’t safe under multi-threading can inadvertently lead to double-processing symptoms. While Karafka itself ensures a single message is handled by one thread at a time, user code might introduce duplication in a few ways.

#### Shared Global State

Multiple threads can interfere if you use class variables, singletons, or another globally shared mutable state to track processing.

Example: Suppose you have a global hash to ensure you don't process the same item twice or a global counter for deduplication. If two threads (processing different partitions) access it, they might see stale or conflicting data. One thread might reset or change a flag that causes the other thread to re-process something. Always protect shared state with mutexes or, better, avoid it. Use local variables or consumer instance local storage if needed, and remember each Karafka consumer instance is tied to a partition and persists for that partition's lifetime so you can store state in instance variables safely per partition.

```ruby
# This example illustrates incorrect setup
# Incorrect: Using Global State Across Threads
class OrdersConsumer < ApplicationConsumer
  # Global shared state across all threads and partitions
  @@processed_orders = Set.new

  def consume
    messages.each do |message|
      order_id = message.payload['order_id']
      unless @@processed_orders.include?(order_id)
        process(message)
        @@processed_orders << order_id
      end
    end
  end
end
```

#### External Services not Thread-Safe

Ensure libraries you call (HTTP clients, database drivers, etc.) are thread-safe or use separate connections per thread. For instance, Rails ActiveRecord is thread-safe if you use its connection pooling properly. A gem that is not thread-safe might mishandle requests when called in parallel. This could manifest as duplicate actions. For example, a non-thread-safe cache library might erroneously replay a write operation from two threads.

#### Manual Thread Management in Consumer

Sometimes, users try to spawn their threads within consume to parallelize work. This is **not** recommended - Karafka already handles parallelism. If you do this, be very careful with offset commits. For example, if you spawn a background thread to process a message and immediately mark the message as consumed in the main thread, the background thread might still work when Karafka commits and moves on. If that thread raises an error, you've already acknowledged the message, so Karafka won't retry it – you just lost it (not a duplicate, but data loss). Conversely, suppose you delay offset commit until threads join. In that case, you might not commit in time, causing Kafka to redeliver messages processed successfully by threads (duplicate processing). In short, avoid inventing your threading on top of Karafka's.

```ruby
# This example illustrates incorrect setup
class OrdersConsumer < ApplicationConsumer
  self.manual_offset_management = true

  def consume
    messages.each do |message|
      Thread.new do
        process(message)  # background thread still running...
      end

      mark_as_consumed(message)  # main thread marks as consumed immediately
    end
  end
end
```

### Thread/Worker Mismanagement and Concurrency Settings

This category is related to thread safety but involves how you configure and deploy Karafka.

#### Karafka Swarm Mode (Multi-Process)

Karafka supports forking multiple worker processes (similar to Puma workers) to overcome MRI GIL limits​. If you use swarm mode, ensure each forked process still has a unique consumer group member identity. Karafka handles this under the hood, but if you manually run multiple Karafka processes (e.g. via a Procfile or multiple containers), make sure they share the same `group.id` in config. A mistake here is running two Karafka processes with the same topics but different group names, which means both processes will independently consume all messages (duplicating everything).

The correct approach to scaling consumers is to run multiple processes all configured as one group (or use Karafka's built-in swarm mode). In Rails deployments, it's common to have an independent Karafka process for each app instance (all using the same group), which is fine.

```ruby
# This example illustrates incorrect setup
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders do
      # different group name for each process
      # this will start processing from beginning each time new
      # karafka process starts
      consumer_group "app_group_#{Process.pid}" do
        topic :orders do 
          consumer OrdersConsumer
        end
      end
    end
  end
end
```

#### Multiple Karafka Apps on Same Topics

Another scenario is that you might have two different Karafka apps (maybe two services) subscribing to the same Kafka topic. If they are meant to handle the same data (like two separate consumers for different purposes), that's not an error – it's expected duplicates (each group processes independently). But you might inadvertently double-consume if they were not supposed to overlap (e.g., a copy-paste of the app running by mistake). Double-check which services consume which topics, and use distinct group IDs only when you intend multiple independent consumptions.

Case Study – Competing Consumers: Imagine running Karafka in Kubernetes with an HPA (Horizontal Pod Autoscaler). You set it to scale up to 5 replicas on high load. However, you accidentally left the consumer group name as the default (which might include a random component or environment-specific name). When new pods start, they form their group instead of joining the existing one because the `group.id` was misconfigured per pod. Now, all pods consume the same topic independently – leading to each message being processed 5 times (once per pod). The fix: define a consistent `consumer_group` name in your Karafka routing config so all pods join the same group. After that, messages will properly partition among pods with no duplicates.

```ruby
# This example illustrates incorrect setup
# Both apps use the same default consumer group (app) and subscribe
# to the same topic.

# Application A
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders do
      consumer OrdersConsumer
    end
  end
end

# Application B
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders do
      consumer NotificationsConsumer
    end
  end
end
```

### Kafka Rebalancing Side Effects (Slow Consumers, Timeouts)

Kafka's consumer group **rebalancing** can cause message reprocessing if not managed correctly. Rebalancing happens whenever consumers join or leave the group (e.g. scaling up/down or a crash) or occasionally due to coordinator decisions. During a rebalance, partitions may move between consumers. Karafka tries to handle this gracefully.

#### Graceful Rebalances

Karafka will, whenever possible, **complete** the processing of any in-flight batch and commit offsets before relinquishing a partition on rebalance. In an ideal case, when you scale up or down, no message is left uncommitted during the transition, so the new consumer starts at the right spot (no duplicates).

#### Revocation Mid-Processing

If a rebalance occurs while a consumer is still processing a batch (maybe a long-running batch), Karafka provides a `#revoked?` method so your code can detect it and stop. If you ignore it, one of two things might happen:

- If Karafka waits, you finish the batch and commit, which is fine (no duplicate).
- If Kafka forcibly revokes (in case of a timeout or crash), the partition ownership is lost mid-processing. Any messages processed but not committed by the time of revocation will be reassigned and reprocessed by another consumer, causing duplicates.

#### Session Timeouts and Max Poll Interval

The Kafka broker uses a `session.timeout.ms` (and `max.poll.interval.ms` for polling heartbeat) to decide if a consumer is dead or stuck. Suppose your consumer takes longer than this timeout to process a batch without polling Kafka. In that case, the broker assumes it's down and will trigger a rebalance, assigning its partitions to another consumer. Karafka uses an internal heartbeat thread (via librdkafka) to keep the session alive during long processing. However, if the processing exceeds `max.poll.interval.ms`, Kafka will still consider it failed. If your processing logic takes a lot of time, consider looking into Karafka's [Long-Running Jobs](Pro-Long-Running-Jobs) feature.

For example, if `max.poll.interval.ms` is 300 seconds (default for Kafka clients) and your consumer takes 600 seconds to handle a huge batch or a slow operation, Kafka may kick it out. Then, another consumer (or a newly started instance) will take over that partition and re-read from the last committed offset (which was before the long batch). Now, those messages will be processed again on the new consumer. This looks like a mysterious duplicate: two processes handled the same messages. It's one message, two different consumers, due to a timeout.

#### Slow Consumer Scenario

A real-world case was reported where two Karafka pods were each getting all messages. The logs showed `Kafka::UnknownMemberId` errors and frequent rebalances. The cause was a consumer that was too slow (processing took longer than the session timeout). Kafka kept ejecting it from the group and redistributing its partition to the other process. That process would also eventually get ejected as it hit the timeout, causing a ping-pong of partition ownership. Each time, some messages were reprocessed on the other side. The solution was to tune the consumer settings: either turn off large batch processing or increase the `max.poll.interval.ms` so that the consumer had enough time to finish without being considered dead.

In Karafka, you can adjust `max_wait_time` and `max_messages` to fetch smaller batches (process messages more frequently in smaller chunks). Essentially, if you have long processing tasks:

- Make sure Kafka's timeouts are higher than the worst-case processing time.
- Use strategies to break the work into smaller pieces.
- Consider using the [Long-Running Jobs](Pro-Long-Running-Jobs) feature.

## Memory Usage / Memory Leaks

As of now, Karafka components have no known memory leaks. We take each report extremely seriously. Before reporting a potential memory leak, please follow these steps:

1. **Upgrade to the Latest Version**: Ensure you use the most recent versions of all Karafka ecosystem gems. Issues might have already been fixed in newer releases.

2. **Check for External Dependencies**: Limit the use of non-default gems to eliminate issues that might arise from other libraries.

3. **Simplify Concurrency**: Set the `concurrency` value to `1` to simplify the processing flow and identify if the issue is related to multi-threading.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.concurrency = 1
  end
end
```

4. **Use a Single Topic and Partition**: Test with a single topic and partition to reduce complexity and isolate the issue.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders do
      consumer OrdersConsumer
    end
  end
end
```

5. **Monitor Memory Usage**: Use tools like `memory_profiler` or `derailed_benchmarks` to monitor and profile memory usage in your Karafka application.

6. **Check Configuration**: Verify your Karafka configuration for any unusual settings that might cause excessive memory usage.

7. **Review Logs**: Check your logs for any warnings or errors that might indicate a problem with memory management.

8. **Isolate the Problem**: Reproduce the issue in a controlled environment. Use minimal configuration and isolate the components one by one.

9. **Garbage Collection**: Force garbage collection and monitor if the memory usage drops. This can help determine if the issue is with Ruby's garbage collector.

```ruby
GC.start
```

10. **Collect Diagnostic Data**: Gather detailed diagnostic data, including heap dumps and backtraces. This information will be crucial for debugging the issue.

```ruby
Process.kill('TTIN', Process.pid)
```

### Understanding Memory Usage and Leaks

Karafka is designed to be efficient with memory, but many factors can contribute to increased memory usage or leaks:

1. **Memory Bloat**: This occurs when your process's memory size keeps increasing over time, even if it is not actively processing a higher load. Common causes include:
   - Ruby gem issues or memory fragmentation.
   - Unreleased resources or objects being held in memory longer than necessary.
   
2. **Garbage Collection**: Ruby uses a garbage collector (GC) to manage memory. Sometimes, tweaking GC settings can help manage memory usage more effectively. You can experiment with environment variables like `RUBY_GC_HEAP_GROWTH_FACTOR`, `RUBY_GC_MALLOC_LIMIT`, and `RUBY_GC_OLDMALLOC_LIMIT` to optimize memory use.

3. **External Dependencies**: Libraries and gems that your application depends on might have their own memory issues. Regularly update and monitor all dependencies.

4. **Profiling Tools**: Use memory profiling tools to identify potential leaks or bloat. Tools like `memory_profiler`, `derailed_benchmarks`, and `stackprof` can help pinpoint memory issues in your application.

5. **Heap Dumps**: Collecting and analyzing heap dumps can provide insights into memory allocation and help identify objects that are using excessive memory.

6. **Code Review**: Regularly review your code for inefficient memory usage patterns, such as large data structures or extensive caching without expiration policies.

If you have followed these steps and still believe there is a memory leak in Karafka, please report it through one of the following channels:

- [The Karafka official Slack channel](https://slack.karafka.io)
- [Open a GitHub issue](https://github.com/karafka/karafka/issues/new)

### Recommendations for Managing Memory in Karafka

1. **Set `MALLOC_ARENA_MAX=2`**: This environment variable is the closest thing to a silver bullet if you are using Linux/glibc in production. Setting `MALLOC_ARENA_MAX=2` limits the number of memory arenas, which can significantly reduce memory fragmentation and overall memory usage.

    ```sh
    export MALLOC_ARENA_MAX=2
    ```

    On Heroku, you can set this configuration by running:

    ```sh
    heroku config:set MALLOC_ARENA_MAX=2
    ```

    By default, glibc can create multiple memory arenas to improve concurrency for multithreaded applications. However, this can lead to high memory usage due to fragmentation. Limiting the number of arenas helps to manage memory more efficiently.

2. **Switch to `jemalloc`**: `jemalloc` is a memory allocator that works well with Ruby, particularly Ruby 3.0 and later. It is designed to reduce fragmentation and improve memory management, leading to more stable memory usage patterns.

    To install `jemalloc`, follow these steps:

    ```sh
    sudo apt-get install libjemalloc-dev
    ```

    Then, compile your Ruby with `jemalloc` support.

## Systematic Debugging of Processing Issues in Karafka

When experiencing issues with Karafka, a systematic approach to debugging can save time and help pinpoint the root cause. This guide provides a structured methodology for identifying and resolving common Karafka processing problems.

### Confirm the Symptom

First, verify that the same message (the same Kafka partition and offset or the same unique key in the payload) is processed more than once. Add logging in your consumer to print the message's topic/partition/offset or any unique ID. This will help distinguish true Kafka-level duplicates from logical issues (like accidentally performing an action twice in your code).

### Ensure You're Using Current Versions

Before diving into debugging **always** verify you're using the most recent versions of all Karafka ecosystem gems. The issue you're experiencing may have already been fixed in a newer version.

### Create a Minimal Reproduction Environment

To isolate and identify issues:

- Use as few non-default gems as possible to eliminate interference from other libraries
- Simplify your processing flow by reducing `concurrency`:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.concurrency = 1
  end
end
```

- Reduce topics and partitions to minimize variables:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other configuration
  end

  routes.draw do
    # Disable other topics for debug...
    # topic :shippings do
    #   consumer ShippingsConsumer
    # end

    topic :orders do
      consumer OrdersConsumer
    end
  end
end
```

### Enable Enhanced Logging

Karafka uses the info log level by default. To get more detailed information:

- Set your logger to debug level:

```ruby
Karafka::App.logger.level = Logger::DEBUG
```

- Enable librdkafka debug flags for detailed internal information:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap. servers': '127.0.0.1:9092',
      # other settings...
      debug: 'all'
    }
  end
end
```

Available debug flags include: `generic`, `broker`, `topic`, `metadata`, `feature`, `queue`, `msg`, `protocol`, `cgrp`, `security`, `fetch`, `interceptor`, `plugin`, `consumer`, `admin`, `eos`, `mock`, `assignor`, `conf`, `all`

!!! Warning "Debug Mode Usage Caution"

    Using debug mode extensively, especially in production, may impact performance and generate large log files. Ensure you revert to regular settings once your issue is resolved.

When debug mode is configured correctly, Karafka will generate detailed logs to help you troubleshoot issues. These logs are printed whether or not Karafka can connect to the Kafka cluster, as part of them are generated during the pre-connection establishment phase.

Below is an example of what these debug logs might look like:

```text
rdkafka: [thrd:app]: 127.0.0.1:9092/bootstrap: Enabled low-latency ops queue wake-ups
rdkafka: [thrd:app]: 127.0.0.1:9092/bootstrap: Added new broker with NodeId -1
rdkafka: [thrd:app]: 127.0.0.1:9092/bootstrap: Selected for cluster connection: bootstrap servers added (broker has 0 connection attempt(s))
rdkafka: [thrd::0/internal]: :0/internal: Enter main broker thread
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Enter main broker thread
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Received CONNECT op
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Broker changed state INIT -> TRY_CONNECT
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: Broadcasting state change
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: broker in state TRY_CONNECT connecting
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Broker changed state TRY_CONNECT -> CONNECT
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: Broadcasting state change
rdkafka: [thrd:app]: librdkafka v2.3.0 (0x20300ff) example_app#producer-1 initialized
rdkafka: [thrd:app]: Client configuration:
rdkafka: [thrd:app]:   client.id = example_app-13131
rdkafka: [thrd:app]:   client.software.version = 2.3.0
rdkafka: [thrd:app]:   metadata.broker.list = 127.0.0.1:9092
rdkafka: [thrd:app]:   topic.metadata.refresh.interval.ms = 5000
rdkafka: [thrd:app]:   debug = generic,broker,topic,metadata,feature,queue,msg,protocol,cgrp,security,fetch,interceptor,plugin,consumer,admin,eos,mock,assignor,conf,all
rdkafka: [thrd:app]:   statistics.interval.ms = 0
rdkafka: [thrd:app]:   error_cb = 0x7fb0111b0000
rdkafka: [thrd:app]:   stats_cb = 0x7fb011791000
rdkafka: [thrd:app]:   log_cb = 0x7fb011792000
rdkafka: [thrd:app]:   log.queue = true
rdkafka: [thrd:app]:   background_event_cb = 0x7fb0111b2000
rdkafka: [thrd:app]:   opaque = 0x2b34
rdkafka: [thrd:app]:   api.version.request = true
rdkafka: [thrd:app]:   allow.auto.create.topics = false
rdkafka: [thrd:app]:   oauthbearer_token_refresh_cb = 0x7fb011220000
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Connecting to ipv4#127.0.0.1:9092 (plaintext) with socket 11
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Connected to ipv4#127.0.0.1:9092
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Connected (#1)
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Updated enabled protocol features +ApiVersion to ApiVersion
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Broker changed state CONNECT -> APIVERSION_QUERY
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: Broadcasting state change
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Sent ApiVersionRequest (v3, 44 bytes @ 0, CorrId 1)
rdkafka: [thrd:app]: Not selecting any broker for cluster connection: still suppressed for 48ms: application metadata request
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Received ApiVersionResponse (v3, 453 bytes, CorrId 1, rtt 6.05ms)
rdkafka: [thrd:127.0.0.1:9092/bootstrap]: 127.0.0.1:9092/bootstrap: Broker API support:
```

### Disable Custom Instrumentation and Monitors

While useful for observability, custom instrumentation, and monitors can inadvertently affect message processing when implemented incorrectly. Historically, some cases of message duplication have been traced to custom monitors (particularly those added for distributed tracing) that interfered with Karafka's internal operations.

If you're experiencing duplicate processing, temporarily disabling all custom monitors can help isolate whether your instrumentation contributes to the issue. Once confirmed, carefully review your monitor implementations to ensure they operate as passive observers without side effects on Karafka's core processing logic.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Disable any custom monitors and instrumentation
    # Use defaults when investigating

    # config.monitor = MonitorWithOpenTelemetry.new
  end
end
```

### Capture Thread States for Hanging Processes

If Karafka seems frozen or is not progressing:

- Send `SIGTTIN` to the Karafka process. It will print backtraces of all threads to stdout/log.

- This shows you what each thread is doing — e.g., stuck waiting on IO, DB, mutex, or sleeping. Works only when LoggerListener is enabled in your monitor setup (enabled by default).

```bash
kill -TTIN <karafka_pid>
```

Useful to detect:

- Deadlocks
- Long blocking operations
- Consumers stuck on external services

### Check for Errors and Retries

Review logs and monitor hooks to spot retry loops or failures:

- Check for `consumer.consume.error` events - these will show unhandled exceptions during consume.
- Look for repeated processing of the same offset - this is often a sign of crash or retry behavior.
- The presence of `retrying?` in logs or monitor events

```ruby
def consume
  messages.each do |message|
    logger.info("retry attempt: #{message.attempt}") if message.retrying?
  end
end
```

### Simplify the Environment

To isolate the issue, try:

- **Single-threaded Mode**: Set `concurrency = 1`
- **Single Instance**: Run only one Karafka process
- **Small Batch Size**: Reduce `max_messages`
- **Test with a Controlled Topic**: Create a test topic with a single partition

### Inspect Kafka Logs and Metrics

Look for:

- Consumer group events in broker logs
- "Member xyz was removed from the group due to timeout" messages
- Rebalance metrics

### Consider Pro Support

If after following all the steps above, you're still unable to isolate or resolve the issue, or if you're dealing with a production-critical incident and need deeper Kafka/Ruby insight, consider reaching out for [Pro](Pro-Support) assistance.

Karafka Pro offers:

- Private Slack channel access
- Direct help from the author
- Assistance with debugging, architecture, rebalancing, upgrade strategies, and more

You can contact us at `contact@karafka.io` or via the private Slack channel if you're a Pro customer.

Don't hesitate to get in touch if you still need clarification after following this guide. We're happy to help.
