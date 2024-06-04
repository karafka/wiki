# Latency and Throughput

## Introduction

Latency management is crucial for optimizing the performance of any Kafka-based system. The Karafka framework's default settings aim to balance average latency and decent throughput. However, these default settings might not be suitable for all use cases, particularly those requiring low latency or high throughput. This document is intended to guide you through the necessary configurations and best practices to manage latency effectively in your Karafka setup.

The producer and consumer sides of a Kafka system have distinct roles and,  consequently, require different strategies for latency management. For producers, the focus is often on optimizing the message batching and sending mechanisms to minimize delays. On the consumer side, the goal is to reduce the time it takes to fetch and process messages. This document will detail specific configurations and practices for producers and consumers to help you achieve the desired latency levels.

!!! Info "Understanding the Complexity of Latency and Throughput Management"

    Latency management in Karafka is a complex and multifaceted topic. While this document provides a comprehensive overview of latency management techniques and best practices, it only covers some possible aspects. Many factors influence latency, including framework configuration, message types, scale, and the nature of your processing workload. These factors often extend beyond the scope of framework documentation.

    If you are seeking in-depth assistance or facing persistent latency issues, we recommend exploring our [commercial offerings](https://karafka.io/#become-pro), which include, among other things, high-performance features, support, and consultancy services.

## Producer Management

Managing latency and throughput on the producer side is critical for ensuring that messages are sent efficiently and quickly. This section covers the key aspects of producer latency management, including configuration tuning,  batching and compression, asynchronous sending, and best practices.

### Configuration Tuning

WaterDrop (Karafka's message producer) is fundamentally asynchronous, with a synchronous API around it. Any message you wait for will ultimately be dispatched from a background thread. Several settings impact how WaterDrop dispatches these messages.

#### `queue.buffering.max.ms`

The `queue.buffering.max.ms` parameter defines the maximum waiting time for additional messages before sending the current batch to the broker. Setting this to `0` or a very low value (like `1` ms) can help lower latency by minimizing wait times. However, this might increase overhead due to smaller batch sizes, impacting throughput and resource usage. When set to `0`, messages are dispatched immediately, allowing for sub-millisecond synchronous dispatches at the cost of increased CPU and network usage and lower throughput.

Below are logs from dispatches with `queue.buffering.max.ms` set to `5` ms compared to `queue.buffering.max.ms` set to 0 in a local Kafka setup:

```bash
# buffer for 5ms and produce sync

[waterdrop-80ad817ceb09] Sync producing (...) took 5.458219051361084 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.43287992477417 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.429641962051392 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.377591848373413 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.311408996582031 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.407937049865723 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.422562122344971 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.36993408203125 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.342764139175415 ms
[waterdrop-80ad817ceb09] Sync producing (...) took 5.406744956970215 ms
```

vs.

```bash
# dispatch immediately

[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.2399919033050537 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.28732800483703613 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.2857530117034912 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.28434205055236816 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.26418089866638184 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.279433012008667 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.2934098243713379 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.2789499759674072 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.3075120449066162 ms
[waterdrop-e2c291b6b0f3] Sync producing (...) took 0.24221014976501465 ms
```

#### `batch.size`

The `batch.size` parameter determines the maximum size of a batch of messages. Larger batch sizes can improve throughput but might increase latency. Finding the right balance is key to optimal performance.

#### `compression.codec`

Compression reduces the size of the messages sent to the broker, potentially decreasing network latency and increasing throughput. However, while compression can reduce network latency, it introduces CPU overhead. Test different compression settings to find the best balance for your use case.

#### `request.required.acks`

The `request.required.acks` parameter determines the number of acknowledgments the leader broker must receive from an in-sync replica (ISR) brokers before responding to the producer. This setting is crucial for balancing message durability and producer latency.

- **0 (No Acknowledgement)**: The broker does not respond to the producer, and the message is considered delivered the moment it is dispatched. This setting provides the lowest latency since the producer doesn't wait for acknowledgments. It's highly performant, allowing for rapid message dispatch, but it risks data loss because there's no confirmation that the broker received the message. Suitable for non-critical data where speed is crucial.

- **1 (Leader Acknowledgement)**: The leader broker responds once it has written the message to its log. This setting balances latency and durability, providing a quick acknowledgment while ensuring the leader broker logs the message. It offers a good trade-off for most use cases, ensuring reasonable reliability with moderate latency. 

- **-1 or all (All ISR Acknowledgements)**: The leader broker waits until all in-sync replicas have acknowledged the message. This setting ensures maximum durability, minimizing the risk of data loss as the message is replicated across multiple brokers. However, it results in higher latency and reduced throughput. It is best for critical applications where data integrity is essential.

Choosing the right acks setting depends on your application's requirements:

- **Low Latency Needs**: Use acks=0 for the fastest message dispatch at the expense of reliability.

- **Balanced Approach**: Use acks=1 to compromise performance and reliability, suitable for most applications.

- **High Durability Needs**: Use acks=-1 or acks=all for critical applications where data loss is unacceptable despite the higher latency and reduced throughput.

!!! Tip "Fine-Tuning `acks` with WaterDrop Variants"

    Using [variants](https://karafka.io/docs/WaterDrop-Variants/), you can customize `request.required.acks` within the same producer instance. This feature allows different configuration settings per topic while sharing TCP connections, optimizing producer efficiency.

### Asynchronous Producing

Asynchronous dispatch reduces waiting time for acknowledgments, allowing your application to continue processing tasks immediately. This significantly lowers end-to-end latency within your application and increases WaterDrop throughput. 

Asynchronous producing is the recommended way for any non-critical messages.

```ruby
producer.produce_many_async(
  [
    { topic: 'my-topic', payload: 'my message'},
    { topic: 'my-topic', payload: 'my message'}
  ]
)
```

## Consumer Management

TBA

### Configuration Tuning

### Parallel Processing

### Prefetching Messages

### Efficient Deserialization

## Troubleshooting Latency Issues

### Common Problems

### Diagnostic Techniques

## Additional Considerations

## Summary

TBA
