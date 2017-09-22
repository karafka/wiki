## Consumer mappers

WIP

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