While Kafka is not a message queue, it has certain features that make it a great fit for Active Job, especially when strict ordering and scaling are desired.

Enhanced Active Job adapter provides extra capabilities to regular Active Job to elevate the combination of Active Job and Kafka.

## Enabling Enhanced Active Job

No action needs to be taken. Please follow the [Active Job setup](Active-Job#active-job-setup) instructions, and the moment you enable Karafka Pro, it will use the Enhanced Active Job components.

## Ordered Jobs

You can tell Karafka which of the partitions send given jobs based on your job arguments. For it to work, Karafka provides two `karafka_options` options you can set:

- `partitioner` - a callable that accepts the job as the argument
- `partition_key_type` - either `:key` (default) or `:partition_key`

Jobs sent to the same partition will always be processed in the order. This can be useful when you process data of objects for which you need to apply your logic sequentially without risking any concurrency problems.

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

We recommend using the `:key` as then it can be used for processing ordering.

## Execution warranties

TBA

## Behaviour on errors

TBA

## Usage with Long-Running Jobs

TBA

## Usage with Virtual Partitions

TBA
