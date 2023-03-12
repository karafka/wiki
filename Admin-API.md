Karafka has a few simple admin functions that allows for getting cluster info and creating and deleting topics.

**Note**: Admin actions will always be applied to the **default** cluster defined in the configuration.

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

**Note**: While the returned messages are `Karafka::Messages::Message` objects, they may not hold the correct notion of the topic details unless the given topic is defined in Karafka routes. For topics that are not defined, defaults will be used.

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

## Adding partitions to a topic

If you want to add partitions to an existing topic, you can use the `create_partitions` admin method:

```ruby
topic_name = 'my-busy-topic'
# Indicates how many partitions we want to end up with
total_partitions = 20

Karafka::Admin.create_partitions(topic_name, total_partitions)
```

This method will create all the additional partitions to reach your desired count.
