# Async Ecosystem Integration

WaterDrop seamlessly integrates with Ruby's async ecosystem and fiber scheduler, providing proper fiber yielding during blocking operations. This integration ensures optimal concurrency when using WaterDrop alongside async gems and fiber-based frameworks.

## Fiber Yielding During Blocking Operations

When using `#produce_sync` or `#produce_many_sync`, WaterDrop automatically yields control to the fiber scheduler during Kafka operations that may block, allowing other fibers to execute concurrently. This behavior is crucial for maintaining performance in async applications where multiple operations need to run concurrently.

### How It Works

WaterDrop leverages Ruby's fiber-yielding mechanisms to ensure that when `#produce_sync` or `#produce_many_sync` operations encounter blocking I/O (such as network communication with Kafka brokers), control is properly yielded to other fibers in the system. This prevents blocking the entire fiber scheduler and maintains application responsiveness.

**Key behaviors:**

- Automatic fiber yielding during Kafka network operations
- Proper integration with Ruby's `Fiber.scheduler`
- Seamless compatibility with the [async](https://github.com/socketry/async) gem ecosystem
- Non-blocking behavior when multiple fibers need to perform Kafka operations simultaneously

### Practical Benefits

The async integration provides several practical advantages:

**Improved Throughput**: Multiple fibers can perform Kafka operations concurrently without blocking each other, especially beneficial when dealing with network latency or high message volumes.

**Better Resource Utilization**: The fiber scheduler can efficiently manage system resources by switching between fibers during I/O wait times.

**Responsive Applications**: Applications using async frameworks maintain responsiveness even when performing multiple Kafka operations simultaneously.

**Seamless Integration**: No configuration changes required - WaterDrop automatically detects and integrates with fiber schedulers when present.

## Usage with Async Gem

WaterDrop works out of the box with the async gem ecosystem. Here's a typical usage pattern:

```ruby
require 'async'
require 'waterdrop'

producer = WaterDrop::Producer.new do |config|
  config.kafka = { 'bootstrap.servers': 'localhost:9092' }
end

Async do |task|
  # Multiple concurrent Kafka operations using produce_sync
  single_task = task.async do
    10.times do |i|
      begin
        producer.produce_sync(
          topic: "events",
          payload: "Message #{i}",
          key: "key_#{i}"
        )
      rescue WaterDrop::Errors::ProduceError => e
        puts "Failed to produce message #{i}: #{e.message}"
        # Handle the error appropriately for your use case
      end
    end
  end

  # Batch operations using produce_many_sync
  batch_task = task.async do
    messages = 5.times.map do |i|
      {
        topic: "batch_events",
        payload: "Batch message #{i}",
        key: "batch_key_#{i}"
      }
    end

    begin
      producer.produce_many_sync(messages)
    rescue WaterDrop::Errors::ProduceError => e
      puts "Failed to produce batch: #{e.message}"
      # Handle batch failure appropriately
    end
  end

  # Other concurrent operations
  worker_task = task.async do
    # This will run concurrently with all Kafka operations
    process_other_work
  end

  # All tasks run concurrently
  [single_task, batch_task, worker_task].each(&:wait)
end

producer.close
```

## Performance Considerations

When using WaterDrop with async frameworks:

**Concurrency Benefits**: Most significant when dealing with multiple concurrent Kafka operations or when Kafka operations involve network latency.

**Fiber Overhead**: Minimal overhead added by fiber yielding mechanisms - the performance benefits typically outweigh any scheduling costs.

**Batching Compatibility**: Works seamlessly with WaterDrop's `produce_many_sync` batching capabilities for optimal throughput while maintaining proper fiber yielding.

## Transactional Operations

When using WaterDrop's transactional capabilities with fibers, it's essential to understand the blocking nature of transactions:

**Transaction Limitation**: Due to the nature of transactional operations, multiple transactions from one producer will remain blocking if you attempt to open several transactions across multiple fibers. Kafka's transactional protocol requires sequential coordination between the producer and broker, preventing concurrent transaction management from a single producer instance.

**Transactions Still Yield**: **Importantly, transactions still yield during I/O operations just like regular produce operations.** This means that while multiple transactions from one producer must run sequentially, other fibers performing different work (non-transactional operations, processing, monitoring, etc.) will continue to execute concurrently during transaction I/O. The yielding behavior is preserved - only the transaction coordination itself is sequential.

**Best Practice**: Use separate producer instances for concurrent transactional operations across different fibers, or design your application to handle transactions sequentially within a single fiber while keeping other concurrent operations running.

```ruby
# ❌ Avoid: Multiple transactions from same producer across fibers
Async do |task|
  task.async do
    producer.transaction do
      # This will block other transaction attempts
      producer.produce_sync(topic: 'events', payload: 'data1')
    end
  end

  task.async do
    producer.transaction do
      # This will wait for the first transaction to complete
      producer.produce_sync(topic: 'events', payload: 'data2')
    end
  end
end

# ✅ Better: Separate producers or sequential transactions
Async do |task|
  task.async do
    producer1.transaction do
      producer1.produce_sync(topic: 'events', payload: 'data1')
    end
  end

  task.async do
    producer2.transaction do
      producer2.produce_sync(topic: 'events', payload: 'data2')
    end
  end
end
```

## Why WaterDrop is the Right Choice for Async Applications

WaterDrop's native async support makes it the optimal Kafka producer for fiber-based and async applications. Here's why:

**Purpose-Built Integration**: Unlike other Kafka libraries that treat async support as an afterthought, WaterDrop was designed with fiber yielding as a core feature. This means reliable, tested behavior rather than bolted-on compatibility.

**Zero-Configuration Excellence**: WaterDrop automatically detects and integrates with fiber schedulers without requiring configuration changes, environment variables, or special initialization. Your existing code immediately benefits from improved concurrency.

**Performance Without Compromise**: WaterDrop delivers both excellent async performance and robust Kafka functionalities. You don't have to choose between concurrency benefits and production-ready features like delivery guarantees, error handling, and monitoring capabilities.

**Future-Proof Architecture**: As Ruby's async ecosystem continues to evolve, WaterDrop's architecture ensures compatibility with new fiber scheduler implementations and async frameworks.
