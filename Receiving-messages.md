# **Warning:** This WIKI page describes the 0.5 version. Sorry for the inconvenience. We're working hard to update all the wiki pages.

Karafka framework has a long running server process that is responsible for receiving messages.

To start Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

Karafka server can be daemonized with the **--daemon** flag:

```
bundle exec karafka server --daemon
```

**Note**: Keep in mind, that consuming modes are not the same thing as processing modes. Consuming modes describe the way data is being pulled out of Kafka, while processing modes describe how you will be able to interact with this data.

## Consuming modes

Karafka supports two consuming modes:

* ```batch_consuming true``` - in that mode, Karafka will consume one message after another from Kafka.
* ```batch_consuming false```- in that mode, Karafka will consume multiple messages in batches. You can limit number of messages received in a single batch, my using the ```max_bytes_per_partition``` configuration option.

Below you can see the difference in between those two:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/consuming_modes.png" alt="Karafka consuming modes" />
</p>

Each of the modes has it's own advantages and disadvantages. If you need help on deciding which road you should go, please visit our [Gitter](https://gitter.im/karafka/karafka) channel and ask for help.

## Processing modes

Karafka supports two processing modes:

* ```batch_processing true``` - in that mode, Karafka will process messages in batches. You will have access to the ```#params_batch``` method, that will give you all the messages altogether.
* ```batch_processing false```- in that mode, Karafka will process messages one after another. Yo access your message details, you can use ```#params``` method. You can think of this mode, as an equivalent to a standard HTTP way of doing things.

## Processing messages directly (without Sidekiq)

If you don't want to use Sidekiq for processing and you would rather process messages directly in the main Karafka server process (right after they are sent), you can do that by setting the *inline_processing* flag to false either on an app level:

```ruby
class App < Karafka::App
  setup do |config|
    config.inline_processing = true
    # Rest of the config
  end
end
```

or per topic (when you want to treat some topics in a different way way than other):

```ruby
App.routes.draw do
  topic :binary_video_details do
    controller Videos::DetailsController
    inline_processing true
  end
end
```

Note: it can slow Karafka down significantly if you do heavy stuff that way.