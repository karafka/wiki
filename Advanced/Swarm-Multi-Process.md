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

Swarm Mode in Karafka brings several advantages, especially for applications dealing with high volumes of data or requiring intensive computation. Here are some benefits that highlight the importance and efficiency of using Swarm Mode:

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

The startup command deviates slightly from the traditional server start command to activate Swarm Mode. Instead of starting your Karafka application with the usual `bundle exec karafka server`, you will invoke Swarm Mode using:

```
bundle exec karafka swarm
```

This command signals Karafka to initiate in Swarm Mode, creating a supervisor process and the forked nodes.

## Configuration and Tuning

Configuring and tuning your Karafka application for optimal performance in Swarm Mode involves setting up the correct number of worker processes (nodes) and optionally altering other settings. This setup is crucial for efficiently handling messages, especially in high-throughput or CPU-intensive environments.

During your Karafka application setup, you can specify the Swarm Mode configuration as part of the setup block. This includes defining the number of worker processes that should be forked:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other settings...

    # Configure the number of worker processes for Swarm Mode
    config.swarm.nodes = 5
  end
end
```

In this example, `config.swarm.nodes = 5` instructs Karafka to operate in Swarm Mode with `5` worker processes, allowing for parallel message processing across multiple CPU cores.

When deciding on the number of nodes (worker processes) to configure, consider the following guidelines:

- **CPU/Cores**: Aim to align the number of worker processes with the number of CPU cores available. This ensures that each process can run on its core, maximizing parallelism and reducing context switching overhead. For example, if your server has 8 CPU cores, configuring `config.swarm.nodes = 8` might be optimal.

- **Memory Availability**: Worker processes initially share the same memory space (thanks to Ruby's Copy-On-Write mechanism) but will gradually consume more memory as they diverge in their execution paths. Ensure your system has enough memory to support the cumulative memory footprint of all worker processes. Monitor memory usage under load to find a balance that prevents swapping while maximizing utilization of available CPUs.

- **Workload Characteristics**: Consider the nature of your workload. CPU-bound tasks benefit from a process-per-core model, whereas I/O-bound tasks might not require as many processes as they often wait on external resources (e.g., network or disk).

Below, you can find a few tuning hints worth considering if you strive to achieve optimal performance:

- **Monitor and Adjust**: Performance tuning is an iterative process. Monitor key metrics such as CPU utilization, memory consumption, and message processing latency. Adjust the number of worker processes based on observed performance and system constraints.

- **Balance with Kafka Partitions**: Ensure that the number of worker processes aligns with the number of partitions in your Kafka topics to avoid idle workers and ensure even load distribution.

- **Consider System Overheads**: Leave headroom for the operating system and other applications. Overcommitting resources to Karafka can lead to contention and degraded performance across the system.

By carefully configuring and tuning the number of worker processes with your system's CPU and memory resources and the specific demands of your workload, you can achieve a highly efficient and scalable Kafka processing environment with Karafka's Swarm Mode.

## Process Management and Supervision

In Swarm Mode, Karafka introduces a supervisor process responsible for forking child nodes and overseeing their operation. This section outlines the key aspects of process management and supervision within this architecture, covering supervision strategies, handling process failures, the limitations of forking, and efficiency through preloading.

### Supervision Strategies

In Karafka's Swarm Mode, the supervision of child nodes is a critical component in ensuring the reliability and resilience of the message processing. By design, the supervisor process employs a proactive strategy to monitor the health of each child node. A vital aspect of this strategy involves each child node periodically reporting its health status to the supervisor, independent of its current processing activities.

Child nodes are configured to send health signals to the supervisor every 10 seconds. This regular check-in is designed to occur seamlessly alongside ongoing message processing and data polling activities, ensuring that the supervision mechanism does not interrupt or degrade the performance of the message handling workflow. The health signal may include vital statistics and status indicators that allow the supervisor to assess whether a child node is functioning optimally or if intervention is required.

The effectiveness of the health reporting mechanism is subject to a critical configuration parameter: `config.max_wait_time`. This setting determines the maximum time Karafka will wait for new data. If this value is set close to or more than `config.internal.swarm.node_report_timeout` (60 seconds by default), nodes may not have a chance to report their health frequently enough.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other settings...

    # If you want to have really long wait times
    config.max_wait_time = 60_000

    # Make sure node_report_timeout is aligned
    config.internal.swarm.node_report_timeout = 120_000
  end
end
```

!!! Abstract "Health Checks vs. `max_wait_time`"

    In Swarm Mode, ensure `max_wait_time` doesn't exceed the `node_report_timeout` interval (default 60 seconds). Setting it too high could prevent nodes from reporting their health promptly, affecting system monitoring and stability.

Two scenarios may necessitate shutting down a node:

1. **Extended Health Reporting Delays**: If a child node fails to report its health status within the expected timeframe, the supervisor interprets this as the node being unresponsive or "hanging". This situation triggers a protective mechanism to prevent potential system degradation or deadlock.

1. **Unhealthy Status Reports (Karafka Pro)**: With the enhanced capabilities of Karafka Pro, nodes possess the self-awareness to report unhealthy states. This can range from excessive memory consumption and prolonged processing times to polling mechanisms becoming unresponsive. Recognizing these reports, the supervisor takes decisive action to address the compromised node.

Upon identifying a node that requires a shutdown, either due to delayed health reports or self-reported unhealthy conditions, the supervisor initiates a two-step process:

- **TERM Signal**: The supervisor first sends a TERM signal to the node, initiating a graceful shutdown sequence. This allows the node to complete its current tasks, release resources, and shut down properly, minimizing potential data loss or corruption.

- **KILL Signal**: If the node fails to shut down within the specified `shutdown_timeout` period, the supervisor escalates its intervention by sending a KILL signal. This forcefully terminates the node, ensuring the system can recover from the situation but at the risk of abrupt process termination.

Following a node's shutdown - graceful or forceful - Karafka imposes a mandatory delay of at least 5 seconds before attempting to restart the node. This deliberate pause serves a crucial purpose:

- **Preventing System Overload**: By waiting before restarting a node, Karafka mitigates the risk of entering a rapid, endless loop of immediate process death and restart. Such scenarios can arise from external factors that instantaneously cause a newly spawned process to fail. The delay ensures that the system has a brief period to stabilize, assess the environment, and apply any necessary corrections before reintroducing the node into the swarm.

- **System Health Preservation**: This pause also provides a buffer for the overall system to manage resource reallocation, clear potential bottlenecks, and ensure that restarting the node is conducive to maintaining system health and processing efficiency.

Karafka's Swarm Mode ensures robust process management through these meticulous supervision strategies, promoting system stability and resilience.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/swarm/supervisor-flow.svg" />
</p>
<p align="center">
  <small>*Diagram illustrating flow of supervision of a swarm node.
  </small>
</p>

### Limitations of Forking

Despite its benefits for CPU-bound tasks, forking has several limitations, especially in the context of I/O-bound operations and broader system architecture:

- **Memory Overhead**: Initially, forking benefits from Ruby's Copy-On-Write (CoW) mechanism, which keeps the memory footprint low. However, as child processes modify their memory, the shared memory advantage may diminish, potentially leading to increased memory usage.

- **I/O Bound Operations**: Forking is less effective for I/O-bound tasks because these tasks spend a significant portion of their time waiting on external resources (e.g., network or disk). In such cases, Karafka multi-threading and Virtual Partitions may be more efficient as they can handle multiple I/O operations in a single process.

- **Database Connection Pooling**: Each forked process requires its database connections. This can rapidly increase the number of database connections, potentially exhausting the available pool and leading to scalability issues.

- **File Descriptor Limits**: Forking multiple processes increases the number of open file descriptors, which can hit the system limit, affecting the application's ability to open new files or establish network connections.

- **Startup Time**: Forking can increase the application's startup time, especially if the initial process needs to load a significant amount of application logic or data into memory before forking.

- **Debugging and Monitoring Complexity**: Debugging issues or monitoring the performance of applications using the forking model can be more challenging due to multiple processes requiring more sophisticated tooling and approaches.

- **Separate Kafka Connections**: Each forked process in a Karafka application is treated by Kafka as an individual client. This means every process maintains its connection to Kafka, increasing the total number of connections to the Kafka cluster.

- **Independent Partition Assignments**: In Kafka, partitions of a topic are distributed among all consumers in a consumer group. With each forked process treated as a separate consumer, Kafka assigns partitions to each process independently. This behavior can lead to uneven workload distribution, especially if the number of processes significantly exceeds the number of partitions or if the partitioning does not align well with the data's processing requirements.

- **Consumer Group Rebalancing**: Kafka uses consumer groups to manage which consumers are responsible for which partitions. When processes are forked, each one is considered a new consumer, triggering consumer group rebalances. Frequent rebalances can lead to significant overhead, especially in dynamic environments where processes are regularly started or stopped. Rebalancing pauses message consumption, as the group must agree on the new partition assignment, leading to potential delays in message processing.

While forking enables Ruby applications like Karafka to parallelize work efficiently, these limitations highlight the importance of careful architectural consideration, especially when dealing with I/O-bound operations or scaling to handle high concurrency and resource utilization levels.

### Warmup and Preloading for Efficiency

Preloading in the Swarm Mode, akin to Puma and Sidekiq Enterprise practices, offers substantial memory savings. By loading the application environment and dependencies before forking, Karafka can significantly reduce memory usage - 20-30% savings are common. However, this feature requires carefully managing resources inherited by child processes, such as file descriptors, network connections, and threads.

When the supervisor process forks a worker, the child inherits open file descriptors and potentially other resources like network connections. Inherited resources can cause unexpected behavior or resource leaks if not properly managed. To address this, Karafka, similar to Puma, provides hooks that allow for resource cleanup and reinitialization before and after forking:

!!! Tip "Automatic Reconfiguration of Karafka Internals Post-Fork"

    All Karafka internal components, including the Karafka producer, will be automatically reconfigured post-fork, eliminating the need for manual reinitialization of these elements. Focus solely on reconfiguring any external components or connections your application relies on, such as databases or APIs, as these are not automatically reset. This automatic reconfiguration ensures that Karafka internals are immediately ready for use in each forked process, streamlining multi-process management.

```ruby
# At the end of karafka.rb

# This will run in each forked node right after it was forked
Karafka.monitor.subscribe('swarm.node.after_fork') do
  # Make sure to re-establish all connections to the DB after fork (if any)
  ActiveRecord::Base.clear_active_connections!
end
```

Below, you can find a few examples of resources worth preparing and cleaning before forking:

- **Database Connections**: Re-establish database connections to prevent sharing connections between processes, which could lead to locking issues or other concurrency problems. For ActiveRecord, this typically involves calling ActiveRecord::Base.establish_connection.

- **Thread Cleanup**: If the preloaded application spawns threads, ensure they are stopped or re-initialized post-fork to avoid sharing thread execution contexts.

- **Closing Unneeded File Descriptors**: Explicitly close or reopen file descriptors that shouldn't be shared across processes to avoid leaks and ensure the independent operation of each process.

Given the potential complexities and dangers associated with preloading the entire application, Karafka makes this feature opt-in. This cautious approach enables developers to enable preloading when effectively managing the related resources.

In addition to preloading for substantial memory savings, Karafka introduces a crucial phase known as "Process Warmup" right before the process starts. It occurs only in the supervisor. This phase is designed to optimize the application's readiness for forking and operation, leveraging Ruby 3.3's `Process.warmup` feature and similar techniques in previous Ruby versions. This method signals Ruby that the application has completed booting and is now ready for forking, triggering actions such as garbage collection and memory compaction to enhance the efficiency of Copy-On-Write (CoW) mechanics in child forks.

Before the warmup phase, Karafka emits a `process.before_warmup` notification, providing an ideal opportunity to eager load the application code and perform other preparatory tasks. This hook is pivotal for loading any code that benefits from being loaded once and shared across forks, thereby reducing memory usage and startup time for each child process.

```ruby
# At the end of karafka.rb

Karafka.monitor.subscribe('process.before_warmup') do
  # Eager load the application code and other heavy resources here
  # This code will run only once in supervisor before the final warmup
  Rails.application.eager_load!
end
```

The `Process.warmup` method and `process.before_warmup` hook collectively ensure that your Karafka application is optimized for multi-process environments. By utilizing these features, you can significantly reduce the memory footprint of your applications and streamline process management, especially in environments where memory efficiency and quick scaling are paramount.

By carefully preparing for and executing the warmup phase, you ensure your Karafka applications operates optimally, benefiting from reduced memory usage and enhanced process initialization performance.

## Instrumentation, Monitoring, and Logging

TBA

- Mention K8s instrumentation
- Update and reference from K8s deployment instrumentation

## Signal Handling

TBA

### Behavior on Shutdown

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
