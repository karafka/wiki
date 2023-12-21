# Karafka Pro Features List

Karafka Pro is a commercial version of the open-source Karafka framework for building Ruby Kafka-based applications.

Below you can find the list of the Pro features with their brief description:

- [Enhanced Web UI](Pro-Enhanced-Web-UI) - The Enhanced Web UI offers additional features and capabilities that are not available in the free version, making it a better option for those looking for more robust monitoring and management capabilities for their Karafka applications.

- [Virtual Partitions](Pro-Virtual-Partitions) - Virtual Partitions allow you to parallelize data processing from a single partition. This can drastically increase throughput when IO operations are involved.

- [Delayed Topics](Pro-Delayed-Topics) - Delayed Topics feature allows for arbitrary delay in processing messages from specified topics without impacting the processing of other topics.

- [Long-Running Jobs](Pro-Long-Running-Jobs) - Long-Running Jobs are jobs that run continuously and handle messages from a Kafka topic over an extended time beyond `max.poll.interval.ms`. These jobs are designed to handle tasks requiring longer execution times, such as data processing, transformation, and analysis.

- [Expiring Messages](Pro-Expiring-Messages) - Karafka's Expiring Messages feature allows messages to be excluded from processing automatically in case they are too old.

- [Routing Patterns](Pro-Routing-Patterns) - Karafka's Routing Patterns feature allows users to define routes using regular expressions. When a Kafka topic matches the specified pattern, Karafka automatically initiates consumption, streamlining the handling of dynamically created topics without manual configuration.

- [Rate Limiting](Pro-Rate-Limiting) - Rate limiting allows you to control the pace at which messages are consumed.

- [Filtering API](Pro-Filtering-API) - The Filtering API allows users to filter messages based on specific criteria, reducing the amount of data that needs to be processed downstream. It also provides advanced ways of altering the consumption flow by allowing for explicit pausing and seeking before the actual processing happens.

- [Iterator](Pro-Iterator-API) - Iterator API allows you to quickly subscribe to selected topics and partitions and perform data lookups without having to start a `karafka server` and create consumers.

- [Granular Backoffs](Pro-Granular-Backoffs) - Granular Backoffs provide heightened control over backing off, pausing, and retrying processing upon errors. This feature offers per-topic customization of the error-handling strategy.

- [Cleaner API](Pro-Cleaner-API) - The Cleaner API efficiently releases messages payloads from memory after processing, optimizing memory management during batch operations.

- [Multiplexing](Pro-Multiplexing) - This feature allows a single process to establish multiple independent connections to the same Kafka topic, enhancing parallel processing and throughput. This capability enables more efficient data handling and improved performance in consuming messages.

- [Messages At Rest Encryption](Pro-Messages-At-Rest-Encryption) - Karafka Pro supports transparent encryption of the message's payload, so sensitive data at rest in Kafka cannot be seen.

- [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) - Enhanced Dead Letter Queue feature provides additional functionalities and warranties to the regular [Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) feature. It aims to complement it with other dispatch warranties and additional messages metadata information.

- [Enhanced Active Job](Pro-Enhanced-Active-Job) - Enhanced Active Job adapter provides extra capabilities to regular Active Job to elevate the combination of Active Job and Kafka.

- [Enhanced Reliability](Pro-Enhanced-Reliability) - Enhanced Reliability provides improvements to achieve better performance and stability, especially on jobs that perform IO operations.

- [Commercial Friendly License](https://github.com/karafka/karafka/blob/master/LICENSE-COMM) - Besides its useful functionalities, buying Karafka Pro grants your organization a Karafka commercial license instead of the GNU LGPL, avoiding any legal issues your lawyers might raise. Please see the [Pro FAQ](/docs/Pro-FAQ) for further licensing details, including options for distributing Karafka Pro with your products.
