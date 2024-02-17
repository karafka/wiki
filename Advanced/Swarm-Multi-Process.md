# Swarm / Multi Process Mode

## Introduction

Karafka's Swarm Mode allows for the efficient CPU-intensive processing of Kafka messages in Ruby. It circumvents Ruby's Global Interpreter Lock (GIL) limitations by utilizing a multi-process architecture, allowing for parallel execution similar to libraries like Puma and Sidekiq Enterprise. This mode is particularly beneficial for CPU-intensive workloads, leveraging Ruby's Copy-On-Write (CoW) feature for memory efficiency. While Karafka's multi-threading excels in I/O-bound tasks, Swarm Mode offers a superior alternative for tasks demanding significant CPU resources, providing scalable and high-performance message processing capabilities.

### Overview of Karafka Swarm Mode

Karafka's Swarm Mode is based on the "Supervisor-Worker" architectural pattern. It utilizes a controller process for supervision and multiple independent child processes for parallel execution. This setup enhances Kafka message processing for CPU-intensive tasks by leveraging multi-process execution. Each child process periodically reports its status to the supervisory master, ensuring system health and efficiency.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/swarm/architecture.svg" />
</p>
<p align="center">
  <small>*This example illustrates the relationship between the supervisor and the nodes.
  </small>
</p>

### Benefits of using Swarm Mode

Swarm Mode in Karafka brings several advantages, especially for applications dealing with high volumes of data or requiring intensive computation. Here are ten benefits that highlight the importance and efficiency of using Swarm Mode:

- **Improved CPU Utilization**: By running multiple processes, Swarm Mode can fully utilize multi-core systems, ensuring CPU resources are maximally exploited for increased processing power.

- **Scalability**: Easily scales your application to handle more load by increasing the number of worker processes, allowing for flexible adaptation to varying workloads.

- **Concurrency**: Achieves true concurrency in Ruby applications, sidestepping the Global Interpreter Lock (GIL) limitations using multiple processes instead of threads.

- **Efficiency in CPU-bound Tasks**: Ideal for CPU-intensive operations, as it allows for parallel execution of tasks that would otherwise be bottlenecked by single-threaded execution.

- **Memory Efficiency**: Leverages Ruby's Copy-On-Write (CoW) feature, which means the memory footprint increases only marginally with each additional processing node, making it memory efficient.

- **Robustness and Isolation**: Each worker process is isolated; a failure in one worker does not directly impact others, enhancing the overall robustness of the application.

- **Load Distribution**: Allows for efficient workload distribution across multiple processes, ensuring that no single process becomes a bottleneck, leading to more consistent performance.

- **Enhanced Fault Tolerance**: The supervisor process can monitor worker health, automatically restarting failed workers, thus ensuring the system remains resilient to individual process failures.

- **Flexible Workload Management**: The ability to fine-tune the system based on specific workload requirements, optimizing performance through configuration adjustments without changing the application code.

- **Simplified Complex Processing**: Facilitates the management of complex processing pipelines by distributing tasks across nodes, making it easier to reason about and maintain large-scale processing logic.

- **Proactive Memory Management**: In Karafka Pro, the supervisor can monitor and control the memory usage of child processes. This feature allows it to shut down workers exceeding a specified memory threshold gracefully. While this is not a substitute for addressing memory leaks within the application, it is a crucial interim measure to manage and mitigate potential memory-related issues.

## Supported Operating Systems

When leveraging Karafka's Swarm Mode for your application, it's crucial to understand the operating system compatibility, mainly due to specific API dependencies. Swarm Mode's efficient process management and supervision rely heavily on the Pidfd API, a feature that is inherently tied to the Linux operating system.

The Pidfd API provides a more reliable mechanism for process management by allowing the creation of process file descriptors. This feature significantly enhances the ability of the supervisor process in Swarm Mode to monitor, control, and manage worker processes without the typical race conditions associated with traditional PID-based management.

However, using the Pidfd API comes with a specific requirement: it is only available on Linux operating systems with a kernel version that supports Pidfd. To utilize Karafka's Swarm Mode, your Linux system must run a kernel version that supports the Pidfd API. This functionality was introduced in the Linux kernel 5.3 and has seen gradual improvements and enhancements in subsequent releases. Therefore, ensuring your system operates on Linux kernel 5.3 or later is essential for leveraging all the benefits of Swarm Mode.

!!! Abstract "Linux Kernel 5.3+ Requirement for Karafka Swarm Mode due to Pidfd API Dependency"

    Karafka's Swarm Mode requires a Linux OS with kernel version 5.3 or later due to its reliance on the Pidfd API for advanced process management. This ensures efficient and reliable supervision of worker processes in Swarm Mode, exclusive to Linux environments compatible with Pidfd.

## Getting Started with Swarm Mode

TBA

## Configuration and Tuning

TBA

## Process Management and Supervision

TBA

### Supervision Strategies

TBA

### Handling Process Failures

TBA

### Limitations of Forking

TBA

### Preloading for Efficiency

TBA

## Instrumentation, Monitoring, and Logging

TBA

- Mention K8s instrumentation
- Update and reference from K8s deployment instrumentation

## Signal Handling

TBA

## Operational Behavior

TBA

### Behavior on Shutdown

TBA

### Nodes Shutdown and Recovery

TBA

## Resources Management

TBA

- Mention that static group memberships work

## Web UI Enhancements for Swarm

TBA

## Swarm vs. Multi-Threading and Virtual Partitions

TBA

## Summary

TBA
