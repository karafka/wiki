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

## Producer shutdown

When using the Karafka producer in processes like Puma, Sidekiq, or rake tasks, it is always recommended to call the #close method on the producer before shutting it down.

This is because the `#close` method ensures that any pending messages in the producer's buffer are flushed to the Kafka broker before shutting down the producer. If you do not call #close, there is a risk that some messages may not be sent to the Kafka broker, resulting in lost or incomplete data.

In addition, calling #close also releases any resources held by the producer, such as network connections, file handles, and memory buffers. Failing to release these resources can lead to memory leaks, socket exhaustion, or other system-level issues that can impact the stability and performance of your application.

Overall, calling `#close` on the Karafka producer is a best practice that helps ensure reliable and efficient message delivery to Kafka while promoting your application's stability and scalability.

Below you can find an example how to `#close` the producer used in various Ruby processes. Please note, that you should **not** close the producer manually if you are using the [Embedding API](Embedding) in the same process.

### Closing producer used in Puma

```ruby
# config/puma.rb 

on_worker_shutdown do
  ::Karafka.producer.close
end
```

### Closing producer used in Sidekiq

```ruby
# config/initializers/sidekiq.rb

Sidekiq.configure_server do |config|
  config.on(:shutdown) do
    ::Karafka.producer.close
  end
end
```

### Closing producer used in Passenger

```ruby
PhusionPassenger.on_event(:stopping_worker_process) do
  ::Karafka.producer.close
end
```

### Closing producer used in a rake task

In case of rake tasks, just invoke `::Karafka.producer.close` at the end of your rake task:

```ruby
desc 'My example rake task that sends all users data to Kafka'
task send_users: :environment do
  User.find_each do |user|
    ::Karafka.producer.produce_async(
      topic: 'users',
      payload: user.to_json,
      key: user.id
    )
  end

  # Make sure, that the producer is always closed before finishing
  # any rake task
  ::Karafka.producer.close
end
```
