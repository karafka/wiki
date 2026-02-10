# Enterprise Architecture Consultation

Karafka Enterprise includes **4 hours per year** of dedicated architecture consultation with Maciej Mensfeld, the creator and lead maintainer of Karafka ecosystem. These sessions provide direct access to deep Kafka and Karafka expertise that can help you navigate complex architectural decisions, optimize performance, and avoid common pitfalls that can cost weeks of engineering time.

## Why Architecture Consultation Matters

Kafka-based systems present unique challenges that aren't immediately obvious from documentation alone. The difference between a well-architected Kafka implementation and a problematic one often comes down to subtle configuration choices, partition strategies, and processing patterns that only become apparent under production load.

Common issues that seem straightforward but have significant implications include:

- **Message duplication vs. message loss trade-offs** - Understanding delivery guarantees and their real-world impact on your specific use case
- **Partition strategy decisions** - Choosing between fewer partitions with virtual partitioning vs. more physical partitions
- **Consumer group topology** - Balancing connection overhead against processing parallelism
- **Rebalancing behavior** - Minimizing disruption during deployments and scaling events
- **Resource allocation** - Right-sizing thread pools, connection counts, and memory buffers

A single architectural decision made early can save (or cost) your team weeks of debugging and refactoring later.

## What I Can Help With

### Karafka Application Architecture

Designing your Karafka application for maintainability and performance:

- **Routing structure design** - Organizing consumers, topics, and subscription groups for clarity and efficiency
- **Consumer class organization** - Balancing single-responsibility principles with practical code structure
- **Dead Letter Queue design** - Structuring error handling flows and retry strategies
- **Transactional processing patterns** - Coordinating Kafka transactions with database operations
- **Multi-app topology** - Splitting responsibilities across multiple Karafka applications

### Pro Features Strategy

Maximizing value from Karafka Pro capabilities:

- **Virtual Partitions** - When they help vs. when physical partitions are better for your workload
- **Long-Running Jobs** - Handling jobs that exceed poll intervals without losing progress
- **Enhanced Dead Letter Queue** - Advanced retry patterns and error categorization
- **Scheduled Messages** - Implementing delayed processing and time-based workflows
- **Filtering API** - Building efficient filters for high-volume topics
- **Periodic Jobs** - Scheduling recurring tasks within Karafka
- **Multiplexing and Piping** - Complex message routing between topics
- **Adaptive Iterator** - Processing large batches with memory efficiency

### Web UI Deployment and Operations

Getting the most out of Karafka's Web UI:

- **Deployment architecture** - Standalone vs. embedded deployment, multi-app visibility
- **Topic configuration optimization** - Retention, compaction, and partition settings for Web UI topics
- **Multi-cluster monitoring** - Configuring Web UI for visibility across multiple Kafka clusters
- **Access control and security** - Authentication and authorization strategies for production dashboards
- **Operational cost optimization** - Minimizing network and storage costs while maintaining visibility
- **Explorer and data inspection** - Using Web UI for debugging and message inspection

### Integration Patterns

Connecting Karafka with your existing stack:

- **Rails integration** - Proper initialization, connection management, and request/background separation
- **ActiveJob backend** - When to use Karafka as a job backend vs. dedicated message processing
- **ActiveRecord connections** - Managing database connection pools with concurrent consumers
- **Testing strategies** - Unit testing consumers, integration testing with Kafka, and CI/CD setup
- **Monitoring integration** - DataDog, AppSignal, StatsD, and custom instrumentation

### Performance Optimization

Production systems often exhibit unexpected behavior:

- Latency spikes during batch processing that don't correlate with load
- Consumer lag accumulating despite adequate resources
- Memory growth patterns that don't match expected consumption
- Throughput plateaus that resist straightforward scaling attempts
- Network utilization suggesting inefficient batching or compression

I can review your configuration, identify bottlenecks, and recommend specific tuning parameters based on your workload characteristics.

### Scaling and Deployment

Planning for growth and production operations:

- **Horizontal scaling** - Partition assignment strategies and consumer group sizing
- **Swarm mode** - Multi-process deployments with copy-on-write optimization
- **Kubernetes patterns** - Container orchestration, health checks, and graceful shutdown
- **Graceful deployments** - Minimizing rebalancing impact during releases
- **Multi-cluster setup** - Disaster recovery and geographic distribution

### Migration Planning

Moving to Karafka from another framework or upgrading major versions:

- Migration path from Racecar, ruby-kafka, or custom implementations
- Upgrade strategies between Karafka major versions
- Transitioning from OSS to Pro features with minimal disruption
- Rolling deployment approaches that minimize rebalancing impact

## Example Consultation Scenarios

### Scenario: E-commerce Order Processing

A retail company processes 50,000 orders daily through Kafka. They're experiencing occasional duplicate order processing and aren't sure if it's a Kafka configuration issue or application logic.

**Consultation focus**: Review delivery guarantee configuration, examine offset commit patterns, discuss idempotency strategies, and design a verification approach.

### Scenario: Financial Data Pipeline

A fintech startup needs to ensure exactly-once processing for transaction records while maintaining sub-100ms latency for 95th percentile.

**Consultation focus**: Analyze latency/throughput trade-offs in their configuration, review transaction usage patterns, optimize batching parameters, and design monitoring for SLA verification.

### Scenario: Multi-Region Deployment

An enterprise is expanding from single-region to multi-region Kafka deployment and needs to understand the implications for their Karafka consumers.

**Consultation focus**: Multi-cluster configuration review, consumer group strategies across regions, failover and disaster recovery planning, and data consistency considerations.

### Scenario: High-Volume Event Streaming

A SaaS platform ingests millions of events daily and is planning to migrate from a custom Kafka consumer to Karafka Pro.

**Consultation focus**: Migration planning, Virtual Partitions strategy for their workload, resource estimation, and phased rollout approach.

## How to Use Your Consultation Hours

The 4 hours can be used flexibly throughout your subscription year:

- **Single deep-dive session** - Use all 4 hours for comprehensive architecture review
- **Multiple shorter sessions** - Split into 1-2 hour sessions as questions arise
- **Mixed approach** - Initial 2-hour planning session, with remaining hours for follow-up

Sessions are conducted remotely via video call. You can share your screen to walk through code, configuration, and monitoring dashboards for real-time analysis.

## Preparing for Your Session

To maximize the value of consultation time:

1. **Document your current architecture** - Topology diagrams, topic structures, consumer group configurations
2. **Gather metrics** - Consumer lag trends, throughput numbers, latency percentiles
3. **List specific questions** - Prioritize the issues you most need guidance on
4. **Prepare access** - Have staging/development environment access ready for live review if needed

## Terms & Conditions

1. **Karafka Enterprise Subscription**: You must have an active paid Karafka Enterprise subscription.
2. **Advance Notice**: Schedule sessions at least one week in advance.
3. **Session Duration**: Minimum 1-hour blocks; 4 hours total per subscription year.
4. **Carryover**: Unused hours do not carry over to the next subscription year.
5. **Scope**: Consultation covers Karafka, WaterDrop, and related Kafka architecture. Custom application development is not included.
6. **Confidentiality**: All discussions and shared materials are treated as confidential.

---

## See Also

- [Enterprise](Pro-Enterprise) - For comprehensive information about Karafka Enterprise
- [Enterprise Workshop Session](Pro-Enterprise-Workshop-Session) - For details about the included training workshop
- [Support](Pro-Support) - For details about enterprise support offerings
