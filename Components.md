Karafka is a robust, Ruby-based framework for building Kafka-driven applications. It provides a comprehensive suite of tools for message production, consumption, and monitoring within Apache Kafka environments. The ecosystem consists of several specialized components:

- **[Karafka](https://github.com/karafka/karafka)** – core framework that handles message consumption from Kafka topics with advanced routing and processing capabilities
- **[WaterDrop](https://github.com/karafka/waterdrop)** – dedicated message production library optimized for high-performance and reliable delivery to Kafka clusters
- **[Karafka-Web](https://github.com/karafka/karafka-web)** –  User Interface providing real-time visibility into application operations
- **[Karafka-Rdkafka](https://github.com/karafka/karafka-rdkafka)** – custom fork of rdkafka-ruby that enhances functionality and stability for production environments
- **[Rdkafka-Ruby](https://github.com/appsignal/rdkafka-ruby/)** – base driver providing low-level Ruby bindings for the librdkafka C/C++ library, maintained by our team

## Producer

The producer can run in any Ruby process, allowing you to produce Kafka messages. 

The following code demonstrates both synchronous and asynchronous message production methods available in Karafka, showcasing the recommended approach for different use cases:

```ruby
# Fast, non-blocking, recommended
Karafka.producer.produce_async(topic: 'events', payload: Events.last.to_json)

# Slower, blocking
Karafka.producer.produce_sync(topic: 'events', payload: Events.last.to_json)

Karafka.producer.class #=> WaterDrop::Producer
```

Karafka uses [WaterDrop](https://github.com/karafka/waterdrop) to produce messages. It is a standalone Karafka framework component that can also be used in applications that only produce messages.

For more details, see [WaterDrop documentation](https://karafka.io/docs/#waterdrop).

## Consumer / Server

Each Karafka server process pulls messages from Kafka topics and processes them. The server will instantiate consumers and deliver messages from desired topics. Everything else is up to your code.

The following examples shows a minimal implementation of a consumer printing payload of fetched messages:

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

Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications without using the command line or third-party software. It does **not** require any additional database beyond Kafka itself.

The following image provides a visual preview of the Karafka Web UI interface, showcasing its dashboard for monitoring Kafka consumers, producers, and topics in a centralized view:

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui.png" alt="Karafka Web UI"/>
</p>

## Karafka-Rdkafka

Karafka uses its fork of the `rdkafka-ruby`. It is done to ensure that each release is complete, stable, and tested against the Karafka ecosystem. Providing our driver layer ensures that upgrades are safe and reliable.

## Rdkafka-ruby

A modern and high-performance Kafka client library for Ruby, built on top of librdkafka. It acts as a base for the `karafka-rdkafka` gem and is also maintained by usour team. It was created and developed by [AppSignal](https://www.appsignal.com/) until the handover at the end of 2023.
