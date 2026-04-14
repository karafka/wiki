## Basics

- [Why Kafka and Karafka](Basics-Why-Kafka-and-Karafka)
- [Getting Started](Basics-Getting-Started)
- [Code Editors and LLM Setup](Basics-Code-Editors-and-LLM-Setup)
- [Configuration](Basics-Configuration)
- [Producing Messages](Basics-Producing-Messages)
- [Consuming Messages](Basics-Consuming-Messages)
- [Consumer Groups vs Share Groups](Basics-Consumer-Groups-vs-Share-Groups)
- [Web UI](Web-UI-Getting-Started)
- [Testing](Basics-Testing)
- [Components](Basics-Components)
- [FAQ](Basics-FAQ)
- [Support](Basics-Support)
- [Status](Status)
- [Articles and Other References](Basics-Articles-and-Other-References)

## Web UI

- [About](Web-UI-About)
- [Getting Started](Web-UI-Getting-Started)
- [Configuration](Web-UI-Configuration)
- [Transactions](Web-UI-Transactions)
- [Features](Web-UI-Features)
    - [Consumers](Web-UI-Features#consumers)
    - [Jobs](Web-UI-Features#jobs)
    - [Health](Web-UI-Features#health)
    - [Routing](Web-UI-Features#routing)
    - [Explorer](Web-UI-Features#explorer)
    - [Errors](Web-UI-Features#errors)
    - [DLQ / Dead](Web-UI-Features#dlq-dead)
    - [Cluster](Web-UI-Features#cluster)
    - [Status](Web-UI-Features#status)
- [Tagging](Web-UI-Tagging)
- [Multi App Mode](Web-UI-Multi-App)
- [Single Process Setup](Web-UI-Single-Process-Setup)
- [Development vs Production](Web-UI-Development-vs-Production)
- [Data Management](Web-UI-Data-Management)
- [Operational Cost Breakdown](Web-UI-Operational-Cost-Breakdown)
- [Components](Web-UI-Components)

## WaterDrop

- [About](WaterDrop-About)
- [Getting Started](WaterDrop-Getting-Started)
- [Configuration](WaterDrop-Configuration)
- [Usage](WaterDrop-Usage)
- [Error Handling](WaterDrop-Error-Handling)
- [Monitoring and Logging](WaterDrop-Monitoring-and-Logging)
- [Transactions](WaterDrop-Transactions)
- [Testing](WaterDrop-Testing)
- [Middleware](WaterDrop-Middleware)
- [Labeling](WaterDrop-Labeling)
- [Variants](WaterDrop-Variants)
- [Custom Partitioners](WaterDrop-Custom-Partitioners)
- [Idempotence and Acknowledgements](WaterDrop-Idempotence-and-Acknowledgements)
- [Connection Management](WaterDrop-Connection-Management)
- [Connection Pool](WaterDrop-Connection-Pool)
- [Async Ecosystem Integration](WaterDrop-Async-Integration)
- [Instrumentation Events](WaterDrop-Instrumentation-Events)
- [Reconfiguration](WaterDrop-Reconfiguration)

## Consumer Groups

- [Routing](Consumer-Groups-Routing)
- [Consuming Messages](Basics-Consuming-Messages)
- [Concurrency and Multithreading](Consumer-Groups-Concurrency-and-Multithreading)
- [Deserialization](Consumer-Groups-Deserialization)
- [Offset Management (Checkpointing)](Consumer-Groups-Offset-management)
- [Pausing, Seeking and Rate-Limiting](Consumer-Groups-Pausing-Seeking-and-Rate-Limiting)
- [Dead Letter Queue](Consumer-Groups-Dead-Letter-Queue)
- [Active Job](Consumer-Groups-Active-Job)
- [Inline Insights](Consumer-Groups-Inline-Insights)
- [Assignments Tracking](Consumer-Groups-Assignments-Tracking)
- [Error Handling and Back Off Policy](Consumer-Groups-Error-Handling-and-Back-Off-Policy)
- [Persistent Pausing](Consumer-Groups-Persistent-Pausing)

## Share Groups

- [Coming Soon](Share-Groups-Coming-Soon)

## Infrastructure

### Operations

- [Development vs Production](Infrastructure-Application-Development-vs-Production)
- [Deployment](Infrastructure-Deployment)
    - [systemd (+ Capistrano)](Infrastructure-Deployment#systemd-capistrano)
    - [Docker](Infrastructure-Deployment#docker)
    - [AWS + MSK (Fully Managed Apache Kafka)](Infrastructure-Deployment#aws-msk-fully-managed-apache-kafka)
    - [Heroku](Infrastructure-Deployment#heroku)
    - [Kubernetes](Infrastructure-Deployment#kubernetes)
    - [Confluent Cloud](Infrastructure-Deployment#confluent-cloud)
    - [Custom OAuth Token Providers](Infrastructure-Deployment#custom-oauth-token-providers)
- [Signals and States](Infrastructure-Signals-and-States)
- [Monitoring and Logging](Infrastructure-Monitoring-and-Logging)
- [Instrumentation Events](Infrastructure-Instrumentation-Events)
- [CLI](Infrastructure-CLI)
- [Exit codes](Infrastructure-Exit-codes)

### Configuration

- [Integrating with Ruby on Rails and other frameworks](Infrastructure-Integrating-with-Ruby-on-Rails-and-other-frameworks)
- [Declarative Topics](Infrastructure-Declarative-Topics)
- [Env Variables](Infrastructure-Env-Variables)
- [Multi-Cluster Setup](Infrastructure-Multi-Cluster-Setup)
- [Active Record Connections Management](Infrastructure-Active-Record-Connections-Management)
- [Embedding](Infrastructure-Embedding)
- [Swarm / Multi Process](Infrastructure-Swarm-Multi-Process)
- [Forking](Infrastructure-Forking)
- [Auto reload of code changes in development](Infrastructure-Auto-reload-of-code-changes-in-development)
- [Admin API](Infrastructure-Admin-API)
- [ACLs API](Infrastructure-Admin-Acls-API)
- [Configs API](Infrastructure-Admin-Configs-API)
- [Replication API](Infrastructure-Admin-Replication-API)
- [Recovery API](Infrastructure-Admin-Recovery-API)

### Reliability

- [Latency and Throughput](Infrastructure-Latency-and-Throughput)
- [Resources Management](Infrastructure-Resources-Management)
- [Broker Failures and Fault Tolerance](Infrastructure-Broker-Failures-and-Fault-Tolerance)
- [AWS MSK Guide](Infrastructure-AWS-MSK-Guide)

### Troubleshooting

- [Problems and Troubleshooting](Infrastructure-Problems-and-Troubleshooting)
- [Debugging](Infrastructure-Debugging)
- [Topic Auto Creation](Infrastructure-Topic-Auto-Creation)

## Karafka Pro

- [Build vs. Buy](Pro-Build-vs-Buy)
- [Purchase Karafka Pro](Pro-Purchase-Karafka-Pro)
- [Getting Started](Pro-Getting-Started)
- [Rotating credentials](Pro-Rotating-Credentials)
- [Pro FAQ](Pro-FAQ)
- [Pro Support](Pro-Support)
- [Commercial License](Pro-License-Comm)
- [Security](Pro-Security)
- [Compliance Certifications](Pro-Compliance-Certifications)
- [HIPAA, PHI, PII Support](Pro-HIPAA-PHI-PII-Support)
- [FIPS Support](Pro-FIPS-Support)
- [Enterprise](Pro-Enterprise)
- [Enterprise Architecture Consultation](Pro-Enterprise-Architecture-Consultation)
- [Enterprise Workshop Session](Pro-Enterprise-Workshop-Session)
- [Enterprise License Setup](https://karafka.io/docs/Pro-Enterprise-License-Setup)

### Features and Enhancements

- [Features List](Pro-Features-List)
- [Features Compatibility](Pro-Features-Compatibility)
- [Routing Patterns](Pro-Routing-Patterns)
- [Cleaner API](Pro-Cleaner-API)
- [Recurring Tasks](Pro-Recurring-Tasks)
- [Scheduled Messages](Pro-Scheduled-Messages)
- [Messages At Rest Encryption](Pro-Messages-At-Rest-Encryption)
- [Enhanced Swarm / Multi Process](Pro-Enhanced-Swarm-Multi-Process)
- [Optimized Statistics Processing](Pro-Optimized-Statistics-Processing)

### Consumer Groups Features

- [Transactions](Pro-Consumer-Groups-Transactions)
- [Offset Metadata Storage](Pro-Consumer-Groups-Offset-Metadata-Storage)
- [Virtual Partitions](Pro-Consumer-Groups-Virtual-Partitions)
- [Parallel Segments](Pro-Consumer-Groups-Parallel-Segments)
- [Delayed Topics](Pro-Consumer-Groups-Delayed-Topics)
- [Long-Running Jobs](Pro-Consumer-Groups-Long-Running-Jobs)
- [Non-Blocking Jobs](Pro-Consumer-Groups-Non-Blocking-Jobs)
- [Adaptive Iterator](Pro-Consumer-Groups-Adaptive-Iterator)
- [Scheduling API](Pro-Consumer-Groups-Scheduling-API)
- [Iterator API](Pro-Consumer-Groups-Iterator-API)
- [Granular Backoffs](Pro-Consumer-Groups-Granular-Backoffs)
- [Direct Assignments](Pro-Consumer-Groups-Direct-Assignments)
- [Multiplexing](Pro-Consumer-Groups-Multiplexing)
- [Enhanced Dead Letter Queue](Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue)
- [Enhanced Active Job](Pro-Consumer-Groups-Enhanced-Active-Job)
- [Enhanced Reliability](Pro-Consumer-Groups-Enhanced-Reliability)
- [Enhanced Inline Insights](Pro-Consumer-Groups-Enhanced-Inline-Insights)
- [Periodic Jobs](Pro-Consumer-Groups-Periodic-Jobs)
- [Expiring Messages](Pro-Consumer-Groups-Expiring-Messages)
- [Rate Limiting](Pro-Consumer-Groups-Rate-Limiting)
- [Filtering API](Pro-Consumer-Groups-Filtering-API)
- [Piping](Pro-Consumer-Groups-Piping)

### Share Groups Features

- [Coming Soon](Pro-Share-Groups-Coming-Soon)

### Enhanced Web UI

- [About](Pro-Web-UI)
- [Getting Started](Pro-Web-UI#getting-started)
- [Consumers](Pro-Web-UI#consumers)
- [Commanding](Pro-Web-UI-Commanding)
- [Health](Pro-Web-UI-Health)
- [Explorer](Pro-Web-UI#explorer)
- [Policies](Pro-Web-UI-Policies)
- [Search](Pro-Web-UI-Search)
- [Recurring Tasks](Pro-Web-UI#recurring-tasks)
- [Scheduled Messages](Pro-Web-UI#scheduled-messages)
- [Topics Insights](Pro-Web-UI-Topics-Insights)
- [Errors](Pro-Web-UI#errors)
- [DLQ / Dead](Pro-Web-UI#dlq-dead)
- [Branding](Pro-Web-UI#branding)
- [Custom Styling](Pro-Web-UI#custom-styling)
- [Topics Management](Pro-Web-UI-Topics-Management)

## Librdkafka

- [Configuration](Librdkafka-Configuration)
- [Statistics](Librdkafka-Statistics)
- [Errors](Librdkafka-Errors)
- [Changelog](Librdkafka-Changelog)

## Kafka

- [Kafka Setup](Kafka-Setup)
- [Best Practices](Kafka-Best-Practices)
- [Topic Configuration](Kafka-Topic-Configuration)
- [Cluster Configuration](Kafka-Cluster-Configuration)
- [New Rebalance Protocol (KIP-848)](Kafka-New-Rebalance-Protocol)

## Upgrade Notes

- [Upgrading](Upgrades-Upgrading)
- [Versions Lifecycle and EOL](Upgrades-Versions-Lifecycle-and-EOL)

It is recommended to do one major upgrade at a time.

- [Karafka](Upgrades-Karafka)
    - [2.5](Upgrades-Karafka-2.5)
    - [2.4](Upgrades-Karafka-2.4)
    - [2.3](Upgrades-Karafka-2.3)
    - [2.2](Upgrades-Karafka-2.2)
    - [2.1](Upgrades-Karafka-2.1)
    - [2.0](Upgrades-Karafka-2.0)

- [Web UI](Upgrades-Web-UI)
    - [0.11](Upgrades-Web-UI-0.11)
    - [0.10](Upgrades-Web-UI-0.10)
    - [0.9](Upgrades-Web-UI-0.9)
    - [0.8](Upgrades-Web-UI-0.8)
    - [0.7](Upgrades-Web-UI-0.7)
    - [0.6](Upgrades-Web-UI-0.6)
    - [0.5](Upgrades-Web-UI-0.5)
    - [0.4](Upgrades-Web-UI-0.4)
    - [0.3](Upgrades-Web-UI-0.3)

- [WaterDrop](Upgrades-WaterDrop)
    - [2.10](Upgrades-WaterDrop-2.10)
    - [2.9](Upgrades-WaterDrop-2.9)
    - [2.8](Upgrades-WaterDrop-2.8)
    - [2.7](Upgrades-WaterDrop-2.7)
    - [2.6](Upgrades-WaterDrop-2.6)
    - [2.5](Upgrades-WaterDrop-2.5)

## Changelogs

- [Karafka](Changelog-Karafka)
- [WaterDrop](Changelog-WaterDrop)
- [Karafka-Web](Changelog-Karafka-Web-UI)
- [Karafka-Testing](Changelog-Karafka-Testing)
- [Karafka-Core](Changelog-Karafka-Core)
- [Karafka-Rdkafka](Changelog-Karafka-Rdkafka)
- [Rdkafka](Changelog-Rdkafka)
- [Librdkafka](Librdkafka-Changelog)

## Code Docs

- [Karafka](https://karafka.io/docs/code/karafka)
- [WaterDrop](https://karafka.io/docs/code/waterdrop)
- [Karafka-Web](https://karafka.io/docs/code/karafka-web)
- [Karafka-Testing](https://karafka.io/docs/code/karafka-testing)
- [Karafka-Core](https://karafka.io/docs/code/karafka-core)
- [Karafka-Rdkafka](https://karafka.io/docs/code/karafka-rdkafka)
- [Rdkafka](https://karafka.io/docs/code/rdkafka)

## Development

- [Gems Publishing](Development-Gems-Publishing)
- [Precompilation](Development-Precompilation)
- [Native Extensions](Development-Native-Extensions)
- [Naming Conventions](Development-Naming-Conventions)
- [LLM Documentation Guidelines](Development-LLM-Documentation-Guidelines)
- [Librdkafka Update Release Policy](Development-Librdkafka-Update-Release-Policy)
- [Karafka Integration Tests Catalog](Development-Karafka-Integration-Tests-Catalog)
- [Software Bill of Materials (SBOM)](Development-SBOM)
- [Code Quality and Linting Setup](Development-Code-Quality-Linting-Setup)
- [Technical Writing](Development-Technical-Writing)
- [KIP-932 Karafka](Development-KIP-932-Karafka)
- [KIP-932 Web UI](Development-KIP-932-Web-UI)
- [KIP-932 Rdkafka](Development-KIP-932-Rdkafka)
