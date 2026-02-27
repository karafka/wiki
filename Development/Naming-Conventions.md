# Karafka Naming Conventions

This document establishes comprehensive naming conventions for the Karafka ecosystem. Consistent naming improves code readability, maintainability, and team collaboration while ensuring alignment with broader Kafka community practices.

## Overview

Naming conventions serve several critical purposes:

| Purpose | Benefit |
| ------- | ------- |
| **Consistency** | Predictable patterns across the codebase |
| **Clarity** | Self-documenting code that's easier to understand |
| **Maintainability** | Easier refactoring and debugging |
| **Community Alignment** | Following established Kafka ecosystem patterns |
| **Scalability** | Conventions that work as systems grow |

## Topic-Partition Naming

### Core Principles

| Principle | Description |
| --------- | ----------- |
| **Consistency First** | Use the same format consistently within each context |
| **Community Alignment** | Follow established Kafka ecosystem conventions |
| **Context Awareness** | Different contexts may require different formats |
| **Future-Proof** | Choose formats that scale well as systems grow |

### Single Topic-Partition References

#### Dash Format: `topic-partition`

Use the dash format when referring to a specific topic-partition pair as a unique identifier.

**When to Use:**

- Log file references
- Metric names and identifiers
- Database keys or unique identifiers
- Internal system references
- Directory names
- Cache keys

**Examples:**

```text
my-events-0
user-activity-5
order-updates-12
system-metrics-0
```

**Code Examples:**

```ruby
# Metric collection
metrics["#{topic}-#{partition}.lag"] = lag_value

# Log file naming
log_file = "logs/#{topic}-#{partition}.log"

# Cache key generation
cache_key = "offset:#{topic}-#{partition}"
```

#### Bracket Format: `topic-[partition]`

Use the bracket format when the context suggests this is part of a collection, even if currently only one partition.

**When to Use:**

- Consumer assignments (even single partition)
- Partition lists in configuration
- Assignment displays in UI
- Contexts where partitions might be added/removed

**Examples:**

```text
my-events-[0]
user-activity-[5]
order-updates-[12]
```

### Multiple Topic-Partition References

#### Multiple Partitions: `topic-[partition,partition,...]`

Use square brackets with comma-separated partition numbers for multiple partitions of the same topic.

**Examples:**

```text
my-events-[0,1,2]
user-activity-[0,1,2,3,4,5]
order-updates-[0,1,2,3,4,5,6,7,8,9,10,11]
```

**UI Display Examples:**

```text
Consumer Group: my-consumer-group
├── my-events-[0,1,2]
├── user-activity-[3,4,5]
└── notifications-[0]
```

#### Range Notation: `topic-[start-end]`

For consecutive partition ranges, you may use range notation for brevity.

**Examples:**

```text
my-events-[0-2]        # Equivalent to my-events-[0,1,2]
user-activity-[0-5]    # Equivalent to user-activity-[0,1,2,3,4,5]
large-topic-[0-99]     # For topics with many consecutive partitions
```

**When to Use Range Notation:**

- Consecutive partitions only
- When list would be very long (10+ partitions)
- Configuration files where brevity helps readability

### Cross-Topic References

#### Multiple Topics with Partitions

When showing assignments across multiple topics, use consistent formatting for each topic.

**Examples:**

```text
orders-[0,1,2], payments-[0,1], notifications-[0]
events-[0-9], metrics-[0-4], logs-[0]
```

#### Topic Lists Without Partition Details

When partition information isn't relevant, use simple topic names.

**Examples:**

```text
Topics: orders, payments, notifications
Subscribed to: events, metrics, logs
```

### Context-Specific Conventions

#### Consumer Group Assignments

Use bracket notation to clearly show which partitions each consumer is handling.

```text
Consumer Group: order-processing-group
Consumer 1: orders-[0,2,4], payments-[0]
Consumer 2: orders-[1,3,5], payments-[1]
Consumer 3: notifications-[0]
```

#### Rebalancing Logs

Use bracket notation in rebalancing scenarios to show partition movements.

```text
[INFO] Rebalancing started
[INFO] Revoking: orders-[0,2,4], payments-[0]
[INFO] Assigning: orders-[1,3], payments-[1], notifications-[0]
[INFO] Rebalancing completed
```

#### Monitoring and Metrics

Use dash notation for metric names and identifiers.

**Metric Names:**

```text
kafka.consumer.lag.orders-0
kafka.consumer.lag.orders-1
kafka.producer.rate.events-5
```

**Monitoring Displays:**

```text
Topic-Partition    | Current Offset | Lag
orders-0           | 15,432         | 0
orders-1           | 12,891         | 3
orders-2           | 18,765         | 1
```

#### Error Messages and Logging

Use appropriate format based on context - dash for specific references, brackets for assignments.

**Error Message Examples:**

```ruby
# Specific partition error
logger.error "Failed to process message from orders-3"

# Assignment context error
logger.error "Cannot assign orders-[0,1,2] to consumer: already assigned"

# Rebalancing context
logger.info "Consumer assigned: orders-[1,3,5], payments-[0]"
```

#### API Responses and Data Structures

Use bracket format for displaying assignments. For structured data, nest partitions within topic hashes following librdkafka conventions.

**JSON API Response:**

```json
{
  "consumer_id": "consumer-123",
  "assigned_partitions": "orders-[0,1,2], payments-[0]",
  "partition_details": {
    "orders": {
      "0": { "offset": 1542, "lag": 0 },
      "1": { "offset": 1123, "lag": 2 },
      "2": { "offset": 1876, "lag": 1 }
    },
    "payments": {
      "0": { "offset": 892, "lag": 0 }
    }
  }
}
```

### Advanced Scenarios

#### Dead Letter Queues

Use consistent naming for DLQ topic-partition references.

```text
Original: orders-0
DLQ: orders-dlq-0

Original: user-events-[0,1,2]
DLQ: user-events-dlq-[0,1,2]
```

#### Compacted Topics

Apply same conventions regardless of topic configuration.

```text
user-profiles-0      # Single partition compacted topic
user-profiles-[0,1,2] # Multi-partition compacted topic
```

#### Schema Registry Integration

Use dash format for schema subject naming that includes partition info.

```text
orders-0-value
orders-0-key
user-events-5-value
```

### Implementation Guidelines

| Context | Format | Example |
| ------- | ------ | ------- |
| **Single specific reference** | `topic-partition` (dash) | `orders-0` |
| **Single in assignment context** | `topic-[partition]` (brackets) | `orders-[0]` |
| **Multiple partitions** | `topic-[partition,partition,...]` (brackets with commas) | `orders-[0,1,2]` |
| **Ranges** | `topic-[start-end]` (brackets with dash for range) | `orders-[0-9]` |
| **Metrics/IDs** | Always use dash format | `kafka.lag.orders-0` |
| **Assignments/UI** | Always use bracket format | `orders-[0,1,2]` |

**Key Guidelines:**

- Be consistent within each context
- Choose format based on whether it's an identifier or a collection

## Integration and Unit Test Topics

All topics used in integration and unit tests across the Karafka ecosystem should follow a consistent naming pattern to enable easy cleanup and maintenance of test environments.

### Test Topic Prefix Convention

**All test topics must use the `it-` prefix** (short for "integration test").

This naming convention allows for simple cleanup operations using regex matching.

### Standard Test Topic Format

#### Primary Pattern: `it-UUID`

Most test topics should follow the UUID-based naming pattern for uniqueness and isolation:

```ruby
# Good: UUID-based test topics
test_topic = "it-#{SecureRandom.uuid}"
# Example: "it-f47ac10b-58cc-4372-a567-0e02b2c3d479"

# RSpec example
RSpec.describe SomeConsumer do
  let(:topic_name) { "it-#{SecureRandom.uuid}" }

  before do
    create_topic(topic_name)
  end
end
```

**Benefits of UUID-based naming:**

- Guaranteed uniqueness across parallel test runs
- No conflicts between different test suites
- Safe for concurrent execution
- Easy to identify and clean up

#### Secondary Pattern: `it-descriptive-name`

When tests require specific, predictable topic names, use descriptive names with the `it-` prefix:

```ruby
# Acceptable: When specific topic names are needed
test_topic = "it-user-events-compacted"
test_topic = "it-orders-partitioned-by-region"
test_topic = "it-dead-letter-queue-testing"

# Configuration testing example
RSpec.describe TopicConfiguration do
  let(:compacted_topic) { "it-user-profiles-compacted" }
  let(:partitioned_topic) { "it-events-high-throughput" }
end
```

**When to use descriptive names:**

- Testing specific topic configurations (compaction, partitioning strategies)
- Integration tests that verify topic-specific behavior
- Tests that need to reference topics by predictable names
- Cross-component integration tests

### Implementation Examples

**Test Setup Patterns:**

```ruby
# Pattern 1: UUID-based (preferred)
RSpec.describe MessageProcessor do
  let(:input_topic) { "it-#{SecureRandom.uuid}" }
  let(:output_topic) { "it-#{SecureRandom.uuid}" }
  let(:dlq_topic) { "it-#{SecureRandom.uuid}-dlq" }
end

# Pattern 2: Descriptive names when needed
RSpec.describe SchemaEvolution do
  let(:versioned_topic) { "it-schema-evolution-v2" }
  let(:backward_compat_topic) { "it-schema-backward-compat" }
end

# Pattern 3: Mixed approach
RSpec.describe RebalancingBehavior do
  let(:base_uuid) { SecureRandom.uuid }
  let(:consumer_topic_1) { "it-#{base_uuid}-consumer-1" }
  let(:consumer_topic_2) { "it-#{base_uuid}-consumer-2" }
end
```

### Special Cases and Exceptions

**Limited Exceptions**

There are a few existing special cases in the Karafka ecosystem where the `it-` prefix is not used. These exceptions are **legacy patterns** and should not be replicated in new code:

- Some specific integration tests may use different prefixes
- Certain benchmarking or performance tests may have custom naming
- Cross-platform compatibility tests might use specific formats

**Important Guidelines:**

- **Do not introduce new exceptions** without explicit approval
- All new test code should follow the `it-` prefix convention
- When refactoring existing tests, migrate to the standard convention when possible
- Document any unavoidable exceptions with clear justification

### Best Practices Summary

| Practice | Description |
| -------- | ----------- |
| **Always use `it-` prefix** | For all new test topics |
| **Prefer UUID-based naming** | For maximum isolation and uniqueness |
| **Use descriptive names sparingly** | Only when testing requires specific topic characteristics |
| **Clean up regularly** | Using regex-based deletion commands |
| **Integrate cleanup** | Into CI/CD pipelines |
| **Avoid creating new exceptions** | To the naming convention |
| **Document any unavoidable exceptions** | With clear reasoning |
| **Consider environment isolation** | For additional safety in shared development environments |

This convention ensures that test topics can be easily identified, managed, and cleaned up across the entire Karafka ecosystem while maintaining clear separation from production topics.
