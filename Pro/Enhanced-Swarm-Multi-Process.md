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

Feature under development.

TBA
