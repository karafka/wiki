# Optimized Statistics Processing at Scale

Karafka Pro includes automatic optimizations for Kafka client statistics handling in high-partition environments. In large-scale deployments with thousands of partitions per topic, the overhead of collecting, serializing, and processing metrics can become a significant, often invisible performance bottleneck.

## The Problem

In environments with high partition counts, the statistics mechanism generates disproportionately large payloads relative to the actual workload of a given consumer or producer process. Each statistics emit requires memory allocation and CPU time proportional to the total number of partitions known to the client, not just those being actively worked with.

At scale, this results in:

- **Oversized statistics payloads** that grow with topic partition count, not assignment size
- **Excessive memory allocations** on every statistics interval
- **Unnecessary CPU overhead** deserializing data irrelevant to the current process

## How Karafka Pro Solves This

Karafka Pro automatically reduces the overhead of statistics processing at multiple levels, ensuring that both the size of the statistics data and the cost of processing it scale with your actual workload rather than the total size of the Kafka cluster.

This optimization is **transparent and automatic** - no configuration changes are required.

## Performance Impact

| Scenario | Without Pro | With Pro | Reduction |
| --- | --- | --- | --- |
| Stats payload size | ~4.2 MB per emit | ~35 KB per emit | 99.2% smaller |
| Partitions in stats payload | ~2,001 | ~11 | 99.5% fewer |
| Memory allocations per event | ~4,053 objects | ~73 objects | 98.2% fewer |
| CPU time per stats decoration | ~28 ms | ~0.5 ms | 98.2% faster |
| RSS memory growth (per minute) | ~66 MB | ~4 MB | 94.1% less |
| GC collections (per minute) | 6 | 1 | 83.3% fewer |

*Benchmarked with a 2,000-partition topic, 10 assigned partitions, `statistics.interval.ms` = 5000ms (Karafka default), Ruby 4.0, Linux x86_64.*

### Scaling by Partition Count

The charts below show how overhead scales from 100 to 5,000 total partitions. In each case, the consumer is assigned only 10 partitions - a realistic scenario where a process consumes a small slice of a large topic. Without Pro, all metrics grow linearly with the total number of partitions known to the client. With Pro, they remain constant regardless of cluster size.

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/optimized_statistics_processing/payload_size.png" alt="stats payload size scaling by partition count" />
</p>

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/optimized_statistics_processing/cpu_time.png" alt="cpu time per stats event scaling by partition count" />
</p>

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/optimized_statistics_processing/allocations.png" alt="memory allocations per stats event scaling by partition count" />
</p>

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/optimized_statistics_processing/rss_growth.png" alt="rss memory growth scaling by partition count" />
</p>

## Who Benefits

This optimization is most impactful for:

- Applications consuming from topics with **100+ partitions**
- Applications using **[Multiplexing](Pro-Consumer-Groups-Multiplexing)**, where multiple consumer connections multiply the statistics overhead
- High-frequency statistics intervals used for real-time monitoring
- Applications relying on **[karafka-web](Web-UI-Getting-Started)** metrics, which process statistics on every emit

The benefits scale with partition count - even at 100+ partitions, the reduced payload size and fewer allocations translate into measurable savings, especially when combined with Multiplexing or frequent statistics intervals.

## See Also

- [Librdkafka Statistics](Librdkafka-Statistics) - Reference for all available statistics fields
- [Multiplexing](Pro-Consumer-Groups-Multiplexing) - Multiple connections that compound statistics overhead without this optimization
- [Web UI](Web-UI-Features) - Benefits from reduced statistics processing overhead
