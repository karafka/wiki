**Prerequisites**: Kafka running. You can start it by following instructions from [here](Setting-up-Kafka).

Add this line to your application's `Gemfile`:

```ruby
gem 'karafka'
```

and then execute:

```bash
bundle install
```

Install Karafka (works for both Rails and standalone applications) by running:

```bash
bundle exec karafka install
```

above command will create all the necessary files and directories to get you started:

- `karafka.rb` - main file where you configure Karafka and where you define which consumers should consume what topics.
- `app/consumers/example_consumer.rb` - example consumer.
- `app/consumers/application_consumer.rb` - base consumer from which all consumers should inherit.

After that, you can run a development console to produce messages to this example topic:

```ruby
# Works from any place in your code and is thread safe
KarafkaApp.producer.produce_async(topic: 'example', payload: { 'ping' => 'pong' }.to_json)
```

and you can run karafka server to start consuming messages:


```
bundle exec karafka server

# example outcome
[7616dc24-505a-417f-b87b-6bf8fc2d98c5] Polling messages...
[7616dc24-505a-417f-b87b-6bf8fc2d98c5] Polled 0 messages in 11104ms
[7616dc24-505a-417f-b87b-6bf8fc2d98c5] Polling messages...
[7616dc24-505a-417f-b87b-6bf8fc2d98c5] Polled 2 messages in 10001ms
[dcf3a8d8-0bd9-433a-8f63-b70a0cdb0732] Consume job for ExampleConsumer on example started
{"ping"=>"pong"}
{"ping"=>"pong"}
```

## Example applications

If you have any problems settings things up or want a ready application to play around with, then the best idea is just to clone our examples repository:

```bash
git clone https://github.com/karafka/example-apps ./example_apps
```

and follow the instructions from the [example apps Wiki](https://github.com/karafka/example-apps/blob/master/README.md).

## Use-cases, edge-cases, and usage examples

Karafka ships with a full integration test suite that illustrates various use-cases and edge-cases of working with Karafka and Kafka. Please visit [this directory](https://github.com/karafka/karafka/tree/master/spec/integrations) of the Karafka repository to see them.
