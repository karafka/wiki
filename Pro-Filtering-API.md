The Filtering API allows users to filter messages based on specific criteria, reducing the amount of data that needs to be processed downstream. It also provides advanced ways of altering the consumption flow by allowing for explicit pausing and seeking before the actual processing happens.

With the Karafka Pro Filtering API, users can set up rules to filter messages based on the message content, key, headers, other metadata, or even external information. For example, users can filter messages based on a specific value in the message body or based on the message header.

This feature is handy in scenarios where a high volume of messages is being sent and received, and processing all the downstream messages may be too resource-intensive or unnecessary. By filtering messages at the source, users can ensure that only the relevant data is being processed, which can improve system performance and reduce costs. It also helps with scenarios requiring custom logic and context-aware pausing or reprocessing where pausing and seeking need to be used.

## Creating Filters

TBA

### Post execution action altering

TBA

### Priority based action selection

TBA

### Idle runs

After applying filters to the messages batch, no data may be left to process. In such cases, Karafka may run an idle job to apply proper action and perform housekeeping work. The idle job will initialize the consumer instance and may invoke `#pause` or `seek` commands if needed.

Idle jobs **do not** run any end-user code except strategy applications based on the Filtering API.

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

### Ordering

Filtering API allows you to register multiple filters for a consumer group or topic. When multiple filters are registered, they are executed in the order in which they were registered. This means that the filter registered later will receive data already pre-filtered by the previously registered one.

For example, let's say you have two filters registered for a topic:

```ruby
routes.draw do
  topic :example do
    consumer ExampleConsumer
    filter ->(*) { FilterOne }
    filter ->(*) { FilterTwo }
  end
end
```

In this case, `FilterOne` will be executed first, and its output will be passed as input to `FilterTwo`. The output of `FilterTwo` will then be used in the further steps of work distribution.

This order dependency allows you to chain multiple filters together to create more complex filtering logic. For example, you could have a first filter that removes all messages with invalid headers, followed by a second filter that removes messages that don't match a specific pattern in the payload.

Remember that the order in which you register filters can affect the performance of your Karafka Pro application. If you have many filters registered, each filter adds overhead to message processing. Therefore, design your filter logic carefully and only register the filters you need to achieve the desired functionality.

## Best Practices

- **Keep Filters Simple**: Filters should be kept as simple as possible to ensure they execute quickly and without error. A filter should only perform one specific task, such as filtering messages with invalid headers or messages that match a specific pattern. Keeping filters simple also makes them easier to maintain and update as your application evolves.

- **Use Factories to Create Filter Instances**: When registering filters using Karafka routing API, use factories to create filter instances instead of class or filter instances. This ensures that each partition has its independent filter instance, making them thread-safe and able to handle messages concurrently without interfering with each other.

- **Register Filters in the Correct Order**: When registering multiple filters, register them in the correct order. Filters are executed in the order in which they are registered, and each filter adds overhead to message processing. Therefore, it's crucial to design your filter logic carefully and only register the filters you need to achieve the desired functionality. It would be best if you also considered their performance to filter out the biggest number of messages using the fastest one.

- **Monitor Filter Performance**: Monitoring filter performance is essential to ensure that your Karafka Pro application processes messages efficiently. Keep an eye on the performance metrics for your filters, and keep in mind that slow filters will add additional lag to the consumption process.

- **Test Filters Thoroughly**: Before deploying your Karafka Pro application, test your filters thoroughly to ensure they are working as expected. Use sample messages to test each filter individually and in combination with other filters. This ensures that your filters are working as expected and not causing unintended side effects.

By following these best practices, you can ensure that your Karafka Pro Filtering API implementation is robust, efficient, and scalable.

## Example use-cases

- **Throttling**: You can use filters to throttle and rate limit messages, including process or system-wide limitation solutions. 

- **Data Validation**: You can use filters to validate the data of incoming messages. For example, you can check whether a message contains all required fields and has valid values and reject invalid.

- **Data Deduplication**: You can use filters to prevent duplicate messages from a single batch from being processed. For example, you can remove messages with the same identifiers or timestamps.

- **Data Redaction**: Filters can be used to remove messages containing sensitive data.

- **Data Sampling**: Filters can be used to sample incoming messages. For example, you can randomly select a subset of messages for further processing or analysis.

- **Data Quality**: Filters can be used to measure the quality of incoming messages. For example, you can check the completeness or accuracy of messages and log or discard those that don't meet a certain threshold.

- **Data Filtering**: Finally, filters can be used to filter out unwanted messages. For example, you can discard messages that contain spam or malware or messages that don't match specific criteria.

## Summary

Karafka Filtering API is a powerful tool that allows developers to process incoming messages in real time and perform various actions based on their content. With the Filtering API, users can register multiple filters to validate, filter out messages as they arrive, and alter the polling process by pausing or starting from a different offset. The order of the filters is essential, as each filter receives the data that the previous filters have already processed. Following best practices, such as using lightweight filters, avoiding complex logic, and testing filters thoroughly, can ensure that the system remains performant and reliable.
