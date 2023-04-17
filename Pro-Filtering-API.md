The Filtering API allows users to filter messages based on specific criteria, reducing the amount of data that needs to be processed downstream. It also provides advanced ways of altering the consumption flow by allowing for explicit pausing and seeking before the actual processing happens.

With the Karafka Pro Filtering API, users can set up rules to filter messages based on the message content, key, headers, other metadata, or even external information. For example, users can filter messages based on a specific value in the message body or based on the message header.

This feature is handy in scenarios where a high volume of messages is being sent and received, and processing all the downstream messages may be too resource-intensive or unnecessary. By filtering messages at the source, users can ensure that only the relevant data is being processed, which can improve system performance and reduce costs. It also helps with scenarios requiring custom logic and context-aware pausing or reprocessing where pausing and seeking need to be used.

## Creating Filters

TBA

### Post execution action altering

TBA

### Idle runs

TBA

## Registering Filters

When registering filters using the Karafka routing API, a factory must be provided instead of a class or filter instance. This is because a new filter instance is built for each topic partition. The factory is responsible for creating a new filter object for each partition, ensuring each partition has its independent instance. By using a factory, Karafka Pro can ensure that each filter instance is thread-safe and can handle messages concurrently without interfering with each other. Therefore, when registering filters using Karafka routing API, it is essential to provide a factory that creates new instances of the filter for each topic partition to ensure proper handling of incoming messages.

The factory is expected to respond to `#call` and will be provided with two arguments:

- `Karafka::Routing::Topic` - routing topic
- `Integer` - partition

Those arguments can be used to implement long-living filters that will not be regenerated after rebalances or to use the topic/partition context to alter the behavior of generic filters.

Below you can find code snippets of registering filters for various scenarios.

Example of a topic/partition agnostic filter registration:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :example do
      consumer ExampleConsumer
      # 
      filter ->(*) { MyCustomFilter.new }
    end
  end
end
```

Example of registration of a filter that accepts topic and partition as arguments:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :example do
      consumer ExampleConsumer
      # 
      filter ->(topic, partition) { MyCustomFilter.new(topic, partition) }
    end
  end
end
```

Example of a persistent factory that uses topic and partition information to provide long-living filter instances:

```ruby
class Factory
  include Singleton

  MUTEX = Mutex.new

  def initialize
    @cache = Hash.new { |h, k| h[k] = {} }
  end

  def call(topic, partition)
    MUTEX.synchronize do
      @cache[topic][partition] ||= MyCustomFilter.new
    end
  end
end

class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :example do
      consumer ExampleConsumer
      # Use a factory object instead of a proc
      filter Factory.instance
    end
  end
end
```

## Ordering

TBA

## Best Practices

TBA

## Example use-cases

TBA

## Summary

TBA
