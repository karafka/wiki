Karafka is a framework for producing and consuming messages using Kafka. It is built out of a few components:

- [Karafka](https://github.com/karafka/karafka) (Consumer) - responsible for consuming messages from Kafka
- [WaterDrop](https://github.com/karafka/waterdrop) (Producer) - messages producer integrated with Karafka out of the box
- [Karafka-Web](https://github.com/karafka/karafka-web) (UI) - User interface for the Karafka framework
- [Karafka-Rdkafka](https://github.com/karafka/karafka-rdkafka) (Driver) - A customized fork of `rdkafka-ruby` providing additional functionalities and extended stability
- [Rdkafka-Ruby](https://github.com/appsignal/rdkafka-ruby/) (Driver base) - The original librdkafka bindings also maintained by us.

## Producer

The producer can run in any Ruby process, allowing you to produce Kafka messages.

```ruby
# Fast, non-blocking, recommended
Karafka.producer.produce_async(topic: 'events', payload: Events.last.to_json)

# Slower, blocking
Karafka.producer.produce_sync(topic: 'events', payload: Events.last.to_json)

Karafka.producer.class #=> WaterDrop::Producer
```

Karafka uses [WaterDrop](https://github.com/karafka/waterdrop) to produce messages. It is a standalone Karafka framework component that can also be used in applications that only produce messages.

Please refer to [WaterDrop documentation](https://karafka.io/docs/#waterdrop) for more details.

## Consumer / server

Each Karafka server process pulls messages from Kafka topics and processes them. The server will instantiate consumers and deliver messages from desired topics. Everything else is up to your code.

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

## Karafka Web

Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications without the need to use the command line or third-party software. It does **not** require any additional database beyond Kafka itself.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui.png" alt="Karafka Web UI"/>
</p>

## Karafka-Rdkafka

Karafka uses its fork of the `rdkafka-ruby`. It is done to ensure that each release is complete, stable, and tested against the Karafka ecosystem. Providing our driver layer ensures that upgrades are safe and reliable.

## Rdkafka-ruby

Modern and performant Kafka client library for Ruby based on librdkafka. It acts as a base for the `karafka-rdkafka` gem and is also maintained by us. It was created and developed by [AppSignal](https://www.appsignal.com/) until a handover at the end of 2023.
