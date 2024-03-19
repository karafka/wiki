Karafka provides a dedicated helper library for testing consumers and producers called [karafka-testing](https://github.com/karafka/karafka-testing).

## Usage with RSpec

### Installation

Add this gem to your Gemfile in the `test` group:

```ruby
group :test do
  gem 'karafka-testing'
  gem 'rspec'
end
```

and then in your `spec_helper.rb` file you must:

- require the helpers
- include appropriate helpers
- require the karafka entrypoint (only when not using Ruby on Rails)

```ruby
# Require entrypoint only when not using Rails, in Rails it happens automatically
require './karafka'
require 'karafka/testing/rspec/helpers'

RSpec.configure do |config|
  config.include Karafka::Testing::RSpec::Helpers
end
```

Once included in your RSpec setup, this library will provide you with a special `#karafka` object that contains three methods that you can use within your specs:

- `#consumer_for` - creates a consumer instance for the desired topic. It **needs** to be set as the spec subject.
- `#produce` - "sends" message to the consumer instance.
- `#produced_messages` - contains all the messages "sent" to Kafka during spec execution.

!!! note ""

    Messages sent using the `#produce` method and directly from `Karafka.producer` won't be sent to Kafka. They will be buffered and accessible in a per-spec buffer in case you want to test messages production.

!!! note ""

    Messages that target the topic built using the `karafka#consumer_for` method will additionally be delivered to the consumer you want to test.

### Testing Messages Consumption (Consumers)

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

Since each [Routing Pattern](https://karafka.io/docs/Pro-Routing-Patterns) has a name, you can test them like regular topics.

Giving a pattern with the name `visits`:

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

You can reference this name when using the `karafka.consumer_for` method:

```ruby
subject(:consumer) { karafka.consumer_for(:visits) }
```

### Testing Messages Production (Producer)

When running RSpec, Karafka will not dispatch messages to Kafka using `Karafka.producer` but will buffer them internally.

This means you can check your application flow, making sure your logic acts as expected:

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
  it { expect(karafka.produced_messages.first[:topic]).to eq('user.created') }
  it { expect(karafka.produced_messages.first[:key]).to eq(created_user.id.to_s) }
end
```

#### Testing Transactions

When testing producer transactions in Karafka, the approach is similar to how the non-transactional production of messages is tested. Within a transaction, messages you send are held and not immediately placed into the buffer. When the transactional block finishes successfully, these messages get moved into the buffers, ready to be produced to Kafka.

If, for any reason, the transaction is aborted, messages inside that transaction won't reach the buffers. This mimics the real-world behavior where an aborted transaction would prevent messages from being sent to Kafka.

Therefore, when you're writing tests for producer transactions in Karafka, you can:

1. Simulate the successful transaction completion and check if messages were placed into the buffers.

2. Simulate an aborted transaction and ensure that no messages reach the buffers.

This approach lets you verify the behavior of your code within transactional boundaries, ensuring that messages are handels as expected in both successful and aborted transaction scenarios.

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

Sometimes you may need to spec out your consumer groups and topics structure. To do so, simply access the ```Karafka::App.routes``` array and check everything you need. Here's an example of a Rspec spec that ensures a custom ```XmlDeserializer``` is being used to a ```xml_data``` topic from the ```batched_group``` consumer group:

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

      it { expect(topic.deserializer).to eq XmlDeserializer }
    end
  end
end
```

## Usage with Minitest

### Installation

Add this gem to your Gemfile in the `test` group:

```ruby
group :test do
  gem 'karafka-testing'
  gem 'rspec'
end
```

And then:

- require the helpers: `require 'karafka/testing/minitest/helpers'`
- include the following helper in your tests:  `include Karafka::Testing::Minitest::Helpers`

Once included in your Minitest setup, this library will provide you with a special `@karafka` object that contains three methods that you can use within your specs:

- `#consumer_for` - creates a consumer instance for the desired topic. It **needs** to be set as the spec subject.
- `#produce` - "sends" message to the consumer instance.
- `#produced_messages` - contains all the messages "sent" to Kafka during spec execution.

!!! note ""

    Messages sent using the `#produce` method and directly from `Karafka.producer` won't be sent to Kafka. They will be buffered and accessible in a per-spec buffer if you want to test message production.

!!! note ""

    Messages that target the topic built using the `karafka#consumer_for` method will additionally be delivered to the consumer you want to test.

### Testing Messages Consumption (Consumers)

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

This means you can check your application flow, making sure your logic acts as expected:

```ruby
class UsersBuilderTest < ActiveSupport::TestCase
  include Karafka::Testing::Minitest::Helpers

  def setup
    @user_details = { name: 'John Doe', email: 'john.doe@example.com' }
    @created_user = UsersBuilder.new.create(@user_details)
  end

  test 'should produce messages' do
      @karafka.producer.produce_sync(
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

!!! note ""

    If you're seeking guidance on testing transactions with Minitest, it's recommended to consult the RSpec transactions testing documentation, as the testing methods are similar for both.
