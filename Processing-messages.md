# Warning: this page is still a work in progress and might not be 100% accurate

## Processing modes

Karafka supports two processing modes:

* ```batch_processing true``` - in that mode, Karafka will process messages in batches. You will have access to the ```#params_batch``` method, that will give you all the messages altogether.
* ```batch_processing false```- in that mode, Karafka will process messages one after another. To access your message details, you can use ```#params``` method. You can think of this mode, as an equivalent to a standard HTTP way of doing things.

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