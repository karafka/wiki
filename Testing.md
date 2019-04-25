Karafka components work in isolation and are pretty simple. While testing, there are 3 crucial parts you should focus on:

- [Consumers](#consumers)
- [Responders](#responders)
- [Consumer groups and topics structure](#consumer-groups-and-topics-structure)

The only thing you need to remember about testing (if you don't use Ruby on Rails integration or integration with any other framework) is to require the ```karafka.rb``` file in your test/spec helper:

```ruby
require './karafka.rb'
```

## Consumers

Since Karafka `1.3` we have a dedicated helper library for testing consumers. Please look at the [karafka-testing README](https://github.com/karafka/testing) for more details.

Testing consumers is really easy.

Add this gem to your Gemfile in the test group:

```ruby
group :test do
  gem 'karafka-testing'
  gem 'rspec'
end
```

then in your `spec_helper.rb` file:

```ruby
require 'karafka/testing/rspec/helpers'

RSpec.configure do |config|
  config.include Karafka::Testing::RSpec::Helpers
end
```

and you are ready to go with your specs:


```ruby
RSpec.describe InlineBatchConsumer do
  # This will create a consumer instance with all the settings defined for the given topic
  subject(:consumer) { karafka_consumer_for(:inline_batch_data) }

  let(:nr1_value) { rand }
  let(:nr2_value) { rand }
  let(:sum) { nr1_value + nr2_value }

  before do
    # Sends first message to Karafka consumer
    publish_for_karafka({ 'number' => nr1_value }.to_json)
    # Sends second message to Karafka consumer
    publish_for_karafka({ 'number' => nr2_value }.to_json)
    allow(Karafka.logger).to receive(:info)
  end

  it 'expects to log a proper message' do
    expect(Karafka.logger).to receive(:info).with("Sum of 2 elements equals to: #{sum}")
    consumer.consume
  end
end
```


## Responders

[WaterDrop](https://github.com/karafka/waterdrop) - the library that works under the hood of responders provides a test mode. When this mode is enabled, messages will not be sent to Kafka but everything else will work exactly the same way.

If you **use** Ruby on Rails integration add this to your ```spec/rails_helper``` file:

```ruby
# Top of the file
ENV['RAILS_ENV'] ||= 'test'
ENV['KARAFKA_ENV'] ||= 'test'
require 'spec_helper'

# all the other things here...

# And at the end
App.boot!

WaterDrop.setup do |config|
  config.deliver = false
end
```

If you **don't** use Ruby on Rails integration, add this to your ```spec/spec_helper``` file:

```ruby
require './karafka.rb'

# Don't send messages in the test env
WaterDrop.setup do |config|
  config.deliver = false
end
```

You can also do that while setting up your application:

```ruby
class App < Karafka::App
  # Other things here...

  monitor.subscribe('app.initialized') do
    WaterDrop.setup { |config| config.deliver = !Karafka.env.test? }
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
