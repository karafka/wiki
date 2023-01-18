Karafka Pro is a commercial version of the open-source Karafka framework for building Ruby Kafka-based applications.

Below you can find the list of the Pro features with their brief description:

- [Virtual Partitions](Pro-Virtual-Partitions) - Virtual Partitions allow you to parallelize data processing from a single partition. This can drastically increase throughput when IO operations are involved.
- [Long-Running Jobs](Pro-Long-Running-Jobs) - Long-Running Jobs are jobs that run continuously and handle messages from a Kafka topic over an extended time beyond `max.poll.interval.ms`. These jobs are designed to handle tasks requiring longer execution times, such as data processing, transformation, and analysis.
- [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) - Enhanced Dead Letter Queue feature provides additional functionalities and warranties to the regular [Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) feature. It aims to complement it with other dispatch warranties and additional messages metadata information.
- [Enhanced Active Job](Pro-Enhanced-Active-Job) - Enhanced Active Job adapter provides extra capabilities to regular Active Job to elevate the combination of Active Job and Kafka.
- [Enhanced Scheduler](Pro-Enhanced-Scheduler) - The Enhanced Scheduler uses a non-preemptive LJF (Longest Job First) algorithm to achieve better performance, especially on jobs that perform IO operations.
- [Messages At Rest Encryption](Pro-Messages-At-Rest-Encryption) - Karafka Pro supports transparent encryption of the message's payload, so sensitive data at rest in Kafka cannot be seen.
