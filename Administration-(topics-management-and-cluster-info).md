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
