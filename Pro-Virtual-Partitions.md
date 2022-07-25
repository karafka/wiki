Virtual Partitions allow you to parallelize the processing of data coming from a single partition. This can drastically increase throughput when IO operations are involved.

While the default scaling strategy for Kafka consumers is to increase partitions count and number of consumers, in many cases, this will not provide you with desired effects. In the end, you cannot go with this strategy beyond the assignment of one process per single topic partition. That means that without a way to parallelize the work further, IO may become your biggest bottleneck.

Virtual Partitions solve this problem by providing you with the means to further parallelize work by creating "virtual" partitions that will operate independently but will, as a collective processing unit, obey all the Kafka warranties.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/stats/virtual_partitions_performance.png" />
</p>
<p align="center">
  <small>*This example illustrates the performance difference for IO intense work where IO cost of a single message is 1ms.
  </small>
</p>

## Parallel processing

TBA

## Using virtual partitions

TBA

### Partitioning based on the partition key

TBA

### Partitioning based on the payload

TBA

## Monitoring

TBA

## Behaviour on errors

TBA

## Ordering warranties

TBA

## Manual offset management

TBA

## Usage with Long-Running Jobs

TBA
