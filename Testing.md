Karafka provides a dedicated testing library, [`karafka-testing`](https://github.com/karafka/karafka-testing), designed to facilitate testing Karafka producers and consumers without the need to run Kafka server. This library effectively mocks Kafka interactions, allowing developers to write and run tests for consumers and producers in an isolated environment. The primary aim of `karafka-testing` is to eliminate the complexities and overhead of connecting to an actual Kafka cluster, initiating consumers, and managing producers during testing. This approach significantly reduces the setup time and resources needed for testing Kafka-related functionalities.

By focusing solely on consumer and producer interactions, `karafka-testing` provides a lightweight, efficient solution for developers to ensure the integrity of message handling in their applications without depending on a live Kafka setup.

!!! note "Testing Scope Limitations"

    `karafka-testing` does not support testing of all Kafka functionalities.

    Specifically, `karafka-testing` does not facilitate testing of the Admin API or any web UI interactions.  Additionally, testing consumers does not trigger instrumentation events, so any instrumentation-based logging or monitoring will not be covered during tests.

## Setting Up Karafka Testing with RSpec

This section guides you through integrating the Karafka testing library with RSpec. Follow these straightforward setup steps to configure your testing environment.

### Installation

Add this gem to your Gemfile in the `test` group:

```ruby
group :test do
  gem 'karafka-testing'
  gem 'rspec'
end
```

In your `spec_helper.rb` file, perform the following steps:

- require the karafka entrypoint (only if you do not use Ruby on Rails)
- require the helpers
- include appropriate helpers

```ruby
# Require entrypoint only when not using Rails, in Rails it happens automatically
require './karafka'
require 'karafka/testing/rspec/helpers'

RSpec.configure do |config|
  config.include Karafka::Testing::RSpec::Helpers
end
```

Once included in your RSpec setup, this library will provide you with a special `#karafka` object that contains three methods which you can use within your specs:

- `#consumer_for` - the method creates a consumer instance for the desired topic.
- `#produce` - the method sends message to the consumer instance.
- `#produced_messages` - the method contains all the messages "sent" to Kafka during spec execution.

!!! important "Message Buffering"

    Messages sent using the `#produce` method and directly from `Karafka.producer` are not sent to Kafka. They are buffered and accessible in a per-spec buffer in case you want to test messages production.

!!! note "Consumer Delivery"

    Messages that target the topic built using the `karafka#consumer_for` method are additionally delivered to the consumer that you want to test.

### Testing Messages Consumption (Consumers)

This section demonstrates how to effectively test your Karafka consumers using the testing library. You will learn how to create consumer instances, send test messages, and verify that your consumers process messages correctly. The following example shows a complete test case for an InlineBatchConsumer that receives multiple messages, processes them, and logs results. 

```ruby
RSpec.describe InlineBatchConsumer do
  # This will create a consumer instance with all the settings defined for the given topic
  subject(:consumer) { karafka.consumer_for('inline_batch_data') }

  let(:nr1_value) { rand }
  let(:nr2_value) { rand }
  let(:sum) { nr1_value + nr2_value }

  before do
    # Sends first message to Karafka consumer
    karafka.produce({ 'number' => nr1_value }.to_json)

    # Sends second message to Karafka consumer
    karafka.produce({ 'number' => nr2_value }.to_json, partition: 2)

    allow(Karafka.logger).to receive(:info)
  end

  it 'expects to log a proper message' do
    expect(Karafka.logger).to receive(:info).with("Sum of 2 elements equals to: #{sum}")
    consumer.consume
  end
end
```

If your consumers use `producer` to dispatch messages, you can check its operations as well:

```ruby
RSpec.describe InlineBatchConsumer do
  subject(:consumer) { karafka.consumer_for(:inline_batch_data) }

  before { karafka.produce({ 'number' => 1 }.to_json) }

  it 'expects to dispatch async message to messages topic with value bigger by 1' do
    consumer.consume

    expect(karafka.produced_messages.last.payload).to eq({ number: 2 }.to_json)
  end
end
```

### Testing Messages Consumption of Routing Patterns

Since each [Routing Pattern](Pro-Routing-Patterns) has a name, you can test them like regular topics.

Give a pattern with the name `visits`:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # config stuff...
  end

  routes.draw do
    pattern :visits, /_visits/ do
      consumer VisitsConsumer
    end
  end
end
```

Reference this name when you use the `karafka.consumer_for` method:

```ruby
subject(:consumer) { karafka.consumer_for(:visits) }
```

### Testing Messages Production (Producer)

When running RSpec, Karafka will not dispatch messages to Kafka using `Karafka.producer`, but will buffer them internally.

This allows you to verify your application flow, ensuring that your logic functions as expected:

```ruby
# Example class in which there is a message production
class UsersBuilder
  def create(user_details)
    user = ::User.create!(user_details)

    Karafka.producer.produce_sync(
      topic: 'users_changes',
      payload: { user_id: user.id, type: 'user.created' },
      key: user.id.to_s
    )

    user
  end
end

RSpec.describe UsersBuilder do
  let(:created_user) { described_class.new.create(user_details) }

  before { created_user }

  it { expect(karafka.produced_messages.size).to eq(1) }
  it { expect(karafka.produced_messages.first[:topic]).to eq('users_changes') }
  it { expect(karafka.produced_messages.first[:key]).to eq(created_user.id.to_s) }
end
```

#### Testing Transactions

When testing producer transactions in Karafka, the approach is similar to that for non-transactional message production. Within a transaction, messages you send are held rather than being placed in the buffer immediately. When the transactional block finishes successfully, these messages get moved into the buffers, ready to be produced to Kafka.

If a transaction is aborted for any reason, the messages within it will not reach the buffers. This mimics real-world behavior, where an aborted transaction prevents messages from being sent to Kafka.

Therefore, when you write tests for producer transactions in Karafka, you can:

1. Simulate the successful transaction completion and check if messages were placed into the buffers.

1. Simulate an aborted transaction and ensure that no messages reach the buffers.

This approach allows you to verify the behavior of your code within transactional boundaries, ensuring that messages are handed as expected in both successful and aborted transaction scenarios.

```ruby
class UsersBuilder
  def create_many(users_details)
    users = []

    Karafka.producer.transaction do
      user = ::User.create!(user_details)

      users << user

      Karafka.producer.produce_async(
        topic: 'users_changes',
        payload: { user_id: user.id, type: 'user.created' },
        key: user.id.to_s
      )
    end

    users
  end
end

RSpec.describe UsersBuilder do
  let(:created_users) { described_class.new.create_many([user_details, user_details]) }

  before { created_users }

  it { expect(karafka.produced_messages.size).to eq(2) }
  it { expect(karafka.produced_messages.first[:topic]).to eq('user.created') }
  it { expect(karafka.produced_messages.first[:key]).to eq(created_users.first.id.to_s) }
end
```

### Testing Consumer Groups and Topics Structure

When designing your Karafka application, you may need to verify your consumer groups and topics configuration. Karafka provides a straightforward way to examine this structure through the Karafka:```Karafka::App.routes``` array and check everything you need. Here's an example of a RSpec spec that ensures a custom ```XmlDeserializer``` is being used to a ```xml_data``` topic from the ```batched_group``` consumer group:

```ruby
RSpec.describe Karafka::App.routes do
  describe 'batched group' do
    let(:group) do
      Karafka::App.routes.find do |cg|
        cg.name == 'batched_group'
      end
    end

    describe 'xml_data topic' do
      let(:topic) { group.topics.find('xml_data') }

      it { expect(topic.deserializers.payload).to eq XmlDeserializer }
    end
  end
end
```

## Usage with Minitest

Alternative testing framework supported by Karafaka is Minitest. While the previous section demonstrated how to verify routing configurations with RSpec, this section explains how to integrate Karafka's testing capabilities with Minitest. The karafka-testing gem provides specialized helpers that simplify consumer testing regardless of your preferred testing framework.

### Installation

## Usage with Minitest

After learning how to test your consumer groups and topics structure with RSpec, you might prefer using Minitest as your testing framework. Karafka supports both testing approaches, allowing you to choose the framework that best fits your project's needs.

While the previous section demonstrated how to verify routing configurations with RSpec, this section explains how to integrate Karafka's testing capabilities with Minitest.

### Installation

To integrate Karafka testing with Minitest, perform the following steps:

1. Add the required gems to your Gemfile in the `test` group:

   ```ruby
   group :test do
     gem 'karafka-testing'
     gem 'minitest'
   end
   ```

1. Run bundle install to install the new dependencies:

   ```
   bundle install
   ```

1. Require the Karafka testing helpers in your test setup file:

   ```ruby
   require 'karafka/testing/minitest/helpers'
   ```

1. Include the helpers module in your test class:

   ```ruby
   include Karafka::Testing::Minitest::Helpers
   ```

**Result:**

Your Minitest environment is configured with Karafka testing capabilities. You have access to a `@karafka` object that provides three essential methods:

- `#consumer_for` - Creates a consumer instance for the desired topic.
- `#produce` - "Sends" messages to the consumer instance.
- `#produced_messages` - Contains all messages "sent" to Kafka during test execution.

!!! warning "Message Buffering"

    Messages sent using the `#produce` method and directly from `Karafka.producer` will not be sent to Kafka. They will be buffered and accessible in a per-spec buffer if you want to test message production.

!!! info "Consumer Testing Behavior"

    Messages that target the topic built using the `karafka#consumer_for` method will additionally be delivered to the consumer you want to test.
   
### Testing Messages Consumption (Consumers)

This section demonstrates how to write effective tests for your Karafka consumers using the testing helpers.The following example shows a complete test case for an inline batch consumer that processes numeric data: 


```ruby
class InlineBatchConsumerTest < ActiveSupport::TestCase
  include Karafka::Testing::Minitest::Helpers

  def setup
    # ..
    nr1_value = rand
    nr2_value = rand
    sum = nr1_value + nr2_value

    @consumer = @karafka.consumer_for('inline_batch_data')
  end

  it 'expects to log a proper message' do
    # Sends first message to Karafka consumer
    @karafka.produce({ 'number' => nr1_value }.to_json)

    # Sends second message to Karafka consumer
    @karafka.produce({ 'number' => nr2_value }.to_json, partition: 2)

    expect(Karafka.logger).to receive(:info).with("Sum of 2 elements equals to: #{sum}")

    consumer.consume
  end
end
```

If your consumers use `producer` to dispatch messages, you can check its operations as well:

```ruby
it 'expects to dispatch async message to messages topic with value bigger by 1' do
  @karafka.produce({ 'number' => 1 }.to_json)
  @consumer.consume

  expect(@karafka.produced_messages.last.payload).to eq({ number: 2 }.to_json)
end
```

### Testing Messages Production (Producer)

When running Minitest, Karafka will not dispatch messages to Kafka using `Karafka.producer` but will buffer them internally.

This allows you to review your application flow, ensuring your logic functions as intended:

```ruby
class UsersBuilderTest < ActiveSupport::TestCase
  include Karafka::Testing::Minitest::Helpers

  def setup
    @user_details = { name: 'John Doe', email: 'john.doe@example.com' }
    @created_user = UsersBuilder.new.create(@user_details)
  end

  test 'should produce messages' do
    Karafka.producer.produce_sync(
      topic: 'users_changes',
      payload: { user_id: user.id, type: 'user.created' },
      key: user.id.to_s
      )
    assert_equal 1, @karafka.produced_messages.size
    assert_equal 'users_changes', @karafka.produced_messages.first[:topic]
    assert_equal @created_user.id.to_s, @karafka.produced_messages.first[:key]
  end
end
```

!!! note

    If you're seeking guidance on testing transactions with Minitest, consult the RSpec transactions testing documentation, as the testing methods are similar for both.

## Limitations

`karafka-testing` primarily aims to eliminate the complexities and overhead of connecting to an actual Kafka cluster, starting consumers, and managing producers during testing. This approach significantly reduces the setup time and resources needed for testing Kafka-related functionalities.

However, keep in mind the following limitations of `karafka-testing`:

1. **No Real Kafka Interactions**: While `karafka-testing` effectively mocks the Kafka interactions, it does not replicate the behavior of a real Kafka cluster. As a result, certain edge cases and Kafka-specific behaviors may not be accurately represented in your tests.

1. **No Admin API Testing**: The `karafka-testing` library does not support testing of Kafka Admin API functionalities. If your application relies on Admin API operations, such as topic management or cluster metadata retrieval, you must perform these tests against a real Kafka cluster.

1. **No Web UI Interactions**: Any web UI interactions that might rely on actual Kafka data or state cannot be tested using `karafka-testing`. This limitation means that the end-to-end UI component testing will still require a live Kafka setup.

1. **Transactional Testing**: While `karafka-testing` supports transactional message production, it may not fully capture all the intricacies of Kafka transactions in a real cluster environment. It is important to be mindful of potential discrepancies between mocked transactions and their real-world counterparts.

1. **Batch Size Ignored**: The `karafka-testing` library does not respect the `max_messages` setting configured for topics in the `karafka.rb` routes. It simply accumulates and consumes all messages sent to it during testing, bypassing the actual fetching engine of Karafka. This means that batch processing behavior may not be accurately reflected in your tests, as the library will consume all messages produced regardless of the configured batch size.

---

## See Also

- [Active Job](Active-Job) - Testing Active Job integration with Karafka
- [Enhanced Active Job](Pro-Enhanced-Active-Job) - Testing ordered and scheduled Active Jobs
- [Dead Letter Queue](Dead-Letter-Queue) - Testing DLQ behavior and error handling
- [Virtual Partitions](Pro-Virtual-Partitions) - Testing consumers with parallel processing
- [Deserialization](Deserialization) - Testing custom deserializers and routing awareness
