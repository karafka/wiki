Karafka Web UI contains several features allowing you to understand your system's karafka consumption process.

Below you can find a comprehensive description of the most important features you can use.

**Note**: Karafka Pro offers enhanced Web UI with many additional metrics and functionalities.

## Consumers

**Note**: More metrics and detailed consumers inspection are available only in our Pro offering.

The consumers status view allows users to view and monitor the performance of Kafka-running consumers. The page displays real-time data and aggregated metrics about the status of the consumers, such as their current offset, lag, the current state of consumers, and others.

![karafka web consumers view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/consumers.png)

The following metrics are available for each consumer:

- `Started` - The moment when the given consumer process was started.
- `Memory` - RSS (Resident Set Size) measures memory usage in an operating system. It represents the portion of a process's memory held in RAM and is "resident" in the system.
- `Utilization` - Displays the number of threads in a given process against a number of threads actively processing data in a given moment.
- `Total lag` - Sumed lag from all the partitions actively consumed by a given process.

## Jobs

**Note**: More metrics are available in our Pro offering.

This page provides a real-time view of the jobs that are currently being processed, including information such as:

- `Process` - Process name where the job is running.
- `Topic` - Topic and partition which the job is processing.
- `Consumer` - Class of the consumer that is running.
- `Type` - Type of work: `#consume`, `#revoke` or `#shutdown`
- `Started at` - Since when the job is running.

![karafka web jobs view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/jobs.png)

## Health

**Note**: This functionality is available only in our Pro offering.

This dashboard view shows Karafka consumers' groups' health state with their lag aggregated information and basic trends.

Here you can learn more about the information available in this dashboard view.

![karafka web health view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/health.png)

## Routing

The Routing UI view allows users to inspect Karafka's routing configuration, including details about particular topics.

![karafka web routing view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/routing1.png)

![karafka web routing view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/routing2.png)

## Explorer

**Note**: This functionality is available only in our Pro offering.

Data explorer allows users to view and explore the data produced to Kafka. It understands the routing table and can deserialize data before it being displayed. It allows for quick investigation of both payload and header information.  

![karafka web explorer view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/explorer3.png)

## Errors

**Note**: More backtrace and high-scale features are available in our Pro offering.

A Karafka errors page UI view is a user interface that allows users to inspect errors occurring during a Kafka-based application built with Karafka. It includes the following information:

- `Origin` - Topic and partition from which the error comes or code location for non-consumption related errors.
- `Process name` - Name of the process on which the error occurred.
- `Error` - Error type.
- `Occurred at` - Moment in time when the error occurred.

![karafka web errors view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/errors1.png)

![karafka web error view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/errors2.png)

## DLQ / Dead

**Note**: This functionality is available only in our Pro offering.

The Dead Letter Queue (DLQ) dashboard allows users to view messages that have failed to be processed and were skipped and moved to the Dead Letter Queue topic with their original details.

![karafka web dlq view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/dlq1.png)

![karafka web dlq view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/dlq2.png)

## Cluster

The Cluster dashboard view displays information about the status of the Kafka cluster and the topics list.

![karafka web cluster view](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/cluster1.png)
