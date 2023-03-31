**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Karafka has a default strategy for consumer ids. Each consumer group id is a combination of the group name taken from the routing and the client_id. This is a really good convention for new applications and systems, however, if you migrate from other tools, you may want to preserve your different naming convention. To do so, you can implement a consumer mapper that will follow your conventions.

Mapper needs to implement the following method:

- ```#call``` - accepts raw consumer group name, should return remapped id.

For example, if you want to skip the ```client_id``` all you need to do, is to create a mapper like the one below:

```ruby
module MyCustomConsumerMapper
  # @param raw_consumer_group_name [String, Symbol] raw consumer group name
  # @return [String] remapped final consumer group name
  def call(raw_consumer_group_name)
    raw_consumer_group_name
  end
end
```

In order to use it, assign it as your default ```consumer_mapper```:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.consumer_mapper = MyCustomConsumerMapper.new
    # Other config options
  end
end
```
