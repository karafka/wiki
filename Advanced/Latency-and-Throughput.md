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

Tuning producers may seem straightforward, but managing consumers is a different and more complex matter. Understanding and optimizing consumer latency and throughput requires a deep dive into various aspects spanning several book chapters. The sections below should be viewed as an introduction rather than exhaustive documentation.

Consumer management is influenced by numerous external factors that go beyond the framework itself. These include:

- **Types of Data Consumed**: Different data types may require different processing strategies and resources.

- **Nature of Assignments and Infrastructure**: How partitions are assigned to consumers and the underlying infrastructure significantly impact performance.

- **Type of Processing**: Whether CPU-intensive or IO-intensive affects how consumers should be tuned.

- **Amount and Sizes of Data**: The volume and size of consumed data are crucial in determining the optimal consumer configuration.

- **Number of Worker Threads**: The number of threads available for processing can influence how effectively data is consumed.

- **Routing Setup**: The complexity of the routing setup affect consumer performance.

- **Data Production Patterns**: Steady data streams versus sudden bursts (flushes) require different handling strategies to maintain performance.

- **Topics Configuration and Number of Partitions**: The configuration of topics and the number of partitions can significantly impact workload distribution and overall consumer efficiency.

This document is designed to provide you with a solid foundation in consumer latency management. It offers detailed explanations and descriptions that can serve as a basis for making informed decisions about consumer configurations. While it does not cover every possible scenario, it provides essential insights to help you navigate the complexities of consumer management in your Kafka setup, ensuring you are well-prepared for any situation.

The strategy and methods selected for consumer management can vary significantly depending on whether the priority is throughput or latency.

- **Prioritizing Throughput**: When the goal is to maximize throughput, the focus is on efficiently processing large volumes of data. Strategies include increasing batch sizes, optimizing worker thread counts, and ensuring consumers can handle high loads without frequent pauses. This approach might accept higher latency for processing more messages per unit of time.

- **Prioritizing Latency**: This strategy, when low latency is the priority, is a swift approach that minimizes the time taken for each message to be processed and acknowledged. It involves reducing batch sizes, using faster data processing methods, and ensuring that the consumer system is highly responsive. Here, throughput might be sacrificed, but the assurance of quick message processing is maintained.

!!! Info "No Silver Bullet for Latency and Throughput Tuning"

    There is no one-size-fits-all solution when it comes to tuning latency and throughput. As mentioned above, achieving optimal performance requires deeply understanding your specific expectations and use cases.

!!! Info "Scope of this Guide"

    This document focuses on aspects related to the operational flow of a single subscription group within Karafka. It provides guidance on tuning configurations and managing latency and throughput for individual subscription groups. However, it's important to note that system dynamics can differ significantly when dealing with multi-subscription group operations. The interplay between multiple groups, their configurations, and the shared resources can introduce additional complexities and considerations not covered in this document.

### Prerequisites and Initial References

To effectively understand Karafka consumer processes latency and the topics discussed in this document, it is essential to be familiar with several key concepts and operations within the framework. Here is a list of topics you should be accustomed to:

- [Routing DSL](https://karafka.io/docs/Routing/) including multi-consumer group and multi-subscription group operations.
- [Concurrency and Multithreading](https://karafka.io/docs/Concurrency-and-Multithreading/) design of the framework.
- [Error Handling](https://karafka.io/docs/Error-handling-and-back-off-policy/) (Especially Backoff Policies)
- [Offset Management Strategies](https://karafka.io/docs/Offset-management/)
- [Monitoring and Logging](https://karafka.io/docs/Monitoring-and-Logging/) basics.
- [Web UI Usage](https://karafka.io/docs/Web-UI-Getting-Started/) for monitoring.
- [Swarm/Multi-Process Mode](https://karafka.io/docs/Swarm-Multi-Process/)
- [Connection Multiplexing](https://karafka.io/docs/Pro-Multiplexing/)
- [Virtual Partitions](https://karafka.io/docs/Pro-Virtual-Partitions/)

### Latency Types

When working with Karafka, there are two primary types of latency: consumption latency and processing latency. Understanding these will help you optimize performance and ensure timely message processing.

- **Consumption Latency**: Measures the time from when a message is created to when it is consumed.
    - **Importance**: Indicates the real-time performance of your consumer setup. High consumption latency suggests bottlenecks in message processing.
    - **Impact of Processing Lag**: Any increase in processing lag directly affects consumption latency. If the consumer process is overloaded, jobs will wait longer in the internal queue, increasing consumption lag.

- **Processing Latency**: Measures the time a batch of messages waits before being picked up by a worker.
    - **Importance**: Helps identify internal delays within the consumer process. High processing latency can indicate an overloaded system.
    - **Relation to Consumption Latency**: Increased processing latency will also increase consumption latency, as delays in processing lead to longer overall time in the system.

You will most often focus on consumption latency, as it reflects the overall performance and responsiveness of your consumer setup. Monitoring both consumption and processing latency helps identify and address performance issues, ensuring the efficient operation of your Karafka consumers.

### Configuration Tuning

Tuning consumer configurations in Karafka involves adjusting various settings that impact how messages are consumed and processed. These settings help balance latency, throughput, and resource utilization according to your requirements. Below are the primary settings within the Karafka configuration and important librdkafka-specific settings that you must consider.

!!! Hint "Optimizing Data Fetching"

    Tuning the configurations below helps improve how fast or how much data Karafka can fetch from Kafka in a given time frame, as long as the consumer process is not blocked by processing or other factors. These are the primary ways to control latency and throughput when getting data from Kafka for the Ruby process.

    Further sections also contain information on how to deal with lags caused by the processing phase.

<table>
  <tr>
    <th>Setting</th>
    <th>Description</th>
    <th>Tuning Tips</th>
  </tr>
  <tr>
    <td class="nowrap">
      <code>max_wait_time</code>
    </td>
    <td>Maximum time a consumer will wait for messages before delegating them for processing.</td>
    <td>
      <ul>
        <li>Lower values reduce latency by ensuring they are processed faster.</li>
        <li>Higher values can improve throughput by allowing more messages to accumulate before processing.</li>
        <li>When lowering consider also lowering the <code>fetch.wait.max.ms</code>to at least match it</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td class="nowrap">
      <code>max_messages</code>
    </td>
    <td>Maximum number of messages a consumer processes in a single batch.</td>
    <td>
      <ul>
        <li>Lower values reduce processing latency per batch.</li>
        <li>Higher values can improve throughput but may increase latency and resource usage.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td class="nowrap">
      <code>fetch.wait.max.ms</code>
    </td>
    <td>Maximum time the consumer waits for the broker to fill the fetch request with <code>fetch.min.bytes</code> worth of messages.</td>
    <td>
      <ul>
        <li>Lower values reduce latency by minimizing wait time.</li>
        <li>Higher values can reduce fetch requests, improving throughput by fetching larger batches.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td class="nowrap">
      <code>fetch.min.bytes</code>
    </td>
    <td>Minimum amount of data the broker should return for a fetch request.</td>
    <td>
      <ul>
        <li>Higher values can improve throughput by reducing the number of fetch requests.</li>
        <li>Lower values ensure quicker fetching but might increase the number of requests.</li>
      </ul>
    </td>
  </tr>
    <td class="nowrap">
      <code>fetch.message.max.bytes</code>
    </td>
    <td>Initial maximum number of bytes per topic+partition to request when fetching messages from the broker.</td>
    <td>
      <ul>
        <li>Lower values can help achieve a better mix of topic partitions data, especially in subscription groups subscribed to multiple topics and/or partitions.</li>
        <li>Higher values may be necessary for consuming larger messages but can reduce the mix of data and increase memory usage.</li>
      </ul>
    </td>
  <tr>
    <td class="nowrap">
      <code>fetch.error.backoff.ms</code>
    </td>
    <td>Wait time before retrying a fetch request in case of an error.</td>
    <td>
      <ul>
        <li>Lower values reduce delay in message consumption after an error, helping maintain low latency.</li>
        <li>Avoid excessively low values to prevent frequent retries that could impact performance.</li>
      </ul>
    </td>
  </tr>
  <tr>
    <td class="nowrap">
      <code>enable.partition.eof</code>
    </td>
    <td>Enables the consumer to raise an event when it reaches the end of a partition.</td>
    <td>
      <ul>
        <li>When set to <code>true</code>, Karafka will bypass <code>max_wait_time</code> and <code>max_messages</code>, delegating all available messages for processing each time the end of the partition is reached.</li>
      </ul>
    </td>
  </tr>
</table>

### Parallel Processing

TBA

### Prefetching Messages

TBA

### Efficient Deserialization

TBA

## Troubleshooting Latency Issues

TBA

### Common Problems

TBA

### Diagnostic Techniques

TBA

### Additional Considerations

TBA

## Summary

TBA
