Karafka provides several features that can work together. Below you can find a comprehensive description of combinations that are and are not allowed.

## Long-Running Jobs

### Usage with Virtual Partitions

Long-Running Jobs work together with [Virtual Partitions](Pro-Virtual-Partitions). All the Virtual Partitions will respond to `#revoked?` if the partition is lost.

There is only one thing you need to keep in mind:

It is **not** allowed to use manual offset management with Virtual Partitions unless Virtual Partitions operate in the `collapsed` mode. Hence you need to set `shutdown_timeout` to a value that will compensate for that.

### Using with Enhanced Dead Letter Queue

Long-Running Jobs work with the Enhanced Dead Letter Queue feature without additional changes.

## Virtual Partitions

### Usage with Long-Running Jobs

Virtual Partitions **can** be used with [Long-Running Jobs](Pro-Long-Running-Jobs). There are no special procedures.

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer
    long_running_job true
    virtual_partitions(
      partitioner: ->(message) { message.headers['order_id'] }
    )
  end
end
```

### Usage with Enhanced Active Job

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

### Using with Enhanced Dead Letter Queue

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

## Enhanced ActiveJob

### Usage with Virtual Partitions

For the Enhanced Active Job adapter to work with Virtual Partitions, you need to update your `karafka.rb` and use the `virtual_partitions` settings in the Active Job topic section:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    active_job_topic :default do
      virtual_partitions(
        partitioner: ->(job) { job.key }
      )
    end
  end
end
```

Your partitioner will accept the wrapping message of a job. Since the payload is the serialized job, you will **not** have access to the payload. We recommend using either key or headers metadata for virtual partitioning.

Please keep in mind that with Virtual Partitions, the offset will be committed after all the Virtual Partitions work is done. There is **no** "per job" marking as processed.

### Usage with Long-Running Jobs

For the Enhanced Active Job adapter to work with Long-Running Jobs, you need to update your `karafka.rb` and use the `long_running_job` setting in the Active Job topic section:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    active_job_topic :default do
      long_running_job true
    end
  end
end
```

### Using with Enhanced Dead Letter Queue

The Active Job Adapter can be used with the Enhanced Dead Letter Queue feature.

## Messages At Rest Encryption

[Messages at rest encryption](Pro-Messages-At-Rest-Encryption) works with all other Pro features without any changes required.
