# Consumers Control

Karafka offers capabilities for controlling and managing consumers at both process and partition levels. These management features, accessible via the Web UI, allow administrators to interact with consumer processes in real-time to maintain optimal performance and address issues.

## Process-Level Control

Process-level commanding includes tracing consumers for detailed state information, quieting consumers to reduce activity, and stopping them when necessary.

!!! tip "Quiet and Stop Commands Limitation"

    Quiet and Stop commands do not function with Karafka processes operating in [Embedded](Embedding) or [Swarm](Swarm-Multi-Process) mode. This limitation arises because, in these modes, the Karafka process itself is not directly responsible for its state management.

### Configuration

Commanding is **turned on by default**. During each consumer process startup, it initiates a special "invisible" connection to Kafka. This connection is used exclusively for administrative commands that can be executed from the Web UI, such as stopping, quieting, and tracing consumers for backtraces.

To turn off this feature, you can set the `config.commanding.active` configuration option to `false`. Disabling commanding removes the extra Kafka connection dedicated to these administrative tasks. Consequently, it also disables the ability to execute these commands from the Web UI.

!!! warning "Commands Topic Required"

    The commanding feature requires the `karafka_consumers_commands` topic to be present in your Kafka cluster. If this topic is missing, the Web UI will display an alert notifying you that pause, resume, and trace functionality is unavailable. Ensure this topic exists and is properly configured before attempting to use commanding features.

```ruby
# Completely disable commanding from Web UI
Karafka::Web.setup do |config|
  # Other config options...

  # Set this to false to disable commanding completely
  config.commanding.active = false
end

Karafka::Web.enable!
```

Opting out of commanding is recommended for environments where direct consumer manipulation via the Web UI is either unnecessary or could pose a risk to the stability or security of Kafka operations. This configuration adjustment is particularly relevant in tightly controlled environments where changes to consumer behavior should be managed through more rigorous operational workflows.

### Controls and Commands

The commanding functionality within the Web UI is organized into two distinct tabs: "Controls" and "Commands." These tabs provide a centralized interface for managing consumer processes, making it easier for administrators to perform and track administrative actions directly from the Web UI.

!!! info

    Commands issued through the Web UI are retained in Kafka for a default period of 7 days. After this duration, these commands are automatically removed from the system. This automatic cleanup helps manage the storage and maintain efficiency within Kafka without manual intervention.

#### Controls Tab

The "Controls" tab is primarily focused on direct consumer process management. It presents a list of all consumer processes currently active within the system. Each listed process is accompanied by detailed information, including its current state, performance metrics, and any other relevant operational data that can help assess the process's health and activity.

Alongside these details, the "Controls" tab also provides actionable commands that can be issued for each consumer process. These commands include options such as:

- **Tracing**: Requesting backtraces and other runtime information from the consumer to diagnose issues or assess performance.
- **Quieting**: Reducing the consumer's activity level to manage load or prepare for maintenance without stopping the process entirely.
- **Stopping**: Completely halting a consumer process for scenarios like system upgrades, bug fixes, or decommissioning.

This tab serves as the operational center for managing consumers, allowing administrators to apply commands individually or in bulk, depending on the situation.

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui/pro-commanding-controls.png" />
</p>

#### Commands Tab

The "Commands" tab offers a historical view of the commands issued through the Web UI and results received from the consumer processes. This tab lists recent commands along with detailed outcomes, such as the success or failure of each command and the diagnostic data returned from tracing actions.

The functionality of the "Commands" tab is crucial for several reasons:

- **Tracking and Auditing**: It provides a log of all commands issued, which is essential for auditing and tracking the administrative actions taken over time.
- **Result Verification**: Administrators can verify the outcomes of issued commands, particularly the backtraces and diagnostic information returned by the tracing command. This helps confirm diagnostic efforts' effectiveness and understand consumer processes' current state.
- **Historical Analysis**: This tab records past commands and their results, aiding in identifying trends or recurring issues across consumer processes. This information can inform future improvements or adjustments in system configuration.

Each command in the Commands tab progresses through multiple states in its lifecycle:

1. **Request**: Initial command issued by the Web UI
2. **Acceptance**: Confirmation that the consumer process has received the command, but it is one that may not be immediately executed
3. **Result**: Final outcome of the command execution

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui/pro-commanding-commands.png" />
</p>

### Tracing

Tracing is a diagnostic feature that allows administrators to request backtraces from active consumer processes. This command is useful for identifying the internal state and tracing the execution path of a consumer at any given moment without stopping or disrupting its operations. By invoking the tracing command via the Web UI, administrators can gain insights into the call stack and other runtime details, which are crucial for debugging complex issues in consumer behavior.

A special command message is dispatched to the targeted consumer when the "Trace" button is pressed in the Web UI. Upon receiving this message, the consumer iterates over all Ruby threads currently running within the process and records the backtrace of each thread. These backtraces provide a snapshot of the execution stack for each thread, which can be invaluable for debugging and understanding the consumer's behavior at a particular moment. After collecting the backtraces, the consumer compiles these into a special result message that is published back to Kafka. This result message is accessible for inspection, providing real-time diagnostic information about the consumer's state.

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui/pro-commanding-trace.png" />
</p>

#### Use Cases

1. **Debugging Deadlocks**: Identifying and resolving thread deadlocks, where two or more threads are waiting on each other to release resources.
2. **Performance Bottlenecks**: Diagnosing performance issues by understanding which threads are consuming most resources or are stuck in long-running operations.
3. **Unexpected Delays**: Investigating unexplained delays in message processing, potentially caused by external API calls or resource locking.
4. **Error Reproduction**: Capturing the exact state of a consumer when an intermittent or hard-to-reproduce error occurs, aiding in debugging.
5. **Optimization**: Analyzing thread states for potential optimizations in how resources are utilized, or operations are conducted.
6. **Training and Learning**: Educating new developers or operators about the internal workings of a consumer by showing real-time thread activities and states.

### Quieting

Quieting is a command designed to gracefully reduce the activity of a consumer process. When a quiet command is issued, the consumer stops accepting new jobs or batches but continues to process any currently active tasks. This feature is particularly useful during deployments or when a controlled slowdown in consumer activities is required. Quieting ensures that ongoing processing completes successfully while preventing new work from being started, aiding in smooth transitions and system maintenance without abrupt interruptions.

!!! tip "Stability Through Quiet State"
    Moving to and staying in a quiet state means that no rebalance will be triggered. Although the consumer will not process new messages, it will not relinquish its assignments, maintaining its position within the consumer group.

#### Use Cases

1. **Deployment Updates**: Reducing consumer activity before deploying updates or patches ensures a smooth transition and reduces the risk of data loss or errors during application updates.
2. **System Maintenance**: Temporarily reduce the load on the system during maintenance activities like hardware upgrades or network changes to maintain overall system stability.
3. **Performance Diagnostics**: Isolating performance issues without stopping the consumer entirely, allowing for live monitoring and troubleshooting while minimizing impact on overall operations.
4. **Error Containment**: In case of an identified error affecting a consumer's tasks, quieting allows the consumer to finish current tasks without accepting new potentially compromised work containing the error.
5. **Incremental Upgrades**: Gradually upgrading consumers in a system without causing a full rebalance or downtime, by quieting certain consumers at a time while others take over the processing load.
6. **Controlled Shutdowns**: Preparing consumers for a controlled shutdown by quieting them to complete the processing of current messages while not picking up new ones, ensuring data integrity and smooth restarts.

### Stopping

The stopping command is used to halt a consumer process entirely. This command should be used with caution as it stops all processing activities after `shutdown_timeout` is reached. Stopping is typically employed when a consumer needs to be taken offline for upgrades, troubleshooting, or when decommissioning is required. Once stopped, a consumer process will need to be manually restarted, and it will resume from the last committed offset in Kafka, ensuring no loss of data but requiring careful management to avoid processing delays or other operational impacts.

!!! warning "Topics and Partitions Reassignment"
    When a consumer is stopped, its assignments are redistributed among the remaining active consumers in the group, ensuring that message processing continues seamlessly without interruption.

#### Use Cases

1. **Emergency Shutdown**: Quickly shutting down a consumer that is causing severe problems, such as data corruption or excessive resource consumption, to prevent further damage to the system.
2. **System Overhaul**: Stopping consumers completely to allow for major system upgrades or reconfigurations that require a complete halt of data processing activities.
3. **Decommissioning Nodes**: Stopping consumers on specific nodes that are being decommissioned or replaced, ensuring that these nodes no longer participate in processing.
4. **Bug Fixes**: Halting a consumer to apply critical bug fixes that cannot be addressed while the consumer is running, ensuring the integrity of the fix deployment.
5. **Resource Reallocation**: Stopping a consumer to reallocate resources such as memory and CPU to other critical applications, especially in resource-constrained environments.
6. **Testing Failover**: Stopping consumers to test the resilience and failover capabilities of the system, ensuring that other consumers or nodes can take over smoothly.
7. **Performance Benchmarking**: Temporarily stopping consumers from performing clean-slate performance benchmarking without background noise from ongoing data processing.

## Partition-Level Processing Control

In addition to process-level control, Karafka offers granular control over individual partition processing. These features allow you to pause/resume processing and adjust offset positions for specific partitions without affecting the entire consumer process or need for any code changes.

### Access Points

Partition-level controls are accessible from two main locations:

1. **Health Overview**: The Health dashboard displays all active consumer group partitions with action buttons for offset adjustment and pause control
2. **Consumer Subscriptions**: Navigating to a specific consumer process shows its subscriptions with partition management options

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui/pro-health.png" alt="Karafka Web UI partition controls in Health overview" />
</p>

### Pause and Resume Partitions

The partition pause feature allows you to temporarily stop message processing for specific partitions without stopping the entire consumer process. Karafka provides two levels of pause control:

- **Partition-level**: Pause individual partitions one at a time
- **Topic-level**: Pause all partitions of a topic at once across all consumer processes

#### Topic-Level Pause/Resume

For scenarios where you need to pause all partitions of a topic simultaneously, Karafka provides topic-level pause controls accessible from the Health Overview page.

To pause all partitions of a topic:

1. Navigate to **Health → Overview**
2. Locate the topic you want to pause
3. Click the **Pause Topic** button
4. Configure pause settings (duration and safety options)
5. Confirm the operation

The command is broadcast to all consumer processes, with each process applying the pause to the partitions it owns within the specified consumer group. This is particularly useful for:

- **Coordinated maintenance**: Stopping all processing for a topic during planned maintenance
- **Emergency response**: Quickly halting all consumption when issues are detected
- **Resource management**: Freeing up resources across all consumers processing a topic

To resume all paused partitions of a topic, use the corresponding **Resume Topic** button from the same Health Overview interface.

!!! info "Cross-Process Coordination"

    Topic-level pause/resume commands are distributed to all active consumer processes. Each process will apply the command only to the partitions it currently owns. This ensures consistent behavior across your consumer fleet without requiring manual intervention on each process.

#### Partition-Level Pause/Resume

The partition pause feature allows you to temporarily stop message processing for a specific partition without stopping the entire consumer process.

#### Pausing a Partition

To pause a partition:

1. Navigate to **Health → Overview** or to a specific consumer's subscriptions
2. Locate the partition you want to pause
3. Click the **Pause** button (pause icon)
4. Enter pause configuration:

   - **Pause Duration**: Enter time in seconds (0 for indefinite pause)
   - **Safety Check**: Option to prevent override of existing pauses

5. Click **Set or Update Pause**

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui/pro-topics-management-pause.png" alt="Karafka Web UI partition pause dialog" />
</p>

!!! warning "Running Consumer Process Operation"

    Pause operations apply to actively running consumers. The operation:

    - Takes effect during the next poll operation (after current message processing completes)
    - May affect message processing
    - Cannot be undone
    - Will take effect only if the current process still owns the assignment

!!! info "Lag Reporting During Pauses"
    During long pauses, lag reporting on paused topic partitions may stop as librdkafka freezes the last known high watermark. Real-time, state-independent lag metrics can always be checked in the Cluster Lags tab of the Health section.

#### Resuming a Partition

To resume a paused partition:

1. Navigate to **Health → Overview** or to a specific consumer's subscriptions
2. Locate the paused partition (indicated by "paused" status)
3. Click the **Resume** button (play icon)
4. In the Resume dialog, optionally select:

   - **Reset Counter**: Reset the processing attempts counter when resuming

5. Click **Resume Processing**

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui/pro-topics-management-resume.png" alt="Karafka Web UI partition resume dialog" />
</p>

Resuming a partition restores normal message processing operations. The resumption takes effect after the current processing cycle completes and before the next polling operation.

### Offset Management

The offset management feature allows you to adjust the position from which a consumer reads messages within a partition.

#### Editing Partition Offsets

To adjust a partition offset:

1. Navigate to **Health → Overview** or to a specific consumer's subscriptions
2. Locate the partition to modify
3. Click the **Edit Offset** button (pencil icon)
4. Configure offset adjustment:

   - **New Offset**: Enter the desired offset position (limited by the partition's low and high watermarks)
   - **Prevent Overtaking**: Option to only adjust if consumer hasn't moved beyond requested offset
   - **Resume Immediately**: If partition is paused, resume processing immediately

5. Click **Adjust Offset**

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/web-ui/pro-topics-management-move.png" alt="Karafka Web UI offset editing interface" />
</p>

!!! warning "Running Consumer Process Operation"

    Offset adjustments apply to actively running consumers. The operation:

    - Takes effect during the next poll operation (after current message processing completes)
    - May affect message processing
    - Cannot be undone
    - Will take effect only if the current process still owns the assignment

### Use Cases

#### Offset Management Use Cases

- **Error Recovery**: Skip past problematic messages that cause repeated failures
- **Replay Processing**: Move backward to reprocess messages after fixing a bug
- **Debugging**: Examine specific messages by positioning the consumer at exact offsets
- **Testing**: Validate message handling by processing specific message ranges
- **Catch-up**: Skip ahead to reduce processing lag when historical data isn't required

#### Pause/Resume Use Cases

- **Maintenance Windows**: Pause specific partitions during maintenance periods
- **Resource Management**: Temporarily halt non-critical partitions under high load
- **Rate Limiting**: Implement basic rate limiting by pausing and resuming processing
- **Troubleshooting**: Isolate problems by pausing specific partitions for investigation
- **Coordinated Deployments**: Pause processing before deployments to prevent message loss

### Limitations and Considerations

- **Processing Cycle**: All operations take effect after the current processing cycle completes and before the next polling operation
- **Assignment Ownership**: Commands only affect partitions if the targeted consumer still owns the assignment
- **Pause Visibility**: Lag metrics for paused partitions may become stale as high watermark updates freeze
- **Offset Boundaries**: Offset adjustments must be within the partition's low and high watermarks
- **Consumer Group Coordination**: Changes to one consumer may trigger rebalancing across the consumer group
- **Command Persistence**: Commands are sent through Kafka and will persist even through consumer restarts
- **Process vs. Partition**: These features control individual partitions, not entire consumer processes

## Connection Management

The commanding feature in Karafka Pro utilizes the Pro Iterator to establish a pub-sub-like connection for managing consumer processes. This connection is distinct from standard subscriptions and is not visible in the Web UI. This design choice helps prevent unnecessary noise in the UI and ensures that the connection remains responsive as long as the entire Ruby process is operational.

Unlike standard data flows, this special connection is built to avoid saturation and flow any potential instabilities, where messages pass from listeners through queues to consumers. Standard flows could be overwhelmed during critical moments, significantly reducing responsiveness when needed most. By bypassing the typical data flow path, the commanding feature maintains a high level of responsiveness, even under heavy system load.

This dedicated subscription, while not "mission-critical", is designed to be reliable, incorporating recovery procedures and automatic reconnections. It does not publish statistics or other metrics, focusing on efficient management and swift responses to administrative commands. This approach, in turn, ensures robust and continuous operation, maintaining system stability and operational efficiency.

### Network Traffic Characteristics

The `karafka_consumers_commands` topic is designed with a single partition and operates as a pub-sub mechanism. Each consumer process maintains an active subscription to this topic, creating continuous polling activity that generates consistent network traffic, even when no commands are actively being issued.

This traffic pattern is normal and expected. While the volume is typically insignificant due to the low-intensity nature of the topic, it may appear more prominent on network monitoring graphs, particularly when other topics have lower traffic volumes. The constant polling ensures that administrative commands can be delivered and executed with minimal latency.

If this network traffic is a concern or if commanding functionality is not needed in your environment, it can be disabled by setting `config.commanding.active` to `false` as shown in the Configuration section above.

Key points include:

- **Invisible Connection**: The pub-sub connection used by the commanding feature is not shown in the Web UI, avoiding unnecessary noise.
- **Responsiveness**: Ensures high responsiveness by bypassing the standard data flow, crucial during debugging.
- **Reliability**: Incorporates recovery and reconnection mechanisms for continuous operation.
- **Error Reporting**: Publishes errors if they occur but does not track or publish statistics or other metrics.
- **Network Traffic**: Generates consistent but typically insignificant traffic due to continuous polling of the commands topic by all consumer processes.

## Summary

Karafka Pro's consumer control capabilities are essential for any organization looking to leverage Kafka for real-time data processing and streaming. They provide the necessary controls to manage consumer behavior effectively at both process and partition levels, ensuring that Kafka clusters are performant and resilient under various operating conditions.

The combination of process-level commands (trace, quiet, stop) and partition-level controls (pause, resume, offset adjustment) provides a comprehensive toolkit for administrators to implement precise control strategies and resolve issues with minimal disruption to the overall message processing workflow.

---

## See Also

- [Persistent Pausing](Operations-Persistent-Pausing) - Implementing persistent topic pausing for planned maintenance using Filtering API
- [Filtering API](Pro-Filtering-API) - Building custom filters for advanced consumption control
- [Web UI Health](Pro-Web-UI-Health) - Monitoring consumer health and partition status
