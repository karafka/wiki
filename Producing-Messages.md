It is quite common in Kafka to treat applications as components of a larger pipeline, similar to a Bash pipeline, where processing results are forwarded to other applications. Karafka facilitates this by enabling you to use the [WaterDrop](https://github.com/karafka/waterdrop) message producer from anywhere in your application.

You can access the pre-initialized WaterDrop producer instance using the `Karafka.producer` method from any location within your codebase.

The following example demonstrates how to asynchronously produce a message to Kafka.

```ruby
Karafka.producer.produce_async(
  topic: 'events',
  payload: Events.last.to_json
)
```

WaterDrop is thread-safe and operates well at scale.

If you need to produce messages within Karafka consumers, you have several convenient alias methods at your disposal, including `#producer`, `#produce_sync`, `#produce_async`, `#produce_many_sync`, and `#produce_many_async`, as shown in the folllowing example:

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

For more details on how to use the WaterDrop producer and its various message production methods, see [WaterDrop documentation](WaterDrop-Usage) .

## Messages Piping

If you are looking for seamless message piping in Kafka-based systems, see [Piping](Pro-Piping) to get familiar with the message piping feature exclusive to Karafka Pro. This feature offers synchronous and asynchronous forwarding capabilities with enhanced traceability, which is perfect for streamlining data workflows.

## Producer Shutdown

Before shutting down the Karafka producer in processes such as Puma, Sidekiq, or rake tasks, make sure to call the `#close` method on the producer.

This is because the `#close` method ensures that any pending messages in the producer buffer are flushed to the Kafka broker before shutting down the producer. 

!!! info

    If you do not call `#close`, there is a risk that some messages may not be sent to the Kafka broker, resulting in lost or incomplete data. In addition, calling `#close` also releases any resources held by the producer, such as network connections, file handles, and memory buffers. Failing to release these resources can lead to memory leaks, socket exhaustion, or other system-level issues that can impact the stability and performance of your application.

Overall, calling `#close` on the Karafka producer is a best practice that helps ensure reliable and efficient message delivery to Kafka while promoting your application stability and scalability.

In the following sections, you can find an example of how to `#close` the producer used in various Ruby processes.

!!! warning

    Note, that you should **not** close the producer manually if you are using the [Embedding API](Embedding) in the same process.

### Closing Producer Used in Karafka

When you shut down the Karafka consumer, the `Karafka.producer` automatically closes. There is no need to close it yourself. If you are using multiple producers or a more advanced setup, you can use the `app.stopped` event during shutdown to handle them.

The following examples show how to properly close Karafka producers in various Ruby environments to ensure all messages are delivered and resources are released.

### Closing Producer Used in Puma (Single Mode)

**For Puma < 7:**

```ruby
# config/puma.rb 

# There is no `on_worker_shutdown` equivalent for single mode
@config.options[:events].on_stopped do
  Karafka.producer.close
end
```

**For Puma >= 7:**

```ruby
# config/puma.rb 

# There is no `before_worker_shutdown` equivalent for single mode
@config.options[:events].after_stopped do
  Karafka.producer.close
end
```

### Closing Producer Used in Puma (Cluster Mode)

**For Puma < 7:**

```ruby
# config/puma.rb 

on_worker_shutdown do
  ::Karafka.producer.close
end
```

**For Puma >= 7:**

```ruby
# config/puma.rb 

before_worker_shutdown do
  ::Karafka.producer.close
end
```

### Closing Producer Used in Sidekiq

```ruby
# config/initializers/sidekiq.rb

Sidekiq.configure_server do |config|
  # You can use :shutdown for older Sidekiq versions if
  # :exit is not available
  config.on(:exit) do
    ::Karafka.producer.close
  end
end
```

### Closing Producer Used in Solid Queue

```ruby
# config/initializers/solid_queue.rb

# This code will close the producer in each worker process
SolidQueue.on_worker_exit do
  ::Karafka.producer.close
end

# Below is optional - useful only when publishing events to Kafka
# from the supervisor process
SolidQueue.on_exit do
  ::Karafka.producer.close
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

  # Make sure that the producer is always closed before finishing
  # any rake task
  ::Karafka.producer.close
end
```

### Closing Producer in any Ruby Process

While integrating Karafka producers into your Ruby applications, it is essential to ensure that resources are managed correctly, especially when terminating processes. We generally recommend utilizing hooks specific to the environment or framework within which the producer operates. These hooks ensure proper shutdowns and resource cleanup tailored to the application lifecycle.

However, there might be scenarios where such specific hooks are not available or suitable. In these cases, employ Ruby's `at_exit` hook as a universal fallback to close the producer before the Ruby process exits. 

The following basic example demonstrates using at_exit with a Karafka producer:

```ruby
at_exit do
  Karafka.producer.close
end
```

## Producing to Multiple Clusters

Karafka, by default, provides a producer that sends messages to a specified Kafka cluster. If you do not configure it otherwise, this producer will always produce messages to the default cluster that you have configured Karafka to work with. If you specify one Kafka cluster in your configuration, all produced messages will be sent to this cluster. This is the out-of-the-box behavior and works well for many setups with a single cluster.

However, if you have a more complex setup where you need to produce messages to different Kafka clusters based on certain logic or conditions, you need a more customized setup. In such cases, configure a producer for each cluster you want to produce to. This allows for distinct producer configurations for each cluster, making it possible to produce to any of them as needed.

If you need to determine which cluster to produce to based on the consumer logic or the message being consumed, you can override the `#producer` method in your consumer. By doing so, you can define a cluster-aware producer instance that aligns with your application's logic.

The following example demonstrates how to create and use multiple producers for different Kafka clusters, allowing you to dynamically route messages:

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

The Web UI relies on per-producer listeners to monitor asynchronous errors. If you craft your consumers and utilize the Web UI, make sure that you configure this integration appropriately.

By leveraging this flexibility in Karafka, you can effectively manage and direct message flow in multi-cluster Kafka environments, ensuring data reaches the right place based on your application's unique requirements.
