The Filtering API allows users to filter messages based on specific criteria, reducing the amount of data that needs to be processed downstream. It also provides advanced ways of altering the consumption flow by allowing for explicit pausing and seeking before the actual processing happens.

With the Karafka Pro Filtering API, users can set up rules to filter messages based on the message content, key, headers, other metadata, or even external information. For example, users can filter messages based on a specific value in the message body or based on the message header.

This feature is handy in scenarios where a high volume of messages is being sent and received, and processing all the downstream messages may be too resource-intensive or unnecessary. By filtering messages at the source, users can ensure that only the relevant data is being processed, which can improve system performance and reduce costs. It also helps with scenarios requiring custom logic and context-aware pausing or reprocessing where pausing and seeking need to be used.

## Creating Filters

Karafka filters need to inherit from the `Karafka::Pro::Processing::Filters::Base` and need to at least respond to two methods:

- `#apply!` - a method that accepts an array of messages from a single topic partition for filtering. This array **needs** to be mutated using methods like `#delete_if`.
- `#applied?` - did the filter limit the input messages array in any way? This should be `true` also in the case of no-altering but when post-execution action altering is required.

If you plan to implement action-altering filters, you need to define two additional methods:

- `action` - that needs to respond with `:skip`, `:pause` or `:seek` to inform Karafka what action to take after the batch processing.
- `timeout` - `0` in case of non-pause actions or pause time in milliseconds.

It is essential to remember that post-processing actions may also be applied when no data is left after filtering.

Below is an example implementation of a filter that continuously removes messages with odd offsets. This filter sets the `@applied` in case even one message has been removed. 

```ruby
class OddRemoval < Karafka::Pro::Processing::Filters::Base
  def apply!(messages)
    @applied = false

    messages.delete_if do |message|
      remove = !(message.offset % 2).zero?
      @applied = true if remove
      remove
    end
  end
end
```

If you are looking for more extensive examples, you can check out the implementations of:

- `Karafka::Pro::Processing::Filters::Delayer` - used as a part of the [Delayed Jobs](Pro-Delayed-Topics) feature.
- `Karafka::Pro::Processing::Filters::Expirer` - used as a part of the [Expiring Messages](Pro-Expiring-Messages) feature
- `Karafka::Pro::Processing::Filters::Throttler` - used as a part of the [Rate Limiting](Pro-Rate-Limiting) feature.

### Filters lifecycle

Filter instance is created when Karafka encounters a given topic partition for the first time and is long-lived. While their primary responsibility is to filter the incoming data, they can also alter the flow behavior. Hence it is essential to remember that part of their operations happens **after** all the data is being processed at the moment of post-execution strategy application. This means that there may be a significant delay between the filtering and the invocation of `#action` that is equal to the collective processing time of all the data of a given topic partition.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/filtering_api_action_application.svg" />
</p>
<p align="center">
  <small>*Lifecycle of filters, illustrating their post-processing usage for action altering.
  </small>
</p>

### Post execution action altering

!!! warning "Throughfully test your filters before usage"

    Using `#seek` and `#pause` within a Filter requires a clear understanding of their implications. Misuse can result in unexpected behavior and performance issues.

    For full details and best practices, refer to the [pausing and seeking](https://karafka.io/docs/Pausing-Seeking-and-Rate-Limiting/) documentation. Ensure you're informed before integrating these operations.

By default, filters applied to messages do not alter the execution or polling behavior of Karafka. This means that even if a message is filtered out, Karafka will continue to poll for messages at the same rate. However, it is possible to alter this behavior by overwriting the `#action` method in a custom consumer. This method is responsible for executing the logic of a given message. By overwriting it, developers can modify the behavior of their Karafka application based on the result of the filtering. For example, they might choose to pause processing or resume from a particular message.

Each action consists of three elements that need to be present in case there is expectation on non-default post-execution action:

- `action` - defines how Karafka should behave after the data is processed or upon idle job execution. Karafka can either:
    - `:skip` - in which case the default strategy action will be applied, like the filters would not exist.
    - `:pause` - will pause processing for the `timeout` period.
    - `:seek` - will move the offset to the desired location or time taken from the `:cursor` message or set manually.
- `timeout` - value applicable for the `:pause` action that describes how long we should pause the consumption on a given topic partition.
- `cursor` - The first message we need to get next time we poll or nil if not applicable.

For example, in case you want to pause the processing, you need to return the following:

- `:pause` as an `#action` result.
- number of milliseconds to pause under `#timeout`.
- message containing the desired offset from which to start processing after un-pausing under `#cursor`.

!!! note ""

    User actions always take precedence over Filtering API automatic actions. This means that even if you issue a `:pause` action request, in case of a user manual pause, it will be applied and not the filter one. Same applies to the `:seek` logic.

### Priority based action selection

To make the most of the Filtering API, it is crucial to have a deep understanding of how Karafka selects actions and the factors that determine their priority. While this may be a challenging aspect of the API to master, it is essential to build robust and efficient filters that can alter polling behaviors.

Since each of the filters can impact the behavior of given topic partition polling, we need to ensure that they collectively do not collide with each other. This is done by applying the algorithm described below that selects proper action parameters.

Here are the rules that the action selection follows:

1. If none of the filters were applied, the action is always `:skip`.
2. If any filter action is `:pause`, collectively, `:pause` will be applied.
3. If any filter action is `:seek`, collectively, `:seek` will be applied.
4. If no filters define action other than `:skip`, `:skip` will be applied.
5. For `:pause`, minimum timeout out of the recommended will be selected.
6. The message with the lowest offset always represents the `cursor` value.

This algorithm ensures that all the expectations and constraints from any of the filters are always applicable collectively.

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

- **Data Reliability**: You can use the Filtering API to build a [transactional offset management](https://mensfeld.pl/2023/06/inside-kafka-enhancing-data-reliability-through-transactional-offsets-with-karafka/) system, improving the reliability of your processing pipelines.

- **Data Validation**: You can use filters to validate the data of incoming messages. For example, you can check whether a message contains all required fields and has valid values and reject invalid.

- **Data Deduplication**: You can use filters to prevent duplicate messages from a single batch from being processed. For example, you can remove messages with the same identifiers or timestamps.

- **Data Redaction**: Filters can be used to remove messages containing sensitive data.

- **Data Sampling**: Filters can be used to sample incoming messages. For example, you can randomly select a subset of messages for further processing or analysis.

- **Data Quality**: Filters can be used to measure the quality of incoming messages. For example, you can check the completeness or accuracy of messages and log or discard those that don't meet a certain threshold.

- **Data Filtering**: Finally, filters can be used to filter out unwanted messages. For example, you can discard messages that contain spam or malware or messages that don't match specific criteria.

## Summary

Karafka Filtering API is a powerful tool that allows developers to process incoming messages in real time and perform various actions based on their content. With the Filtering API, users can register multiple filters to validate, filter out messages as they arrive, and alter the polling process by pausing or starting from a different offset. The order of the filters is essential, as each filter receives the data that the previous filters have already processed. Following best practices, such as using lightweight filters, avoiding complex logic, and testing filters thoroughly, can ensure that the system remains performant and reliable.
