Active Job is a standard interface for interacting with job runners in Ruby on Rails. Active Job can be configured to work with Karafka.

## Active Job Setup

The Active Job adapter must be set to `:karafka` or it will use the default value provided by Rails, which is `:async`. This can be done in the `config/application.rb`:

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

For Karafka server to understand which of the topics contain Active Job data, you need to indicate this in your `karafka.rb` routing section using the `#active_job_topic`:

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

**Note**: [Pro Enhanced ActiveJob](Pro-Enhanced-Active-Job) adapter supports `Long-Running Jobs`, `Virtual Partitions`, `Ordered Jobs`, and other Pro features.

## Usage

Jobs can be added to the job queue from anywhere. You can add a job to the queue by:

```ruby
ExampleJob.perform_later args
```

At this point, Karafka will run the job for us. If the job fails, Karafka will retry the job as normal.

### Enqueuing modes

When you enqueue a job using `#perform_later`, Karafka, by default, will produce a message to Kafka in an async fashion. A job will be added to a background process queue and dispatched without blocking the processing flow.

You may want to alter this behavior for critical jobs and use synchronous enqueuing. To use it, just call the `karafka_options` method within your job class definition and set the `dispatch_method` to `:produce_sync` as followed:

```ruby
class Job < ActiveJob::Base
  queue_as :my_kafka_jobs

  karafka_options(
    dispatch_method: :produce_sync
  )

  def perform(value1, value2)
    puts "value1: #{value1}"
    puts "value2: #{value2}"
  end
end
```

## Execution warranties

Karafka marks each job as consumed using `#mark_as_consumed` after successfully processing it. This means that the same job should not be processed twice unless the process is killed before the async marking in Kafka happens.

## Behaviour on errors

Active Job Karafka adapter will follow the Karafka general [runtime errors handling](Error-handling-and-back-off-policy#runtime) strategy. Upon error, the partition will be paused, a backoff will happen, and Karafka will attempt to retry the job after a specific time.

Please keep in mind that **until** the error persists, **no** other jobs from a given partition will be processed.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/aj_error_handling.png" />
</p>

## Behaviour on shutdown

After the shutdown is issued, Karafka will finish processing the current job. After it is processed, will mark it as consumed and will close. Other jobs that may be buffered will not be processed and picked up after the process is started again.

## Behaviour on revocation

Revocation awareness is not part of the standard Active Job adapter. We recommend you either:

1. Have short-running jobs.
2. Build your jobs to work in an at-least-once fashion.
3. Set `max_messages` to a small value, so fewer jobs are fetched.
4. Use [Pro Enhanced Active Job](Pro-Enhanced-Active-Job) with revocation awareness and other Pro features.

## Queue Prefixes

Active Job allows you to configure a queue prefix. Karafka does not support prefixes at the moment.
