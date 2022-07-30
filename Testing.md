Karafka components work in isolation and are pretty simple. While testing, there are three crucial parts you should focus on:

## Consumers and producers

We have a dedicated helper library for testing consumers and producers.

Please look at the [karafka-testing README](https://github.com/karafka/karafka-testing) for details and examples.

## Consumer groups and topics structure

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
      let(:topic) { group.topics.find { |ts| ts.name == 'xml_data' } }

      it { expect(topic.deserializer).to eq XmlDeserializer }
    end
  end
end
```
