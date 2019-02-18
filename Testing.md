Karafka components work in isolation and are pretty simple. While testing, there are 3 crucial parts you should focus on:

- [Consumers](#consumers)
- [Responders](#responders)
- [Consumer groups and topics structure](#consumer-groups-and-topics-structure)

The only thing you need to remember about testing (if you don't use Ruby on Rails integration or integration with any other framework) is to require the ```karafka.rb``` file in your test/spec helper:

```ruby
require './karafka.rb'
```

## Consumers

Testing consumers is really easy. The only thing you need to do is the assignment of unparsed messages. After that, you can invoke your business logic and run the controller ```#consume``` method:

```ruby
class InlineBatchConsumer < ApplicationConsumer
  def consume
    sum = params_batch.map { |param| param.payload.fetch('number') }.sum
    Karafka.logger.info "Sum of #{params_batch.count} elements equals to: #{sum}"
  end
end
```

```ruby
RSpec.describe InlineBatchConsumer do
  subject(:consumer) { described_class.new }

  let(:nr1_payload) { rand }
  let(:nr2_payload) { rand }
  let(:nr1) { { 'number' => nr1_payload }.to_json }
  let(:nr2) { { 'number' => nr2_payload }.to_json }
  let(:sum) { nr1_payload + nr2_payload }

  before do
    consumer.params_batch = [{ 'payload' => nr1 }, { 'payload' => nr2 }]
    allow(Karafka.logger).to receive(:info)
  end

  it 'expects to log a proper message' do
    message = "Sum of 2 elements equal to: #{sum}"
    expect(Karafka.logger).to receive(:info).with(message)
    consumer.consume
  end
end
```

## Responders

[WaterDrop](https://github.com/karafka/waterdrop) - the library that works under the hood of responders provides a test mode. When this mode is enabled, messages will not be sent to Kafka but everything else will work exactly the same way. To enable this mode, add this to your ```spec/spec_helper``` file:

```ruby
require './karafka.rb'

# Don't send messages in the test env
WaterDrop.setup do |config|
  config.deliver = false
end
```

You can also do that in the ```#after_init``` based on your application environment:

```ruby
class App < Karafka::App
  after_init do
    # Don't send messages in the test env
    WaterDrop.setup do |config|
      config.deliver = !Karafka.env.test?
    end
  end
end
```

Here's an example responder and an example RSpec spec to it:

```ruby
module Pong
  class PingResponder < ApplicationResponder
    topic :pong

    def respond(data)
      respond_to :pong, data
    end
  end
end
```

```ruby
RSpec.describe Pong::PingResponder do
  subject(:responder) { described_class.new }

  it { expect(described_class.topics.size).to eq 1 }

  describe 'supported topics' do
    describe 'pong' do
      let(:topic) { described_class.topics['pong'] }

      it { expect(topic.name).to eq 'pong' }
      it { expect(topic.required?).to be true }
    end
  end

  describe '#call' do
    let(:input_data) { { rand => rand } }

    let(:accumulated_data) do
      [[input_data.to_json, { topic: 'pong' }]]
    end

    it 'expect to add builds to message buffer' do
      responder.call(input_data)
      expect(responder.messages_buffer['pong']).to eq accumulated_data
    end

    context 'when we try to use the same responder more than once' do
      let(:error) { Karafka::Errors::InvalidResponderUsage }

      it 'expects to raise an error since its not a multiple usage responder' do
        expect { 2.times { responder.call(input_data) } }.to raise_error error
      end
    end
  end
end
```

## Consumer groups and topics structure

Sometimes you may need to spec out your consumer groups and topics structure. To do so, simply access the ```Karafka::App.consumer_groups``` array and check everything you need. Here's an example of a Rspec spec that ensures a custom ```XmlDeserializer``` is being used to a ```xml_data``` topic from the ```batched_group``` consumer group:

```ruby
RSpec.describe Karafka::App.consumer_groups do
  describe 'batched group' do
    let(:group) do
      Karafka::App.consumer_groups.find do |cg|
        cg.name == 'batched_group'
      end
    end

    describe 'xml_data topic' do
      let(:topic) { group.topics.find { |ts| ts.name == 'xml_data' } }

      it { expect(topic.deserializer).to eq XmlDeserializer }
    end
  end
end
```
