Karafka provides application administrative functions via the built-in `Karafka::Admin` module, including topic and consumer group management, cluster administration, and more.

!!! Tip "Asynchronous Operation Propagation"

    Many Kafka administrative operations (ACLs, configs, topics) are asynchronous in nature. When an API call returns successfully, this means the controller has accepted the request, not that the change has been fully propagated across the cluster. Configuration changes, ACL updates, and topic modifications may take several seconds to be applied on all brokers, depending on cluster size and network conditions. Always allow time for propagation and verify changes are applied across your cluster before proceeding with dependent operations.

!!! Hint "Default Cluster Limitation"

    All admin operations in Karafka always run on the default cluster. To run admin operations on multiple clusters, you need separate Karafka boot files for each cluster. For more details, visit the [Multi-Cluster Setup](#multi-cluster-setup) section.

## Configuration

`Karafka::Admin` operates using the default cluster configuration, employing a distinct consumer group name, specifically `karafka_admin`. It's essential to understand that the Web UI also leverages this same consumer group as it utilizes the Admin API internally. If you're implementing granular Kafka ACLs (Access Control List) permissions, ensure that the `karafka_admin` consumer group is granted the necessary permissions to function effectively. If you're using `karafka-web`, you will also need the same permissions applied to the `karafka_web` group as well.

`Karafka::Admin` gets a consistent prefix alongside all other consumer groups, allowing you to streamline permissions across all the consumer groups associated with that application.

For example, if you're using Kafka ACLs with prefixed wildcard permissions, `Karafka::Admin` will be subject to the naming patterns established by the Consumer Mapper, ensuring security and consistent access control.

If you wish to reconfigure `Karafka::Admin`, you may alter the `config.admin` scope during the Karafka framework configuration. You may, for example, use an alternative `group_id` to replace the default `karafka_admin` part and alter the `kafka` scope settings.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"

    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092'
    }

    # Fetch 20MB at most with admin, instead of the default 5MB
    config.admin.kafka[:'fetch.message.max.bytes'] = 20 * 1_048_576
    # Replace karafka_admin group name component with app_admin
    config.admin.group_id = 'app_admin'
  end
end
```

We **strongly advise against** modifying the `config.admin.kafka` settings in their entirety, as they have been configured to meet the demands of admin operations. For any adjustments, we suggest adopting the granular approach outlined above.

Please note that in the case of `kafka` settings, if a given setting is not found, the root `kafka` scope value will be used.

### Multi-Cluster Setup

Karafka allows you to manage multiple Kafka clusters using the `KARAFKA_BOOT_FILE` environment variable. This variable can point to different Karafka boot files configured for a specific cluster. By changing the value of `KARAFKA_BOOT_FILE`, you can specify which cluster to use when performing any Karafka admin and declarative topics operations.

```ruby
# cluster1.rb

class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"

    config.kafka = {
      'bootstrap.servers': '192.168.1.2:9092'
    }
  end
end
```

```ruby
# cluster2.rb

class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"

    config.kafka = {
      'bootstrap.servers': '192.168.1.10:9092'
    }
  end
end
```

```bash
# Access Karafka console to operate in cluster 1
export KARAFKA_BOOT_FILE=cluster1.rb
bundle exec karafka console

# Same applies to declarative topics management
export KARAFKA_BOOT_FILE=cluster2.rb
bundle exec karafka topics migrate
```

## Creating a Topic

```ruby
topic_name = 'my_cool_topic'
partitions_count = 2
replication_factor = 1 # 1 for dev, for prod you want more

Karafka::Admin.create_topic(topic_name, partitions_count, replication_factor)
```

## Deleting a Topic

```ruby
topic_name = 'my_cool_topic'

Karafka::Admin.delete_topic(topic_name)
```

## Altering a Topic

Karafka provides two distinct approaches for managing and altering topic configurations:

- [Declarative Topics](https://karafka.io/docs/Declarative-Topics/) (Recommended for most cases)
- [Admin Configs API](https://karafka.io/docs/Admin-Configs-API/) (For lower-level control)

### Declarative Topics Approach

The Declarative Topics feature provides a high-level, code-based way to manage topic configurations. This approach is recommended for most users as it offers:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ... other config ...
  end

  routes.draw do
    topic :orders do
      config(
        partitions: 6,
        replication_factor: 3,
        'cleanup.policy': 'compact',
        'retention.ms': 604_800_000 # 7 days
      )
    end
  end
end
```

Apply changes using:

```bash
bundle exec karafka topics migrate
```

### Admin Configs API Approach

For cases requiring more granular control, you can use the Admin Configs API to directly manage topic configurations:

```ruby
# Describe current topic configuration
resource = Karafka::Admin::Configs::Resource.new(type: :topic, name: 'orders')
topics = Karafka::Admin::Configs.describe(resource)

# Alter topic configuration
resource = Karafka::Admin::Configs::Resource.new(type: :topic, name: 'orders')
resource.set('retention.ms', '7200000')  # Set retention to 2 hours
Karafka::Admin::Configs.alter(resource)
```

## Getting Cluster Info

```ruby
# Get cluster info and list all the topics
info = Karafka::Admin.cluster_info

puts info.topics.map { |topic| topic[:topic_name] }.join(', ')
```

## Reading Topic Messages

By using the `read_topic` method, you can read data from a given topic partition without subscribing to it.

!!! note ""

    While the returned messages are `Karafka::Messages::Message` objects, they may not hold the correct notion of the topic details unless the given topic is defined in Karafka routes. For topics that are not defined, defaults will be used.

!!! note ""

    When using the `#read_topic` method in the Karafka Admin API to retrieve messages from a topic partition, it's essential to understand that this method skips offsets of compacted messages and transactions-related messages. This means that these specific messages won't be fetched or displayed even if they exist in the topic partition. However, while these messages are skipped during retrieval, they are still included in the total counts for those in that partition.

    This behavior implies that if you request a certain number of the most recent messages, say the last 10, and all these 10 messages were either related to transactions or were compacted, then the `#read_topic` method will return no data. Thus, you might find situations where you expect data based on the total count but get none due to this offset-skipping behavior.

### Getting Last N Messages

```ruby
topic = 'my_topic'
partition = 0
how_many = 10

messages = Karafka::Admin.read_topic(topic, partition, how_many)

messages.each do |message|
  puts message.raw_payload
end
```

### Getting Messages From a Given Offset

```ruby
topic = 'my_topic'
partition = 0
how_many = 10
first_offset = 50

messages = Karafka::Admin.read_topic(topic, partition, how_many, first_offset)

messages.each do |message|
  puts message.raw_payload
end
```

### Getting Messages From a Given Time

```ruby
topic = 'my_topic'
partition = 0
how_many = 10
# Read at most 10 messages starting 60 seconds ago
start_at = Time.now - 60

messages = Karafka::Admin.read_topic(topic, partition, how_many, start_at)

messages.each do |message|
  puts message.raw_payload
end
```

## Adding Partitions To a Topic

If you want to add partitions to an existing topic, you can use the `create_partitions` admin method:

```ruby
topic_name = 'my-busy-topic'
# Indicates how many partitions we want to end up with
total_partitions = 20

Karafka::Admin.create_partitions(topic_name, total_partitions)
```

This method will create all the additional partitions to reach your desired count.

## Reading the Watermark Offsets

Watermark offsets represent the current high and low offsets for each partition in a topic.

- The high-watermark offset is the offset of the last message that has been fully replicated across all of the brokers in the Kafka cluster.
- The low watermark offset is important because it determines the starting point for a new consumer reading from a partition. When a consumer subscribes to a Kafka topic, it must know where to start reading messages from in each partition. A new consumer will start reading from the low watermark offset by default.

Watermark offsets are used to track consumers' progress in a Kafka topic. As a consumer reads messages from a topic, it keeps track of the offset of the last message consumed for each partition. By comparing this offset to the watermark offset, the consumer can determine how far behind it is in processing messages.

You can access this information using the `#read_watermark_offsets` admin method as follows:

```ruby
topic = 'my_topic'
partition = 1

low, high = Karafka::Admin.read_watermark_offsets(topic, partition)

puts "Low watermark offset: #{low}"
puts "High watermark offset: #{high}"
```

## Reading Lags and Offsets of a Consumer Group

This functionality provides the means to track and understand the consumption progress of consumer groups across specific topics and partitions within your Kafka setup. It is crucial for monitoring the health and performance of your Kafka consumers, as it helps identify any delays or backlogs in processing messages.

Using the following method, you can obtain the lags and offsets for a specific consumer group across selected topics. This will provide insights into how far behind each partition is from the latest message.

If consumer groups are not specified, the method will default to monitoring all consumer groups defined in the Karafka routing configuration with active topics, according to the `active_topics_only` parameter. This ensures comprehensive coverage of your Karafka setup, providing visibility into all potentially active consumption patterns without explicit specification.

### Reading Lags of All Active Routing Topics

To get the lag for all active topics in your Karafka setup, invoke `#read_lags_with_offsets` without any arguments. Karafka will automatically use the consumer groups and active topics defined in `karafka.rb`:

```ruby
lags_with_offsets = Karafka::Admin.read_lags_with_offsets

lags_with_offsets.each do |group_name, topics|
  puts "Consumer group: #{group_name}"

  topics.each do |topic_name, partitions|
    puts "  Topic: #{topic_name}"

    partitions.each do |partition, data|
      offset = data[:offset]
      lag = data[:lag]
      puts "    Partition: #{partition}, Offset: #{offset}, Lag: #{lag}"
    end
  end

  puts
end

# Consumer group: cg0
#   Topic: visits
#     Partition: 0, Offset: 204468, Lag: 6
#     Partition: 1, Offset: 180631, Lag: 0
#     Partition: 2, Offset: 181414, Lag: 5
#     Partition: 3, Offset: 181070, Lag: 8
#     Partition: 4, Offset: 180974, Lag: 4
# 
# Consumer group: karafka_web
#   Topic: karafka_consumers_reports
#     Partition: 0, Offset: 48669, Lag: 2
```

### Reading Lags of All Routing Topics

To fetch lags for all topics, including inactive ones, set `active_topics_only` to `false` when calling `Karafka::Admin.read_lags_with_offsets`:

```ruby
lags_with_offsets = Karafka::Admin.read_lags_with_offsets(active_topics_only: false)

lags_with_offsets.each do |group_name, topics|
  puts "Consumer group: #{group_name}"

  topics.each do |topic_name, partitions|
    puts "  Topic: #{topic_name}"

    partitions.each do |partition, data|
      offset = data[:offset]
      lag = data[:lag]
      puts "    Partition: #{partition}, Offset: #{offset}, Lag: #{lag}"
    end
  end

  puts
end

# Consumer group: cg0
#   Topic: visits
#     Partition: 0, Offset: 204569, Lag: 12
#     Partition: 1, Offset: 180736, Lag: 9
#     Partition: 2, Offset: 181511, Lag: 11
#     Partition: 3, Offset: 181163, Lag: 3
#     Partition: 4, Offset: 181075, Lag: 14
# 
# Consumer group: karafka_web
#   Topic: karafka_consumers_reports
#     Partition: 0, Offset: 48689, Lag: 3
#   Topic: karafka_consumers_states
#     Partition: 0, Offset: -1, Lag: -1
#   Topic: karafka_consumers_metrics
#     Partition: 0, Offset: -1, Lag: -1
#   Topic: karafka_consumers_commands
#     Partition: 0, Offset: -1, Lag: -1
#   Topic: karafka_errors
#     Partition: 0, Offset: -1, Lag: -1
```

### Reading Lags of Selected Consumer Groups and Topics

To get lags for a specific subset of data, you can explicitly define the consumer groups and topics you're interested in:

```ruby
# Specify the consumer group and the topics you are interested in
consumer_group_with_topics = {
  'example_consumer_group' => ['topic1', 'topic2']
}

# Fetch the lags and offsets
lags_with_offsets = Karafka::Admin.read_lags_with_offsets(consumer_group_with_topics)

lags_with_offsets.each do |group_name, topics|
  puts "Consumer group: #{group_name}"

  topics.each do |topic_name, partitions|
    puts "  Topic: #{topic_name}"

    partitions.each do |partition, data|
      offset = data[:offset]
      lag = data[:lag]
      puts "    Partition: #{partition}, Offset: #{offset}, Lag: #{lag}"
    end
  end

  puts
end

# Consumer group: example_consumer_group
#   Topic: topic1
#     Partition: 0, Offset: 204676, Lag: 3
#     Partition: 1, Offset: 180825, Lag: 3
#     Partition: 2, Offset: 181592, Lag: 4
#     Partition: 3, Offset: 181249, Lag: 7
#     Partition: 4, Offset: 181154, Lag: 6
#
#   Topic: topic2
#     Partition: 0, Offset: 4676, Lag: 7
#     Partition: 1, Offset: 825, Lag: 12
```

### Edge Cases and Considerations

- **Non-existent Topics**: Returns an empty hash for non-existent topics to indicate the absence of data.

- **Unconsumed Topics**: Topics with no recorded consumption by the specified consumer group will show a lag and offset of -1 for each partition, highlighting inactivity.

- **Kafka-centric Lag Reporting**: The reported lags reflect Kafka's internal tracking rather than the consumer's acknowledged state, which may differ based on the consumer's internal processing.

## Renaming a Consumer Group

!!! Warning "Never Rename Active Consumer Groups"

    This method should **not** be used on actively running consumer groups, as it involves creating a temporary consumer to handle offset migration. Running this operation on active groups may cause unexpected behavior.

The `rename_consumer_group` method in Karafka Admin API allows you to rename an existing consumer group while preserving its offsets for specific topics. This method is beneficial when reorganizing or consolidating consumer group names without losing track of the consumption state.

```ruby
Karafka::Admin.rename_consumer_group(
  'old_group_name',
  'new_group_name',
  ['topic1', 'topic2']
)
```

When using `rename_consumer_group`, the method ensures that offsets from the old consumer group are transferred to the new one, maintaining continuity in message consumption. You need to specify which topics should have their offsets migrated during the rename, giving you control over the process. By default, the original consumer group is deleted after the rename, but you can retain it by setting `delete_previous` to `false`.

!!! Tip "Offset Merger with Existing Consumer Groups"

    If the new consumer group already exists, the offsets from the old group will be merged into it. This may result in the continuation of message processing from the combined offsets, so plan accordingly.

## Copying a Consumer Group

!!! warning "Never Copy Active Consumer Groups"

  This method should **not** be used on actively running consumer groups, as it involves creating a temporary consumer to handle offset migration. Running this operation on active groups may cause unexpected behavior.

The `#copy_consumer_group` method in Karafka Admin API allows you to copy offsets from an existing consumer group to another while preserving its consumption state for specific topics. This functionality is useful when creating a duplicate consumer group with the same consumption progress as an existing one.

```ruby
Karafka::Admin.copy_consumer_group(
  'source_group_name',
  'target_group_name',
  ['topic1', 'topic2']
)
```

When using `#copy_consumer_group`, the method ensures that offsets from the source consumer group are transferred to the target one, maintaining continuity in message consumption. You need to specify which topics should have their offsets copied during the process, giving you control over what gets migrated.

!!! Tip "Offset Merger with Existing Consumer Groups"

    If the target consumer group already exists, the offsets from the source group will be merged into it. This may result in the continuation of message processing from the combined offsets, so plan accordingly.

The method returns `true` if offsets were successfully copied or `false` if there was nothing to copy (for example, if the source consumer group doesn't exist or has no committed offsets for the specified topics).

This functionality is particularly useful for:

- Creating backup consumer groups before making significant changes
- Testing new consumer configurations with the same consumption progress
- Setting up disaster recovery scenarios

Unlike `#rename_consumer_group`, this method preserves the source consumer group, allowing both groups to exist simultaneously.

## Deleting a Consumer Group

!!! warning "Never Delete Active Consumer Groups"

    This method should only be used for consumer groups **not** actively used. Deleting a consumer group that is currently in use (running) can lead to data loss, inconsistencies, or unexpected behavior in your Kafka cluster.

The `Karafka::Admin.delete_consumer_group` method is designed to remove an existing consumer group from a Kafka cluster. This method effectively disbands the specified group, removing its metadata and state from the Kafka cluster.

To use it, all you need to do is to provide your consumer group name:

```ruby
Karafka::Admin.delete_consumer_group('your_consumer_group_name')
```

## Changing an Offset of a Consumer Group

!!! warning "Never Alter Active Consumer Groups"

    This method should only be used for consumer groups **not** actively used. Altering a consumer group that is currently in use (running) can lead to data loss, inconsistencies, or unexpected behavior in your Kafka cluster.

This method allows you to modify the offset for a specific topic within a consumer group, effectively controlling where the group starts consuming messages from within the topic.

The `Karafka::Admin.seek_consumer_group` method takes two primary arguments:

the name of the consumer group
a topic-partition hash with topics, partitions, and offsets where the consumer group should be moved

When invoked, it changes the current offset of the specified consumer group for the given topics to the new offsets provided. This method is beneficial when you need to reprocess or skip specific messages due to various operational requirements.

### Changing an Offset for All Partitions

You can specify a hash mapping topics to integer offsets, allowing the adjustment of offsets for entire partitions within those topics:

```ruby
Karafka::Admin.seek_consumer_group(
  'my_consumer_group',
  {
    # move offset to 0 on all partitions of this topic
    'my_topic1' => 0,
    # move offset to 1000 on all partitions of this topic
    'my_other_topic' => 1000
  }
  
)
```

### Changing an Offset for a Particular Partition

Alternatively, you can always move offset on specific partitions by specifying them directly:

```ruby
Karafka::Admin.seek_consumer_group(
  'my_consumer_group',
  {
    # move offset to 0 on partition 0 and to 10 on partition 1
    'my_topic1' => { 0 => 0, 1 => 10 },
    # move offset to 10 000 on partition 5 and to 50 000 on partition 20
    'my_other_topic' => { 5 => 10_000, 20 => 50_000 }
  }
)
```

### Changing an Offset to a Time-Based Location

`seek_consumer_group` method also accepts time references as offsets, allowing for precise time-based location seeking. Karafka automatically locates the matching offsets for the specified times and moves the consumer group position to this location.

```ruby
now = Time.now

Karafka::Admin.seek_consumer_group(
  'my_consumer_group',
  {
    # move offset back by 1 hour for partition 0, and 2 hours for partition 5
    'my_topic1' => { 0 => now - 60 * 60, 5 => now - 60 * 60 * 2 },
    # move offset back by five minutes for all the partitions of the given topic
    'my_other_topic' => now - 60 * 5
  }
)
```

### Changing an Offset to Earliest or Latest

Adjusting consumer group offsets to "earliest" or "latest" helps control where consumption begins within a topic. However, these terms can be misleading, particularly with compacted topics where the "earliest" offset may not be zero due to log cleanup and message expiration. The "earliest" setting allows consumers to start from the oldest available message, ensuring comprehensive data coverage.

Conversely, the "latest" offset refers to the end of the log, indicating the point where new messages will be appended. Setting the offset to "latest" means consumption will start with new messages arriving post-adjustment, which is ideal for applications focused on real-time data.

The `Karafka::Admin.seek_consumer_group` method facilitates easy adjustment of offsets to either "earliest" or "latest", applicable across entire topics or specific partitions:

```ruby
# Adjust offsets for specific partitions
Karafka::Admin.seek_consumer_group(
  'your_consumer_group',
  {
    'your_topic' => {
      0 => :latest,    # Start reading new messages from partition 0
      1 => :earliest  # Start from the oldest message in partition 1
    }
  }
)

# Adjust all partitions of a topic to the earliest or latest
Karafka::Admin.seek_consumer_group(
  'your_consumer_group',
  { 'your_topic' => :earliest }  # Start all partitions from the oldest available message
)

Karafka::Admin.seek_consumer_group(
  'your_consumer_group',
  { 'your_topic' => :latest }  # Start consuming new messages across all partitions
)
```

Using `:earliest` and `:latest` is vital for managing consumer behavior, ensuring flexibility in data consumption strategies according to specific needs.
