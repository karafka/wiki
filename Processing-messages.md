Karafka supports two ways of processing messages:

* ```batch_processing true``` - in that mode, Karafka will process messages in batches. You will have access to the ```#params_batch``` method, that will give you all the messages altogether.
* ```batch_processing false```- in that mode, Karafka will process messages one after another. To access your message details, you can use ```#params``` method. You can think of this mode, as an equivalent to a standard HTTP way of doing things.

### Processing messages one by one

Here's a simple example of the configuration and controller you need to have in order to process messages one by one:

```ruby
class App < Karafka::App
  setup do |config|
    config.batch_processing = false
    # other config things...
  end
end

class UsersCreatedController < ApplicationController
  def perform
    # Note, that you can still use here the #params_batch method, but
    # it will always contain just a single message inside
    User.create!(params[:user])
  end
end
```

### Processing messages one by one

Here's a simple example of the configuration and controller you need to have in order to process messages one by one:

```ruby
class App < Karafka::App
  setup do |config|
    config.batch_processing = true
    # other config things...
  end
end

class ReportsCreatedController < ApplicationController
  def perform
    # Note, that you cannot use the #params method, as it will raise
    # an exception
    Report.import params_batch.map { |param| param[:report] }
  end
end
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