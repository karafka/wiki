While Kafka is not a message queue, it has certain features that make it a great fit for Active Job, especially when strict ordering and scaling are desired.

Enhanced Active Job adapter provides extra capabilities to regular Active Job to elevate the combination of Active Job and Kafka.

## Enabling Enhanced Active Job

No action needs to be taken. Please follow the [Active Job setup](Active-Job#active-job-setup) instructions, and the moment you enable Karafka Pro, it will use the Enhanced Active Job components.

## Ordered Jobs

With the Karafka Enhanced Active Job adapter, you can ensure jobs processing order. This means that with proper `partitioner` usage, you can ensure that for a given resource, only one job runs at a time and that jobs will run in the order in which they were enqueued.

You can tell Karafka to which partition send a given job based on the job arguments. For it to work, Karafka provides two `karafka_options` options you can set:

- `partitioner` - a callable that accepts the job as the argument
- `partition_key_type` - either `:key` (default), `:partition_key` or `:partition`

Jobs sent to the same partition will always be processed in the order. This can be useful when you process data of objects for which you need to apply your logic sequentially without risking any concurrency problems. For example for applying updates in a consistent order.

```ruby
# An example job that updates user attributes in the background job
class Job < ActiveJob::Base
  queue_as TOPIC

  karafka_options(
    # Make sure that all jobs related to a given user are always dispatched to the same partition
    partitioner: ->(job) { job.arguments.first },
    partition_key_type: :key
  )

  def perform(user_id, attributes)
    User.find(user_id).update!(attributes)
  end
end
```

The above code will ensure that jobs related to the same user will always be dispatched to the same consumer.

We recommend using the `:key` as then it can be used for combining Enhanced Active Job with [Virtual Partitions](Pro-Virtual-Partitions).

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/enhanced_aj_ordering.svg" />
</p>
<p align="center">
  <small>*This example illustrates the end distribution of jobs based on the user id.
  </small>
</p>

## Scheduled Jobs

Karafka supports job scheduling via the [Scheduled Messages](Pro-Scheduled-Messages) feature, providing a robust framework for setting future execution times for tasks, akin to capabilities seen in other Rails Active Job adapters. This feature integrates seamlessly with Karafka's infrastructure, allowing users to schedule and manage tasks directly within the Kafka ecosystem.

To utilize the Scheduled Jobs functionality in Karafka, you must:

1. **Configure the Scheduled Messages Feature**: Ensure the Scheduled Messages feature is properly [configured](Pro-Scheduled-Messages#enabling-scheduled-messages) within your Karafka setup. This involves setting up the necessary Kafka topics and ensuring Karafka knows these configurations.

1. **Configure the Job Class**: Each job class that requires scheduling must have the scheduled_messages_topic configured. This setting informs Karafka about the specific Kafka topic that serves as the proxy for handling the scheduling of these messages.

    ```ruby
    class ExampleJob < ActiveJob::Base
      queue_as :default

      karafka_options(
        scheduled_messages_topic: 'scheduled_jobs_topic'
      )

      def perform(*args)
        # Job execution logic here
      end
    end
    ```

1. **Schedule Jobs**: After these configurations are in place, jobs can be scheduled using the standard ActiveJob APIs by specifying the execution time:

    ```ruby
    ExampleJob.set(wait_until: Date.tomorrow.noon).perform_later(user_id)
    ```

This integration not only simplifies the management of timed tasks but also enhances the reliability and scalability of job execution, making Karafka an ideal platform for complex, time-sensitive job scheduling needs in large-scale applications.

## Custom Producer/Variant Usage

When using ActiveJob with Karafka, you can customize the dispatch of Active Jobs by leveraging custom producers or [producer variants](WaterDrop-Variants). This customization allows for more granular control over how jobs are produced and managed within Kafka, which can be crucial for applications with specific performance, scalability, or reliability requirements.

To utilize a custom producer or variant with ActiveJob, specify a `:producer` option within the `#karafka_options`. This option should be set to a callable object (such as a lambda or a proc) that accepts the job as an argument. This callable is expected to return a producer or a variant that will be used to dispatch the job's message to Kafka.

Here is an example that demonstrates how to integrate a custom producer variant within an ActiveJob setup:

```ruby
# Define a custom producer variant for high-priority jobs
HIGH_RELIABILITY_PRODUCER = Karafka.producer.with(topic_config: { 'acks': 'all' })

# Define an ActiveJob class that uses this custom producer variant
class HighPriorityJob < ActiveJob::Base
  queue_as :critical_events

  karafka_options(
    # Job is accepted as an argument for dynamic producer selection
    producer: ->(_job) { HIGH_RELIABILITY_PRODUCER }
  )

  def perform(event_data)
    # Job implementation
  end
end
```

In the above example, `HighPriorityJob` is configured to use a specifically tailored producer variant for critical events. This producer variant is configured with a higher acknowledgment setting (`all`), ensuring that all replicas confirm each message before it is successfully delivered. This setup is particularly beneficial for jobs where data loss or delivery failure is unacceptable.

Allowing each job class to specify its producer offers the flexibility to tailor message production characteristics according to the job's requirements. Whether it's adjusting the acknowledgment levels, managing timeouts, or utilizing specific compression settings, custom producers and variants can significantly enhance the robustness and efficiency of your Karafka-based messaging system within ActiveJob, opening up new possibilities for system optimization and performance improvement.

## Routing Patterns

Pro ActiveJob adapter supports the Routing Patterns capabilities. You can read more about it [here](Pro-Routing-Patterns#activejob-routing-patterns).

## ActiveJob Continuation

Karafka Pro provides enhanced support for Rails 8.1+ ActiveJob Continuation feature with additional capabilities beyond the OSS version. With Pro, you can leverage delayed resumption and partitioning within continuation jobs for advanced workflow management.

!!! note "Scheduled Messages Not Required for Immediate Resumption"

    If you only need immediate job resumption (without delays), you can use `resume_options = { wait: 0 }` without setting up the Scheduled Messages feature. This avoids the overhead of configuring Scheduled Messages when delayed resumption is not needed.

### Configuration

#### Immediate Resumption (No Scheduled Messages Required)

For jobs that need to resume immediately without delays, you can use ActiveJob Continuation without setting up Scheduled Messages:

```ruby
class ProcessImportJob < ActiveJob::Base
  include ActiveJob::Continuable

  queue_as :default

  # No scheduled_messages_topic needed for immediate resumption
  self.resume_options = { wait: 0 }

  def perform(import_id)
    @import = Import.find(import_id)

    step :validate do
      @import.validate!
    end

    step :process_records do |step|
      @import.records.find_each(start: step.cursor) do |record|
        record.process
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

#### Delayed Resumption (Requires Scheduled Messages)

To use delayed resumption, configure your job class with the `resume_options`:

```ruby
class ProcessImportJob < ActiveJob::Base
  include ActiveJob::Continuable

  queue_as :default

  # Configure delayed resume (requires Pro Scheduled Messages)
  self.resume_options = { wait: 5.seconds }

  def perform(import_id)
    @import = Import.find(import_id)

    step :validate do
      @import.validate!
    end

    step :process_records do |step|
      @import.records.find_each(start: step.cursor) do |record|
        record.process
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

### Partitioning in Continuation Jobs

Pro allows you to combine continuation with partitioning to ensure ordered processing of multi-step jobs for specific resources:

```ruby
class ProcessUserDataJob < ActiveJob::Base
  include ActiveJob::Continuable

  queue_as :default

  karafka_options(
    scheduled_messages_topic: 'scheduled_jobs_topic',
    dispatch_method: :produce_sync,
    # Ensure all steps for the same user go to the same partition
    partitioner: ->(job) { job.arguments.first.to_s },
    partition_key_type: :key
  )

  self.resume_options = { wait: 5.seconds }

  def perform(user_id)
    @user = User.find(user_id)

    step :process_profile do
      @user.process_profile_data
    end

    step :process_transactions do |step|
      @user.transactions.find_each(start: step.cursor) do |transaction|
        transaction.process
        step.advance! from: transaction.id
      end
    end

    step :finalize do
      @user.finalize_processing
    end
  end
end
```

This configuration ensures that all continuation steps for a given user are processed in order on the same partition, preventing race conditions while allowing parallel processing of different users.

### Requirements

To use ActiveJob Continuation in Pro with **immediate resumption** (`wait: 0`):

- No additional setup required beyond the standard ActiveJob adapter configuration

To use ActiveJob Continuation in Pro with **delayed resumption**:

1. **Scheduled Messages Feature**: Must be properly [configured](Pro-Scheduled-Messages#enabling-scheduled-messages)
2. **Scheduled Messages Topic**: Each job class using delayed resumption must specify `scheduled_messages_topic` in `karafka_options`
3. **Synchronous Dispatch**: Recommended to use `dispatch_method: :produce_sync` for reliable continuation

### OSS Compatibility

For details on using ActiveJob Continuation in the OSS version with immediate resumption, see [ActiveJob Continuation](Active-Job#activejob-continuation).

## Execution Warranties

Same execution warranties apply as for standard [Active Job adapter](Active-Job#execution-warranties).

## Behaviour on Errors

When using the ActiveJob adapter with Virtual Partitions, upon any error in any of the Virtual Partitions, all the not-started work in any of the Virtual Partitions will not be executed. The not-executed work will be then executed upon the retry. This behavior minimizes the number of jobs that must be re-processed upon an error.

For non-VP setup, same error behaviors apply as for standard [Active Job adapter](Active-Job#behaviour-on-errors).

!!! note

    Please keep in mind that if you use it in combination with [Virtual Partitions](Pro-Virtual-Partitions), marking jobs as consumed (done) will happen only **after** all virtually partitioned consumers finished their work collectively. There is **no** intermediate marking in between jobs in that scenario.

## Behaviour on Revocation

Enhanced Active Job adapter has revocation awareness. That means that Karafka will stop processing other pre-buffered jobs upon discovering that a given partition has been revoked. In a scenario of a longer job where the revocation happened during the job execution, only at most one job per partition will be processed twice. You can mitigate this scenario with static group memberships.

## Behaviour on Shutdown

When using the ActiveJob adapter with Virtual Partitions, Karafka will **not** early break processing and will continue until all the work is done. This is needed to ensure that all the work is done before committing the offsets.

For a non-VP setup, the same shutdown behavior applies as for standard [Active Job adapter](Active-Job#behaviour-on-shutdown).
