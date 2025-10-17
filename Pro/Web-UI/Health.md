The health views of the Web UI display the current status of all the running Karafka instances aggregated on a per-consumer-group basis. Those views allow users to monitor the health of their messages consumption and troubleshoot any issues that may arise including issues related to hanging transactions (LSO issues). It also allows quick identification of performance bottlenecks and can help with capacity planning.

![karafka web ui](https://cdn.karafka.io/assets/misc/printscreens/web-ui/pro-health.png)

## LSO Freezes Awareness

In the world of Kafka, the Last Stable Offset (LSO) is pivotal in ensuring message integrity and order, especially for idempotent producers. However, at times, the LSO may hang, affecting the consumption of messages and potentially bringing to a standstill any consumers operating at a `read_committed` isolation level. This documentation will shed light on the concept, the problems it may cause, and how the Karafka Web UI can be a lifesaver during such situations.

### Understanding the LSO - Last Stable Offset

The Last Stable Offset (LSO) is a checkpoint marking the last point at which records were successfully committed. It is a significant reference point because any records beyond this point are not considered stable and may not be safely consumed by clients requiring transactional consistency.

### The Risk of LSO Freezes

If the LSO hangs or is stuck, it signifies that new records have yet to be committed beyond this point. When such a scenario happens, all consumers with a `read_committed` isolation level will be unable to proceed. Essentially, they will have to wait until the LSO issue is resolved, which can be a significant challenge for real-time data processing systems.

### A Beacon in LSO Freezes

The Karafka Web UI is equipped with robust health views that swiftly identify cases where consumers cannot progress due to a stuck LSO.

Karafka's Web UI has visual cues to indicate potential problems concerning the LSO:

1. **At Risk (Yellow Highlight)**
    - **Scenario**: Consumption is at risk but is still moving forward. This happens when there is still data before reaching the LSO, so the consumer is progressing.
    - **Web UI Indication**: The partition will be highlighted in yellow.
    - **LSO State**: "At risk"

![karafka web ui LSO warning](https://cdn.karafka.io/assets/misc/printscreens/web-ui/pro-health-lso1.png)

2. **Stopped (Red Highlight)**
    - **Scenario**: Consumption is halted and cannot move forward. This situation arises when more data is available on the topic, but it lies beyond the LSO, and the consumer has already reached it.
    - **Web UI Indication**: The partition will be highlighted in red, emphasizing that it is stopped.
    - **LSO State**: "Stopped".

![karafka web ui LSO error](https://cdn.karafka.io/assets/misc/printscreens/web-ui/pro-health-lso2.png)

These visual indicators allow immediate awareness of potential problems, ensuring quick identification and action.

### Conclusion

Awareness of LSO freezes, and its implications is vital for any Kafka-based system. The Karafka Web UI provides a proactive approach to detect and visually indicate such issues, ensuring administrators and users can take quick corrective actions. Regularly monitoring the health view and being aware of the LSO states can be crucial for the seamless functioning of your Kafka-based data processing system.

## Cluster Lags

Unlike many other Web UI features centered around insights from consumer processes and producers, the Cluster Lags functionality offers a direct view into Kafka's perception of lag. This is critical for comprehensive monitoring and management.

In Kafka terms, lag refers to the difference between the last message produced to a topic and the last message consumed. These metrics become invaluable in scenarios where consumer processes are not active or experiencing issues. The Cluster Lags are derived from the lag information stored directly in Kafka, providing an independent and accurate measure of message processing delays.

This feature is handy in environments where:

- Consumer processes are temporarily down or inactive.
- Consumers are misbehaving or not processing messages as expected.

Focusing on the lag data directly from Kafka lets you gain insights into system performance and potential bottlenecks without relying solely on consumer process metrics.

![karafka web ui cluster lags](https://cdn.karafka.io/assets/misc/printscreens/web-ui/pro-health-cluster-lags.png)

!!! warning "Lag Reporting Limitation for Paused Partitions"

    When consumer partitions are paused, there is a known limitation in how lag information is reported in the Web UI (except for Cluster Lags). The lag data for paused partitions comes from consumer processes, and librdkafka does not refresh metadata for paused partitions. This means the lag value will remain static until the partition is resumed, even if new messages are being produced to that partition.

    **Important Notes:**

    - **Consumer-reported lags** (visible in consumer views) will not grow for paused partitions
    - **Cluster Lags** will continue to update correctly, as they reflect lag "as Kafka sees it" independent of consumer state
    - This is a known limitation that will be mitigated in future versions of the Web UI
    - Remember that Web UI is designed for operational monitoring, not as an analytical platform like Datadog

    For accurate lag information during consumer pauses, rely on the Cluster Lags view, which always reflects the true state from Kafka's perspective.
