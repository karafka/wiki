It's quite common when using Kafka to treat applications as parts of a bigger pipeline (similarly to Bash pipeline) and forward processing results to other applications. Karafka provides a way of dealing with that by allowing you to use the [WaterDrop](https://github.com/karafka/waterdrop) messages producer from any place within your application.

You can access the pre-initialized WaterDrop producer instance using the `Karafka.producer` method from any place within your codebase.

```ruby
Karafka.producer.produce_async(
  topic: 'events',
  payload: Events.last.to_json
)
```

WaterDrop is thread-safe and operates well in scale.

If you're looking to produce messages within Karafka consumers, you have several convenient alias methods at your disposal, including `#producer`, `#produce_sync`, `#produce_async`, `#produce_many_sync`, and `#produce_many_async`. Here's how you might use them:

```ruby
class VisitsConsumer < ApplicationConsumer
  def consume
    ::Visit.insert_all(messages.payloads)

    producer.produce_async(
      topic: 'events',
      payload: { type: 'inserted', count: messages.count }.to_json
    )

    # Or you can use the listed methods directly, bypassing `#producer` reference:
    produce_async(
      topic: 'events',
      payload: { type: 'inserted', count: messages.count }.to_json
    )
  end
end
```

Please follow the [WaterDrop documentation](https://karafka.io/docs/WaterDrop-Usage/) for more details on how to use it.

## Messages Piping

If you are looking for seamless message piping in Kafka-based systems, we recommend checking out the [message piping](https://karafka.io/docs/Pro-Piping) feature in Karafka Pro. Exclusive to Karafka Pro, this feature offers synchronous and asynchronous forwarding capabilities with enhanced traceability, which is perfect for streamlining data workflows.

## Producer Shutdown

When using the Karafka producer in processes like Puma, Sidekiq, or rake tasks, it is always recommended to call the `#close` method on the producer before shutting it down.

This is because the `#close` method ensures that any pending messages in the producer's buffer are flushed to the Kafka broker before shutting down the producer. If you do not call `#close`, there is a risk that some messages may not be sent to the Kafka broker, resulting in lost or incomplete data.

In addition, calling `#close` also releases any resources held by the producer, such as network connections, file handles, and memory buffers. Failing to release these resources can lead to memory leaks, socket exhaustion, or other system-level issues that can impact the stability and performance of your application.

Overall, calling `#close` on the Karafka producer is a best practice that helps ensure reliable and efficient message delivery to Kafka while promoting your application's stability and scalability.

Below you can find an example how to `#close` the producer used in various Ruby processes. Please note, that you should **not** close the producer manually if you are using the [Embedding API](Embedding) in the same process.

### Closing Producer Used in Karafka

When you shut down Karafka consumer, the `Karafka.producer` automatically closes. There's no need to close it yourself. If you're using multiple producers or a more advanced setup, you can use the `app.stopped` event during shutdown to handle them.

### Closing Producer Used in Puma

```ruby
# config/puma.rb 

on_worker_shutdown do
  ::Karafka.producer.close
end
```

### Closing Producer Used in Sidekiq

```ruby
# config/initializers/sidekiq.rb

Sidekiq.configure_server do |config|
  config.on(:shutdown) do
    ::Karafka.producer.close
  end
end
```

### Closing Producer Used in Passenger

```ruby
PhusionPassenger.on_event(:stopping_worker_process) do
  ::Karafka.producer.close
end
```

### Closing Producer Used in a Rake Task

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

### Closing Producer in any Ruby Process

While integrating Karafka producers into your Ruby applications, it's essential to ensure that resources are managed correctly, especially when terminating processes. We generally recommend utilizing hooks specific to the environment or framework within which the producer operates. These hooks ensure graceful shutdowns and resource cleanup tailored to the application's lifecycle.

However, there might be scenarios where such specific hooks are not available or suitable. In these cases, Ruby's `at_exit` hook can be employed as a universal fallback to close the producer before the Ruby process exits. Here's a basic example of using at_exit with a Karafka producer:

```ruby
at_exit do
  Karafka.producer.close
end
```

## Producing to Multiple Clusters

Karafka, by default, provides a producer that sends messages to a specified Kafka cluster. If you don't configure it otherwise, this producer will always produce messages to the default cluster that you've configured Karafka to work with. If you only specify one Kafka cluster in your configuration, all produced messages will be sent to this cluster. This is the out-of-the-box behavior and works well for many setups with a single cluster.

However, if you have a more complex setup where you'd like to produce messages to different Kafka clusters based on certain logic or conditions, you need a more customized setup. In such cases, you must configure a producer for each cluster you want to produce. This means you'll have separate producer configurations tailored to each cluster, allowing you to produce to any of them as required.

In scenarios where you want to decide which cluster to produce to based on the consumer logic or the consumed message, you can override the `#producer` method in your consumer. By overriding this method, you can specify a dedicated cluster-aware producer instance depending on your application's logic.

```ruby
# Define your producers for each of the clusters
PRODUCERS_FOR_CLUSTERS = {
  primary: Karafka.producer,
  secondary: ::WaterDrop::Producer.new do |p_config|
    p_config.kafka = {
      'bootstrap.servers': 'localhost:9095',
      'request.required.acks': 1
    }
  end
}


# And overwrite the default producer in any consumer you need
class MyConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      # Pipe messages to the secondary cluster
      producer.produce_async(topic: message.topic, payload: message.raw_payload)
    end
  end

  private

  def producer
    PRODUCERS_FOR_CLUSTERS.fetch(:secondary)
  end
end
```

The Web UI relies on per-producer listeners to monitor asynchronous errors. If you're crafting your consumers and utilizing the Web UI, please ensure you configure this integration appropriately.

By leveraging this flexibility in Karafka, you can effectively manage and direct the flow of messages in multi-cluster Kafka environments, ensuring that data gets to the right place based on your application's unique requirements.
