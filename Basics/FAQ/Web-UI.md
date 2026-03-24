1. [Why some of consumer subscriptions are not visible in the Web UI?](#why-some-of-consumer-subscriptions-are-not-visible-in-the-web-ui)
1. [Can I create all the topics needed by the Web UI manually?](#can-i-create-all-the-topics-needed-by-the-web-ui-manually)
1. [Why after moving from Racecar to Karafka, my Confluent Datadog integration stopped working?](#why-after-moving-from-racecar-to-karafka-my-confluent-datadog-integration-stopped-working)
1. [Can I password-protect Karafka Web UI?](#can-i-password-protect-karafka-web-ui)
1. [Why am I getting `No such file or directory - ps (Errno::ENOENT)` from the Web UI?](#why-am-i-getting-no-such-file-or-directory-ps-errnoenoent-from-the-web-ui)
1. [Why do Karafka Web UI topics contain binary/Unicode data instead of text?](#why-do-karafka-web-ui-topics-contain-binaryunicode-data-instead-of-text)
1. [Can I use same Karafka Web UI topics for multiple environments like production and staging?](#can-i-use-same-karafka-web-ui-topics-for-multiple-environments-like-production-and-staging)
1. [Does Karafka plan to submit metrics via a supported Datadog integration, ensuring the metrics aren't considered custom metrics?](#does-karafka-plan-to-submit-metrics-via-a-supported-datadog-integration-ensuring-the-metrics-arent-considered-custom-metrics)
1. [The "Producer Network Latency" metric in DD seems too high. Is there something wrong with it?](#the-producer-network-latency-metric-in-dd-seems-too-high-is-there-something-wrong-with-it)
1. [What is the purpose of the `karafka_consumers_reports` topic?](#what-is-the-purpose-of-the-karafka_consumers_reports-topic)
1. [Why does the `karafka_consumers_commands` topic generate constant network traffic?](#why-does-the-karafka_consumers_commands-topic-generate-constant-network-traffic)
1. [Is it possible to exclude `karafka-web` related reporting counts from the web UI dashboard?](#is-it-possible-to-exclude-karafka-web-related-reporting-counts-from-the-web-ui-dashboard)
1. [Why is the "Dead" tab in Web UI empty in my Multi App setup?](#why-is-the-dead-tab-in-web-ui-empty-in-my-multi-app-setup)
1. [Why are message and batch numbers increasing even though I haven't sent any messages?](#why-are-message-and-batch-numbers-increasing-even-though-i-havent-sent-any-messages)
1. [What does `config.ui.sessions.secret` do for the Karafka Web UI? Do we need it if we are using our authentication layer?](#what-does-configuisessionssecret-do-for-the-karafka-web-ui-do-we-need-it-if-we-are-using-our-authentication-layer)
1. [Can we change the name of Karafka's internal topic for the Web UI?](#can-we-change-the-name-of-karafkas-internal-topic-for-the-web-ui)
1. [Is there a way to control which pages we show in the Karafka Web UI Explorer to prevent exposing PII data?](#is-there-a-way-to-control-which-pages-we-show-in-the-karafka-web-ui-explorer-to-prevent-exposing-pii-data)
1. [Why does Karafka Web UI stop working after upgrading the Ruby slim/alpine Docker images?](#why-does-karafka-web-ui-stop-working-after-upgrading-the-ruby-slimalpine-docker-images)
1. [Why does installing `karafka-web` take exceptionally long?](#why-does-installing-karafka-web-take-exceptionally-long)
1. [Can I disable logging for Karafka Web UI consumer operations while keeping it for my application consumers?](#can-i-disable-logging-for-karafka-web-ui-consumer-operations-while-keeping-it-for-my-application-consumers)
1. [What is the serialization format for Karafka Web UI internal topics?](#what-is-the-serialization-format-for-karafka-web-ui-internal-topics)
1. [What is the expected message throughput for Karafka Web UI internal topics?](#what-is-the-expected-message-throughput-for-karafka-web-ui-internal-topics)
1. [What Kafka ACLs are required for the Karafka Web UI to work?](#what-kafka-acls-are-required-for-the-karafka-web-ui-to-work)

---

## Why some of consumer subscriptions are not visible in the Web UI?

If some of your Karafka consumer subscriptions are not visible in the Karafka Web UI, there could be a few reasons for this:

- You are using Karafka Web older than the `0.4.1` version. Older Karafka Web UI versions used to only shows subscriptions that have at least one message processed.
- The consumer group that the subscription belongs to is not active. Karafka only displays active consumer groups in the Web UI. Make - sure that your consumer group is up and running.
The subscription is not properly configured. Ensure that your subscription is appropriately defined, has the correct topic, and is active.
- There is a delay in the Karafka Web UI updating its data. Karafka Web UI may take a few seconds to update its data, especially if many subscriptions or messages are being processed.

If none of these reasons explain why your subscriptions are not visible in the Karafka Web UI, you may need to investigate further and check your Karafka logs for any errors or warnings.

## Can I create all the topics needed by the Web UI manually?

While it is possible to create the necessary topics manually using the Kafka command-line tools, it is generally recommended to use the `bundle exec karafka-web install` command instead.

This is because the `karafka-web install` command ensures that the topics are created with the correct configuration settings, including the appropriate number of partitions, retention policies, and other critical parameters for efficient and reliable message processing. If you create the topics manually, there is a risk that you may miss some configuration settings or make mistakes that can cause performance or stability issues.

Overall, while it is technically possible to create the necessary topics for the Karafka Web UI manually, it is generally recommended to use the `karafka-web install` command instead.

If you need to create them manually, please include the settings listed [here](Web-UI-Getting-Started).

## Why after moving from Racecar to Karafka, my Confluent Datadog integration stopped working?

When a new consumer group is introduced, Confluent reports things with a delay to Datadog. This is because the new consumer group needs to be registered with Confluent before it can start reporting metrics to Datadog.

To ensure a smoother monitoring experience, we recommend enabling [Karafka Datadog integration](Infrastructure-Monitoring-and-Logging#datadog-and-statsd-integration). It will allow you to easily monitor your Karafka operations and ensure everything is running smoothly. An out-of-the-box dashboard can be imported to Datadog for overseeing Karafka operations. This dashboard provides detailed metrics and insights into your Karafka operations, making identifying and resolving issues easier.

## Can I password-protect Karafka Web UI?

**Yes**, you can password-protect the Karafka Web UI, and it is highly recommended. Adding a layer of password protection adds a level of security to the interface, reducing the risk of unauthorized access to your data, configurations, and system settings.

Karafka provides ways to implement password protection, and you can find detailed steps and guidelines [here](Web-UI-Getting-Started#authentication).

## Why am I getting `No such file or directory - ps (Errno::ENOENT)` from the Web UI?

If you are seeing the following error:

```shell
INFO pid=1 tid=gl9 Running Karafka 2.3.0 server
#<Thread:0x0000aaab008cc9d0 karafka-2.3.0/lib/karafka/helpers/async.rb:25 run>
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

Please ensure you have **all** the Karafka Web UI required OS commands installed and executable. A complete list of the OS dependencies can be found [here](Web-UI-Getting-Started#external-shellos-required-commands).

## Why do Karafka Web UI topics contain binary/Unicode data instead of text?

If you've checked Karafka Web UI topics in an alternative Kafka UI, you may notice that topics seem to contain binary/unicode data rather than plain text. It's not an oversight or an error. This design choice is rooted in our data management and transmission efficiency approach.

- **Compression for Efficient Data Transfer**: Karafka Web UI compresses all data that it sends to Kafka. The primary objective behind this is to optimize data transmission by reducing the size of the messages. Smaller message sizes can lead to faster transmission rates and lower storage requirements. This is especially crucial when dealing with vast amounts of data, ensuring that Kafka remains efficient and responsive.

- **Independent Compression without External Dependencies**: We understand the significance of maintaining a lightweight, hassle-free setup for our users. We chose Zlib for data compression - it comes bundled with every Ruby version. This means there's no need to rely on third-party libraries or go through configuration changes to your Kafka cluster to use Karafka Web UI.

By choosing Zlib, we've simplified it for the end user. You won't have to grapple with additional compression settings or worry about compatibility issues. Zlib's ubiquity in Ruby ensures that Karafka remains user-friendly without compromising data transmission efficiency.

While the binary/Unicode representation in the Karafka Web UI topics might seem unconventional at first glance, it's a strategic choice to streamline data transfers and keep the setup process straightforward. Karafka Web UI Explorer recognizes this format and will decompress it if you need to inspect this data.

## Can I use same Karafka Web UI topics for multiple environments like production and staging?

**No**. More details about that can be found [here](Web-UI-Multi-App#limitations).

## Does Karafka plan to submit metrics via a supported Datadog integration, ensuring the metrics aren't considered custom metrics?

**No**, Karafka does not have plans to submit metrics through a dedicated Datadog integration that ensures these metrics are classified as non-custom. While Karafka has an integration with Datadog, the metrics from this integration will be visible as custom metrics.

The reason for this approach is grounded in practicality and long-term maintainability. As with any software, weighing the benefits against the maintenance cost and the commitment involved is essential. While it might seem feasible to align certain features or integrations with the current framework changes, it could introduce challenges if the release cycle or external dependencies were to change.

To put it in perspective:

- **Maintenance Cost & Commitment**: Introducing such a feature would mean an ongoing commitment to ensuring it works seamlessly with every subsequent update or change to Karafka or Datadog. It's imperative to consider the long-term cost of this commitment.

- **External Dependencies**: If Datadog's release cycle or features were to evolve unexpectedly, it could lead to complexities in ensuring smooth integration. This introduces an external dependency that's out of Karafka's direct control.

- **Ecosystem Benefits**: While such integrations can offer added value, assessing if their benefits are substantial enough to justify the effort and potential challenges is vital. In this case, the perceived benefit to the ecosystem seems insignificant.

In conclusion, while Karafka recognizes the value of integrations and continually seeks to enhance its capabilities, it's essential to strike a balance that ensures the software remains efficient, maintainable, and free from unnecessary complexities.

## The "Producer Network Latency" metric in DD seems too high. Is there something wrong with it?

In this case, the high number you see is in microseconds, not milliseconds. To put it into perspective, 1 millisecond is 1,000 microseconds. So, if you see a metric like 15k, it's just 0.015 of a second. Always ensure you're reading the metrics with the correct scale in mind.

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/karafka_dd_producer_latency_metric.png" alt="producer network latency chart for waterdrop" />
</p>

## What is the purpose of the `karafka_consumers_reports` topic?

The `karafka_consumers_reports` topic is an integral component of the Karafka [Web UI](Web-UI-About). Its primary purpose is to store information related to the processes and operations of the Karafka application. This, along with other Web UI topics, is designed to capture and provide data. By doing so, Karafka Web UI eliminates the need for an external third-party database, allowing it to leverage Kafka as its primary source of information.

## Why does the `karafka_consumers_commands` topic generate constant network traffic?

The `karafka_consumers_commands` topic generates consistent network traffic because it operates as a pub-sub mechanism for the commanding feature. When commanding is enabled (which is the default), each consumer process maintains an active subscription to this single-partition topic to receive administrative commands from the Web UI, such as pause, trace, quiet, and stop operations.

Since all consumer processes subscribe to this topic simultaneously, it creates continuous polling activity that appears as constant network traffic, even when no commands are being issued. This traffic pattern is normal and expected behavior for the commanding system.

The traffic volume is typically insignificant because the topic is low-intensity with minimal new data under normal circumstances. However, it may appear more prominent on network monitoring graphs when other topics have lower traffic volumes.

If commanding functionality is not needed, it can be disabled to eliminate this traffic:

```ruby
Karafka::Web.setup do |config|
  config.commanding.active = false
end
```

For more details, see the [Commanding](Pro-Web-UI-Commanding) documentation.

## Is it possible to exclude `karafka-web` related reporting counts from the web UI dashboard?

No.

## Why is the "Dead" tab in Web UI empty in my Multi App setup?

If the "Dead" tab in your Karafka Web UI is empty, especially within a multi-app setup, there are two primary reasons to consider based on the DLQ routing awareness section:

1. **DLQ Topic References Not Configured**: The most likely reason is that the Dead Letter Queue (DLQ) topics have yet to be explicitly referenced in the `karafka.rb` configuration of the application serving the Web UI. Without these references, the Web UI lacks the context to identify which topics are designated as DLQs. This means that even if messages are being routed to a DLQ, the Web UI will not display these topics under the "Dead" tab because it does not recognize them as such. Ensure that all DLQ topics are correctly defined in the routing configuration of the Karafka application hosting the Web UI to resolve this issue. You can read more about this issue [here](Web-UI-Multi-App#dlq-routing-awareness).

1. **Non-existent DLQ Topic**: Another possibility is that the DLQ topic itself does not exist. In scenarios where messages fail processing and are supposed to be routed to a DLQ, the absence of the designated DLQ topic would result in no messages being stored or visible in the "Dead" tab. This could occur if the DLQ topic were never created in Kafka or if there needs to be a misconfiguration in the topic name within your application's settings, leading to a mismatch between where Karafka attempts to route failed messages and the actual topic structure in Kafka.

To troubleshoot and resolve this issue, you should:

- **Verify DLQ Topic Configuration**: Double-check your `karafka.rb` file to ensure that DLQ topics are correctly referenced within the routing configuration. Ensure the topic names match the expected DLQ topics in your Kafka setup.

- **Check Kafka for DLQ Topic Existence**: Ensure that the DLQ topics are created and exist within your Kafka cluster. You can use Kafka command-line tools or a Kafka management UI to list topics and verify their existence.

- **Review Topic Naming Consistency**: Ensure consistency in topic naming across your Kafka configuration and Karafka setup. Any discrepancy could lead to failed message routing.

## Why are message and batch numbers increasing even though I haven't sent any messages?

Karafka Web-UI uses Kafka to report the status of Karafka processes, sending status messages every 5 seconds by default. This is why you see the message and batch numbers increasing. The web UI uses these Kafka messages to show the status of the processes.

Karafka processes messages in batches, and the value you see indicates how many batches have been processed, even if a batch contains only one message.

To view the actual payload of messages sent from producer to consumer, you can use the Karafka Explorer.

## What does `config.ui.sessions.secret` do for the Karafka Web UI? Do we need it if we are using our authentication layer?

The `config.ui.sessions.secret` configuration is used for CSRF (Cross-Site Request Forgery) protection in the Karafka Web UI. Even if you use your own authentication layer, you must set this configuration. It's not critical, but it needs to be set.

Since you have your own authentication, this configuration becomes secondary, though it still provides an additional layer of protection. Ensure that the secret is consistent across all deployment instances, with one value per environment.

## Can we change the name of Karafka's internal topic for the Web UI?

Yes, you can change the name of Karafka's internal topic for the Web UI.

For instance, if you need to prepend a unique combination before the topic's name, such as `12303-karafka_consumers_states`, this is feasible.

Detailed instructions on how to configure this can be found in the Karafka documentation under [this](Web-UI-Configuration#using-a-shared-kafka-cluster-for-multiple-karafka-application-environments) section.

## Is there a way to control which pages we show in the Karafka Web UI Explorer to prevent exposing PII data?

Yes. Karafka provides an API for visibility filtering, which allows you to decide what to display, and whether options to download payloads and JSON versions should be usable. Additionally, you can sanitize certain fields from being presented.

For detailed information, refer to the [Pro Enhanced Web UI Policies documentation](Pro-Web-UI-Policies).

## Why does Karafka Web UI stop working after upgrading the Ruby slim/alpine Docker images?

Recent changes in the official Ruby slim and alpine Docker images removed several system dependencies, including the `procps` package that provides the `ps` command. The `ps` command is required by Karafka Web UI for process management and monitoring.

To resolve this issue, you need to explicitly add the `procps` package to your Dockerfile. For Debian-based images (slim), add:

```shell
RUN apt-get update && apt-get install -y procps
```

For Alpine-based images, add:

```shell
RUN apk add --no-cache procps
```

You can find the complete list of required system commands in our [Getting Started documentation](Web-UI-Getting-Started#external-shellos-required-commands).

## Why does installing `karafka-web` take exceptionally long?

When installing `karafka` and `karafka-web`, especially in Docker environments like `ruby:3.4.2-slim`, you might notice installation appears exceptionally slow. However, this delay is typically **not** caused by `karafka` itself.

Instead, the slowdown usually results from compiling native extensions for other gems - most commonly `grpc`. Bundler's parallel installation can mislead you into thinking that `karafka-web` is slow, as the log messages for other gems (like `grpc`) may appear after the message indicating `karafka-web` installation, giving a false impression of delay.

Karafka itself includes native extensions via the `karafka-rdkafka` gem, but its compilation typically completes quickly (usually within 1-2 minutes).

On the other hand, compiling `grpc` from source can take significantly longer (up to 20 minutes or more), particularly in resource-constrained CI environments.

You can verify the bottleneck by running:

```shell
bundle install --jobs=1
```

This command disables parallel installation, clearly showing compilation times per gem.

## Can I disable logging for Karafka Web UI consumer operations while keeping it for my application consumers?

Yes, you can selectively disable logging for Karafka Web UI consumer operations by subclassing the `LoggerListener` and filtering based on the consumer type.

By default, Karafka logs all consumer operations, including those from the Web UI, because this information can be valuable for debugging overloaded processes or understanding system behavior. However, if you want to reduce log noise, especially in development, you can create a custom logger listener:

```ruby
class MyLogger < Karafka::Instrumentation::LoggerListener
  def on_worker_process(event)
    job = event[:job]
    consumer = job.executor.topic.consumer

    return if consumer == Karafka::Web::Processing::Consumer

    super
  end

  def on_worker_processed(event)
    job = event[:job]
    consumer = job.executor.topic.consumer

    return if consumer == Karafka::Web::Processing::Consumer

    super
  end
end
```

Then replace the default logger listener with your custom one in your `karafka.rb`:

```ruby
# Remove the default logger listener and add your custom one
Karafka.monitor.subscribe(MyLogger.new)
```

This approach allows you to maintain detailed logging for your application consumers while filtering out the Web UI consumer logs that may flood your development logs. The same pattern can be extended to filter other types of operations as needed.

## What is the serialization format for Karafka Web UI internal topics?

Karafka Web UI internal topics use compressed JSON serialization for all messages. This approach leverages Ruby's built-in compression capabilities without requiring additional third-party gems, ensuring compatibility and simplicity for all users.

## What is the expected message throughput for Karafka Web UI internal topics?

The write throughput for Karafka Web UI internal topics follows predictable patterns based on your deployment. The throughput is proportional to the number of consumer processes for some topics, while others maintain fixed rates regardless of process count. The number of messages consumed by your consumers does not impact the throughput of these internal topics, as reporting frequency remains constant.

All detailed throughput rates, message volumes, and operational cost breakdowns for each internal topic can be found in the [Web UI Operational Cost Breakdown](https://karafka.io/docs/Web-UI-Operational-Cost-Breakdown/) documentation.

## What Kafka ACLs are required for the Karafka Web UI to work?

When deploying Karafka Web UI in a Kafka cluster with explicit ACLs, you need to grant permissions for both the Web UI topics (`karafka_consumers_reports`, `karafka_consumers_states`, `karafka_consumers_metrics`, `karafka_consumers_commands`, and `karafka_errors`) and the consumer groups (`karafka_admin` and `karafka_web`).

For detailed information about required permissions and configuration options, see the [Kafka ACL Requirements](Web-UI-Getting-Started#kafka-acl-requirements) section in the Web UI documentation.
