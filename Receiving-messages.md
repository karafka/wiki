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