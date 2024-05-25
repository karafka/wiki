1. Make sure Apache Kafka is running. You can start it by following instructions from [here](https://karafka.io/docs/Kafka-Setting-Up/).

2. Add Karafka to your Gemfile:

```bash
# Make sure to install Karafka 2.4 as Karafka 1.4 is no longer maintained
bundle add karafka --version ">= 2.4.0"
```

3. Install Karafka (works for both Rails and standalone applications) by running:

```bash
bundle exec karafka install
```

the above command will create all the necessary files and directories to get you started:

- `karafka.rb` - main file where you configure Karafka and where you define which consumers should consume what topics.
- `app/consumers/example_consumer.rb` - example consumer.
- `app/consumers/application_consumer.rb` - base consumer from which all consumers should inherit.

4. After that, you can run a development console to produce messages to this example topic:

```ruby
# Works from any place in your code and is thread-safe
# You usually want to produce async but here it may raise exception if Kafka is not available, etc
Karafka.producer.produce_sync(topic: 'example', payload: { 'ping' => 'pong' }.to_json)
```

5. Run the karafka server to start consuming messages:

```
bundle exec karafka server

# example outcome
[7616dc24-505a-417f-b87b-6bf8fc2d98c5] Polled 2 messages in 1000ms
[dcf3a8d8-0bd9-433a-8f63-b70a0cdb0732] Consume job for ExampleConsumer on example started
{"ping"=>"pong"}
{"ping"=>"pong"}
[dcf3a8d8-0bd9-433a-8f63-b70a0cdb0732] Consume job for ExampleConsumer on example finished in 0ms
```

Here's the demo of the installation process:

<div class="asciinema" data-cols="100" data-rows="14" data-cast="getting-started">
  <span style="display: none;">
    Note: Asciinema videos are not visible when viewing this wiki on GitHub. Please use our
    <a href="https://karafka.io/docs">online</a>
    documentation instead.
  </span>
</div>

6. (Optionally) Install and configure the Web UI by following [this](Web-UI-Getting-Started) documentation section.

## Example applications

If you have any problems settings things up or want a ready application to play around with, then the best idea is just to clone our examples repository:

```bash
git clone https://github.com/karafka/example-apps ./example_apps
```

and follow the instructions from the [example apps Wiki](https://github.com/karafka/example-apps/blob/master/README.md).

## Use-cases, edge-cases, and usage examples

Karafka ships with a full integration test suite that illustrates various use-cases and edge-cases of working with Karafka and Kafka. Please visit [this directory](https://github.com/karafka/karafka/tree/master/spec/integrations) of the Karafka repository to see them.
