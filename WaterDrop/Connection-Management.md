# Connection Management

WaterDrop provides advanced connection management features that complement librdkafka's native connection handling, helping to optimize resource usage and maintain efficient connections to Kafka brokers. These features are particularly valuable in environments with varying message production patterns.

## Connection Management Background

Understanding how connections are managed across the stack is essential for effective resource optimization:

### librdkafka Native Connection Management

librdkafka features built-in connection management through configuration options, such as `connections.max.idle.ms`, which automatically closes unused broker connections after a specified idle period. However, librdkafka has an important limitation: **the leader connection (bootstrap connection) is never closed** because it must remain open to receive cluster metadata updates, partition leadership changes, and other administrative information.

### Kafka Broker Connection Reaping

Kafka brokers themselves also manage connections through their own connection reaper mechanisms, closing idle client connections based on server-side configuration.

### WaterDrop's Enhancement

WaterDrop's automatic idle producer disconnection feature fills a critical gap by providing **complete producer-level disconnection**, including the leader connection that librdkafka keeps open. When WaterDrop disconnects an idle producer, it performs a full shutdown and will establish fresh connections (including a new leader connection) when the producer becomes active again.

This is particularly valuable because:

- **Addresses the leader connection limitation**: Unlike librdkafka's native idle connection handling, WaterDrop can close all connections, including the persistent leader connection
- **Producer-level control**: Operates at the WaterDrop producer instance level rather than individual broker connections
- **Complete resource cleanup**: Ensures full connection pool cleanup during extended idle periods

## Automatic Idle Producer Disconnection

The automatic idle producer disconnection feature allows WaterDrop to automatically disconnect entire producers (including all their connections) when they have been inactive for a specified period. This provides more comprehensive resource management than librdkafka's native connection idle handling.

### Configuration

The idle disconnection feature is controlled by the `idle_disconnect_timeout` configuration option:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.idle_disconnect_timeout = 60_000  # Disconnect after 60 seconds of inactivity
  config.kafka = {
    'bootstrap.servers': 'localhost:9092'
  }
end
```

### Configuration Options

<table>
  <thead>
    <tr>
      <th>Value</th>
      <th>Behavior</th>
      <th>Use Case</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>0</code></td>
      <td>Disables automatic disconnection</td>
      <td>High-frequency producers or when connection persistence is critical</td>
    </tr>
    <tr>
      <td>Disconnects after specified milliseconds of inactivity</td>
      <td>Low-frequency producers or resource-constrained environments</td>
    </tr>
  </tbody>
</table>

!!! note "Minimum Timeout"

    The minimum allowed timeout is 30 000 milliseconds. Values below 30 000 will result in a configuration error.

### How It Works

The idle disconnection mechanism monitors producer activity and automatically disconnects producers that haven't transmitted messages within the configured timeout period.

1. **Activity Monitoring**: WaterDrop tracks the last message transmission time for each producer
2. **Timeout Check**: Periodically checks if producers have exceeded the idle timeout
3. **Safe Disconnection**: Only disconnects producers that are in a safe state (no pending operations)
4. **Automatic Reconnection**: Producers automatically reconnect when new messages need to be sent

### Example Usage Scenarios

#### Low-Frequency Background Jobs

For applications that send messages sporadically, such as background job notifications:

```ruby
# Configure for background job producer
job_producer = WaterDrop::Producer.new do |config|
  config.id = 'background_jobs'
  config.idle_disconnect_timeout = 300  # 5 minutes
  config.kafka = {
    'bootstrap.servers': 'localhost:9092'
  }
end

# Producer will disconnect after 5 minutes of no activity
# and reconnect automatically when needed
job_producer.produce_async(topic: 'job_notifications', payload: job_data)
```

#### Resource-Constrained Environments

In environments where connection limits or memory usage are concerns:

```ruby
# Configure for efficient resource usage
efficient_producer = WaterDrop::Producer.new do |config|
  config.idle_disconnect_timeout = 60   # Disconnect quickly when idle
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'socket.keepalive.enable': true
  }
end
```

#### High-Frequency Producers

For producers that send messages continuously, disable the feature:

```ruby
# Disable for high-frequency producers
stream_producer = WaterDrop::Producer.new do |config|
  config.idle_disconnect_timeout = 0    # Keep connections persistent
  config.kafka = {
    'bootstrap.servers': 'localhost:9092'
  }
end
```

### Monitoring and Observability

When using idle disconnection, you can monitor your producer's connection behavior through WaterDrop's built-in instrumentation:

```ruby
# Subscribe to connection events
WaterDrop.monitor.subscribe('producer.disconnected') do |event|
  puts "Producer #{event[:producer_id]} disconnected due to inactivity"
end

WaterDrop.monitor.subscribe('producer.connected') do |event|
  puts "Producer #{event[:producer_id]} connected"
end
```

### Performance Considerations

#### Benefits

- **Reduced Resource Usage**: Fewer idle TCP connections consume less system resources
- **Better Connection Pool Management**: Prevents connection pool exhaustion in broker clusters
- **Cost Optimization**: Reduces network overhead in cloud environments

#### Trade-offs

- **Reconnection Latency**: First message after disconnection incurs reconnection overhead
- **Metadata Refresh**: Reconnecting producers need to refresh topic metadata

## Interaction with librdkafka Connection Settings

WaterDrop's idle disconnection works alongside librdkafka's native connection management. Understanding their interaction helps optimize your connection strategy:

### Complementary Configuration

```ruby
producer = WaterDrop::Producer.new do |config|
  config.idle_disconnect_timeout = 300_000  # WaterDrop: disconnect entire producer after 5 minutes
  config.kafka = {
    'bootstrap.servers': 'localhost:9092',
    'connections.max.idle.ms': 60_000     # librdkafka: close individual broker connections after 1 minute
  }
end
```

In this configuration:

1. **librdkafka** closes unused individual broker connections after 1 minute, but keeps the leader connection open
2. **WaterDrop** performs complete producer disconnection (including leader connection) after 5 minutes of no activity
3. This provides two levels of resource optimization: broker-level and producer-level

### Timing Considerations

- Set `idle_disconnect_timeout` higher than `connections.max.idle.ms` to allow librdkafka's connection cleanup to occur first
- Consider your cluster's connection limits and broker-side idle timeouts when setting these values
- Monitor connection patterns to find the optimal balance for your use case
