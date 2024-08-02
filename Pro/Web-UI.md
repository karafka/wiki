The Enhanced Web UI, aside from all the features from the OSS version, also offers additional features and capabilities not available in the free version, making it a better option for those looking for more robust monitoring and management capabilities for their Karafka applications. Some of the key benefits of the Enhanced Web UI version include the following:

- Enhanced consumers utilization metrics providing much better insights into processes resources utilization.
- Consumer process inspection to quickly analyze the state of a given consuming process.
- Consumer jobs inspection to view currently running jobs on a per-process basis.
- Health dashboard containing general consumption overview information
- Data Explorer allowing for viewing and exploring the data produced to Kafka topics. It understands the routing table and can deserialize data before it is displayed.
- Enhanced error reporting allowing for backtrace inspection and providing multi-partition support.
- DLQ / Dead insights allowing to navigate through DLQ topics and messages that were dispatched to them.
- Consumer Processes Commanding from the Web interface.

## Getting Started

Karafka Web UI will automatically switch to the Pro mode when Karafka Pro is in use.

There are **no** extra steps needed unless you want to completely disable consumers processes management.

## Dashboard

The dashboard provides an all-encompassing insight into your Karafka operations. It’s an indispensable tool for anyone looking to monitor, optimize, and troubleshoot their Karafka processes. With its user-friendly interface and detailed metrics, you have everything you need to ensure the smooth running of your Kafka operations.

<img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-dashboard.png" alt="karafka web pro dashboard view" />

## Consumers

Enhanced consumer view reports all of the metrics available in the OSS version but also reports:

- Machine memory usage
- Machine memory available
- Average CPU load from the last minute, 5 minutes, and 15 minutes
- Threads utilization from the last 60 seconds

Those metrics can allow you to identify bottlenecks (CPU vs. IO) in your Karafka consumers.

### Consumer Process Inspection

Consumer process inspection view provides real-time visibility into the performance and behavior of a given consumer process and its Kafka subscriptions.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-consumer-subscriptions.png)

### Consumer Jobs Inspection

The consumer jobs inspection view provides real-time visibility into the jobs running at the current moment on a given consumer instance.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-consumer-jobs.png)

### Consumer Details Inspection

This feature offers users a detailed look into each process's current state report. It's a valuable tool for thorough debugging and precise per-process inspection.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-consumer-details.png)

### Consumers Commanding

This feature has its own dedicated documentation that you can access [here](https://karafka.io/docs/Pro-Commanding).

## Health

This dashboard views show Karafka consumers' groups' health states with their lag aggregated information and basic trends.

[Here](https://karafka.io/docs/Pro-Web-UI-Health) you can learn more about the health information available in this dashboard view.

## Topics Insights

The "Topics Insights" feature in Karafka Pro Web UI is a comprehensive suite designed to provide users with detailed information and analytics about their Kafka topics. This feature is crucial for developers who must ensure optimal configuration and performance of their Kafka topics. You can learn more about this feature [here](https://karafka.io/docs/Pro-Web-UI-Topics-Insights).

## Explorer

Karafka Data Explorer is an essential tool for users seeking to navigate and comprehend the data produced to Kafka. Offering an intuitive interface and a deep understanding of the routing table, the explorer ensures that users can access deserialized data effortlessly for seamless viewing.

Below you can find the primary features of the Karafka Data Explorer.

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

## Errors

Enhanced Web UI errors provide a few enhancements:

- Supports error tracking on a high-scale due to the support of multiple partitions for the error topic.
- Supports errors backtrace reporting in the dashboard.

It allows for easier debuggability and error exploration, enabling users to perform real-time data analysis and troubleshoot issues faster.

Errors list:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-errors1.png)

Error details:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-errors2.png)

## DLQ / Dead

Dead insights allowing to navigate through DLQ topics and messages that were dispatched to them.

!!! Tip "Automatic Qualification of DLQ Topics"

    Web UI will automatically classify any topics that contain `dlq` or `dead_letter` in their names - irrespective of case - as Dead Letter Queue (DLQ) topics. This means topics labeled with variations such as `DLQ`, `dlq`, `Dead_Letter`, or `DEAD_LETTER` will be viewed and managed under the DLQ view. 

DLQ dispatched messages view:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-dead1.png)

DLQ dispatched per message view:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/dlq2.png)
