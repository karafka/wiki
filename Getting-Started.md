## Prerequisites

<!-- [Maciek] TODO: jak odbywa się weryfikacja? -->

1. To verify that Apache Kafka is running, run the following command:

```bash
docker ps | grep kafka
```

2. If it is not running, then set up Kafka. For instructions, see [Setting Up Kafka](Kafka-Setting-Up).

## For Existing Applications

1. Add Karafka to your Gemfile:

```shell
# Make sure to install Karafka 2.5 as Karafka 1.4 is no longer maintained
bundle add karafka --version ">= 2.5.0"
```

2. To install Karafka either for Rails or standalone applications, run the following command:

```shell
bundle exec karafka install
```

**Result**: All necessary files and directories are generated:

- `karafka.rb` — the main file where you configure Karafka and define which consumers should consume what topics
- `app/consumers/example_consumer.rb` — an example consumer
- `app/consumers/application_consumer.rb` — the base consumer from which all consumers should inherit

3. To produce test messages, open the development console and enter:

```ruby
# Works from any place in your code and is thread-safe
# You usually want to produce async but here it may raise exception if Kafka is not available, etc
Karafka.producer.produce_sync(topic: 'example', payload: { 'ping' => 'pong' }.to_json)
```
<!-- TODO: Polled — poprawne słowo?-->
4. To start consuming messages, run the Karafka server:

```shell
bundle exec karafka server

# example outcome
[7616dc24-505a-417f-b87b-6bf8fc2d98c5] Polled 2 messages in 1000ms
[dcf3a8d8-0bd9-433a-8f63-b70a0cdb0732] Consume job for ExampleConsumer on example started
{"ping"=>"pong"}
{"ping"=>"pong"}
[dcf3a8d8-0bd9-433a-8f63-b70a0cdb0732] Consume job for ExampleConsumer on example finished in 0ms
```

Below is the demo of the installation process:

<div class="asciinema" data-cols="100" data-rows="14" data-cast="getting-started">
  <span style="display: none;">
    Note: Asciinema videos are not visible when viewing this wiki on GitHub. Go to
    <a href="https://karafka.io/docs">online</a>
    documentation instead.
  </span>
</div>

5. (Optional) To install and configure the Web UI, see [Getting Started with the Web UI
](Web-UI-Getting-Started).

## For New Applications (Starting From Scratch)

1. Create a `Gemfile`:

```ruby
# Gemfile
source "https://rubygems.org"

gem "karafka", ">= 2.5.0"
```

2. Run: `bundle install`

3. To install Karafka either for Rails and standalone applications, run the following command:

```shell
bundle exec karafka install
```

**Result**: All necessary files and directories are generated:

- `karafka.rb` — the main file where you configure Karafka and where you define which consumers should consume what topics.
- `app/consumers/example_consumer.rb` — an example consumer.
- `app/consumers/application_consumer.rb` — the base consumer from which all consumers should inherit.

4. Run a development console to produce messages to this example topic:

```ruby
# Works from any place in your code and is thread-safe
# You usually want to produce async but here it may raise exception if Kafka is not available, etc
Karafka.producer.produce_sync(topic: 'example', payload: { 'ping' => 'pong' }.to_json)
```

5. To start consuming messages, run the karafka server:

```shell
bundle exec karafka server

# example outcome
[7616dc24-505a-417f-b87b-6bf8fc2d98c5] Polled 2 messages in 1000ms
[dcf3a8d8-0bd9-433a-8f63-b70a0cdb0732] Consume job for ExampleConsumer on example started
{"ping"=>"pong"}
{"ping"=>"pong"}
[dcf3a8d8-0bd9-433a-8f63-b70a0cdb0732] Consume job for ExampleConsumer on example finished in 0ms
```

## Example applications

If you have any problems setting up Karafka or need a ready application to play with, clone our examples repository:

```shell
git clone https://github.com/karafka/example-apps ./example_apps
```

and follow the instructions from the [example apps Wiki](https://github.com/karafka/example-apps/blob/master/README.md).

## Use cases, edge cases, and usage examples

Karafka ships with a full integration test suite that illustrates various use cases and edge cases of working with Karafka and Kafka. For comprehensive understanding of our framework, visit [Integrations directory](https://github.com/karafka/karafka/tree/master/spec/integrations) of the Karafka repository.
