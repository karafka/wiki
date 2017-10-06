## Consumer mappers

Karafka has a default strategy for consumer ids. Each consumer id is a combination of the group name taken from the routing and the client_id. This is a really good convention for new applications and systems, however if you migrate from other tools, you may want to preserve your naming convention that is different. To do so, you can implement a consumer mapper that will follow your conventions.

Mapper needs to implement following method:

- ```call``` - accepts raw consumer group name, should return remapped id.

For example, if you want to skip the ```client_id``` all you need to do, is to create a mapper like the one below:

```ruby
module MyCustomConsumerMapper
  # @param raw_consumer_group_name [String, Symbol] raw consumer group name
  # @return [String] remapped final consumer group name
  def self.call(raw_consumer_group_name)
    raw_consumer_group_name
  end
end
```

In order to use it, assign it as your default ```consumer_mapper```:

```ruby
class App < Karafka::App
  setup do |config|
    config.consumer_mapper = MyCustomConsumerMapper
  end
end
```

## Topic mappers

Some Kafka cloud providers require topics to be namespaced with a user name. This approach is understandable, but at the same time, makes your applications less provider agnostic. To target that issue, you can create your own topic mapper that will sanitize incoming/outgoing topic names, so your logic won't be binded to those specific versions of topic names.

Mapper needs to implement two following methods:

  - ```#incoming``` - accepts an incoming "namespace dirty" version ot topic. Needs to return sanitized topic.
  - ```#outgoing``` - accepts outgoing sanitized topic version. Needs to return namespaced one.

Given each of the topics needs to have "karafka." prefix, your mapper could look like that:

```ruby
class KarafkaTopicMapper
  def initialize(prefix)
    @prefix = prefix
  end

  def incoming(topic)
    topic.to_s.gsub("#{@prefix}.", '')
  end

  def outgoing(topic)
    "#{@prefix}.#{topic}"
  end
end

mapper = KarafkaTopicMapper.new('karafka')
mapper.incoming('karafka.my_super_topic') #=> 'my_super_topic'
mapper.outgoing('my_other_topic') #=> 'karafka.my_other_topic'
```

To use custom mapper, just assign it during application configuration:

```ruby
class App < Karafka::App
  setup do |config|
    # Other settings
    config.topic_mapper = MyCustomMapper.new('username')
  end
end
```

Topic mapper automatically integrates with both messages consumer and responders.