Active Job is a standard interface for interacting with job runners. Active Job can be configured to work with Karafka.

## Active Job Setup

The Active Job adapter must be set to `:karafka` or else it will use the default value provided by Rails, which is `:async`. This can be done in the `config/application.rb`:

```ruby
class Application < Rails::Application
  # ...
  config.active_job.queue_adapter = :karafka
end
```

We can use the generator to create a new job:

```
rails generate job Example
```

The above command will create `app/jobs/example_job.rb`:

```ruby
class ExampleJob < ActiveJob::Base
  # Set the topic name to default
  queue_as :default

  def perform(*args)
    # Perform Job
  end
end
```

In order for Karafka server to understand which of the topics contain Active Job data, you need to indicate this in your `karafka.rb` routing section using the `#active_job_topic`:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    active_job_topic :default
  end
end
```

`#active_job_topic` similar to `#topic` accepts block for additional configuration:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    active_job_topic :default do
      # Available only in Pro
      long_running_job true
    end
  end
end
```

**Note**: ActiveJob adapter supports both `Long Running Jobs` as well as `Virtual Partitions` Pro features.

## Usage

Jobs can be added to the job queue from anywhere. You can add a job to the queue by:

```ruby
ExampleJob.perform_later args
```

At this point, Karafka will run the job for us. If the job for some reason fails, Karafka will retry the job as normal.

## Queue Prefixes

Active Job allows you to configure a queue prefix. Karafka does not support prefixes at the moment.
