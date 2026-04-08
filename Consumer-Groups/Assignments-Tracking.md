The Karafka Assignments Tracker is a feature designed to keep track of the active assignments within a Karafka process. It serves as a tool for understanding the current assignments of topics partitions from a Kafka cluster. This tracker is handy in environments with dynamic partition reassignments, such as those involving multiple consumer groups or subscription groups.

## Usage

To access your process's current assignments, you only need to execute `Karafka::App.assignments` method from any place in the process. This thread-safe method will return a Hash object where keys correspond to the assigned topics and values are arrays with IDs of the partitions assigned for a corresponding topic.

It is worth pointing out that the topics are `Karafka::Routing::Topic` objects and not just topic names. This is done that way so the system supports providing you insights about the same topic if it is being consumed in multiple consumer groups simultaneously. You can use it from any place in your code.

```ruby
def consume
  Karafka::App.assignments.each do |topic, partitions|
    puts "In #{topic.name} I'm currently assigned to partitions: #{partitions.join(', ')}"
  end
end
```

!!! note "Revocation, Reassignment, and Generation Tracking"

    The `Karafka::App.assignments` method returns only the current state of assignments. When a partition is revoked during a rebalance, it is removed from the assignments hash. If that same partition is later reassigned back, it appears identically to a first-time assignment in the current assignments hash.

    However, per-partition **generation tracking** is available via `Karafka::Instrumentation::AssignmentsTracker`. Each time a partition is assigned, its generation counter is incremented (starting at 1 for the first assignment). Revocations, client resets, and assignment losses do **not** reset or change generation counters — only new assignments increment them.

    - `AssignmentsTracker.generation(topic, partition)` — returns the generation count for a specific topic-partition (0 if never assigned, 1+ otherwise).
    - `AssignmentsTracker.generations` — returns a frozen hash of all topic-partitions and their generation counts, including partitions that have been revoked.

    This is useful for idempotency logic, cache invalidation, and state recovery decisions where you need to distinguish first-time assignments from reassignments.

## Example Use Cases

- **Building Assignments Aware Schedulers**: A custom scheduler that takes into account assignments can significantly improve efficiency and performance. Such a scheduler optimizes resource utilization and reduces latency by making intelligent scheduling decisions based on real-time cluster state.

- **Dynamic Resources Allocation**: In scenarios where workloads fluctuate, the tracker can dynamically redistribute tasks based on the current partition assignments or apply specific processing strategies, ensuring optimal resource utilization.

- **Monitoring and Alerting**: Developers can monitor partition assignments to detect anomalies (e.g., imbalanced loads, partition loss) and trigger alerts for proactive issue resolution.

- **Consumer Group Management**: For applications involving multiple consumer groups, the tracker provides visibility into how partitions are distributed across different groups, aiding debugging and performance tuning.

- **Performance Tuning**: Observing partition traffic can help identify hotspots or bottlenecks in data flow, enabling fine-tuning partition sizes or numbers to optimize performance.

- **Dynamic Consumer Scaling**: For systems that dynamically scale consumers based on load, knowledge of partition assignments is necessary to redistribute partitions among the new set of consumers efficiently.

---

## See Also

- [Monitoring and Logging](Infrastructure-Monitoring-and-Logging) - Track consumer assignments and partition distribution
- [Web UI Features](Web-UI-Features) - Visualize partition assignments in the Web UI
- [Concurrency and Multithreading](Consumer-Groups-Concurrency-and-Multithreading) - Understanding thread safety with partition assignments
