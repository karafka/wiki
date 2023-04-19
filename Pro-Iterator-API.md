Iterator API allows developers to subscribe to Kafka topics and perform data lookups from various Ruby processes, including Rake tasks, custom scripts, and the Rails console. This API provides a powerful and flexible way to access Kafka data without the need for complex setup, configuration, `karafka server` processes deployment or creating consumers.

The Iterator API is designed to be simple and easy to use. It allows developers to subscribe to specific Kafka topics and partitions and perform data lookups using a simple and intuitive Ruby interface. 

Developers can customize their data processing logic and perform data lookups according to their specific needs, such as retrieving data from a particular offset, processing data from the beginning of the topic, or processing only the most recent messages.

One of the major benefits of the Iterator API is its flexibility. You can use it from any Ruby process, including Rake tasks, custom scripts, and the Rails console. This means you can easily integrate Kafka data processing into their existing workflows and automation tasks. It also makes it easy to perform ad-hoc data processing and analysis without complex infrastructure.

## Usage

The iterator API requires you to create an instance of the `Karafka::Pro::Iterator` with the following arguments:

- `topics` - A topic name or a hash with topics subscriptions settings
- `settings` (keyword argument) - settings to pass to the consumer. Allow for altering the EOF behavior and other low-level settings.

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

One everyday use case for Karafka Pro Iterator API is to fetch the last N messages from each topic partition and process them instead of starting from the beginning. This can be useful when you need to perform data analysis or processing on the most recent data without processing the entire dataset. By using the Iterator API to fetch the last N messages from each partition, you can save time and resources and focus on processing only the most relevant data.

When subscribing with a negative offset, Karafka will compute the offset from which it should start for each partition independently, ensuring that at least the requested number of messages is being processed.

```ruby
# Read and iterate
iterator = Karafka::Pro::Iterator.new(
  {
    'users_events' => -10_000 
  }
)

iterator.each do |message|
  puts message.payload
end
```

**Note**: In Karafka, you may encounter a negative offset of `-1001` in the context of statistics reporting, and this does **not** represent the same concept as the Iterator negative offsets lookup. In the context of Karafka emitted statistics, the `-1001` means that the offset information is not yet available.

#### Subscribing to particular partitions


#### Long-living subscriptions

TBA

### Routing awareness

TBA

### Data iterating

TBA

#### Partition consumption early stopping

TBA

### Integration with Ruby processes

TBA

### Scalability and Performance

TBA

## Example use-cases

TBA

## Summary

Overall, the Karafka Pro Iterator API provides a powerful and flexible way to access and process Kafka data from various Ruby processes. Its simplicity, flexibility, and scalability make it an essential tool for developers who need to work with Kafka data quickly and efficiently.
