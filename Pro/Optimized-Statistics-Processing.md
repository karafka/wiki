# Optimized Statistics Processing

In environments with high partition counts, librdkafka's statistics payloads (emitted via `statistics.interval.ms`) include per-partition data for every partition known to the client, not just the ones a given consumer process is actively assigned. On topics with hundreds or thousands of partitions, this means the statistics payload - and the cost of generating and parsing it - grows with the size of the topic rather than with the size of the actual assignment.

At scale, this results in:

- **Oversized statistics payloads** that grow with topic partition count, not assignment size
- **Excessive memory allocations** on every statistics interval
- **Unnecessary CPU overhead** processing data irrelevant to the current process

## How Karafka Pro Helps

Karafka Pro automatically applies internal optimizations to statistics processing, so payload size, memory allocations, and CPU cost scale with your actual assignment rather than with the total partition count of the topic.

This is applied automatically and requires no configuration changes.

## Who Benefits

This is most relevant for applications consuming from topics with a large number of partitions relative to what a single process is assigned, especially when combined with:

- **[Multiplexing](Pro-Consumer-Groups-Multiplexing)**, where multiple consumer connections each receive their own statistics payload
- Frequent statistics intervals (low `statistics.interval.ms`) used for real-time monitoring
- **[karafka-web](Web-UI-Getting-Started)**, which parses statistics on every emit

## See Also

- [librdkafka Statistics](Librdkafka-Statistics) - Reference for all available statistics fields
- [Multiplexing](Pro-Consumer-Groups-Multiplexing) - Multiple connections that each emit their own statistics
- [Web UI](Web-UI-Features) - Consumes statistics data for its dashboards
