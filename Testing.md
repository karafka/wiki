Karafka components work in isolation and are pretty simple. While testing, there are 3 crucial parts you should focus on:

- [Consumers](#consumers)
- [Producers](#producers)
- [Consumer groups and topics structure](#consumer-groups-and-topics-structure)

The only thing you need to remember about testing (if you don't use Ruby on Rails integration or integration with any other framework) is to require the ```karafka.rb``` file in your test/spec helper:

```ruby
require './karafka.rb'
```

## Consumers

Since Karafka `1.4` we have a dedicated helper library for testing consumers. Please look at the [karafka-testing README](https://github.com/karafka/testing) for more details.

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

## Producers

WIP

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
