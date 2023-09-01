Karafka allows you to manage your topics in two ways:

- Using the built-in [Declarative Topics](#declarative-topics) routing + CLI functionality (recommended)
- Directly via the [Admin API](#admin-api)

Karafka considers your topics setup (retention, partitions, etc.) as part of your business logic. You can describe them in the routing and make Karafka ensure their consistency across all the environments using the appropriate CLI commands. Thanks to that, you can make sure that everything is described as code.

**Note**: Admin actions will always be applied to the **default** cluster defined in the configuration.

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

## Declarative Topics

Keeping Kafka topics configuration as code has several benefits:

- Version Control: By keeping the topic settings as code, you can track changes over time and easily understand historical changes related to the topics. This is particularly important in a production environment where changes need to be carefully managed.

- Reproducibility: When you define Kafka topics settings as code, you can easily recreate the same topic with the same settings in multiple environments. This ensures that your development, staging, and production environments are consistent, which can help prevent unexpected issues and bugs.

- Automation: If you use code to define Kafka topics settings, you can automate the process of creating and updating topics. This can save time and reduce the risk of human error.

- Collaboration: When you keep Kafka topics settings as code, you can collaborate with other developers on the configuration. You can use tools like Git to manage changes and merge different configurations.

- Documentation: Code is self-documenting, meaning anyone can look at the configuration and understand what is happening. This can make it easier for new team members to get up to speed and help troubleshoot issues.

Overall, keeping Kafka topics settings as code can make it easier to manage, automate, and collaborate on Kafka topics, saving time and reducing the risk of errors.

Karafka [routing](Routing) allows you to do that via per topic `#config` method that you can use to describe your Kafka topic configuration.

This configuration is used by a set of Karafka [CLI](CLI) commands you can invoke to operate on your application's topics.

There are the following commands supported:

- `karafka topics create` - creates topics with appropriate settings.
- `karafka topics delete` - deletes all the topics defined in the routes.
- `karafka topics repartition` - adds additional partitions to topics with fewer partitions than expected.
- `karafka topics reset` - deletes and re-creates all the topics.
- `karafka topics migrate` - creates missing topics and repartitions existing to match expected partitions count.

The below example illustrates the usage of the `migrate` command to align the number of partitions and to add one additional topic:

<div class="asciinema" data-cols="100" data-rows="16" data-cast="topics-migrate">
  <span style="display: none;">
    Note: Asciinema videos are not visible when viewing this wiki on GitHub. Please use our
    <a href="https://karafka.io/docs">online</a>
    documentation instead.
  </span>
</div>

### Defining topic configuration

All the configuration for a given topic needs to be defined using the topic scope `#config` method.

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(
        partitions: 6,
        replication_factor: 3,
        'retention.ms': 86_400_000 # 1 day in ms,
        'cleanup.policy': 'delete'
      )

      consumer ConsumerA
    end

    topic :b do
      config(
        partitions: 2,
        replication_factor: 3
        # The rest will be according to the cluster defaults
      )

      consumer ConsumerB
    end
  end
end
```

If not invoked, the default config looks as followed:

```ruby
config(
  partitions: 1,
  replication_factor: 1
)
```

### Excluding topics from the topics management

If you want to manage only part of your topics using Karafka, you can set the `active` flag for a given topic configuration to false.

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(active: false)
    end
  end
end
```

This will effectively ignore this topic from being altered in any way by Karafka. Karafka will ignore this topic together in all the CLI topics related operations.

**Note**: Keep in mind that setting `active` to false inside the `#config` is **not** equivalent to disabling the topic consumption using the `active` method.

You can use Karafka to manage topics that you do not consume from as well by defining their config and making them inactive at the same time:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(
        partitions: 2,
        replication_factor: 3
      )

      active false
    end
  end
end
```

Setting such as above will allow Karafka to manage the topic while instructing Karafka not to try to consume it. A configuration like this is helpful in a multi-app environment where you want Karafka to manage topics, but their consumption belongs to other applications.

### Production usage

The topics management CLI **never** performs any destructive actions except the `delete` and `reset` commands. This means you can safely include the `karafka topics migrate` in your deployment pipelines if you wish to delegate topics management to Karafka.

Please keep in mind two things, though:

1. Karafka currently does **not** update settings different than the partition count.
2. Topics management API does **not** provide any means of concurrency locking when CLI commands are being executed.

### Limitations and other info

- Karafka currently does **not** update settings different than the partition count.
- Topics management is enabled by default but will not be used unless any CLI commands are invoked.
- `migrate` does not support changing other settings than partitions count.
- If a topic is used by several consumer groups defined in one application, only the first `config` defined will be used.
- Topics management API does **not** support the management of multiple independent Kafka clusters. Only the primary one will be managed.
- Topics management API does **not** provide any means of concurrency locking when CLI commands are being executed. This means it is up to you to ensure that two topic CLI commands are not running in parallel during the deployments.
- Topics commands are **not** transactional. It means that the state application may be partial in case of errors.
- Topics commands **are** idempotent. Broken set of operations can be retried after fixes without worry.
- Karafka will **never** alter any topics that are not defined in the routing.

## Admin API

Karafka has a few simple admin functions that allows for getting cluster info and creating and deleting topics.

**Note**: Admin actions will always be applied to the **default** cluster defined in the configuration.

### Creating a topic

```ruby
topic_name = 'my_cool_topic'
partitions_count = 2
replication_factor = 1 # 1 for dev, for prod you want more

Karafka::Admin.create_topic(topic_name, partitions_count, replication_factor)
```

### Deleting a topic

```ruby
topic_name = 'my_cool_topic'

Karafka::Admin.delete_topic(topic_name)
```

### Getting cluster-info

```ruby
# Get cluster info and list all the topics
info = Karafka::Admin.cluster_info

puts info.topics.map { |topic| topic[:topic_name] }.join(', ')
```

### Reading topic messages

By using the `read_topic` method, you can read data from a given topic partition without subscribing to it.

**Note**: While the returned messages are `Karafka::Messages::Message` objects, they may not hold the correct notion of the topic details unless the given topic is defined in Karafka routes. For topics that are not defined, defaults will be used.

#### Getting last N messages

```ruby
topic = 'my_topic'
partition = 0
how_many = 10

messages = Karafka::Admin.read_topic(topic, partition, how_many)

messages.each do |message|
  puts message.raw_payload
end
```

#### Getting messages from a given offset

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

#### Getting messages from a given time

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

### Adding partitions to a topic

If you want to add partitions to an existing topic, you can use the `create_partitions` admin method:

```ruby
topic_name = 'my-busy-topic'
# Indicates how many partitions we want to end up with
total_partitions = 20

Karafka::Admin.create_partitions(topic_name, total_partitions)
```

This method will create all the additional partitions to reach your desired count.

### Reading the watermark offsets

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
