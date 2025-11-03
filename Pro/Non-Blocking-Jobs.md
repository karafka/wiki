Non-blocking jobs do not block polling of the underlying listener for other topic partitions. This ensures that a single Kafka connection can efficiently poll data from multiple topics and partitions.

## Using Non-Blocking Jobs

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      non_blocking_job true
    end
  end
end
```

Setting `non_blocking_job` to `true` within a route configuration indicates that the job should execute without blocking data polling from other topic partitions that utilize the same connection.

## Non-Blocking vs. Long-Running Jobs

Non-Blocking Jobs are Long-Running Jobs, and `#non_blocking_job` is just an alias to `long_running_job`. The dual terminology, Long-Running Jobs and Non-Blocking Jobs, provides clarity and specificity in codebases. Using these terms appropriately allows developers to:

- Communicate the primary characteristics of the job directly through code.
- Make informed decisions about system architecture based on the job's nature.
- Maintain a self-documenting codebase that is easier to understand and manage.

Please refer to the [Long-Running Jobs documentation](Pro-Long-Running-Jobs) to better understand this feature.

---

## See Also

- [Pro Long-Running Jobs](Pro-Long-Running-Jobs) - Detailed long-running jobs documentation
- [Pro Virtual Partitions](Pro-Virtual-Partitions) - Parallel processing capabilities
- [Pro Multiplexing](Pro-Multiplexing) - Multiple connections for parallel processing
