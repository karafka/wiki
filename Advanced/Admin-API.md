Karafka provides application administrative functions via the built-in `Karafka::Admin` module, including topic and consumer group management, cluster administration, and more.

!!! note ""

    Admin actions will always be applied to the **default** cluster defined in the configuration.

## Configuration

`Karafka::Admin` operates using the default cluster configuration, employing a distinct consumer group name, specifically `karafka_admin`. It's essential to understand that the Web UI also leverages this same consumer group as it utilizes the Admin API internally. If you're implementing granular Kafka ACLs (Access Control List) permissions, ensure that the `karafka_admin` consumer group is granted the necessary permissions to function effectively. If you're using `karafka-web`, you will also need the same permissions applied to the `karafka_web` group as well.

`Karafka::Admin` gets a consistent prefix alongside all other consumer groups, allowing you to streamline permissions across all the consumer groups associated with that application.

For example, if you're using Kafka ACLs with prefixed wildcard permissions, `Karafka::Admin` will be subject to the naming patterns established by the Consumer Mapper, ensuring security and consistent access control.

If you wish to reconfigure `Karafka::Admin`, you may alter the `config.admin` scope during the Karafka framework configuration. You may, for example, use an alternative `group_id` to replace the default `karafka_admin` part and alter the `kafka` scope settings.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_application'

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

```ruby
# Specify the consumer group and the topics you are interested in
consumer_group = 'example_consumer_group'
topics = ['topic1', 'topic2']

# Fetch the lags and offsets
lags_and_offsets = Karafka::Admin.read_lags_with_offsets(consumer_group, topics)

# Output the fetched data
lags_and_offsets.each do |topic, partition_data|
  partition_data.each do |partition, data|
    puts "Topic: #{topic}, Partition: #{partition}, Offset: #{data[:offset]}, Lag: #{data[:lag]}"
  end
end
```

If consumer groups are not specified, the method will default to monitoring all consumer groups defined in the Karafka routing configuration with active topics, according to the `active_topics_only` parameter. This ensures comprehensive coverage of your Karafka setup, providing visibility into all potentially active consumption patterns without explicit specification.

### Edge Cases and Considerations

- **Non-existent Topics**: Returns an empty hash for non-existent topics to indicate the absence of data.

- **Unconsumed Topics**: Topics with no recorded consumption by the specified consumer group will show a lag and offset of -1 for each partition, highlighting inactivity.

- **Kafka-centric Lag Reporting**: The reported lags reflect Kafka's internal tracking rather than the consumer's acknowledged state, which may differ based on the consumer's internal processing.

## Deleting a Consumer Group

!!! warning "Never delete active consumer groups"

    This method should only be used for consumer groups **not** actively used. Deleting a consumer group that is currently in use (running) can lead to data loss, inconsistencies, or unexpected behavior in your Kafka cluster.

The `Karafka::Admin.delete_consumer_group` method is designed to remove an existing consumer group from a Kafka cluster. This method effectively disbands the specified group, removing its metadata and state from the Kafka cluster.

To use it, all you need to do is to provide your consumer group name:

```ruby
Karafka::Admin.delete_consumer_group('your_consumer_group_name')
```

## Changing an Offset of a Consumer Group

!!! warning "Never alter active consumer groups"

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

### Changing an Offset for a Particular Partiton

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
