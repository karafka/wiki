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

The "Web UI Explorer" in Karafka Pro Web UI provides detailed insights and analytics about Kafka messages. Essential for developers, it helps monitor, debug, and optimize Kafka applications. Learn more [here](https://karafka.io/docs/Pro-Web-UI-Explorer/)

## Search

The Search feature is part of the Karafka Web UI Explorer, but due to its complexity, it has its dedicated section that can be found [here](https://karafka.io/docs/Pro-Web-UI-Search/).

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
