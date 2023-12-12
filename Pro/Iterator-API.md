Iterator API allows developers to subscribe to Kafka topics and perform data lookups from various Ruby processes, including Rake tasks, custom scripts, and the Rails console. This API provides a powerful and flexible way to access Kafka data without the need for complex setup, configuration, `karafka server` processes deployment or creating consumers.

The Iterator API is designed to be simple and easy to use. It allows developers to subscribe to specific Kafka topics and partitions and perform data lookups using a simple and intuitive Ruby interface. 

Developers can customize their data processing logic and perform data lookups according to their specific needs, such as retrieving data from a particular offset, processing data from the beginning of the topic, or processing only the most recent messages.

One of the major benefits of the Iterator API is its flexibility. You can use it from any Ruby process, including Rake tasks, custom scripts, and the Rails console. This means you can easily integrate Kafka data processing into their existing workflows and automation tasks. It also makes it easy to perform ad-hoc data processing and analysis without complex infrastructure.

!!! note ""

    When using Karafka's Iterator API to access Kafka data, please keep in mind, that it skips compacted messages and transactions-related messages during reading. However, these skipped messages are still included in the overall count. For instance, if you request the last 10 messages and all are transaction-related or compacted, the API will return no data, but they're counted in the total.

## Usage

The iterator API requires you to create an instance of the `Karafka::Pro::Iterator` with the following arguments:

- `topics` - A topic name or a hash with topics subscriptions settings
- `settings` (keyword argument) - settings to pass to the consumer. Allow for altering the EOF behavior and other low-level settings.
- `yield_nil` (keyword argument) - indicates if `nil` values should also be yielded. Useful for long-living scenarios. Defaults to `false`.

```ruby
# A simple example to stream all partitions from beginning till the end
iterator = Karafka::Pro::Iterator.new('my_topic')

iterator.each do |message|
  puts message.payload
end
```

Please read the sections below for more details. 

### Subscription modes

Iterator accepts topic lists in various formats to support multiple use cases. Depending on your specific needs, you can pass in topics as a single string, a list of strings, or a hash with options. This allows developers to easily subscribe to one or multiple Kafka topics and partitions and perform data lookups according to their requirements.

#### Subscribing to all topic partitions

The easiest way to subscribe to a topic or few is by providing their names. In a scenario like this, Karafka will subscribe to all the topics' partitions and consume messages from the earliest available message.

You can either provide a topic name or array with all the topics you want to subscribe to:

```ruby
iterator = Karafka::Pro::Iterator.new(['my_topic1' 'my_topic2'])

iterator.each do |message|
  puts message.payload
end
```

#### Subscribing to fetch the last N messages

One everyday use case for Karafka Pro Iterator API is to fetch the last N messages from each topic partition and process them instead of starting from the beginning. This can be useful when you need to perform data analysis or processing on the most recent data without dealing with the entire dataset. By using the Iterator API to fetch the last N messages from each partition, you can save time and resources and focus on processing only the most relevant data.

When subscribing with a negative offset, Karafka will compute the offset from which it should start for each partition independently, ensuring that at least the requested number of messages is being processed.

```ruby
# Read and iterate over the last 10 000 messages available in each
# partition of the topic users_events
iterator = Karafka::Pro::Iterator.new(
  {
    'users_events' => -10_000 
  }
)

iterator.each do |message|
  puts message.payload
end
```

!!! note ""

    In Karafka, you may encounter a negative offset of `-1001` in the context of statistics reporting, and this does **not** represent the same concept as the Iterator negative offsets lookup. In the context of Karafka emitted statistics, the `-1001` means that the offset information is not yet available.

!!! note ""

    Negative lookups operate based on watermark offsets, not actual message counts. So, for compacted topics (where redundant data is removed), this could result in fetching fewer messages than requested, as the specified offset might include removed data.

#### Subscribing to fetch messages from a certain point in time

This functionality is handy when you need to analyze data from a specific period or start processing from a certain point in the Kafka topic, but you do not know the offset.

To do this, you must provide a timestamp instead of a numerical offset when setting up your subscription. This timestamp should represent the exact time you wish to start processing messages. The Karafka Iterator API will then fetch all messages that were produced after this timestamp.

```ruby
# Read and iterate over the last 60 seconds of messages available in each
# partition of the topic users_events
iterator = Karafka::Pro::Iterator.new(
  {
    'users_events' => Time.now - 60
  }
)

iterator.each do |message|
  puts message.payload
end
```

This feature enables a more intuitive way of accessing and processing historical Kafka data. Instead of calculating or estimating offsets, you can directly use real-world time to navigate through your data. Just like with offsets, remember that you can only fetch messages still stored in Kafka according to its data retention policy.

#### Subscribing to particular partitions

One reason it may be worth subscribing only to particular partitions of a topic using the iterator API is to reduce resource consumption. Consuming all topic partitions can be resource-intensive, especially when dealing with large amounts of data. By subscribing only to specific partitions, you can significantly reduce the amount of data that needs to be processed and reduce the overall resource consumption.

Another reason subscribing only to particular partitions can be helpful is to save time. When consuming all partitions of a topic, the iterator needs to search through all the partitions to find the data that matches the consumer's criteria. If you know to which partition the data you are looking for goes, you can skip the unnecessary search in other partitions, which can save a lot of time.

To do so, you need to provide the list of the partitions with the initial offset or time. You can set the initial offset to `0` if you want to start from the beginning. If the `0` offset is unavailable, Karafka will seek to the beginning of the partition. You may also use negative per-partition offsets similar to how they use them for whole-topic subscriptions.

```ruby
# Go through two partitions: 0, 5 and 7
# Get 100 most recent messages for partition 0
# Get 10 000 most recent messages for partition 5
# Get messages from last 60 seconds from partition 7
iterator = Karafka::Pro::Iterator.new(
  {
    'users_events' => {
      0 => -100,
      5 => -10_000,
      7 => Time.now - 60
    }
  }
)

iterator.each do |message|
  puts message.payload
end
```

### Long-living iterators

By default iterator instance will finish its work when it reaches end of data on all the partitions. This however may not be desired if you want to process data as it comes.

You can alter this behavior by setting the `enable.partition.eof` to `false` and setting the `yield_nil` to `true`. Yielding nil is required because you need a way to exit the iterator even if no messages are being produced to the topic you are iterating on.

```ruby
iterator = Karafka::Pro::Iterator.new(
  # Start from the last message available
  { 'system_events' => -1 },
  settings: { 'enable.partition.eof': false },
  yield_nil: true
)

# Stop iterator when 100 messages are accumulated
limit = 100
buffer = []

iterator.each do |message|
  break if buffer.count >= limit

  # Message may be a nil when `yield_nil` is set to true  
  buffer << message if message
end
```

!!! note ""

    If you find yourself working with long-living iterators that operate for a long time, we do recommend using the `karafka server` default consumption API as it provides all the needed features and components for robust and long-running consumption. 

### Routing awareness

If you are iterating over topics defined in your `karafka.rb`, including those marked as inactive, the iterator will know what deserializer to use and will operate accordingly. If you are iterating over an unknown topic, defaults will be used.

```ruby
# karafka.rb

class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic 'events' do
      active false
      deserializer XmlDeserializer
    end
  end
end

# Your iterator script

iterator = Karafka::Pro::Iterator.new('events')

iterator.each do |message|
  # Karafka will know, to use the XmlDeserializer
  puts message.payload
end
```

### Partition consumption early stop

There may be situations when using the iterator where you may want to stop consuming data from specific partitions while continuing to consume data from other partitions. This can be useful in scenarios where you were looking for pieces of information in each of the partitions, and in some, you've already found it. In such scenarios, further processing of those partitions will not provide any benefits and will only consume resources.

To early stop one partition without stopping the iterator process, you can use the `#stop_partition` or `#stop_current_partition` methods.

```ruby
iterator = Karafka::Pro::Iterator.new(
  {
    'users_events' => -10_000 
  }
)

data_per_partition = Hash.new { |h, k| h[k] = [] }
limit_per_partition = 20

iterator.each do |message, iterator|
  data_per_partition[message.partition] << message.payload

  # Continue data collection for each partition until enough data
  next if data_per_partition[message.partition].size < limit_per_partition

  # Stop current partition from being fetched
  iterator.stop_current_partition
end
```

### Integration with Ruby processes

The Karafka Pro Iterator API is designed to be simple and easy to use, and there is nothing special needed to get started with it. There are also no special recommendations when using it from any specific Ruby process type.

However, it is important to remember that the Iterator API is designed for lightweight Kafka operations and should not be used to perform extensive Kafka operations during HTTP requests or similar. This is because performing extensive Kafka operations during requests can impact the application's performance and result in slower response times.

Additionally, it is important to note that the Iterator API does not manage the offsets. This means that when you subscribe to a Kafka topic and partition, you must provide the initial offsets yourself.

### Scalability and Performance

It's important to note that the Karafka Pro iterator API is designed to be a straightforward way to access Kafka data using Ruby. However, it is a single-threaded API, meaning it does not provide any form of parallelizing data. This means that any data processing or analysis will be performed sequentially, which may impact performance when dealing with large amounts of data or performing extensive IO operations. While this can be limiting in some cases, the Iterator API's simplicity and ease of use make it an attractive option for developers looking for a quick and easy way to access Kafka data without the need for complex configuration or deployment of additional processes. If parallelization is required, alternative approaches, such as using the Karafka consumers feature, may need to be explored.

The iterator should handle up to 100 000 messages per second.

## Example Use Cases

- Custom Kafka data processing: The iterator API allows developers to create custom scripts that process Kafka data in a specific way. For example, you can extract specific fields from Kafka data, transform them into a different format, or perform calculations on the data.

- Custom data analytics: With the iterator API, developers can perform custom data analytics on Kafka data, such as trend analysis, forecasting, or anomaly detection. This can be useful for detecting patterns in data that might take time to be noticeable.

- Automated testing: With the iterator API, developers can automate the testing of Kafka data and verify that data is flowing correctly between different components of an application.

- Custom reporting: By subscribing to specific Kafka topics and partitions, developers can create custom reports that provide insights into Kafka data. This can be useful for identifying trends or outliers in data.

- Debugging: The iterator API can be used to quickly diagnose and fix issues with Kafka data by providing a simple way to inspect Kafka data in real time.

## Summary

Overall, the Karafka Pro Iterator API provides a powerful and flexible way to access and process Kafka data from various Ruby processes. Its simplicity, flexibility, and scalability make it an essential tool for developers who need to work with Kafka data quickly and efficiently.
