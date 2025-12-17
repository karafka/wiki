# Admin Replication API

The Karafka Admin Replication API provides tools for planning topic replication factor changes. This API helps you generate partition reassignment plans that can be executed using Kafka's native CLI tools.

!!! warning "External Tools Required"

    Due to limitations in librdkafka, Karafka cannot directly execute replication factor changes. The `AlterPartitionReassignments` Kafka API is not supported by librdkafka. This feature generates reassignment plans that must be executed using Kafka's native `kafka-reassign-partitions.sh` tool.

!!! tip "When to Use This API"

    Use this API when you need to increase the replication factor of existing topics to improve fault tolerance, or when you need to rebalance replica placement after adding new brokers to your cluster.

## Prerequisites

Before using the Replication API, ensure you have:

- **Kafka CLI tools**: The `kafka-reassign-partitions.sh` script from your Kafka installation
- **Sufficient broker capacity**: Target replication factor cannot exceed the number of available brokers
- **Adequate resources**: Replication changes require disk space and network bandwidth on target brokers
- **Cluster access**: Network access to execute Kafka CLI commands against your cluster

## Planning a Replication Factor Increase

The `plan_topic_replication` method generates a detailed plan for increasing a topic's replication factor. The plan includes everything needed to execute the change using Kafka's native tools.

### Basic Usage with Automatic Broker Distribution

When you don't specify broker assignments, Karafka automatically distributes replicas across available brokers:

```ruby
# Generate a plan to increase replication factor to 3
plan = Karafka::Admin.plan_topic_replication(
  topic: 'events',
  replication_factor: 3
)

# View the human-readable summary
puts plan.summary

# Export the JSON file for kafka-reassign-partitions.sh
plan.export_to_file('/tmp/reassignment.json')

# Get the execution commands
puts plan.execution_commands[:execute]
```

### Manual Broker Assignment

For precise control over replica placement, you can specify exact broker assignments per partition:

```ruby
# Manually specify which brokers should host each partition's replicas
plan = Karafka::Admin.plan_topic_replication(
  topic: 'events',
  replication_factor: 3,
  brokers: {
    0 => [1, 2, 3],  # Partition 0 replicas on brokers 1, 2, 3
    1 => [2, 3, 1],  # Partition 1 replicas on brokers 2, 3, 1
    2 => [3, 1, 2]   # Partition 2 replicas on brokers 3, 1, 2
  }
)
```

Manual assignment is useful when you need to:

- Control rack awareness or availability zone placement
- Ensure specific partitions are hosted on specific hardware
- Implement custom load balancing strategies

## Rebalancing Replicas

After adding new brokers to your cluster, existing topics won't automatically use them. The `rebalance` method helps redistribute replicas across all available brokers while maintaining the current replication factor:

```ruby
# Rebalance replicas across all brokers without changing replication factor
plan = Karafka::Admin::Replication.rebalance(topic: 'events')

# Export and execute as usual
plan.export_to_file('/tmp/rebalance.json')
```

This is particularly useful after cluster expansion to ensure even load distribution.

## Working with the Replication Plan

The `plan_topic_replication` and `rebalance` methods return a `Replication` object containing all the information needed to understand and execute the plan.

### Plan Attributes

| Attribute                    | Description                                                     |
|------------------------------|-----------------------------------------------------------------|
| `topic`                      | The target topic name                                           |
| `current_replication_factor` | The topic's current replication factor                          |
| `target_replication_factor`  | The desired replication factor                                  |
| `partitions_assignment`      | Hash mapping partition IDs to arrays of broker IDs              |
| `reassignment_json`          | Kafka-compatible JSON string (version 1 format)                 |
| `execution_commands`         | Hash with `:generate`, `:execute`, and `:verify` CLI commands   |
| `steps`                      | Array of human-readable step-by-step instructions               |

### Plan Methods

| Method                 | Description                                              |
|------------------------|----------------------------------------------------------|
| `export_to_file(path)` | Writes the reassignment JSON to the specified file path  |
| `summary`              | Returns a human-readable description of the plan         |

### Example: Inspecting a Plan

```ruby
plan = Karafka::Admin.plan_topic_replication(
  topic: 'events',
  replication_factor: 3
)

# Check current vs target replication
puts "Current RF: #{plan.current_replication_factor}"
puts "Target RF: #{plan.target_replication_factor}"

# View partition assignments
plan.partitions_assignment.each do |partition, brokers|
  puts "Partition #{partition}: #{brokers.join(', ')}"
end

# Get the raw JSON for inspection
puts plan.reassignment_json
```

## Executing the Plan

After generating a plan, you need to execute it using Kafka's native `kafka-reassign-partitions.sh` tool. The process involves three phases: generate (validate), execute, and verify.

### Step-by-Step Execution

```ruby
plan = Karafka::Admin.plan_topic_replication(
  topic: 'events',
  replication_factor: 3
)

# 1. Export the reassignment JSON
plan.export_to_file('/tmp/reassignment.json')

# 2. View the recommended commands
plan.steps.each { |step| puts step }
```

The execution commands hash provides ready-to-use CLI commands:

```ruby
# Validate the plan (optional but recommended)
puts plan.execution_commands[:generate]

# Execute the reassignment
puts plan.execution_commands[:execute]

# Monitor progress until complete
puts plan.execution_commands[:verify]
```

### Typical CLI Workflow

```shell
# Execute the reassignment
kafka-reassign-partitions.sh \
  --bootstrap-server localhost:9092 \
  --reassignment-json-file /tmp/reassignment.json \
  --execute

# Monitor progress (run periodically until complete)
kafka-reassign-partitions.sh \
  --bootstrap-server localhost:9092 \
  --reassignment-json-file /tmp/reassignment.json \
  --verify
```

The verify command will show progress for each partition. The reassignment is complete when all partitions show "completed successfully".

## Validation and Error Handling

The Replication API validates your request before generating a plan. Common validation errors include:

| Error                           | Cause                                          | Solution                                           |
|---------------------------------|------------------------------------------------|----------------------------------------------------|
| Target RF must exceed current   | Attempting to decrease or maintain current RF  | Use a higher replication factor value              |
| Target RF exceeds broker count  | Not enough brokers available                   | Add more brokers or use a lower RF                 |
| Missing partition assignments   | Manual assignment doesn't cover all partitions | Include all partition IDs in the brokers hash      |
| Duplicate brokers in assignment | Same broker listed twice for a partition       | Each broker ID must appear only once per partition |
| Invalid broker ID               | Referenced broker doesn't exist                | Use only broker IDs present in the cluster         |

### Example: Handling Validation Errors

```ruby
begin
  plan = Karafka::Admin.plan_topic_replication(
    topic: 'events',
    replication_factor: 5
  )
rescue Karafka::Errors::InvalidConfigurationError => e
  puts "Validation failed: #{e.message}"
  # Handle the error appropriately
end
```

## Best Practices

### Before Execution

- **Test on non-critical topics first**: Verify the process works in your environment before applying to production topics
- **Check cluster health**: Ensure all brokers are healthy and have sufficient resources
- **Review the plan**: Use `summary` and inspect `partitions_assignment` to verify the plan looks correct
- **Plan for maintenance windows**: Execute during low-traffic periods to minimize impact

### During Execution

- **Monitor broker resources**: Watch disk I/O, network bandwidth, and CPU usage during reassignment
- **Use throttling if needed**: Kafka supports throttling reassignment traffic to limit impact
- **Run verify periodically**: Check progress regularly until all partitions complete

### After Execution

- **Verify ISR status**: Ensure all replicas are in-sync before considering the operation complete
- **Monitor for under-replicated partitions**: Watch for any issues in the hours following the change
- **Update monitoring thresholds**: Adjust alerts if your replication factor expectations have changed

## Limitations

- **Increase only**: This API only supports increasing replication factor, not decreasing it
- **External execution required**: Due to librdkafka limitations, plans must be executed via Kafka CLI tools
- **No atomic operations**: Partition reassignments happen independently and may complete at different times

---

## See Also

- [Admin API](Admin-API) - General admin operations and topic management
- [Declarative Topics](Declarative-Topics) - Code-based topic configuration management
- [Kafka Topic Configuration](Kafka-Topic-Configuration) - Available topic configuration options
