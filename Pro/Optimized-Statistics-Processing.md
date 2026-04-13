# Optimized Statistics Processing at Scale

Karafka Pro includes automatic optimizations for Kafka client statistics handling in high-partition environments. In large-scale deployments where topics have thousands of partitions, the overhead of collecting, serializing, and processing internal Kafka client metrics can become a significant and often invisible performance bottleneck.

## The Problem

In environments with high partition counts, the internal Kafka client statistics mechanism generates disproportionately large payloads relative to the actual workload of a given consumer process. Each statistics emit requires memory allocation and CPU time proportional to the total number of partitions known to the client - not just those being actively consumed.

At scale, this results in:

- **Oversized statistics payloads** that grow with topic partition count, not assignment size
- **Excessive memory allocations** on every statistics interval
- **Unnecessary CPU overhead** deserializing data irrelevant to the current process

## How Karafka Pro Solves This

Karafka Pro automatically reduces the statistics processing overhead at multiple levels, ensuring that both the size of statistics data and the cost of processing it scale with your actual workload rather than the total size of the Kafka cluster.

This optimization is **transparent and automatic** - no configuration changes are required.

## Performance Impact

| Scenario | Without Pro | With Pro | Reduction |
| --- | --- | --- | --- |
| X,000-partition topic (consumer) | ~X MB per stat emit | ~Y KB per stat emit | ~Z% |
| X,000-partition topic (producer) | ~X MB per stat emit | Minimal | ~Z% |
| Memory allocated per stats interval | X MB | Y KB | ~Z% |
| CPU time parsing stats | X ms | Y ms | ~Z% |

*Numbers measured with `statistics.interval.ms` = 5000ms (Karafka default).*

## Who Benefits

This optimization is most impactful for:

- Applications consuming from topics with **X,000+ partitions**
- Applications using **[Multiplexing](Pro-Consumer-Groups-Multiplexing)**, where multiple consumer connections multiply the statistics overhead
- High-frequency statistics intervals used for real-time monitoring
- Applications relying on **[karafka-web](Web-UI-Getting-Started)** metrics, which process statistics on every emit

For applications with small partition counts (under ~100 per topic), the improvement is present but unlikely to be noticeable in practice.

## Important Notes

- **Aggregate totals are preserved** - top-level metrics remain accurate regardless of the optimization level applied.
- **Rebalance visibility is maintained** - full partition visibility is preserved during reassignment events.

## See Also

- [Librdkafka Statistics](Librdkafka-Statistics) - Reference for all available statistics fields
- [Multiplexing](Pro-Consumer-Groups-Multiplexing) - Multiple connections that compound statistics overhead without this optimization
- [Web UI](Web-UI-Features) - Benefits from reduced statistics processing overhead
