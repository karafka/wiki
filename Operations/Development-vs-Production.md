When working with Karafka and Kafka, it's essential to understand the nuances between development (`development` and `test` environments) and production. Awareness of these differences ensures a smoother work experience and optimal system performance. Here's a detailed breakdown of some of the crucial considerations to keep in mind:

## Avoid Using Karafka's Reload Mode in Production

While Karafka offers a reload mode, which can be very helpful during development, it's crucial not to use this in a production environment. This mode can impact the performance and stability of your system. Always ensure that this mode is disabled before deploying to production.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other settings...

    # Recreate consumers with each batch. This will allow Rails code reload to work in the
    # development mode. Otherwise Karafka process would not be aware of code changes
    # It is recommended to have persistence turned on for any non-dev environment
    config.consumer_persistence = !Rails.env.development?
  end
end
```

## Pre-create Necessary Topics in the Production Kafka Cluster

Kafka topics act as communication channels for your messages. It is best to create all the required topics in your production Kafka cluster upfront. Doing so ensures no interruptions or issues when your application starts sending or receiving messages and that your topics have the desired number of partitions. You can use [Declarative Topics](Declarative-Topics) functionality for that.

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :system_events do
      config(
        partitions: 6,
        replication_factor: 3,
        'retention.ms': 86_400_000 # 1 day in ms,
        'cleanup.policy': 'delete',
        'compression.codec': 'gzip'
      )

      consumer EventsConsumer
    end
  end
end
```

## Disable Automatic Topic Creation in Production

When set to true, the `allow.auto.create.topics` setting enables Kafka to create topics automatically. However, it's recommended not to rely on this feature in a production environment. It's more controlled and predictable to manually set up your topics, ensuring they are configured correctly for your production needs.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'allow.auto.create.topics': !Rails.env.production?
    }
  end
end
```

## Lock Your Topics List in Development After Stabilization

As you develop and test, you may often modify your list of Kafka topics and their settings. However, once you stabilize your topic list, it's a good idea to lock it. Typos and minor errors can easily be overlooked, leading to potential issues propagating to production.

## Be Cautious with the Default Single Partition for Auto-created Topics

Topics that are automatically created because of `allow.auto.create.topics` are assigned just one partition by default. While this may suffice for development purposes, production environments often require multiple partitions for better performance and scalability. Ensure you configure your topics' appropriate number of partitions before deploying to production.

## Consider the Impact of Rolling Deployments on Rebalances

Whenever you do a rolling deployment of `N` processes, expect `N` rebalances to occur. Rebalances can impact the performance and stability of your Kafka cluster. However, using the `cooperative-sticky` rebalance strategy or the next-generation consumer protocol (KIP-848) can significantly mitigate these issues.

For Kafka 4.0+ with KRaft mode, the [next-generation consumer group protocol](Kafka-New-Rebalance-Protocol) is recommended:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'group.protocol': 'consumer'  # KIP-848 (requires Kafka 4.0+)
    }
  end
end
```

For older Kafka versions, use `cooperative-sticky`:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      # Fallback to cooperative-sticky for older brokers
      'partition.assignment.strategy': 'cooperative-sticky'
    }
  end
end
```

## Manual Topic Creation and Consumer Starting Sequence

Creating a topic manually or by sending the first message and then initiating a consumer is recommended. While Karafka does refresh cluster metadata information to detect new topics, this process can sometimes take over five minutes. Ensuring that the topic exists before starting a consumer reduces potential delays.

## Adjust Topic Metadata Refresh Interval for Production

In the development environment, the `topic.metadata.refresh.interval.ms` setting defaults to 5 seconds. This means Karafka quickly discovers any topic created after starting the Karafka service. However, in production, this short interval is not recommended. The default value for a production environment should be 5 minutes to reduce unnecessary overhead.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'topic.metadata.refresh.interval.ms': 5 * 60 * 1_000
    }
  end
end
```

## Opt for Advanced Rebalance Strategies in Production

For production environments, using advanced rebalance strategies significantly improves performance and stability during consumer group changes.

**Recommended (Kafka 4.0+ with KRaft):** Use the [next-generation consumer group protocol (KIP-848)](Kafka-New-Rebalance-Protocol) for rebalances with minimal disruption:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'group.protocol': 'consumer'
    }
  end
end
```

**Alternative (Older Kafka versions):** Use the `cooperative-sticky` rebalance strategy:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'partition.assignment.strategy': 'cooperative-sticky'
    }
  end
end
```

## Set the `compression.codec` for Both Topic/Broker Settings and Karafka

The `compression.codec` parameter in Kafka's configuration allows you to specify the compression algorithm to be used for messages. Kafka supports multiple compression algorithms like GZIP, LZ4, and Snappy. Karafka also honors the compression settings.

There are several reasons why you should configure compression for your production environments and why it needs to be set on both Kafka and Karafka levels:

- **Network Traffic Volume Reduction**: One of the main benefits of compression is to reduce the amount of data transmitted over the network. When producers send compressed data to the broker, and consumers receive it, it reduces the bandwidth utilized. Remember that compression **needs** to be set for both Kafka topics and Karafka to ensure data is being compressed before it is sent over the wire. Otherwise, the compression will occur only on the broker, and no network traffic savings will occur.

- **Consistency**: Keeping the compression setting consistent between producers, consumers, and brokers ensures the data is uniformly compressed throughout its lifecycle. This minimizes issues related to unsupported compression formats or mismatched compression expectations.

- **Performance & Storage**: Compressed data is typically smaller, leading to better storage efficiency on the broker side and quicker transmission times.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'compression.codec': 'gzip'
    }
  end
end
```

## Avoid Rolling Upgrades for Rebalance Protocol Changes

Whether changing the `partition.assignment.strategy` (classic protocol) or migrating to/from the `group.protocol` (KIP-848), rebalance protocol changes require careful coordination.

**Note:** Migrating to the [next-generation consumer group protocol (KIP-848)](Kafka-New-Rebalance-Protocol) **does** support rolling upgrades. See the migration guide for details.

When you switch between classic protocol assignment strategies, be aware that:

1. **Deployment Concerns**: Direct strategy shifts using rolling upgrades can result in conflicts. Running consumers with distinct assignment strategies within the same group will trigger an "Inconsistent group protocol" error, "assignors must have the same protocol type" error or similar

1. **Performance Variations**: Different strategies can lead to diverse load distributions, influencing the processing efficiency of individual consumers.

1. **Potential for Uneven Distribution**: Some strategies might result in specific consumers being assigned a larger share of partitions, leading to uneven work distribution.

1. **Compatibility Concerns**: Ensure the chosen strategy is compatible with your Kafka broker version. Some strategies might be exclusive to specific Kafka versions.

To ensure a smooth transition when adjusting the classic protocol assignment strategy, follow these steps:

1. **Backup Configuration**: Initiate the process by backing up your existing Kafka and Karafka configurations. This creates a recovery point in case complications arise.

1. **Test in a Non-Production Environment**: Before rolling out changes in a live setting, validate the new strategy in a controlled, non-production environment.

1. **Shutdown Consumers**: To sidestep the "Inconsistent group protocol" error and other critical issues, stop **all** consumers in the consumer group **before** enacting the change.

1. **Update Strategy & Restart**: Modify the `partition.assignment.strategy` with **all** consumers offline. Once adjusted, you can bring all consumers back online.

1. **Monitor Behavior**: Post-transition, maintain rigorous oversight of the consumer behaviors. Specifically, observe for unexpected rebalances or any imbalances in partition assignments.

## Messages from the Future / Time Drift Problem

In Kafka, every message (or record) produced to a topic carries metadata, including a timestamp. This timestamp is set by the producer or the broker when the message gets appended to the log. Consumers then use the timestamp to understand the chronological order of messages.

Under regular operations, this system works seamlessly. However, problems arise when there's a time drift between the Kafka cluster nodes and the consumer. Essentially, if the Kafka broker believes it's 2:00 PM, while the consumer thinks it's 1:50 PM, the messages produced in that 10-minute interval by the broker will appear as if they're coming from the "future" when consumed.

The time synchronization issue usually boils down to the Network Time Protocol (NTP). NTP is a protocol used to synchronize the clocks of computers to some time reference, which can be an atomic clock, GPS, or another reliable source.

- **NTP Not Installed**: If NTP isn't installed on the machines running Kafka or the consumer application, they rely on their internal clocks. Over time, even minor discrepancies between internal clocks can add up, leading to significant drifts.

- **NTP Malfunctions**: Even with NTP installed, there might be cases where it's not working correctly. This can happen for various reasons, like network issues, software bugs, or misconfigurations.

### Consequences of Time Drift

When Kafka and the consumer drift apart in time, it doesn't just result in the odd phenomenon of messages from the future. It can:

- Impact consumer logic that relies on time-based processing.

- Affect windowed operations in stream processing applications.

- Cause retention policies based on time to behave unpredictably.

- Cause other problems in Karafka Web UI tracking and reporting.

### How to Prevent Time Drift

1. **Ensure NTP is Installed**: Always ensure that NTP is installed on all machines running Kafka brokers and consumer applications.

2. **Monitor NTP Status**: Regularly monitor the NTP status to ensure it's running and is in sync with its time sources.

3. **Configure Alerts**: Set alerts for any significant time drift between the servers. This can provide early warnings before time drift becomes a problem.

4. **Synchronize Frequently**: Reduce the time between synchronization intervals to ensure that even minor drifts are corrected promptly.

In conclusion, while Kafka is a powerful tool, it's essential to remember the importance of time synchronization to ensure the reliable delivery and consumption of messages. Regularly monitoring and ensuring the correct functioning of NTP can prevent time drift issues, providing a smoother Kafka experience.

### Impact on Karafka

Karafka and Karafka Web UI internal operations starting from `2.2.4` are resilient to this issue, as Karafka normalizes the time for internal computation. While this will not crash your operations, please note that time-sensitive metrics may not be accurate.

## Configure your brokers' `offsets.retention.minutes` policy

`offsets.retention.minutes` in Apache Kafka is a configuration setting that determines how long the Kafka broker will retain the offsets of consumer groups. The offset is a crucial piece of information that records the position of a consumer in a topic, essentially marking which messages have been processed.

When a consumer is not running longer than the `offsets.retention.minutes` value, the following impacts can occur:

- **Loss of Offset Data**: Once the retention period is exceeded, the offsets for that consumer group are deleted. If the consumer starts again after this period, it won't have a record of where it left off in processing the messages.

- **Reprocessing of Messages**: Without the offset information, the consumer might start reading messages from the beginning of the log or the latest offset, depending on its configuration. This can lead to reprocessing messages (if they start from the beginning) or missing out on messages (if they start from the latest).

- **Data Duplication or Loss**: The impact on data processing depends on the consumer's configuration and the nature of the data. It could result in data duplication or data loss if not managed properly.

It's essential to set the `offsets.retention.minutes` value considering your consumer applications' most extended expected downtime to avoid these issues. Setting a longer retention period for offsets can be crucial for systems where consumers might be down for extended periods.

It's important to note that while the `offsets.retention.minutes` setting in Kafka might not seem particularly relevant in a development environment, it becomes crucial in a production setting.

In development, consumer downtimes are generally short, and losing offsets might not have significant consequences as the data is often test data, and reprocessing might not be a concern. However, in a production environment, consumer downtime can be more impactful if a consumer is down for a time exceeding the `offsets.retention.minutes` value. The loss of offset data can lead to significant issues like message reprocessing or missing out on unprocessed messages. This can affect data integrity and processing efficiency.

## Topics Metadata Propagation During their Creation and Removal

Apache Kafka, a distributed streaming platform, handles topic creation asynchronously. This means that when a new topic is created, there's a delay before it's recognized across all brokers in the Kafka cluster. This delay can cause temporary issues where the topic appears non-existent, leading to `unknown_topic` errors. To mitigate this, clients delay flagging a topic as non-existent for a default period of 30 seconds (configurable through `topic.metadata.propagation.max.ms`). This wait allows time for the topic metadata to propagate across the cluster.

In Karafka it has specific implications:

- **Delayed Writing to Newly Created Topics**: In Karafka, it's advisable not to start producing messages for a topic immediately after its creation using the Karafka Admin API. Due to Kafka's asynchronous nature, the topic might not be fully recognized across the cluster, leading to message delivery issues. Messages sent to these "in-limbo" topics get queued and might fail if the topic becomes unavailable within the propagation time.

- **Topic Replication and Usability Timeframe**: New topics must be fully replicated and usable across the cluster. This replication time varies depending on the cluster's size and configuration. In Karafka applications, developers should account for this delay and design their message-producing logic accordingly, allowing sufficient time for topics to stabilize within the Kafka ecosystem before initiating message production.

- **Handling Topic Resets**: Resetting topics in Karafka, especially in a production environment, should be approached with caution. Resetting a topic (deleting and recreating it) may lead to immediate marking of the topic as non-existent, as the propagation time does not apply in this scenario. This can cause significant disruptions in message flow and processing. We **do not** recommend removing and recreating topics on running systems. Always stop your producers and consumers before attempting to do so.

- **Topic Auto-Creation Considerations**: While Kafka and, by extension, Karafka support automatic topic creation, it's generally not recommended for consumer applications. Automatic topic creation can lead to issues where consumers attempt to consume from auto-created topics without producers, resulting in empty message sets.

In summary, when working with Kafka through Karafka, it's crucial to understand the asynchronous nature of Kafka's topic management. Developers should plan for propagation delays, be cautious with topic resets, and manage auto-creation settings judiciously to ensure a robust and reliable streaming application.

## `zstd` Support Issues on macOS

When using `rdkafka` or `karafka-rdkafka` on macOS, `zstd` support may break on macOS development machines. Users have encountered the following error:

```text
Karafka::Errors::InvalidConfigurationError:

Unsupported value "zstd" for configuration property "compression.codec": libzstd not available at build time
```

This issue occurs because of karafka-rdkafka not being linked against `libzstd`, even if `brew install zstd` was previously used to provide `zstd` support.

To resolve this issue, ensure that `pkg-config` is installed on your macOS machine. The absence of `pkg-config` can prevent `librdkafka` from finding `libzstd` during the build process.

```shell
brew install pkg-config
gem uninstall karafka-rdkafka
bundle install
```

The need for `pkg-config` might not have been apparent in older versions due to changes in macOS or dependencies over time.

## Challenges with Puma Worker Mode on macOS

Forking processes on macOS, especially from macOS High Sierra (10.13) onwards, can introduce significant challenges due to changes in how macOS handles system calls in forked processes. These challenges often manifest as errors such as:

- `[NSCharacterSet initialize] may have been in progress in another thread when fork()`

- Segmentation faults similar to: `[BUG] Segmentation fault at 0x0000000000000110`

You can find an extensive explanation of Karafka ecosystem components forking support [here](Forking).

## Be Aware of WaterDrop Default Producer Middleware Modifications

When applying middleware in `Karafka.producer` that modifies payloads or topics (like adding prefixes), you must consider that the Web UI also utilizes this producer. Any topic name changes must be applied across all environments and tools, including the Karafka Web UI. This ensures alignment between produced messages and what the Web UI expects. Alternatively, you can configure an independent Web UI with only a dedicated producer and not apply the middleware.

For example, when applying such a middleware:

```ruby
class NamespacerMiddleware
  def call(message)
    message[:topic] = "my_prefix.#{message[:topic]}"
    message
  end
end

Karafka.producer.middleware.append(NamespacerMiddleware.new)
```

Your Web UI topics configuration should look as follows:

```ruby
Karafka::Web.setup do |config|
  config.topics.errors.name = "my_prefix.karafka_errors"
  config.topics.consumers.reports.name = "my_prefix.karafka_consumers_reports"
  config.topics.consumers.states.name = "my_prefix.karafka_consumers_states"
  config.topics.consumers.metrics.name = "my_prefix.karafka_consumers_metrics"
  config.topics.consumers.commands.name = "my_prefix.karafka_consumers_commands"
end
```

## Consider Splitting Consumer Groups To Improve Stability and Performance

When working with Karafka and Kafka, it is crucial to understand how rebalancing works, especially as you scale your deployment. A common pitfall occurs when a single consumer group subscribes to multiple topics, with individual consumers within the group only consuming subsets of those topics. This configuration can lead to significant inefficiencies during rebalances, affecting all consumers in the group regardless of the specific topics they are consuming and the assignment strategy.

### Rebalance Mechanism

Consumers within the same consumer group will undergo the same rebalance cycle, even if they are subscribed to different topics. Here's a detailed explanation of how this process works:

- **Rebalance Trigger**: Rebalances can be triggered by several events, such as a new consumer joining the group, an existing consumer leaving, changes in subscription patterns, or changes in the number of partitions in the topics.

- **Subscription and Assignment**: Each consumer can subscribe to different topics in a consumer group. However, during a rebalance, Kafka assigns partitions to consumers based on the collective subscription of the entire group, not individual consumer subscriptions.

- **Partition Assignment**: Kafka's coordinator assigns partitions from the subscribed topics to the consumers within the group. Consumers receive partitions only from the topics to which they are subscribed, but the rebalance cycle affects all consumers in the group.

### Example Scenario

Consider a consumer group A with two consumers:

- Consumer 1 (C1) subscribes to Topic Y.
- Consumer 2 (C2) subscribes to Topic X.

During a rebalance:

- Kafka will assign partitions from Topic Y to C1.
- Kafka will assign partitions from Topic X to C2.

Despite C1 and C2 subscribing to different topics, both consumers are affected by the rebalance cycle.

### Considerations

For small-scale development environments, having a single consumer group with multiple topic subscriptions might be manageable. However, in larger deployments, particularly those with more than **10** processes, this approach can be sub-optimal. The key reasons are:

- **Performance Impact**: Frequent rebalances can temporarily degrade performance as partitions are reassigned, and consumers may experience brief downtimes.

- **Coordination Overhead**: The coordination and rebalance logic applies to the entire group, increasing the complexity and potential for inefficiencies.

- **Rebalance Timeouts**: In heterogeneous deployments, where consumers subscribe to different topics, the rebalance process can become more complex and prolonged. This complexity can lead to rebalance timeouts, where the rebalance cannot be completed within the time limitations imposed by Kafka settings, such as max.poll.interval.ms and session.timeout.ms.

### Recommendation

For larger deployments, organizing your consumers and topics is advisable so that each consumer group subscribes to a smaller, more focused set of topics. This reduces the scope and impact of rebalances, leading to more stable and performant applications.

## Configure `shutdown_timeout` for Cooperative-Sticky Strategy in Large Deployments

When deploying Kafka with the `cooperative-sticky` rebalance strategy in environments with many consumers and partitions, setting the `shutdown_timeout` to an appropriately high value is crucial. This ensures that the rebalance and shutdown processes are completed smoothly without causing consumer disruptions.

### Why Set a High `shutdown_timeout`?

The `shutdown_timeout` configuration defines the maximum time consumers can shut down gracefully. In larger deployments with many partitions, rebalances can take longer due to the complexity of ensuring minimal partition movement and maintaining a balanced load. A higher `shutdown_timeout` helps in:

- **Ensuring Graceful Shutdowns**: Allows consumers sufficient time to process in-flight messages and commit offsets, reducing the risk of data loss or reprocessing.

- **Reducing Rebalance Interruptions**: Prevents premature shutdowns during rebalances, which can cause additional rebalances and increase system instability.

- **Maintaining Consumer Health**: Gives consumers more time to handle their state transitions, ensuring a smoother rebalance process.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other configuration options...
    config.shutdown_timeout = 90_000 # 90 seconds
  end
end
```

### Choosing the Right `shutdown_timeout` Value

The appropriate value for shutdown_timeout depends on your specific deployment characteristics:

- **Consumer Group Size**: Larger groups with more consumers may need a higher timeout to accommodate the increased coordination required.

- **Partition Count**: More partitions mean more work during rebalances, necessitating a higher timeout.

- **Workload Characteristics**: If your consumers process messages quickly, a lower timeout might suffice. For slower processing, increase the timeout accordingly.

We recommend setting the `shutdown_timeout` to at least 30 seconds. A timeout of at least 90 seconds is advisable for larger deployments to ensure a smooth and stable rebalance process.

### Static Group Membership Usage

In addition to configuring `shutdown_timeout,` consider using static group membership if possible. Static group membership offers several benefits that can enhance the stability and efficiency of your consumer groups:

- **Minimized Rebalance Impact**: Static members maintain their identity across rebalances, reducing the need for frequent reassignments of partitions and improving overall group stability.

- **Faster Rebalance Process**: With static membership, the rebalance process can be completed more quickly as the coordinator has a clearer picture of group membership.

- **Improved Resource Utilization**: Static membership improves resource utilization by reducing the churn of consumer instances and minimizes the overhead associated with consumer state transitions.

To enable static group membership, set the `group.instance.id` configuration for each consumer instance in your `karafka.rb`:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Primary cluster
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      # Unique value per consumer group
      'group.instance.id': "consumer_instance_#{ENV['HOSTNAME']}"
    }

    # Other settings...
  end
end
```

!!! warning "Static Group Membership and Multiplexing in Dynamic Mode"

    We do not recommend using static group membership with Multiplexing operating in [Dynamic mode](Pro-Multiplexing#dynamic-multiplexing). Multiplexing in Dynamic mode involves frequent changes in group composition, which conflicts with the nature of static group membership that relies on stable consumer identities. This can lead to increased complexity and more prolonged assignment lags.

    However, Multiplexing can be used without issues if Dynamic mode is not enabled. In this configuration, consumers maintain a more predictable group composition, which aligns well with the principles of static group membership and ensures a more stable and efficient operation.

---

## See Also

- [Deployment](Operations-Deployment) - Production deployment strategies and best practices
- [Configuration](Configuration) - Environment-specific configuration options
- [Web UI Development vs Production](Web-UI-Development-vs-Production) - Web UI considerations for different environments
- [Monitoring and Logging](Operations-Monitoring-and-Logging) - Setting up monitoring for production environments
