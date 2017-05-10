![karafka logo](http://mensfeld.github.io/karafka-framework-introduction/img/karafka-04.png)

Framework used to simplify Apache Kafka based Ruby applications development.

It allows programmers to use approach similar to "the Rails way" when working with asynchronous Kafka messages.

Karafka not only handles incoming messages but also provides tools for building complex data-flow applications that receive and send messages.

## How does it work

Karafka provides a higher-level abstraction than raw Kafka Ruby drivers, such as Kafka-Ruby and Poseidon. Instead of focusing on  single topic consumption, it provides developers with a set of tools that are dedicated for building multi-topic applications similarly to how Rails applications are being built.

## Support

If you have any questions about using Karafka, feel free to join our [Gitter](https://gitter.im/karafka/karafka) chat channel.

## Requirements

In order to use Karafka framework, you need to have:

  - Zookeeper (required by Kafka)
  - Kafka (at least 0.9.0)
  - Ruby (at least 2.3.0)

## Installation

Karafka does not have a full installation shell command. In order to install it, please follow the below steps:

Create a directory for your project:

```bash
mkdir app_dir
cd app_dir
```

Create a **Gemfile** with Karafka:

```ruby
source 'https://rubygems.org'

gem 'karafka'
```

and run Karafka install CLI task:

```
bundle exec karafka install
```
