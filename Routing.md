The routing engine provides an interface to describe how messages from all the topics should be received and consumed.

Due to the dynamic nature of Kafka, you can use multiple configuration options; however, only a few are required.

## Routing DSL organization

Karafka uses consumer groups to subscribe to topics. Each consumer group needs to be subscribed to at least one topic (but you can subscribe with it too as many topics as you want). To replicate this concept in our routing DSL, Karafka allows you to configure settings on two levels:

* settings level - root settings that will be used everywhere
* topic level - options that need to be set on a per topic level or overrides to options set on a root level

**Note**: most of the settings (apart from the ```consumer```) are optional and if not configured, will use defaults provided during the [configuration](https://github.com/karafka/karafka/wiki/Configuration) of the app itself.

Karafka provides two ways of defining topics on which you want to listen:

### Single consumer group with multiple topics mode

In this mode, Karafka will create a single consumer group to which all the topics will belong.

It is recommended for most of the use-cases and can be changed later.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :example do
      consumer ExampleConsumer
    end

    topic :example2 do
      consumer Example2Consumer
    end
  end
end
```

### Multiple consumer groups mode

In this mode, Karafka will use a single consumer group per each of the topics defined within a single `#consumer_group` block.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    consumer_group :group_name do
      topic :example do
        consumer ExampleConsumer
      end

      topic :example2 do
        consumer ExampleConsumer2
      end
    end

    consumer_group :group_name2 do
      topic :example3 do
        consumer Example2Consumer3
      end
    end
  end
end
```

### Multiple subscription groups mode

Karafka uses a concept called `subscription groups` to organize topics into groups that can be subscribed to Kafka together. This aims to preserve resources to achieve as few connections to Kafka as possible.

Each subscription group connection operates independently in a separate background thread. They do, however, share the workers poll for processing.

All the subscription groups define within a single consumer group will operate within the same consumer group.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    subscription_group 'a' do
      topic :A do
        consumer ConsumerA
      end

      topic :B do
        consumer ConsumerB
      end

      topic :D do
        consumer ConsumerD
      end
    end

    subscription_group 'b' do
      topic :C do
        consumer ConsumerC
      end
    end
  end
end
```

You can read more about the concurrency implications of using subscription groups [here](Concurrency-and-multithreading#parallel-kafka-connections-within-a-single-consumer-group-subscription-groups).

### Routing Patterns

For users leveraging the advanced capabilities of Karafka Pro, the Routing Patterns feature has its dedicated documentation page. This page delves deep into the behavior, configuration, and best practices surrounding Routing Patterns. Please refer to the [Routing Patterns documentation](Pro-Routing-Patterns) to explore this feature in detail and gain comprehensive insights.

## Overriding Defaults

Almost all the default settings configured can be changed on either on the ```topic``` level. This means that you can provide each topic with some details in case you need a non-standard way of doing things (for example, you need batch consuming only for a single topic).

## Shared Defaults

This option allows you to define default settings that apply to all the topics defined in your routing unless those are defined explicitely when describing the appropriate topic. This not only simplifies configurations but also ensures consistency throughout your application.

Here's how you can set up routing defaults and then define a topic that overrides one of those defaults:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    defaults do
      config(
        # Ensure there are always 5 partitions by default
        partitions: 5,
        # Make sure that topic is replicated in production
        replication_factor: Rails.env.production? ? 2 : 1
      )
    end

    topic :A do
      consumer ConsumerA
      # When overwriting defaults, all settings need to be
      # redefined for a given method. Partial redefinition
      # is not allowed and will not work
      config(
        partitions: 2,
        replication_factor: Rails.env.production? ? 2 : 1
      )
    end

    topic :B do
      consumer ConsumerB
    end
  end
end
```

When you decide to override any default option for a topic within the `#topic` block, it's crucial to understand that you must set **all** the arguments for that particular option. Partial updating of arguments is not supported.

Karafka will not use the user-specified defaults you've defined in the defaults block if you attempt to update the arguments for an option partially. Instead, it will revert to the framework's internal defaults for the missing arguments. This could lead to unexpected behavior in your application if not considered.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    defaults do
      config(
        # Ensure there are always 5 partitions by default
        partitions: 5,
        # Make sure that topic is replicated in production
        replication_factor: Rails.env.production? ? 2 : 1
      )
    end

    topic :A do
      consumer ConsumerA

      # BAD idea because `replication_factor` is going to be set
      # to `1` as it is the framework default
      config(partitions: 2)
    end
  end
end
```

## Topic level options

There are several options you can set inside of the ```topic``` block. All of them except ```consumer``` are optional. Here are the most important once:

| Option                            | Value type   | Description                                                                                                                 |
|-----------------------------------|--------------|-----------------------------------------------------------------------------------------------------------------------------|
| active                            | Boolean      | Set to `false` if you want to have the given topic defined but not consumed. Helpful when working with topics via admin API |
| [consumer](Consuming-messages)    | Class        | Name of a consumer class that we want to use to consume messages from a given topic                                         |
| [deserializer](Deserialization)   | Class        | Name of a deserializer that we want to use to deserialize the incoming data                                                 |
| [manual_offset_management](Offset-management#manual-offset-management)               | Boolean        | Should Karafka automatically mark messages as consumed or not          |
| [long_running_job](Pro-Long-Running-Jobs)        | Boolean     | Converts this topic consumer into a job that can run longer than `max.poll.interval.ms`                       |
| [virtual_partitions](Pro-Virtual-Partitions)     | Hash        | Allows you to parallelize the processing of data from a single partition.                                     |
| [dead_letter_queue](Dead-Letter-Queue)           | Hash        | Provides a systematic way of dealing with persistent consumption errors.                                      |
| [delay_by](Pro-Delayed-Topics)    | Integer      | Feature that enables delaying message processing from specific topics for a specified time.                                 |
| [expire_in](Pro-Expiring-Messages) | Integer     | Feature that allows messages to be excluded from processing automatically in case they are too old.                         |
| [filter](Pro-Filtering-API)       | `#call`      | Feature that allows users to filter messages based on specific criteria.                                                    |
| [config](Topics-management-and-administration#declarative-topics) | Hash         | Allows for specifying each of the topic settings and their creation via the CLI commands                                    |

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    consumer_group :videos_consumer do
      topic :binary_video_details do
        config(partitions: 2)
        consumer Videos::DetailsConsumer
        deserializer Serialization::Binary::Deserializer.new
      end

      topic :new_videos do
        config(partitions: 5, replication_factor: 4)
        consumer Videos::NewVideosConsumer
      end
    end

    topic :events do
      config(partitions: 1, 'cleanup.policy': 'compact')
      # Set to false because not for consumption.
      # Only inspection via admin API.
      active false
      deserializer EventsDeserializer.new
    end
  end
end
```

## Modular Monolith Approach

A Modular Monolith architecture focuses on separating a monolith application into well-defined, loosely coupled modules. These modules can evolve and scale independently but still operate as part of a single unit. With Karafka, embracing this architecture becomes efficient due to its flexible routing mechanism.

One of Karafka's routing beauties is the ability to call the #draw method multiple times. In a Modular Monolith architecture context, each of your application's modules can define its own set of topic routes.

- **Decoupling**: Each module can define and manage its message routing without interfering with others.

- **Scalability**: As modules grow, they can independently evolve their messaging strategies.

- **Maintainability**: Changes to routing in one module won't impact others, making it easier to manage and refactor.

Within each module, you can define a Karafka routing block using the #draw method:

```ruby
# app/modules/orders/karafka_routes.rb
Karafka.routing.draw do
  topic :order_created do
    consumer Orders::OrderCreatedConsumer
  end

  topic :order_updated do
    consumer Orders::OrderUpdatedConsumer
  end
end
```

```ruby
# app/modules/users/karafka_routes.rb
Karafka.routing.draw do
  topic :user_registered do
    consumer Users::UserRegisteredConsumer
  end
end
```

By leveraging the ability to draw routes multiple times, Karafka seamlessly fits into a Modular Monolith architecture. This allows for improved code organization, easier maintenance, and the flexibility to evolve each module independently.
