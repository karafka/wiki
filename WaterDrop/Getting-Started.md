# Getting Started with WaterDrop

!!! info

    If you want to both produce and consume messages, please use [Karafka](Getting-Started). It integrates WaterDrop automatically.

To get started with WaterDrop:

1. Add it to your Gemfile:

```bash
bundle add waterdrop
```

2. Create and configure a producer:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'request.required.acks': 1
  }
end
```

3. Use it as follows:

```ruby
# And use it
producer.produce_sync(topic: 'my-topic', payload: 'my message')

# or for async
producer.produce_async(topic: 'my-topic', payload: 'my message')

# or in batches
producer.produce_many_sync(
  [
    { topic: 'my-topic', payload: 'my message'},
    { topic: 'my-topic', payload: 'my message'}
  ]
)

# both sync and async
producer.produce_many_async(
  [
    { topic: 'my-topic', payload: 'my message'},
    { topic: 'my-topic', payload: 'my message'}
  ]
)
```

!!! info

    For additional WaterDrop usage examples, please refer to the [Usage](WaterDrop-Usage) section of this documentation.
