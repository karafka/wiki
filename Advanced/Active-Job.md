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

```shell
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

!!! note

    [Pro Enhanced ActiveJob](Pro-Enhanced-Active-Job) adapter supports `Long-Running Jobs`, `Virtual Partitions`, `Ordered Jobs`, `Scheduled Jobs`, and other Pro features.

## Usage

Jobs can be added to the job queue from anywhere. You can add a job to the queue by:

```ruby
ExampleJob.perform_later args
```

At this point, Karafka will run the job for us. If the job fails, Karafka will retry the job as normal.

### Enqueuing Modes

#### `#perform_later`

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

#### `#perform_all_later`

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

## `karafka_options` Partial Inheritance

When an ActiveJob class defines `karafka_options`, these options are designed to be inherited by any subclass of the job. This inheritance mechanism ensures that all the settings are consistently applied across different jobs, simplifying configuration management and promoting reusability.

By default, when a subclass inherits from a parent job class with predefined `karafka_options`, the subclass automatically inherits all of these options. If no explicit `karafka_options` are defined in the subclass, it will use the options set in its parent class.

However, when `karafka_options` are set in a subclass, it does not necessarily have to redefine all the options specified in the parent class. Instead, it can choose to overwrite only specific options. Karafka will merge the options defined in the subclass with those of the parent class. This merging process ensures that any option not explicitly overridden in the subclass retains its value from the parent class.

For example, consider a parent job class configured with multiple karafka_options:

```ruby
class ParentJob < ApplicationJob
  karafka_options(
    dispatch_method: :produce_sync,
    dispatch_many_method: :produce_many_async
  )
end
```

If a subclass intends to modify only the `dispatch_method` option, it can do so without having to redefine all other options:

```ruby
class ChildJob < ParentJob
  karafka_options dispatch_method: :produce_async
end
```

In this case, `ChildJob` will have `dispatch_many_method` taken from the `ParentJob`.

This feature of partial options overriding allows for flexible configuration adjustments in subclassed jobs, making it easier to manage variations in job behavior without duplicating the entire set of options across multiple classes.

## Execution Warranties

Karafka marks each job as consumed using `#mark_as_consumed` after successfully processing it. This means that the same job should not be processed twice unless the process is killed before the async marking in Kafka happens.

## Behaviour on Errors

Active Job Karafka adapter will follow the Karafka general [runtime errors handling](Operations-Error-Handling-and-Back-Off-Policy#runtime) strategy. Upon error, the partition will be paused, a backoff will happen, and Karafka will attempt to retry the job after a specific time.

Please keep in mind that **as long as** the error persists, **no** other jobs from a given partition will be processed.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/aj_error_handling.svg" />
</p>

## Usage With the Dead Letter Queue

The Karafka Active Job adapter is fully compatible with the [Dead Letter Queue (DLQ)](Dead-Letter-Queue) feature. Setting the `independent` flag to `true` when configuring DLQ with Active Job is advisable. This recommendation is based on the nature of ActiveJob jobs being inherently independent. The `independent` flag enhances the DLQ's handling of job failures by treating each job separately, aligning with Active Job's operational characteristics.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    active_job_topic :default do
      dead_letter_queue(
        topic: 'dead_jobs',
        max_retries: 2,
        # Set this to true for AJ as AJ jobs are independent
        independent: true
      )
    end
  end
end
```

## Behaviour on Shutdown

After the shutdown is issued, Karafka will finish processing the current job. After it is processed, will mark it as consumed and will close. Other jobs that may be buffered will not be processed and picked up after the process is started again.

## Behaviour on Revocation

Revocation awareness is not part of the standard Active Job adapter. We recommend you either:

1. Have short-running jobs.
2. Build your jobs to work in an at-least-once fashion.
3. Set `max_messages` to a small value, so fewer jobs are fetched.
4. Use [Pro Enhanced Active Job](Pro-Enhanced-Active-Job) with revocation awareness and other Pro features.

## Queue Prefixes

Active Job allows you to configure a queue prefix. Karafka does not support prefixes at the moment.

## Current Attributes

The Karafka adapter supports the use of [CurrentAttributes](https://api.rubyonrails.org/classes/ActiveSupport/CurrentAttributes.html). You need to put this in your `karafka.rb` config file (or initializer):

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

Karafka handles CurrentAttributes by including them as part of the job serialization process before pushing them to Kafka. These attributes are then deserialized by the ActiveJob consumer and set back in your CurrentAttributes classes before executing the job.

This approach is based on Sidekiq's approach to persisting current attributes: [Sidekiq and Request-Specific Context](https://www.mikeperham.com/2022/07/29/sidekiq-and-request-specific-context/).

## ActiveJob Continuation

Karafka supports Rails 8.1+ ActiveJob Continuation feature, which allows jobs to pause and resume their execution. This is useful for long-running jobs that need to be broken down into smaller steps, enabling jobs to be interrupted and resumed across application restarts.

### Configuration for OSS

In the OSS (Open Source) version of Karafka, ActiveJob Continuation requires specific configuration because delayed resumption is not available without the Pro [Scheduled Messages](Pro-Scheduled-Messages) feature.

To use ActiveJob Continuation in OSS Karafka, configure jobs to resume immediately without delay:

```ruby
class ProcessImportJob < ActiveJob::Base
  include ActiveJob::Continuable

  queue_as :default

  # Configure immediate resume for OSS compatibility
  self.resume_options = { wait: 0 }

  def perform(import_id)
    @import = Import.find(import_id)

    step :validate do
      @import.validate!
    end

    step :process_records do |step|
      @import.records.find_each(start: step.cursor) do |record|
        record.process
        # Update cursor to track progress within this step
        step.advance! from: record.id
      end
    end

    step :finalize
  end

  def finalize
    @import.finalize!
  end
end
```

The `resume_options = { wait: 0 }` configuration ensures that continuation jobs resume immediately, bypassing the need for scheduled message support.

### Enhanced Continuation in Pro

For advanced continuation capabilities including delayed resumes and partitioning within continuation jobs, consider upgrading to [Karafka Pro](Pro-Enhanced-Active-Job#activejob-continuation). Pro supports features such as:

- Delayed resume times via Scheduled Messages
- Partitioning within continuation jobs for ordered processing
- Full integration with other Pro features

!!! note "OSS and Pro Compatibility"

    ActiveJob Continuation is available in both OSS and Pro versions. The main difference is that OSS requires immediate resumption (`wait: 0`), while Pro supports delayed resumption through the Scheduled Messages feature.

---

## See Also

- [Pro-Enhanced-Active-Job](Pro-Enhanced-Active-Job) - Advanced features including long-running jobs, virtual partitions, and ordered jobs
- [Testing](Testing) - Test your ActiveJob jobs with Karafka's testing helpers
- [Dead-Letter-Queue](Dead-Letter-Queue) - Handle failed jobs using DLQ with independent mode
- [Pro-Long-Running-Jobs](Pro-Long-Running-Jobs) - Allow jobs to run longer than max.poll.interval.ms
- [Error-Handling-and-Back-Off-Policy](Error-Handling-and-Back-Off-Policy) - Understand error handling and retry behavior for jobs
