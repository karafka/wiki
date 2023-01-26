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
- Average CPU load from the last minute, 5 minutes and 15 minutes
- Threads utilization from the last 60 seconds

Those metrics can allow you to identify bottlenecks (CPU vs IO) in your running Karafka consumers.

## Health

## Explorer

## Errors

## DLQ / Dead
