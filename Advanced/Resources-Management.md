This document provides a detailed examination of threading, TCP connection management, memory usage, and CPU utilization in Karafka. It delves into how Karafka manages multiple tasks simultaneously, handles TCP connections efficiently, and optimizes resource usage for Kafka consumers and producers.

## Threading

Karafka's multithreaded nature is one of its strengths, allowing it to manage numerous tasks simultaneously. To understand how it achieves this, it's essential to realize that Karafka's threading model isn't just about worker poll threads. It also extends to other aspects of Karafka's functionality.

### Consumer

Aside from worker threads, each subscription group within a consumer group uses a background thread. These threads handle the polling and scheduling of messages for the assigned topics in the group.

The C `librdkafka` client library, which Karafka uses under the hood, uses `2` to `4` threads per subscription group. This is crucial to remember, as each consumer group added to your application will introduce an additional `3` to `4` threads in total.

The Kafka cluster size can also affect the number of threads since Karafka maintains connections with multiple brokers in a cluster. Therefore, a larger cluster size may result in more threads. A single consumer group Karafka server process in a Ruby on Rails application on a small cluster will have approximately `25` to `30` threads.

This may sound like a lot, but for comparison, Puma, a popular Ruby web server in a similar app, will have around `21` to `25` threads. It's important to note that having a higher thread count in Karafka is perfectly normal. Karafka is designed to handle the complexity of multiple brokers and consumer groups in a Kafka cluster, which inherently requires more threads.

Karafka Pro Web-UI gives you enhanced visibility into your Karafka server processes. This includes the ability to inspect the thread count on a per-process basis. This detailed view can provide invaluable insights, helping you understand how your Karafka server is performing and where any potential bottlenecks might occur.

This visibility and a sound understanding of how Karafka utilizes threads can be a great asset when troubleshooting performance issues or planning for future scalability.

If you are interested in the total number of threads your Karafka servers use, Karafka Pro Web-UI gives you visibility into this value.

This detailed view can provide invaluable insights, helping you understand how your Karafka server is performing and where any potential bottlenecks might occur.

### Producer

In the current implementation, each Karafka producer employs a relatively simple threading model to efficiently handle asynchronous message delivery to Kafka. A vital characteristic of this model is that each producer instantiates at least two additional threads. Here's how these threads function:

- **Ruby Thread**: The first thread operates within the Ruby environment. Its primary role is to manage communication with librdkafka, ensuring that messages are queued and sent to the Kafka cluster efficiently. This thread also handles various events and callbacks that arise during the message delivery process.

- **librdkafka Thread**: The second thread is managed by librdkafka itself, the native library Karafka leverages for interacting with Kafka. This thread is crucial for performing network I/O operations and managing internal events of the Kafka protocol.

- **Broker-Specific Thread**: librdkafka also creates an additional thread for each broker it connects to. This thread is solely responsible for managing communication with that particular broker and handling tasks such as message transfers, acknowledgments, and network events.

Despite adding these threads, the overall impact on system resources is minimal. The threads mostly wait for events or data, meaning their CPU usage is generally low, making this model highly efficient in resource consumption.

## Kafka TCP Connections

Karafka's efficient management of TCP connections is substantially powered by librdkafka. This native library implements a smart connection strategy to optimize network interactions with Kafka brokers, ensuring robustness and efficiency. Below, you can find a general description of how librdkafka deals with both consumer and producer connections. Please refer to the appropriate sub-section for context-specific details.

- **Selective Connections**: librdkafka only attempts to establish TCP connections with brokers necessary for its operation. This includes one of the brokers listed in `bootstrap.servers`, partition leaders, and specific coordinators (group and transaction). This targeted approach helps minimize unnecessary network traffic and optimizes connection management.

- **Bootstrap and Failover Mechanism**: The connection process begins with the `bootstrap.servers`. If the first attempted bootstrap server is unavailable, librdkafka will try the next server in a randomized order. This failover mechanism ensures the client can connect to the cluster even if some brokers are down.

- **Metadata Requests**: Upon establishing the first connection with any broker, librdkafka sends a Metadata request. This request is crucial as it retrieves a complete list of all brokers within the cluster, along with their roles and capabilities.

- **Broker Cache**: After receiving the Metadata response, librdkafka maintains an internal cache of all broker information. This cache includes details like broker node IDs and their roles, enabling librdkafka to intelligently connect directly to the appropriate broker for specific operations like producing or consuming messages.

- **Initial Use of Bootstrap Brokers**: Initially, connections to bootstrap brokers are utilized primarily for fetching Metadata. However, these connections might be repurposed for regular broker interactions under certain conditions.

- **Advertised Listeners**: If the hostname and port of a bootstrap broker match those of a broker from the Metadata response (as specified by the `advertised.listeners` configuration), the connection to this bootstrap broker is then associated with that broker's ID. Subsequently, it is used for full protocol operations, such as message production or consumption.

- **Automatic Reconnection**: librdkafka is designed to automatically attempt reconnecting to brokers if their connections drop but are still required for ongoing operations. This feature is vital for maintaining uninterrupted service even during network issues or broker restarts.

- **Connection Lifecycle Management**: If a broker is no longer needed (e.g., due to a change in partition leadership), librdkafka will not attempt to reconnect, thus optimizing resource usage and connection management.

### Consumer

Karafka uses one librdkafka client per subscription group.

To calculate the estimated TCP usage for a single Karafka consumer process, excluding producer and other TCP connections, use the formula:

```ruby
# Number of effective subscription groups
sub_groups_count = 5

# Number of brokers

brokers_count = 3

# Extra one is for a metadata connection
total = sub_groups_count * (brokers_count + 1)

puts total #=> 20 
```

This accounts for each subscription group's connections to all brokers, plus one additional connection for metadata queries.

### Producer

In Karafka, each producer internally uses a single librdkafka client, which is designed to establish one TCP connection per broker in the Kafka cluster. This architecture implies that a single Karafka producer can potentially open as many TCP connections as brokers in the cluster. This fact becomes particularly important in larger systems or in setups where producers are dynamically created for different topics.

For instance, consider a scenario where a Ruby process is configured to spawn a separate producer for each of `10` different topics. If your Kafka cluster consists of `5` brokers, this configuration would result in each producer maintaining `5` TCP connections — one for each broker. Consequently, the total number of TCP connections in just one Ruby process would be `50` (`10` topics x `5` brokers). When scaled up to `100` processes, this architecture would lead to a staggering total of `5000` TCP connections, which can impact network performance and resource utilization.

Awareness of this potential multiplication of TCP connections is crucial. Systems architects and developers need to consider the implications of such a setup, including the increased overhead on network resources and the complexity of managing a larger number of connections, which can introduce more points of failure and complicate troubleshooting.

To optimize the management of TCP connections and enhance overall system performance, it is advisable to leverage WaterDrop, Karafka's thread-safe producer library. WaterDrop allows for the use of a single producer instance to dispatch messages across multiple topics efficiently. This method reduces the number of TCP connections needed and simplifies the producer management by minimizing the number of producer instances in the system. Adopting this approach is recommended in most scenarios as it provides a more scalable and maintainable architecture, especially in systems where topics and brokers are numerous.

Below, you can find the formula to estimate the TCP usage of your processes cluster in regard to WaterDrop usage:

```ruby
number_of_producers_per_process = 10
number_of_processes = 500
number_of_brokers = 5

total = number_of_producers_per_process * number_of_processes * number_of_brokers

puts total #=> 25 000
``` 

## Database Connections Usage

Karafka, by itself, does not manage PostgreSQL or any other database connections directly. When using frameworks like Ruby on Rails, database connections are typically managed by the [ActiveRecord Connection Pool](https://api.rubyonrails.org/classes/ActiveRecord/ConnectionAdapters/ConnectionPool.html).

Under normal circumstances, Karafka will use the `concurrency` number of database connections at most. This is because, at any given time, that's the maximum number of workers that can run in parallel.

However, the number of potential concurrent database connections might increase when leveraging advanced Karafka APIs, such as the Filtering API, or making alterations to the scheduler and invoking DB requests from it. This is because these APIs operate from the listeners threads. In such advanced scenarios, the maximum number of concurrent DB connections would be the sum of the number of workers (`concurrency`) and the total number of subscription groups.

It's important to note that a situation where all these threads would execute database operations simultaneously is highly unlikely. Therefore, in most use cases, the simplified assumption that only the `concurrency` parameter determines potential DB connections should suffice.

## Memory Usage

Karafka demonstrates robustness and efficiency in managing memory resources, particularly in high-throughput environments. Here are some key aspects of how memory usage is handled within Karafka:

- **Baseline Memory Consumption**: A freshly started Karafka-Rails application has a baseline memory footprint of around `80MB`. This initial consumption provides a starting point for understanding the memory requirements in typical deployment scenarios.

- **No Known Memory Leaks**: Karafka has no known memory leaks within its components as of the latest updates.

- **Batch Processing and Memory Release**: By default, Karafka retains the memory occupied by messages and their payload until an entire batch is processed. Karafka makes no assumptions about the nature of the processing. While this ensures flexibility in handling complex workflows, it can also increase memory usage during high-throughput operations. For those looking to optimize memory management and release message memory more proactively, Karafka Pro offers a [Cleaner API](https://karafka.io/docs/Pro-Cleaner-API/).

- **Ruby Version Considerations**: It's important to note that external factors such as Ruby versions can affect memory usage. For instance, Ruby `3.3.0` has been observed to have memory leak issues due to bugs introduced in that version.

- **Impact of High Throughput**: Karafka's design to handle tens of thousands of messages per second means that any memory leaks in other gems or the application code can be more problematic than in traditional web applications. The high message throughput can quickly escalate minor leaks into significant issues, affecting system stability and performance.

- **Multi-threaded Environment**: Karafka's use of multiple threads to process tasks in parallel can lead to a larger memory footprint than single-threaded applications. Each thread consumes memory for its stack and may duplicate particular objects, leading to higher overall memory usage.

- **Reporting Memory Issues**: No software is entirely free of issues, and memory leaks can occur for various reasons, including interactions with other software components. If you suspect Karafka has a memory leak, you should report this. Such issues are treated with high urgency to ensure that they are resolved promptly, maintaining the high reliability of Karafka for all users.


## CPU Usage

Karafka is designed to efficiently handle high-throughput message processing, leveraging modern CPU architectures to optimize performance. Here are the key aspects of CPU usage in Karafka:

- **Asynchronous Operations**: Karafka employs asynchronous operations wherever possible, using Global VM Lock (GVL) releasing locks rather than standard sleep operations. This approach reduces idle CPU time and maximizes resource usage efficiency, allowing Karafka to perform more operations concurrently without unnecessary delays.

- **Multi-threaded Nature**: The multi-threaded design of Karafka, despite the constraints imposed by the Ruby GVL, enables efficient parallel data processing. This architecture is particularly effective in environments where quick handling of large volumes of data is crucial. By distributing tasks across multiple threads, Karafka can leverage the CPU more effectively.

- **Swarm Mode for Intensive Workloads**: Karafka offers a Swarm mode for CPU-intensive tasks, which spawns multiple processes under a supervisor. This model is designed to fully utilize multiple CPUs or cores, effectively scaling the processing capabilities across the available hardware resources. Swarm mode is especially beneficial for applications requiring significant computational power, as it helps to distribute the load and prevent any single process from becoming a bottleneck.

- **Underlying librdkafka Multithreading**: The librdkafka library, which underpins Karafka's interaction with Kafka, is multi-threaded. It can efficiently utilize multiple cores available on modern machines, enhancing the capability to manage multiple connections and perform various network and I/O operations concurrently.

- **Optimization Opportunities**: Given its multi-threaded nature and efficient asynchronous techniques, Karafka allows for significant optimization opportunities regarding CPU usage. Developers can fine-tune the number of threads and the operational parameters of Karafka to match the specific performance and resource requirements.
