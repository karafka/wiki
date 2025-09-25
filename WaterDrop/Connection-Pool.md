# Connection Pool

WaterDrop provides a built-in `ConnectionPool` for efficient producer management and connection handling in high-intensity applications. The connection pool provides optimized connection handling, enabling efficient management of multiple producer instances in scenarios where this is necessary.

!!! note "Important: Most Users Don't Need Connection Pools"

    Since WaterDrop producers are thread-safe, most applications can share a single producer instance across multiple threads without needing connection pooling. Connection pools are primarily beneficial for high-intensity applications with particular performance requirements or when you need to isolate producer configurations.

!!! tip "Consider Variants Before Connection Pools"

    Before implementing connection pools, consider using [Variants](WaterDrop-Variants). Variants allow you to manage different configuration settings per topic using the same producer instance with shared TCP connections. This approach is often more efficient than connection pools when your primary need is topic-specific configurations (such as different acknowledgment levels, compression settings, and timeouts) rather than isolated producer instances.

## Prerequisites

WaterDrop's `ConnectionPool` utilizes the `connection_pool` gem internally, which is not included as a dependency by default, as most users don't require connection pooling functionality.

Add the `connection_pool` gem to your Gemfile:

```ruby
gem 'connection_pool'
```

Then run:

```shell
bundle install
```

If you attempt to use `WaterDrop::ConnectionPool` without the gem installed, you'll receive a helpful error message with installation instructions.

## Getting Started with Connection Pools

To use connection pools with WaterDrop:

1. **Set up the connection pool** with your desired configuration:

```ruby
# Basic connection pool setup
WaterDrop::ConnectionPool.setup(
  size: 10,
  timeout: 5_000
)
```

2. **Use the connection pool** to get producers and send messages:

```ruby
# Get a producer from the pool and use it
WaterDrop::ConnectionPool.with do |producer|
  producer.produce_sync(topic: 'events', payload: 'my message')
end

# The producer is automatically returned to the pool
```

3. **Close the connection pool** when shutting down your application:

```ruby
# Close the connection pool when done
WaterDrop::ConnectionPool.close
```

!!! note "Auto-Closing in Karafka Applications"

    When using the default connection pool within Karafka framework processes, the connection pool is automatically closed during framework shutdown, similar to how the default producer is handled. You don't need to close it manually in Karafka processes.

## Working with Transactions

For transactional message processing, each producer in the pool needs a unique `transactional.id`. Configure this during setup:

```ruby
# Setup transactional connection pool with unique transaction IDs
WaterDrop::ConnectionPool.setup(size: 5) do |config, index|
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'transactional.id': "my-app-#{index}"
  }
  config.deliver = true
end
```

Then use the convenient transaction method:

```ruby
# Automatically handles transaction lifecycle
WaterDrop::ConnectionPool.transaction do |producer|
  producer.produce_sync(topic: 'orders', payload: order.to_json)
  producer.produce_sync(topic: 'inventory', payload: inventory_update.to_json)
  # Transaction is automatically committed if block completes successfully
  # Transaction is automatically rolled back if an exception occurs
end
```

This is equivalent to manual transaction management but provides a cleaner API:

```ruby
# Manual approach (equivalent to the above)
WaterDrop::ConnectionPool.with do |producer|
  producer.transaction do
    producer.produce_sync(topic: 'orders', payload: order.to_json)
    producer.produce_sync(topic: 'inventory', payload: inventory_update.to_json)
  end
end
```

## Configuration Options

When setting up your connection pool, you can configure:

| Option    | Required | Value type | Description                                    |
|-----------|----------|------------|------------------------------------------------|
| `size`    | true     | Integer    | Maximum number of producer connections in pool |
| `timeout` | true     | Integer    | Connection timeout in milliseconds            |

Additional configuration can be provided through a block:

```ruby
WaterDrop::ConnectionPool.setup(size: 10, timeout: 5_000) do |config, index|
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'transactional.id': "my-app-#{index}" # Unique per producer
  }
  config.deliver = true
end
```

The configuration block receives:

- `config` - Standard WaterDrop producer configuration
- `index` - Zero-based index of the producer in the pool (useful for unique IDs)

## Multiple Connection Pool Instances

While the global connection pool is convenient for most cases, you can create separate connection pool instances when you need different configurations for different use cases:

```ruby
# Create separate connection pools for different purposes
analytics_pool = WaterDrop::ConnectionPool.new(size: 5, timeout: 3_000) do |config, index|
  config.kafka = {
    'bootstrap.servers': 'analytics-cluster:9092',
    'transactional.id': "analytics-#{index}"
  }
  config.deliver = true
end

notifications_pool = WaterDrop::ConnectionPool.new(size: 10, timeout: 10_000) do |config|
  config.kafka = {
    'bootstrap.servers': 'notifications-cluster:9092',
    'acks': 'all'
  }
  config.deliver = true
end

# Use specific pools for different tasks
analytics_pool.with do |producer|
  producer.produce_sync(topic: 'user_events', payload: event_data.to_json)
end

notifications_pool.with do |producer|
  producer.produce_async(topic: 'push_notifications', payload: notification.to_json)
end

# Don't forget to close each pool when shutting down
analytics_pool.close
notifications_pool.close
```

This approach is useful when you need:

- Different Kafka clusters for different message types
- Separate transaction ID namespaces
- Different performance characteristics (pool sizes, timeouts)
- Isolated producer configurations

## Common Usage Patterns

### High-Throughput Event Publishing

For applications sending many messages:

```ruby
# Setup once during application initialization
WaterDrop::ConnectionPool.setup(size: 20, timeout: 10_000)

class EventPublisher
  def self.publish(event_type, data)
    WaterDrop::ConnectionPool.with do |producer|
      producer.produce_async(
        topic: "events.#{event_type}",
        payload: data.to_json,
        headers: { 'timestamp' => Time.now.to_i.to_s }
      )
    end
  end
end

# Use throughout your application
EventPublisher.publish('user_created', { id: 123, name: 'Alice' })
EventPublisher.publish('order_placed', { order_id: 456, amount: 99.99 })
```

### Background Job Integration

Integrate with background job systems:

```ruby
class NotificationJob
  def perform(user_id, message)
    WaterDrop::ConnectionPool.with do |producer|
      producer.produce_sync(
        topic: 'notifications',
        payload: {
          user_id: user_id,
          message: message,
          timestamp: Time.now.iso8601
        }.to_json
      )
    end
  rescue ConnectionPool::TimeoutError => e
    Rails.logger.error "No producer available from pool: #{e.message}"
    # Consider retry logic or fallback to direct producer
    raise
  rescue => e
    Rails.logger.error "Failed to publish message: #{e.message}"
    # Handle other errors like network issues, serialization errors, etc.
    raise
  end
end
```

### Transactional Order Processing

Process multiple related messages atomically:

```ruby
class OrderProcessor
  def process_orders(orders)
    WaterDrop::ConnectionPool.transaction do |producer|
      orders.each do |order|
        producer.produce_async(
          topic: 'processed_orders',
          payload: order.to_json,
          key: order.id.to_s
        )
      end
    end
  end
end
```

## Error Handling

When working with connection pools, handle these specific errors:

- `ConnectionPool::TimeoutError` - No producer available within timeout
- Standard WaterDrop/Kafka errors for message delivery issues

```ruby
begin
  WaterDrop::ConnectionPool.with do |producer|
    producer.produce_sync(topic: 'events', payload: data.to_json)
  end
rescue ConnectionPool::TimeoutError => e
  # Pool exhausted, no producers available
  logger.error "Connection pool timeout: #{e.message}"
  # Consider retry with backoff or use fallback producer
rescue => e
  # Other errors (network, serialization, etc.)
  logger.error "Message production failed: #{e.message}"
  raise
end
```

## Monitoring and Events

WaterDrop provides events for monitoring connection pool lifecycle:

| Event                           | Description                                    |
|--------------------------------|------------------------------------------------|
| `connection_pool.created`      | Emitted when a new connection pool is created |
| `connection_pool.setup`        | Emitted when a connection pool is configured  |
| `connection_pool.shutdown`     | Emitted when a connection pool shuts down     |
| `connection_pool.reload`       | Emitted when a connection pool begins reload  |
| `connection_pool.reloaded`     | Emitted when a connection pool reload completes |

Subscribe to these events for monitoring:

```ruby
# Monitor connection pool lifecycle
WaterDrop.monitor.subscribe('connection_pool.created') do |event|
  Rails.logger.info "Connection pool created with #{event[:size]} connections"
end

WaterDrop.monitor.subscribe('connection_pool.shutdown') do |event|
  Rails.logger.info "Connection pool shutting down"
end
```
