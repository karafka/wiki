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


### `#perform_later`

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

Job.perform_later(1, 2)
```

### `#perform_all_later`

When you enqueue a jobs using `#perform_all_later`, Karafka, by default, will produce messages to Kafka in an async fashion. Jobs will be added to a background process queue and dispatched without blocking the processing flow.

You may want to alter this behavior for critical jobs and use synchronous enqueuing. To use it, just call the `karafka_options` method within your job class definition and set the `dispatch_many_method` to `:produce_many_sync` as followed:

```ruby
class Job < ActiveJob::Base
  queue_as :my_kafka_jobs

  karafka_options(
    dispatch_many_method: :produce_many_sync
  )

  def perform(value1, value2)
    puts "value1: #{value1}"
    puts "value2: #{value2}"
  end
end

jobs = 2.times.map { |i| Job.new(i, i + 1) }

Job.perform_all_later(jobs)
```

## Execution warranties

Karafka marks each job as consumed using `#mark_as_consumed` after successfully processing it. This means that the same job should not be processed twice unless the process is killed before the async marking in Kafka happens.

## Behaviour on errors

Active Job Karafka adapter will follow the Karafka general [runtime errors handling](Error-handling-and-back-off-policy#runtime) strategy. Upon error, the partition will be paused, a backoff will happen, and Karafka will attempt to retry the job after a specific time.

Please keep in mind that **as long as** the error persists, **no** other jobs from a given partition will be processed.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/aj_error_handling.svg" />
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

## Current Attributes

The Karafka adapter supports the use of [CurrentAttributes](https://api.rubyonrails.org/classes/ActiveSupport/CurrentAttributes.html). You just need to put this in your `karafka.rb` config file (or initializer):
```ruby
require 'karafka/active_job/current_attributes'
Karafka::ActiveJob::CurrentAttributes.persist('YourCurrentAttributesClass')
# or multiple current attributes
Karafka::ActiveJob::CurrentAttributes.persist('YourCurrentAttributesClass', 'AnotherCurrentAttributesClass')
```

Now when you set your current attributes and create a background job, it will execute with them set.

```ruby
class Current < ActiveSupport::CurrentAttributes
  attribute :user_id
end

class Job < ActiveJob::Base
  def perform
    puts 'user_id: #{Current.user_id}'
  end
end

Karafka::ActiveJob::CurrentAttributes.persist('Current')
Current.user_id = 1
Job.perform_later # the job will output "user_id: 1"
```

The way Karafka handles CurrentAttributes is by including them as part of the job serialization process before pushing it to Kafka. These attributes are then deserialized by the ActiveJob consumer and set back in your CurrentAttributes classes before executing the job.

This approach is based on Sidekiq's approach to persisting current attributes: [Sidekiq and Request-Specific Context](https://www.mikeperham.com/2022/07/29/sidekiq-and-request-specific-context/).
