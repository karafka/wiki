While Kafka is not a message queue, it has certain features that make it a great fit for Active Job, especially when strict ordering and scaling are desired.

Enhanced Active Job adapter provides extra capabilities to regular Active Job to elevate the combination of Active Job and Kafka.

## Enabling Enhanced Active Job

No action needs to be taken. Please follow the [Active Job setup](Active-Job#active-job-setup) instructions, and the moment you enable Karafka Pro, it will use the Enhanced Active Job components.

## Ordered Jobs

With the Karafka Enhanced Active Job adapter, you can ensure jobs processing order. This means that with proper `partitioner` usage, you can ensure that for a given resource, only one job runs at a time and that jobs will run in the order in which they were enqueued.

You can tell Karafka to which partition send a given job based on the job arguments. For it to work, Karafka provides two `karafka_options` options you can set:

- `partitioner` - a callable that accepts the job as the argument
- `partition_key_type` - either `:key` (default) or `:partition_key`

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
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/enhanced_aj_ordering.svg" />
</p>
<p align="center">
  <small>*This example illustrates the end distribution of jobs based on the user id.
  </small>
</p>

## Routing Patterns

TBA

## Execution warranties

Same execution warranties apply as for standard [Active Job adapter](Active-Job#execution-warranties).

## Behaviour on errors

When using the ActiveJob adapter with Virtual Partitions, upon any error in any of the Virtual Partitions, all the not-started work in any of the Virtual Partitions will not be executed. The not-executed work will be then executed upon the retry. This behavior minimizes the number of jobs that must be re-processed upon an error.

For non-VP setup, same error behaviors apply as for standard [Active Job adapter](Active-Job#behaviour-on-errors).

**Note**: Please keep in mind that if you use it in combination with [Virtual Partitions](Pro-Virtual-Partitions), marking jobs as consumed (done) will happen only **after** all virtually partitioned consumers finished their work collectively. There is **no** intermediate marking in between jobs in that scenario.

## Behaviour on revocation

Enhanced Active Job adapter has revocation awareness. That means that Karafka will stop processing other pre-buffered jobs upon discovering that a given partition has been revoked. In a scenario of a longer job where the revocation happened during the job execution, only at most one job per partition will be processed twice. You can mitigate this scenario with static group memberships.

## Behaviour on shutdown

When using the ActiveJob adapter with Virtual Partitions, Karafka will **not** early break processing and will continue until all the work is done. This is needed to ensure that all the work is done before committing the offsets.

For a non-VP setup, the same shutdown behavior applies as for standard [Active Job adapter](Active-Job#behaviour-on-shutdown).
