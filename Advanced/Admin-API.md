Karafka provides application administrative functions via the built-in `Karafka::Admin` module, including topic and consumer group management, cluster administration, and more.

!!! note ""

    Admin actions will always be applied to the **default** cluster defined in the configuration.

## Configuration

`Karafka::Admin` operates using the default cluster configuration, employing a distinct consumer group name, specifically `CLIENT_ID_karafka_admin` where `CLIENT_ID` corresponds to the configured `client_id` value and is subject to the [Consumer Mapper](https://karafka.io/docs/Consumer-mappers/) logic as any other consumer group used throughout Karafka.

It's essential to understand that the Web UI also leverages this same consumer group as it utilizes the Admin API internally. If you're implementing granular Kafka ACLs (Access Control List) permissions, ensure that the `CLIENT_ID_karafka_admin` consumer group is granted the necessary permissions to function effectively.

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

## Creating a topic

```ruby
topic_name = 'my_cool_topic'
partitions_count = 2
replication_factor = 1 # 1 for dev, for prod you want more

Karafka::Admin.create_topic(topic_name, partitions_count, replication_factor)
```

## Deleting a topic

```ruby
topic_name = 'my_cool_topic'

Karafka::Admin.delete_topic(topic_name)
```

## Getting cluster-info

```ruby
# Get cluster info and list all the topics
info = Karafka::Admin.cluster_info

puts info.topics.map { |topic| topic[:topic_name] }.join(', ')
```

## Reading topic messages

By using the `read_topic` method, you can read data from a given topic partition without subscribing to it.

!!! note ""

    While the returned messages are `Karafka::Messages::Message` objects, they may not hold the correct notion of the topic details unless the given topic is defined in Karafka routes. For topics that are not defined, defaults will be used.

!!! note ""

    When using the `#read_topic` method in the Karafka Admin API to retrieve messages from a topic partition, it's essential to understand that this method skips offsets of compacted messages and transactions-related messages. This means that these specific messages won't be fetched or displayed even if they exist in the topic partition. However, while these messages are skipped during retrieval, they are still included in the total counts for those in that partition.

    This behavior implies that if you request a certain number of the most recent messages, say the last 10, and all these 10 messages were either related to transactions or were compacted, then the `#read_topic` method will return no data. Thus, you might find situations where you expect data based on the total count but get none due to this offset-skipping behavior.

### Getting last N messages

```ruby
topic = 'my_topic'
partition = 0
how_many = 10

messages = Karafka::Admin.read_topic(topic, partition, how_many)

messages.each do |message|
  puts message.raw_payload
end
```

### Getting messages from a given offset

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

### Getting messages from a given time

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

## Adding partitions to a topic

If you want to add partitions to an existing topic, you can use the `create_partitions` admin method:

```ruby
topic_name = 'my-busy-topic'
# Indicates how many partitions we want to end up with
total_partitions = 20

Karafka::Admin.create_partitions(topic_name, total_partitions)
```

This method will create all the additional partitions to reach your desired count.

## Reading the watermark offsets

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
