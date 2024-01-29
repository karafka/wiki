# WaterDrop Custom Partitioners

In Apache Kafka, a partitioner determines how records are placed among the partitions of a topic. While WaterDrop provides default partitioning strategies, there are scenarios where a custom partitioner is advantageous for achieving more control and efficiency in how messages are distributed across the partitions.

## Reasons for Using a Custom Partitioner

1. **Specific Data Distribution Needs**: You may want to distribute messages based on specific data attributes, such as ensuring all messages from a particular user or entity end up in the same partition to maintain order.

1. **Load Balancing**: If the data has certain hotspots (e.g., a few keys are very common), a custom partitioner can help distribute the load more evenly across the partitions, preventing any single partition from becoming a bottleneck.

1. **Performance Optimization**: In some instances, optimizing partitioning logic based on consumption patterns can lead to more efficient data processing.

1. **Compatibility and Integration**: When integrating with other systems, you might need to align your partitioning strategy with the external systems for seamless data flow and processing.

## Building a Custom Partitioner

When integrating a custom partitioning strategy into your Kafka setup with WaterDrop, you generally have two options:

1. Writing an entirely external custom partitioner
2. Utilizing WaterDrop's middleware for the partitioning logic.

Both approaches have merits and drawbacks, primarily influenced by the nature of your data and the specifics of your use case.

In both cases, you need to know the partition count for a given topic. You can retrieve this information by using the `WaterDrop::Producer#partition_count` method:

```ruby
producer.partition_count('users_events') => 5
```

!!! Warning "Failure To Fetch Partition Count"

    If WaterDrop Producer cannot retrieve topic metadata, it will report the partition count as `-1’. Ensure your custom partitioner can handle this scenario gracefully, possibly by reverting to a default partition or implementing a retry mechanism. Monitoring the occurrence of this issue is recommended to identify potential underlying system problems.

### Fully External Custom Partitioner

This approach involves creating a partitioner that operates outside of the WaterDrop producer. Essentially, you're looking at writing a wrapper or a separate component that manages partitioning before handing off the message to the producer.

Advantages:

- **Full Control Over Data**: You have access to the raw data before any serialization or processing has occurred. This is particularly useful if your partitioning logic requires complex operations on the data's original structure or format.
- **Flexibility**: As a standalone component, the external partitioner can be designed independently from the producer, making it easier to adapt or replace without affecting the producer's internals.

Drawbacks:

- **Complexity**: This method introduces additional layers to your architecture, potentially increasing the complexity of your system.
- **Maintenance**: You need to ensure that the external partitioner and the producer are well-integrated and that any changes in one don't adversely affect the other.

```ruby
class UserPartitioner
  def partition(user)
    user.id % PRODUCER.partition_count('default')
  end
end

partitioner = UserPartitioner.new

PRODUCER.produce_async(
  topic: 'users_topic',
  payload: user.to_json,
  partition: partitioner.partition(user)
)
```

### Middleware Approach

Alternatively, you can leverage WaterDrop's middleware to inject your custom partitioning logic directly into the message processing pipeline. This is seen as a more elegant and integrated approach.

Advantages:

- **Seamless Integration**: The partitioning logic encapsulates the producer's workflow, making the overall process more streamlined.
- **Ease of Use**: Middleware is easy to implement and fits naturally into the WaterDrop ecosystem, making it a developer-friendly option.

Drawbacks:

- **Limited Data Access**: Middleware operates on the message after it's been prepared for dispatch. This means it only has access to the data post-serialization. This could be a significant limitation if your partitioning logic needs to work with the data in its original format. However, it can be bypassed if you decide to serialize data directly in the middleware.

- **Implicit Flow**: Implementing partitioning logic as middleware might not be explicitly clear, leading to confusion. The middleware's internal workings and position in the execution chain must be well understood.

```ruby
class PartitioningMiddleware
  def call(message)
    case message[:topic].to_s
    when 'users_events'
      # Make sure there is no partition key not to trigger default partitioner
      message.delete(:partition_key)
      # Distribute users based on their ids
      user_id = message[:payload].user_id
      message[:partition] = user_id % partition_count('users_events')
      message[:payload] = message[:payload].to_json
    when 'system_events'
      message.delete(:partition_key)
      # Distribute randomly amongst available partitions
      message[:partition] = rand(partition_count('users_events'))
      message[:payload] = message[:payload].to_json
    else
      message[:payload] = message[:payload].to_s
    end

    message
  end

  private

  def partition_count(topic)
    PRODUCER.partition_count(topic)
  end
end

# Inject your middleware
PRODUCER.middleware.append(PartitioningMiddleware.new)

# And now you can provide your objects, and they will be serialized and
# assigned to proper partitions automatically
PRODUCER.produce_async(topic: 'users_events', payload: user)
```

## Summary

In summary, the choice between an external custom partitioner and a middleware-based partitioner in WaterDrop hinges on your specific requirements, particularly regarding how and when your data needs to be processed for partitioning. If pre-serialization data manipulation is crucial for your partitioning logic, an external partitioner might be more suitable. On the other hand, if you prefer a more integrated approach and your partitioning logic can work with serialized data, using WaterDrop's middleware might be the optimal path.
