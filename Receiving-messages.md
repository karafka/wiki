Karafka framework has a long running server process that is responsible for receiving messages.

To start Karafka server process, use the following CLI command:

```bash
bundle exec karafka server
```

Karafka server can be daemonized with the **--daemon** flag:

```
bundle exec karafka server --daemon
```

## Processing messages directly (without Sidekiq)

If you don't want to use Sidekiq for processing and you would rather process messages directly in the main Karafka server process, you can do that by setting the *inline* flag either on an app level:

```ruby
class App < Karafka::App
  setup do |config|
    config.inline_mode = true
    # Rest of the config
  end
end
```

or per route (when you want to treat some routes in a different way):

```ruby
App.routes.draw do
  topic :binary_video_details do
    controller Videos::DetailsController
    inline_mode true
  end
end
```

Note: it can slow Karafka down significantly if you do heavy stuff that way.