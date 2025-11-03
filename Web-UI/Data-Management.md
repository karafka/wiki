# Web UI Data Management

Karafka Web UI is a tool for managing and monitoring data within Kafka-based systems. This document describes its unique approach to data management, schema handling, and migrations.

## Data Storage and Management

Karafka Web UI utilizes Apache Kafka as its core for data management, eliminating the need for third-party databases. This direct integration offers several advantages:

- **Streamlined Data Handling**: Data is managed directly within Kafka, providing a unified and efficient approach to data processing and storage.

- **No External Dependencies**: The absence of a third-party database simplifies the architecture, reducing potential points of failure and maintenance overhead.

## Topic-Based Data Organization

Karafka employs a topic-centric approach to organize and materialize relevant data:

- **Custom Topics**: Karafka uses its own Kafka topics to store and materialize information, ensuring data is categorized logically and efficiently.

- **Topic Schemas**: Each topic message adheres to a defined schema, ensuring consistency and reliability in the data structure.

## Schema Versioning and Compatibility

Karafka Web UI emphasizes strict schema management:

- **Schema Versioning**: All topic messages in Karafka are versioned. This versioning allows for backward compatibility and clear evolution of data structures.

- **Handling of Schema Changes**: In the event of schema modifications, Karafka Web UI employs a rigorous approach:
    - **Older Schemas**: Reports with outdated schemas are ignored, prioritizing consistency over backward compatibility.

    - **Newer Schemas**: Messages with newer schemas trigger an error in the Karafka consumer, halting data processing. This persists until the system is upgraded to handle the new schema, facilitating zero-downtime rolling upgrades.

## Migrations and Consistency in Materialized Topics

For materialized topics, especially those holding aggregated statistics and metrics, Karafka Web UI integrates a specialized migration engine:

- **Internal Migration Engine**: Functionally akin to Ruby on Rails migrations, this engine recognizes different versions of topic schemas.

- **Migration Execution**: The engine executes necessary migrations to bring materialized and aggregated topic data to the correct consistency state.

- **Ensuring Data Integrity**: This system ensures that data across various versions remains consistent and reliable, essential for accurate data analysis and reporting.

## Eventual Consistency of Web UI Data

Karafka Web UI data is eventually consistent, meaning that while the system strives to keep the data current, there can be delays in metrics reporting. Most of the data presented in the Web UI is collected from consumer and producer processes, and their reporting depends on their current state.

Under certain circumstances, such as heavy lags on multiple partitions, the data presented on the graphs may be outdated by a few minutes. This latency occurs because the consumer and producer processes may not immediately reflect the latest state of the system when they are under significant load.

However, this delay is generally irrelevant when analyzing patterns and conducting general health assessments. The eventual consistency model ensures that, despite temporary delays, the data will ultimately reflect the accurate state of the system. This approach allows users to identify trends and monitor the overall health of their Kafka-based environment effectively, even if some metrics are momentarily lagging.

## Conclusion

Karafka Web UI offers a robust, efficient, and reliable solution for monitoring Karafka-based environments. Its direct use of Kafka for data storage and sophisticated schema management and migration capabilities positions it as a powerful tool for users seeking to leverage Kafka within their applications.

## See also

- [About Web UI](Web-UI-About) - For an overview of Web UI capabilities
- [Pro Cleaner API](Pro-Cleaner-API) - For managing and cleaning Web UI data topics
- [Librdkafka Configuration](Librdkafka-Configuration) - For configuration options that affect Web UI behavior
