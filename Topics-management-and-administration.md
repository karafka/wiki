Karafka allows you to manage your topics in two ways:

- Using the built-in [Topics management](#topics-management) routing + CLI functionality (recommended)
- Directly via the [Admin API](#admin-api)

Karafka considers your topics setup (retention, partitions, etc.) as part of your business logic. You can describe them in the routing and make Karafka ensure their consistency across all the environments using the appropriate CLI commands. Thanks to that, you can make sure that everything is described as code.

**Note**: Admin actions will always be applied to the **default** cluster defined in the configuration.

## Topics management

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

<div
  id="topics-migrate"
  class="asciinema"
  style="z-index: 1; position: relative"
  data-cols="100"
  data-rows="16"
  data-cast="topics-migrate">

  The below example illustrates the usage of the `migrate` command to align the number of partitions and to add one additional topic:

  <span style="display: none;">
    Note: Asciinema videos are not visible when viewing this wiki on GitHub. Please use our online documentation instead.
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

TBA

### Production usage

TBA

### Limitations and other info

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

### Adding partitions to a topic

If you want to add partitions to an existing topic, you can use the `create_partitions` admin method:

```ruby
topic_name = 'my-busy-topic'
# Indicates how many partitions we want to end up with
total_partitions = 20

Karafka::Admin.create_partitions(topic_name, total_partitions)
```

This method will create all the additional partitions to reach your desired count.
