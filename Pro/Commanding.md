Karafka Pro offers powerful capabilities for directly managing consumer processes. These management features, accessible via the Web UI, allow administrators to interact with the consumer processes in real time to maintain optimal performance and address issues swiftly. Commanding includes probing consumers for detailed state information, quieting consumers to reduce activity, and stopping them when necessary.

## Configuration

Commanding is **turned on by default**. During each consumer process startup, it initiates a special "invisible" connection to Kafka. This connection is used exclusively for administrative commands that can be executed from the Web UI, such as stopping, quieting, and probing consumers for backtraces.

To disable this feature, you can set the `config.commanding.active` configuration option to `false`. Disabling commanding removes the extra Kafka connection dedicated to these administrative tasks. Consequently, it also disables the ability to execute these commands from the Web UI.

```ruby
# Completely disable commanding from Web UI
Karafka::Web.setup do |config|
  # Other config options...

  # Set this to false to disable commanding completely
  config.commanding.active = false
end

Karafka::Web.enable!
```

Opting out of commanding is recommended for environments where direct consumer manipulation via the Web UI is either not needed or could pose a risk to the stability or security of Kafka operations. This configuration adjustment is particularly relevant in tightly controlled environments where changes to consumer behavior should be managed through more rigorous operational workflows.

## Controls and Commands

The commanding functionality within the Karafka Pro Web UI is organized into two distinct tabs: "Controls" and "Commands." These tabs provide a centralized interface for managing consumer processes, making it easier for administrators to perform and track administrative actions directly from the Web UI.

Warning 7 days retentin

### Controls Tab

The "Controls" tab is primarily focused on direct consumer process management. It presents a comprehensive list of all consumer processes currently active within the system. Each listed process is accompanied by detailed information, including its current state, performance metrics, and any other relevant operational data that can help assess the process's health and activity.

Alongside these details, the "Controls" tab also provides actionable commands that can be issued for each consumer process. These commands include options such as:

- **Probing**: Requesting backtraces and other runtime information from the consumer to diagnose issues or assess performance.

- **Quieting**: Reducing the consumer's activity level to manage load or prepare for maintenance without stopping the process entirely.

- **Stopping**: Completely halting a consumer process for scenarios like system upgrades, bug fixes, or decommissioning.

This tab serves as the operational center for managing consumers, allowing administrators to apply commands individually or in bulk, depending on the situation.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-commanding-controls.png" />
</p>

### Commands Tab

The "Commands" tab offers a historical view of the commands issued through the Web UI and results received from the consumer processes. This tab lists recent commands along with detailed outcomes, such as the success or failure of each command and the diagnostic data returned from probing actions.

The functionality of the "Commands" tab is crucial for several reasons:

- **Tracking and Auditing**: It provides a log of all commands issued, which is essential for auditing and tracking the administrative actions taken over time.

- **Result Verification**: Administrators can verify the outcomes of issued commands, particularly the backtraces and diagnostic information returned by probing commands. This helps confirm diagnostic efforts' effectiveness and understand consumer processes' current state.

**Historical Analysis**: This tab records past commands and their results, aiding in identifying trends or recurring issues across consumer processes. This information can inform future improvements or adjustments in system configuration.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-commanding-commands.png" />
</p>

## Probing

Probing is a diagnostic feature that allows administrators to request backtraces from active consumer processes. This command is useful for identifying the internal state and tracing the execution path of a consumer at any given moment without stopping or disrupting its operations. By invoking the probing command via the Web UI, administrators can gain insights into the call stack and other runtime details, which are crucial for debugging complex issues in consumer behavior.

A special command message is dispatched to the targeted consumer when the "Probe" button is pressed in the Web UI. Upon receiving this message, the consumer iterates over all Ruby threads currently running within the process and records the backtrace of each thread. These backtraces provide a snapshot of the execution stack for each thread, which can be invaluable for debugging and understanding the consumer's behavior at a particular moment. After collecting the backtraces, the consumer compiles these into a special result message that is published back to Kafka. This result message is accessible for inspection, providing real-time diagnostic information about the consumer's state.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-commanding-probe.png" />
</p>

### Use Cases

1. **Debugging Deadlocks**: Identifying and resolving thread deadlocks, where two or more threads are waiting on each other to release resources.

1. **Performance Bottlenecks**: Diagnosing performance issues by understanding which threads are consuming most resources or are stuck in long-running operations.

1. **Unexpected Delays**: Investigating unexplained delays in message processing, potentially caused by external API calls or resource locking.

1. **Error Reproduction**: Capturing the exact state of a consumer when an intermittent or hard-to-reproduce error occurs, aiding in debugging.

1. **Optimization**: Analyzing thread states for potential optimizations in how resources are utilized, or operations are conducted.

1. **Training and Learning**: Educating new developers or operators about the internal workings of a consumer by showing real-time thread activities and states.

## Quieting

Quieting is a command designed to gracefully reduce the activity of a consumer process. When a quiet command is issued, the consumer stops accepting new jobs or batches but continues to process any currently active tasks. This feature is particularly useful during deployments or when a controlled slowdown in consumer activities is required. Quieting ensures that ongoing processing completes successfully while preventing new work from being started, aiding in smooth transitions and system maintenance without abrupt interruptions.

!!! Tip "Stability Through Quiet State"

    Moving to and staying in a quiet state means that no rebalance will be triggered. Although the consumer will not process new messages, it will not relinquish its assignments, maintaining its position within the consumer group.

### Use Cases

1. **Deployment Updates**: Reducing consumer activity before deploying updates or patches ensures a smooth transition and reduces the risk of data loss or errors during application updates.

1. **System Maintenance**: Temporarily reduce the load on the system during maintenance activities like hardware upgrades or network changes to maintain overall system stability.

1. **Performance Diagnostics**: Isolating performance issues without stopping the consumer entirely, allowing for live monitoring and troubleshooting while minimizing impact on overall operations.

1. **Error Containment**: In case of an identified error affecting a consumer's tasks, quieting allows the consumer to finish current tasks without accepting new potentially compromised work containing the error.

1. **Incremental Upgrades**: Gradually upgrading consumers in a system without causing a full rebalance or downtime, by quieting certain consumers at a time while others take over the processing load.

1. **Controlled Shutdowns**: Preparing consumers for a controlled shutdown by quieting them to complete the processing of current messages while not picking up new ones, ensuring data integrity and smooth restarts.

## Stopping

The stopping command is used to halt a consumer process entirely. This command should be used with caution as it stops all processing activities after `shutdown_timeout` is reached. Stopping is typically employed when a consumer needs to be taken offline for upgrades, troubleshooting, or when decommissioning is required. Once stopped, a consumer process will need to be manually restarted, and it will resume from the last committed offset in Kafka, ensuring no loss of data but requiring careful management to avoid processing delays or other operational impacts.

!!! Warning "Topics and Partitions Reassignment"

    When a consumer is stopped, its assignments are redistributed among the remaining active consumers in the group, ensuring that message processing continues seamlessly without interruption.

### Use Cases

1. **Emergency Shutdown**: Quickly shutting down a consumer that is causing severe problems, such as data corruption or excessive resource consumption, to prevent further damage to the system.

1. **System Overhaul**: Stopping consumers completely to allow for major system upgrades or reconfigurations that require a complete halt of data processing activities.

1. **Decommissioning Nodes**: Stopping consumers on specific nodes that are being decommissioned or replaced, ensuring that these nodes no longer participate in processing.

1. **Bug Fixes**: Halting a consumer to apply critical bug fixes that cannot be addressed while the consumer is running, ensuring the integrity of the fix deployment.

1. **Resource Reallocation**: Stopping a consumer to reallocate resources such as memory and CPU to other critical applications, especially in resource-constrained environments.

1. **Testing Failover**: Stopping consumers to test the resilience and failover capabilities of the system, ensuring that other consumers or nodes can take over smoothly.

1. **Performance Benchmarking**: Temporarily stopping consumers from performing clean-slate performance benchmarking without background noise from ongoing data processing.

## Summary

Karafka Pro's commanding capabilities are essential for any organization looking to leverage Kafka for real-time data processing and streaming. They provide the necessary controls to manage consumer behavior effectively, ensuring that Kafka clusters are performant but also resilient and secure under various operating conditions.
