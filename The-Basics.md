Karafka is a framework for producing and consuming messages using Kafka. It requires three parts:

## Producer

The producer can run in any Ruby process and allows you to produce messages to Kafka.

```ruby
# Fast, non-blocking, recommended
Karafka.producer.produce_async(topic: 'events', payload: Events.last.to_json)

# Slower, blocking
Karafka.producer.produce_sync(topic: 'events', payload: Events.last.to_json)

Karafka.producer.class #=> WaterDrop::Producer
```

Karafka uses [WaterDrop](https://github.com/karafka/waterdrop) to produce messages. It is a standalone Karafka framework component that can also be used in applications that only produce messages.

Please refer to [WaterDrop README](https://github.com/karafka/waterdrop#usage=) for more details.

## Consumer / server

Each Karafka server process pulls messages from Kafka topics and processes them. The server will instantiate consumers and deliver you messages from desired topics. Everything else is up to your code.

Example consumer printing payload of fetched messages:

```ruby
class PrintingConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      puts message.payload
    end
  end
end
```

## Apache Kafka

Apache Kafka acts as a storage backbone for Karafka.

See [Setting up Kafka](Setting-up-Kafka) for info about Kafka configuration.
