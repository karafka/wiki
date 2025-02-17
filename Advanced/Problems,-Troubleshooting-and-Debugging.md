# Help!

Read below for tips.  If you still need help, you can:

* Ask your question in [The Karafka official Slack channel](https://slack.karafka.io)
* [Open a GitHub issue](https://github.com/karafka/karafka/issues/new).  (Don't be afraid to open an issue, even if it's not a Karafka bug.  An issue is just a conversation, not an accusation!)
* Check our [FAQ](/docs/FAQ) and the [Pro FAQ](/docs/Pro-FAQ)

You **should not** email any Karafka committer privately.

Please respect our time and efforts by sticking to one of the options above.

Please consider buying the Pro subscription for additional priority Pro support and extra features.

## OSS Support Policy

Karafka Official Support Policy can be found [here](https://karafka.io/docs/Support).

## Reporting problems

When you encounter issues with Karafka, there are several things you can do:

- Feel free to open a [Github issue](https://github.com/karafka/karafka/issues)
- Feel free to ask on our [Slack channel](https://slack.karafka.io)
- Use our [integration specs](https://github.com/karafka/karafka/tree/master/spec/integrations) and [example apps](https://github.com/karafka/example-apps) to create a reproduction code that you can then share with us.

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

* [The Karafka official Slack channel](https://slack.karafka.io)
* [Open a GitHub issue](https://github.com/karafka/karafka/issues/new)

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

## Debugging

Remember that Karafka uses the `info` log level by default. If you assign it a logger with `debug,` debug will be used.

Here are a few guidelines that you should follow when trying to create a reproduction script:

1. Ensure you are using the most recent versions of all the Karafka ecosystem gems. The issue you are facing might have already been fixed.
2. Use as few non-default gems as possible to eliminate issues emerging from other libraries.
3. Try setting the `concurrency` value to `1` - this will simplify the processing flow.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.concurrency = 1
  end
end
```

4. Use a single topic with a single partition (so Karafka does not create extensive concurrent jobs).

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
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

5. If the issue is related to Active Job or Ruby on Rails, try using the latest stable release.
6. Check the [Versions Lifecycle and EOL](Versions-Lifecycle-and-EOL) page to make sure that your Ruby and Ruby on Rails (if used) combination is supported.
7. Try disabling all Karafka components that may be irrelevant to the issue, like extensive listeners and other hooks.
8. You can use `TTIN` [signal](Signals-and-States#signals) to print a backtrace of all the Karafka threads if Karafka appears to be hanging or dead. For this to work, the `LoggerListener` needs to be enabled.
9. If you are interested/need extensive `librdkafka` debug info, you can set the kafka `debug` flag to `all` or one of the following values: `generic`, `broker`, `topic`, `metadata`, `feature`, `queue`, `msg`, `protocol`, `cgrp`, `security`, `fetch`, `interceptor`, `plugin`, `consumer`, `admin`, `eos`, `mock`, `assignor`, `conf`, `all`.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      # other settings...
      debug: 'all'
    }
  end
end
```

### Enabling Extensive Logging

!!! Warning "Debug Mode Usage Caution"

    Remember: Using debug mode extensively, especially in production, may impact performance and generate large log files. Ensure you revert to regular settings once your issue is resolved.

If your Karafka server process is connected but not consuming any messages, the immediate step is to enable all debug settings. Running your Karafka server with these debug settings will provide detailed logs, shedding light on any potential issues.

Examining the verbose logs can reveal connection problems, configuration mishaps, or other reasons preventing message consumption.

```ruby
# Use the debug all flag in your kafka options
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      # other settings...
      # 
      debug: 'all'
    }
  end
end

# Set the logger level to debug to print all info
Karafka::App.logger.level = Logger::DEBUG
```

!!! Tip "Ensuring Debug Logs Are Visible"

    When setting `debug` to `all`, ensure your application logger is also set to debug mode. If the logger is set to a higher log level, Karafka may generate extensive logs, but they will not be printed. Ensuring both settings are in debug mode allows you to see all the detailed logs generated by Karafka.

### Example Logs

When debug mode is configured correctly, Karafka will generate detailed logs to help you troubleshoot issues. These logs are printed whether or not Karafka can connect to the Kafka cluster, as part of them are generated during the pre-connection establishment phase.

Below is an example of what these debug logs might look like:

```
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
rdkafka: [thrd:app]:   client.id = example_app
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
