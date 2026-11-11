# WaterDrop Testing

!!! note "Use `karafka-testing` When Testing With Karafka"

    If you are using WaterDrop with Karafka, consider the `karafka-testing` gem for RSpec integration. Detailed documentation on its usage can be found [here](Basics-Testing).

WaterDrop provides a testing mechanism for its producers, so you can check that your code produces messages as expected.

When testing code that uses WaterDrop producers, you have two primary strategies:

1. **End-to-End Testing with Kafka**: You set up a Kafka environment and produce messages to it. This tests the full flow of your application: messages are produced to and received from Kafka.

1. **Using the Buffered Client**: WaterDrop's Buffered Client stores messages in memory instead of sending them to Kafka. You can test which messages your code produces and verify their content and structure.

The choice is between an entire interaction with Kafka or a simulated, in-memory testing experience with the Buffered Client. Both approaches have their merits, depending on the specific testing requirements.

## End-to-End

When developing applications that interact with Kafka, one common approach for testing is to set up an actual Kafka cluster and conduct end-to-end integration tests. This method ensures that every part of the message production process is tested.

However, setting up and managing a Kafka cluster for testing can introduce several complexities:

1. **Infrastructure Overhead**: A real Kafka setup requires enough infrastructure, including the Kafka brokers, ZooKeeper nodes, and potentially more components, depending on the testing scenario.

1. **Configuration Complexity**: Ensuring that Kafka is configured correctly for each testing environment can be cumbersome.

1. **Cleanup and Isolation**: After each test, the Kafka cluster may need to be reset or cleaned to ensure test isolation. Managing topics, partitions, and offsets can be complex and time-consuming.

1. **Time Consumption**: Spinning up, configuring, and tearing down real Kafka instances can significantly lengthen the test runtime.

1. **Topics Creation Overhead**: If you expect your tests to run in isolation, ensure each test operates on a separate topic or partition. This can create a significant overhead and drastically increase test-suite execution time.

The process is refreshingly straightforward if you opt for end-to-end testing with WaterDrop and Kafka. You do not need any special configurations. Set up your Kafka environment, integrate WaterDrop, create a producer, and you are ready to use it in your specs and tests.

The RSpec example below tests that the expected messages are produced to Kafka.

```ruby
RSpec.describe WebhookProcessor do
  subject(:processor_flow) { described_class.new.call(incoming_request) }

  # Fake JSON with request data
  let(:incoming_request) { build(:incoming_request) }
  # This can be slow if you run it per each spec
  let(:last_topic_message) { Karafka::Admin.read_topic('incoming_request', 0, 1) }

  before { processor_flow }

  it 'expect to create a message with correct payload in the incoming_requests topic' do
    expect(last_topic_message).to eq(incoming_request)
  end
end
```

## Buffered Client

WaterDrop offers a client specifically designed for testing. This client can replicate the Kafka behaviors related to the production of messages without the need for an actual Kafka instance. This simulation allows developers to test their Kafka message production logic without a live Kafka instance's overhead and potential complications.

1. **Delivery Handle and Delivery Report**: For every message you "send" using the WaterDrop producer, the testing client simulates the return of a delivery handle and a delivery report. This mimics the behavior you would expect when producing messages to a live Kafka instance, providing a realistic testing scenario.

1. **Consecutive Per Partition Offsets**: One of the vital aspects of Kafka is message ordering within a partition. WaterDrop's testing client ensures that the simulated delivery reports carry consecutive offsets for each partition. This means that if you produce multiple messages to a particular partition, the offsets of the delivery reports for these messages will be consecutive numbers, mirroring real-world Kafka behavior. This feature allows you to use the returned offset information consistently and predictably, enhancing your tests' reliability.

1. **Default Partition Handling**: If you do not specify a partition when sending a message, the testing client defaults to partition zero. This is consistent with general Kafka producer behavior, where if no partition is specified, it might be determined by a partitioner or default to a specific partition.

1. **Transactions Support**: The buffered client of WaterDrop supports transactions, a crucial feature for ensuring message production consistency. If, for any reason, a transaction is aborted, the messages within that transaction are not added to the buffer. This emulates the atomic nature of Kafka transactions, allowing you to test scenarios that involve transaction commits and aborts without inadvertently inflating your message buffer.

### Configuration

!!! note "`karafka-testing` Auto-Activates the Buffered Backend"

    With the `karafka-testing` gem integrated, the WaterDrop Buffered backend is automatically activated for `Karafka.producer`.

To harness the Buffered backend in your test environment, adjust the `client_class` configuration to `WaterDrop::Clients::Buffered` as follows:

```ruby
# When you initialize your producer, whether part of Karafka or not
PRODUCER = WaterDrop::Producer.new do |config|
  # Other settings can stay as they are
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'request.required.acks': 1
  }

  # Use dummy only for tests
  break unless Rails.env.test?

  config.client_class = WaterDrop::Clients::Buffered
end
```

### Usage

Whenever your code produces messages, synchronously or asynchronously, the messages are not sent to Kafka. Instead, they reach the `producer.client.messages` array.

```ruby
handel = PRODUCER.produce_async(topic: 'test', payload: '123')

puts handel
#=> <WaterDrop::Clients::Dummy::Handle:... @topic="test", @partition=0, @offset=0>

report = handel.wait

puts report
#=> <Rdkafka::Producer::DeliveryReport:... @error=nil, @offset=0, @partition=0, @topic_name="test">

puts PRODUCER.client.messages
#=> [{:topic=>"test", :payload=>"123"}]

raise unless PRODUCER.client.messages.count != 1
```

Messages from aborted transactions are not stored in the buffer.

```ruby
PRODUCER.transaction do
  PRODUCER.produce_async(topic: 'test1', payload: '123')
  PRODUCER.produce_async(topic: 'test2', payload: '456')

  raise(WaterDrop::AbortTransaction)
end

# No messages will be stored in the buffers as the transaction was aborted
puts PRODUCER.client.messages.size #=> 0
```

In case of a successful transaction, data will be stored:

```ruby
PRODUCER.transaction do
  PRODUCER.produce_async(topic: 'test1', payload: '123')
  PRODUCER.produce_async(topic: 'test2', payload: '456')
end

puts PRODUCER.client.messages.size #=> 2
```

### Inspection API

The WaterDrop Buffered client provides two methods for accessing buffered messages:

- `#messages`: Retrieves all buffered messages in their produce order.

- `#messages_for`: Retrieves the buffered messages produced to one topic.

```ruby
PRODUCER.produce_sync(topic: 'test1', payload: '123')
PRODUCER.produce_sync(topic: 'test2', payload: '456')

PRODUCER.client.messages #=> [{:topic=>"test1", :payload=>"123"}, {:topic=>"test2", :payload=>"456"}]

PRODUCER.client.messages_for('test1') #=> [{:topic=>"test1", :payload=>"123"}]
PRODUCER.client.messages_for('test2') #=> [{:topic=>"test2", :payload=>"456"}]
PRODUCER.client.messages_for('test3') #=> []
```

### Isolation

When using a per-process producer, it is essential to ensure test isolation. Without clearing the producer client buffers, messages from one test might unintentionally affect subsequent tests.

To prevent this, use the `client.reset` method as follows:

```ruby
PRODUCER.produce_async(topic: 'test', payload: '123')

puts PRODUCER.client.messages.count #=> 1

PRODUCER.client.reset

puts PRODUCER.client.messages.count #=> 0
```

This ensures each test starts with an empty buffer, eliminating potential cross-test interference.

## See Also

- [Testing](Basics-Testing) - For comprehensive testing strategies in Karafka applications
- [Producing Messages](Basics-Producing-Messages) - For message production techniques and patterns
