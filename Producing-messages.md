It's quite common when using Kafka to treat applications as parts of a bigger pipeline (similarly to Bash pipeline) and forward processing results to other applications. Karafka provides a way of dealing with that by allowing you to use the [WaterDrop](https://github.com/karafka/waterdrop) messages producer from any place within your application.

You can access the pre-initialized WaterDrop producer instance using the `Karafka.producer` method from any place within your codebase.

```ruby
Karafka.producer.produce_async(
  topic: 'events',
  payload: Events.last.to_json
)
```

WaterDrop is thread-safe and operates well in scale.

If you want to produce messages from the Karafka consumers, there's a handy alias method `#producer` for this:

```ruby
class VisitsConsumer < ApplicationConsumer
  def consume
    ::Visit.insert_all(messages.payloads)

    producer.produce_async(
      topic: 'events',
      payload: { type: 'inserted', count: messages.count }.to_json
    )
  end
end
```

Please follow the [WaterDrop README](https://github.com/karafka/waterdrop/blob/master/README.md) for more details on how to use it.
