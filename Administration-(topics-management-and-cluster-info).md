Karafka has a few simple admin module that allows for getting cluster info and creating and deleting topics.

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

Using the `read_topic` method, you can read data from a given topic partition without subscribing to it.

**Note**: While the returned messages are `Karafka::Messages::Message` objects, they do not hold a correct notion of the topic. This is because the admin API can also work with topics not being part of the routing. Hence there is no topic resolution. The default JSON deserializer is used.

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
