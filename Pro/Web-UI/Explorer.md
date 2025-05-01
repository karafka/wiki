Karafka Data Explorer is an essential tool for users seeking to navigate and comprehend the data produced to Kafka. Offering an intuitive interface and a deep understanding of the routing table, the explorer ensures that users can access deserialized data effortlessly for seamless viewing.

Below you can find the primary features of the Karafka Data Explorer.

!!! Warning "Large Payloads and Performance Considerations"

    Explorer is **not** suited for viewing and managing messages with large payloads (e.g., tens of MB in size). This is because it downloads all payloads for each page load, leading to significant network and memory usage. While it does not deserialize the data, the sheer volume of data transferred can cause performance bottlenecks.

### Topics List View

Before diving deep into the data, having a bird's eye view of all available topics is essential. This feature offers a list of all the topics, allowing users to select and focus on specific ones. It serves as a starting point for data exploration, giving a clear overview of the topics landscape.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-explorer1.png)

### Per Topic View

This feature provides an overview of the most recent data across all partitions for a specific topic, ensuring you don't miss out on the latest insights.

#### Limitations

1. **Data Merging from Multiple Partitions**: When using the Per Topic View, the system merges data from several partitions. However, there's a limitation. If the number of partitions exceeds the number of elements allowed to be displayed on a single page, not all data might be visible immediately. For example, if there are 30 partitions but the page only shows data from 25, you would only see the combined data from those 25 partitions on the first page. The remaining data from the other partitions would be visible on the subsequent pages (Page 2, Page 3, and so on).

1. **Displaying Sparse Data from Many Partitions**: Another limitation might arise in situations where topics have a small number of messages. If a topic has many partitions (say more than 25) but only a few messages, not all may be visible in the Per Topic View. This is due to the merging process, where data from many partitions might overshadow those few messages.

1. **Low Watermark Offset Viewing**: It's worth noting that the limitations mentioned mainly apply when observing data close to the low watermark offset, typically when there's not much data present (less than 100 messages). In such cases, the view might provide a partial picture due to the abovementioned constraints.

However, in most other scenarios, where there's a substantial amount of data, the Per Topic View should function seamlessly, providing a holistic and accurate representation of the most recent data across all partitions.

### Per Partition View with Offset-Based Pagination

Dive deeper into each partition and scroll through the data using offset-based pagination. This offers a granular view, ensuring detailed exploration of data within partitions.

### Time-Based Offset Lookups

Ever wanted to see a message generated at a particular moment? This feature facilitates precisely that. You can navigate to messages produced at specific times by performing time-based offset lookups. This functionality is particularly advantageous for debugging, allowing for precise tracking and resolution.

### Timestamp-Based Offset Lookups

Need to investigate messages from a specific moment in time? Karafka Web UI provides Kafka messages timestamp-based offset lookups that enable you to jump directly to messages produced at exact Unix timestamps. This feature is invaluable for incident analysis, allowing you to correlate message production with system events or errors. Enter the timestamp, and the Explorer will navigate to the corresponding offset, making historical data exploration efficient and precise.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/explorer_timestamp_input.png)

### Real-Time Display of the Recent Message

Stay updated with the latest information. The explorer can display the most recent message from a given topic partition in real time and even supports an auto-refresh feature, ensuring you always have the current data at your fingertips.

### Detailed Message View

Every message is more than just its content. With the Karafka Data Explorer, you can access the complete details of any message. This includes its payload, headers, and associated metadata, ensuring a comprehensive understanding of the data.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-explorer3.png)

### Message Republishing

Occasionally, there might be a need to republish a message for various reasons. This feature empowers users to seamlessly republish any message to the same topic partition. It retains the original payload and all the headers, ensuring data consistency and integrity during republishing.

### Surroundings Lookup

"Surroundings Lookup" enhances Karafka Web UI's debugging capabilities by allowing users to navigate directly to a specific message and instantly view its preceding and subsequent messages. This is essential for understanding the context, especially during batch processing.

### Summary

The Karafka Data Explorer is your go-to solution for an in-depth exploration of data produced to Kafka. It's not just about viewing the data; it's about understanding it.
