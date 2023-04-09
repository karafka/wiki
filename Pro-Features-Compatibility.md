Karafka provides several features that can work together. Unless explicitly stated otherwise, Karafka Pro features should work with each other without any limitations

## Long Running Jobs + Virtual Partitions

Long-Running Jobs work together with [Virtual Partitions](Pro-Virtual-Partitions). All the Virtual Partitions will respond to `#revoked?` if the partition is lost.

There is only one thing you need to keep in mind:

It is **not** allowed to use manual offset management with Virtual Partitions unless Virtual Partitions operate in the `collapsed` mode. Hence you need to set `shutdown_timeout` to a value that will compensate for that.

### Enhanced Active Job + Virtual Partitions

Virtual Partitions **can** be used with Active Job without any limitations. The only thing worth keeping in mind is that the message payload for Active Job contains serialized job details and should not be deserialized in the partitioner.

The recommended approach is to use the Enhanced Active Job headers support to add a key that can be used for partitioning:

```ruby
class Job < ActiveJob::Base
  queue_as :jobs

  karafka_options(
    dispatch_method: :produce_async,
    partitioner: ->(job) { job.arguments.first[0] }
  )
end

class KarafkaApp < Karafka::App
  routes.draw do
    active_job_topic :jobs do
      virtual_partitions(
        partitioner: ->(job) { job.key }
      )
    end
  end
end
```

Please keep in mind that with Virtual Partitions, the offset will be committed after all the Virtual Partitions work is done. There is **no** "per job" marking as processed.

### Enhanced Dead Letter Queue + Virtual Partitions

Virtual Partitions can be used together with the Dead Letter Queue. This can be done due to Virtual Partitions' ability to collapse upon errors.

The only limitation when combining Virtual Partitions with the Dead Letter Queue is the minimum number of retries. It needs to be set to at least `1`:

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer
    virtual_partitions(
      partitioner: ->(message) { message.headers['order_id'] }
    )
    dead_letter_queue(
      topic: 'dead_messages',
      # Minimum one retry because VPs needs to switch to the collapsed mode
      max_retries: 1
    )
  end
end
```
