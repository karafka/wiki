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

Kafka topics act as communication channels for your messages. It would be best to create all the required topics in your production Kafka cluster upfront. Doing so ensures no interruptions or issues when your application starts sending or receiving messages and that your topics have the desired number of partitions. You can use [Declarative Topics](https://karafka.io/docs/Declarative-Topics) functionality for that.

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

Whenever you do a rolling deployment of `N` processes, expect `N` rebalances to occur. Rebalances can impact the performance and stability of your Kafka cluster. However, using the `cooperative-sticky` rebalance strategy can mitigate some of these issues.

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

## Opt for the cooperative-sticky Rebalance Strategy in Production

The `cooperative-sticky` rebalance strategy set via the `partition.assignment.strategy` configuration is highly recommended for production environments. It offers better performance and stability compared to other rebalance strategies.

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

## Avoid Rolling Upgrades for `partition.assignment.strategy` Changes

The `partition.assignment.strategy` in Kafka determines how topic partitions are allocated amongst the consumers in a consumer group. Adjusting this strategy can influence the distribution of partitions and, thus, the performance and efficiency of your consumers.

When you switch between assignment strategies, be aware that:

1. **Deployment Concerns**: Direct strategy shifts using rolling upgrades can result in conflicts. Running consumers with distinct assignment strategies within the same group will trigger an "Inconsistent group protocol" error, "assignors must have the same protocol type" error or similar

1. **Performance Variations**: Different strategies can lead to diverse load distributions, influencing the processing efficiency of individual consumers.

1. **Potential for Uneven Distribution**: Some strategies might result in specific consumers being assigned a larger share of partitions, leading to uneven work distribution.

1. **Compatibility Concerns**: Ensure the chosen strategy is compatible with your Kafka broker version. Some strategies might be exclusive to specific Kafka versions.

To ensure a smooth transition when adjusting the assignment strategy, follow these steps:

1. **Backup Configuration**: Initiate the process by backing up your existing Kafka and Karafka configurations. This creates a recovery point in case complications arise.

1. **Test in a Non-Production Environment**: Before rolling out changes in a live setting, validate the new strategy in a controlled, non-production environment.

1. **Shutdown Consumers**: To sidestep the "Inconsistent group protocol" error and other critical issues, stop **all** consumers in the consumer group **before** enacting the change.

1. **Update Strategy & Restart**: Modify the `partition.assignment.strategy` with **all** consumers offline. Once adjusted, you can bring all consumers back online.

1. **Monitor Behavior**: Post-transition, maintain rigorous oversight of the consumer behaviors. Specifically, observe for unexpected rebalances or any imbalances in partition assignments.

To recap, while modifying `partition.assignment.strategy` in Karafka may promise enhanced consumer efficiency, the transition demands solid planning and execution. With the insights and procedure outlined above, you're equipped to undertake the shift methodically and with minimal disruption.

## Messages from the Future / Time Drift Problem

In Kafka, every message (or record) produced to a topic carries metadata, including a timestamp. This timestamp is set by the producer or the broker when the message gets appended to the log. Consumers then use the timestamp to understand the chronological order of messages.

Under regular operations, this system works seamlessly. However, problems arise when there's a time drift between the Kafka cluster nodes and the consumer. Essentially, if the Kafka broker believes it's 2:00 PM, while the consumer thinks it's 1:50 PM, the messages produced in that 10-minute interval by the broker will appear as if they're coming from the "future" when consumed.

The time synchronization issue usually boils down to the Network Time Protocol (NTP). NTP is a protocol used to synchronize the clocks of computers to some time reference, which can be an atomic clock, GPS, or another reliable source.

- **NTP Not Installed**: If NTP isn't installed on the machines running Kafka or the consumer application, they rely on their internal clocks. Over time, even minor discrepancies between internal clocks can add up, leading to significant drifts.

- **NTP Malfunctions**: Even with NTP installed, there might be cases where it's not working correctly. This can happen for various reasons, like network issues, software bugs, or misconfigurations.

### Consequences of Time Drift

When Kafka and the consumer drift apart in time, it doesn’t just result in the odd phenomenon of messages from the future. It can:

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

```
Karafka::Errors::InvalidConfigurationError:

Unsupported value "zstd" for configuration property "compression.codec": libzstd not available at build time
```

This issue occurs because of karafka-rdkafka not being linked against `libzstd`, even if `brew install zstd` was previously used to provide `zstd` support.

To resolve this issue, ensure that `pkg-config` is installed on your macOS machine. The absence of `pkg-config` can prevent `librdkafka` from finding `libzstd` during the build process.

```
brew install pkg-config
gem uninstall karafka-rdkafka
bundle install
```

The need for `pkg-config` might not have been apparent in older versions due to changes in macOS or dependencies over time.

## Challenges with Puma Worker Mode on macOS

Forking processes on macOS, especially from macOS High Sierra (10.13) onwards, can introduce significant challenges due to changes in how macOS handles system calls in forked processes. These challenges often manifest as errors such as:

- `[NSCharacterSet initialize] may have been in progress in another thread when fork()`

- Segmentation faults similar like: `[BUG] Segmentation fault at 0x0000000000000110`

You can find an extensive explanation of Karafka ecosystem components forking support [here](https://karafka.io/docs/Forking/).
