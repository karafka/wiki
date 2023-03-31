**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


The Enhanced Web UI, aside from all the features from the OSS version, also offers additional features and capabilities not available in the free version, making it a better option for those looking for more robust monitoring and management capabilities for their Karafka applications. Some of the key benefits of the Enhanced Web UI version include the following:

- Enhanced consumers utilization metrics providing much better insights into processes resources utilization.
- Consumer process inspection to quickly analyze the state of a given consuming process.
- Consumer jobs inspection to view currently running jobs on a per-process basis.
- Health dashboard containing general consumption overview information
- Data Explorer allowing for viewing and exploring the data produced to Kafka topics. It understands the routing table and can deserialize data before it is displayed.
- Enhanced error reporting allowing for backtrace inspection and providing multi-partition support.
- DLQ / Dead insights allowing to navigate through DLQ topics and messages that were dispatched to them.

## Getting Started

Karafka Web UI will automatically switch to the Pro mode when Karafka Pro is in use.

There are **no** extra steps needed.

## Consumers

Enhanced consumer view reports all of the metrics available in the OSS version but also reports:

- Machine memory usage
- Machine memory available
- Average CPU load from the last minute, 5 minutes, and 15 minutes
- Threads utilization from the last 60 seconds

Those metrics can allow you to identify bottlenecks (CPU vs. IO) in your Karafka consumers.

### Consumer process inspection

Consumer process inspection view provides real-time visibility into the performance and behavior of a given consumer process and its Kafka subscriptions.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-consumer-subscriptions.png)

### Consumer jobs inspection

The consumer jobs inspection view provides real-time visibility into the jobs running at the current moment on a given consumer instance.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-consumer-jobs.png)

## Health

The health view of the Web UI displays the current status of all the running Karafka instances aggregated on a per-consumer-group basis. This view allows users to monitor the health of their messages consumption and troubleshoot any issues that may arise. It also allows quick identification of performance bottlenecks and can help with capacity planning.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-health.png)

## Explorer

Data Explorer is a feature that allows users to explore data stored in Kafka topics. It provides an interface for the exploration and enables users to perform real-time data analysis and troubleshoot any issues. Explorer understands the routing table and can deserialize data before it is displayed.

Topics list view:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-explorer1.png)

Messages list view:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-explorer2.png)

Message view with deserialized payload:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-explorer3.png)

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

DLQ dispatched messages view:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-dead1.png)

DLQ dispatched per message view:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/dlq2.png)
