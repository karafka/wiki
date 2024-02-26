# Enhanced Swarm / Multi-Process Mode

Karafka's Enhanced Swarm / Multi-Process mode introduces Pro enhancements that extend the capabilities of the standard Swarm Mode, offering advanced features for greater control, efficiency, and reliability in processing Kafka messages. These enhancements cater to enterprise-level needs, where complex and high-volume message processing requires sophisticated management strategies.

This documentation only covers extra functionalities enhancing the Swarm feature.

Please refer to the [Swarm](Swarm-Multi-Process) documentation for more details on its core principles.

## Enhanced Liveness Listener

The Pro Liveness Listener is a significant enhancement in Karafka Pro, designed to ensure the highest system health and efficiency level. This feature goes beyond traditional liveness checks by allowing developers to specify the maximum memory allowed for each node and the criteria for processing and polling liveness. The supervisor will gracefully restart the misbehaving swarm node if a node exceeds memory limits or fails to meet processing or polling criteria.

This listenener provides following benefits:

- **System Stability**: Memory leaks or prolonged processing times can lead to system instability or degradation. The Pro Liveness Listener proactively addresses these issues, ensuring nodes operate within defined parameters.

- **Efficient Resource Utilization**: By monitoring and restarting nodes that exceed memory usage or fail to process or poll efficiently, the system conserves resources and maintains optimal performance.

- **Fault Tolerance**: The ability to automatically identify and restart problematic nodes minimizes the impact of individual node failures on the overall system, enhancing the fault tolerance of the swarm.

This enhancement is crucial for maintaining a high-performance Kafka processing environment, especially in scenarios with stringent resource constraints or high throughput requirements.

To use the Enhanced Liveness Listener in your Karafka application, you need to subscribe to the listener within your `karafka.rb` configuration file:

### Usage

```ruby
# Put this at the end of karafka.rb
Karafka.monitor.subscribe(
  Karafka::Pro::Swarm::LivenessListener.new(
    memory_limit: 2048, # Memory limit in MB (e.g., 10GB)
    consuming_ttl: 5 * 60 * 1_000, # 5 minutes in ms
    polling_ttl: 5 * 60 * 1_000 # 5 minutes in ms
  )
)
```

Once the listener subscribes, it will actively report any abnormalities to the supervisor.

### Configuration Parameters

The Enhanced Liveness Listener accepts several parameters to customize its behavior. Here’s a table outlining the arguments, their expected types, default values, and descriptions:

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Expected Type</th>
      <th>Default</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>memory_limit</code></td>
      <td>Integer</td>
      <td>nil</td>
      <td>Max memory in MB for a process to be considered healthy. Set to <code>nil</code> to disable monitoring.</td>
    </tr>
    <tr>
      <td><code>consuming_ttl</code></td>
      <td>Integer</td>
      <td>Matches <code>max.poll.interval.ms</code></td>
      <td>Time in ms to consider consumption hanging. Defines the max consumption time after which the supervisor should consider a process as hanging.</td>
    </tr>
    <tr>
      <td><code>polling_ttl</code></td>
      <td>Integer</td>
      <td>Matches <code>max.poll.interval.ms</code></td>
      <td>Max time in ms for polling. If polling does not happen often enough, the process will be considered dead.</td>
    </tr>
  </tbody>
</table>

### Failure Statuses

The listener reports to the supervisor the following failure statuses for monitored conditions:

<table>
  <tr>
    <th>Status Code</th>
    <th>Description</th>
  </tr>
  <tr>
    <td>1</td>
    <td>Node reported insufficient polling from Kafka (Pro only).</td>
  </tr>
  <tr>
    <td>2</td>
    <td>Consumer is consuming a batch longer than expected (Pro only).</td>
  </tr>
  <tr>
    <td>3</td>
    <td>Node exceeded the allocated memory limit (Pro only).</td>
  </tr>
</table>

## Node Assignments

The Node Assignments feature in Karafka's Enhanced Swarm / Multi-Process Mode addresses the need for more granular control over topic processing across different nodes within the swarm. By default, Karafka Swarm assigns all topics to all nodes uniformly. This means each node attempts to connect to and subscribe to the same set of topics. This approach ensures that the processing load is distributed across all available nodes, providing a balanced workload under typical conditions. However, this can lead to inefficiencies in specific scenarios.

Granular control over node assignments becomes crucial when topics have varying loads, message volumes, or numbers of partitions. 

Allocating specific topics to specific nodes allows for more efficient resource utilization and can significantly enhance performance by:

- **Aligning Resource Allocation**: Directing high-volume topics to nodes with more processing power or assigning them exclusively can prevent bottlenecks and ensure smoother processing across the swarm.

- **Optimizing for Partitions**: Topics with different numbers of partitions may benefit from being processed by a specific subset of nodes, enabling more effective load balancing and reducing cross-node communication overhead.

- **Improving Performance**: Tailoring node assignments can help optimize the processing time by ensuring that nodes are not overwhelmed by attempting to subscribe and process messages from topics that are too resource-intensive for their capacity.

In Karafka, configuring node assignments is straightforward within the routing setup, utilizing the `#swarm` method to direct topic subscriptions to specified nodes. Nodes are indexed starting at `0`, allowing for individual or ranges of nodes to be targeted. Without explicit assignments, topics default to being accessible by all nodes. Below is a configuration example to demonstrate node assignment usage:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
    # Run 8 processes
    config.swarm.nodes = 8
  end

  routes.draw do
    consumer_group :group_name do
      topic :example do
        swarm(nodes: [0, 1, 2])
        consumer ExampleConsumer
      end

      topic :example2 do
        swarm(nodes: 4..7)
        consumer ExampleConsumer2
      end
    end

    consumer_group :group_name2 do
      topic :example3 do
        consumer Example2Consumer3
      end
    end
  end
end
```
