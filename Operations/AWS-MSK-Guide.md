# AWS MSK Guide

This document addresses the unique operational characteristics and recurring issues observed when running Karafka with AWS Managed Streaming for Apache Kafka (MSK) and MSK Express. While AWS MSK provides a fully managed Kafka service, it introduces several distinct behaviors compared to other Kafka vendors that affect how Karafka and librdkafka operate.

Over time, users of the Karafka and rdkafka ecosystems have reported numerous recurring incidents specific to MSK deployments that rarely occur with other vendors. Issues such as `unknown_partition` errors during consumption, authentication failures after cluster maintenance, and complete consumer group stalls during broker patching prompted the creation of this guide.

While some documented issues may occur with other Kafka deployments, this guide is built on the collective experience of production MSK incidents, workarounds, and solutions discovered by the community. Each pattern and solution has been validated in real MSK environments where these problems consistently manifested.

!!! note "Help Improve This Guide"

    This document aims to be a comprehensive, community-driven resource aggregating real-world MSK operational knowledge. If you encounter MSK-related issues not covered here or have alternative solutions to documented problems, please reach out and share your experience. Your insights help build a more complete picture of MSK operational patterns and strengthen the collective knowledge base for the entire community.

## MSK vs. Other Kafka Vendors

The most significant operational difference between MSK and other Kafka vendors lies in their maintenance and update strategies.

MSK performs maintenance via rolling updates, rebooting brokers one at a time. During this process, brokers are taken offline sequentially, and Kafka automatically moves leadership to another online broker. The next broker isn't rebooted until the partitions on the current broker fully catch up (become in sync). A broker size update typically takes 10-15 minutes per broker, so maintenance for a 6-broker cluster can take up to 90 minutes.

When updating cluster configurations, Amazon MSK performs rolling restarts when necessary. After restarting each broker, MSK lets the broker catch up on any data it might have missed during the configuration update before moving to the next broker. This sequential approach prioritizes cluster availability over update speed.

!!! warning "Dual-Broker Outages During Maintenance"

    Some Karafka users have observed instances where two brokers appear offline simultaneously during maintenance operations. It remains unclear whether these occurrences result from MSK taking down one broker for maintenance while another crashes independently, or whether MSK occasionally begins updating the next broker before the previous one fully completes its restart and catch-up process. These dual-broker outages significantly impact cluster availability and will be addressed in the configuration recommendations throughout this guide.

Beyond scheduled maintenance, AWS performs unplanned "heal cluster" operations to replace unhealthy brokers or rebalance availability zones. These operations occur automatically without advance notification when AWS detects infrastructure degradation or needs to maintain zone balance.

### MSK Express vs Standard Brokers

MSK offers two distinct broker types with different maintenance approaches:

Express brokers have no maintenance windows - Amazon MSK automatically updates cluster hardware on an ongoing basis. Express brokers always replicate data and are configured with best-practice settings and guardrails that should make clusters resilient to load changes during maintenance. These improvements should eliminate the need for advance notifications, planning, and maintenance windows.

Standard brokers follow the traditional rolling update pattern described above. During this update process, AWS expects transient disconnect errors on clients as a normal part of the maintenance procedure. Customers receive advance notification of planned maintenance, but must configure their applications to handle rolling broker restarts.

!!! tip "Monitor MSK Express Despite No Maintenance Windows"

    While MSK Express eliminates scheduled maintenance windows, proper instrumentation and monitoring remain essential. There have been rare but documented cases where MSK Express automatic updates caused librdkafka to enter non-recoverable states, requiring consumer or producer instance restarts. Always maintain robust monitoring and automated recovery mechanisms even with Express brokers.

## Expected Errors

This section covers errors that are normal operational events in MSK deployments. Understanding which errors are expected versus problematic helps avoid unnecessary troubleshooting and panic during routine MSK operations.

### Transport and Network Failures

Transport errors are among the most common operational occurrences in MSK deployments. These errors, typically manifesting as `transport` failures in librdkafka logs and Karafka error pipeline, are **expected and normal** during various MSK operations, including broker restarts, network blips, and AWS infrastructure events.

These errors typically self-recover once network connectivity is restored or brokers complete their restart cycle. However, default configurations often prove insufficient for MSK's cloud environment, where cross-AZ latency, authentication overhead, and maintenance operations create longer interruption periods than typical on-premise deployments.

Transport errors should be expected during:

- **MSK maintenance windows** - Each broker restart triggers connection failures
- **Heal cluster operations** - Automatic broker replacements cause unexpected disconnections  
- **Network infrastructure events** - AWS networking updates or failures
- **Cross-AZ communication** - Temporary network partitions between availability zones
- **Security group propagation** - Changes to security groups can take 30-60 seconds to propagate
- **Initial cluster connection** - Especially with IAM authentication which has additional handshake overhead

MSK environments require more aggressive retry configurations than typical Kafka deployments due to longer recovery times during maintenance operations and cross-AZ network latency.

Essential retry parameters for MSK:

```ruby
config.kafka = {
  'metadata.recovery.strategy': 'rebootstrap',
  'topic.metadata.refresh.interval.ms': 30_000,
  'metadata.max.age.ms': 90_000,
  'socket.connection.setup.timeout.ms': 45_000,
  'socket.timeout.ms': 90_000,
  'retry.backoff.ms': 250,
  'retry.backoff.max.ms': 1000,
  'reconnect.backoff.ms': 250,
  'reconnect.backoff.max.ms': 10_000,
  'request.timeout.ms': 60_000,
  'socket.nagle.disable': true
}
```

### Message Timeout Configuration

The `message.timeout.ms` setting controls how long a producer waits for message delivery acknowledgment before giving up. This is critical for MSK deployments where maintenance operations and network issues can cause temporary delivery delays.

Default values differ between libraries:

<table>
  <thead>
    <tr>
      <th>Library</th>
      <th>Default <code>message.timeout.ms</code></th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>librdkafka</td>
      <td>300,000ms (5 minutes)</td>
    </tr>
    <tr>
      <td>WaterDrop</td>
      <td>50,000ms (50 seconds)</td>
    </tr>
  </tbody>
</table>

WaterDrop uses a [shorter default](https://github.com/karafka/waterdrop/blob/master/lib/waterdrop/config.rb) to provide faster feedback in typical deployments. However, MSK's maintenance operations and rolling updates can cause delivery delays that exceed 50 seconds, particularly during dual-broker outages.

**Recommended MSK configuration for standard producers:**

```ruby
config.kafka = {
  # Increase message timeout to handle MSK maintenance delays
  # For transactional producers, use transaction.timeout.ms instead (see below)
  'message.timeout.ms': 300_000 # 5 minutes, matching librdkafka default
}
```

#### Transactional Producer Timeout Configuration

When using transactional producers, timeout configuration requires additional attention. The `transaction.timeout.ms` setting controls how long the transaction coordinator waits before aborting an incomplete transaction. Critically, librdkafka automatically adjusts related timeout settings based on `transaction.timeout.ms`:

- `message.timeout.ms` is automatically adjusted to match `transaction.timeout.ms` when a `transactional.id` is configured
- `socket.timeout.ms` must be at least 100ms lower than `transaction.timeout.ms` if explicitly configured

Default transactional timeout values:

<table>
  <thead>
    <tr>
      <th>Setting</th>
      <th>librdkafka Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>transaction.timeout.ms</code></td>
      <td>60,000ms (60s)</td>
    </tr>
    <tr>
      <td><code>message.timeout.ms</code></td>
      <td>Adjusted to 60,000ms when transactional</td>
    </tr>
    <tr>
      <td><code>socket.timeout.ms</code></td>
      <td>Must be &lt; <code>transaction.timeout.ms</code> - 100ms</td>
    </tr>
  </tbody>
</table>

For MSK deployments with transactional producers, increase `transaction.timeout.ms` to accommodate maintenance delays:

```ruby
config.kafka = {
  'transactional.id': 'my-transactional-producer',
  # Increase transaction timeout for MSK maintenance tolerance
  'transaction.timeout.ms': 300_000, # 5 minutes
  # message.timeout.ms will be automatically adjusted to match
  # socket.timeout.ms if set explicitly must be at least 100ms less
  'socket.timeout.ms': 299_900
}
```

!!! warning "Transactional Timeouts Override Message Timeouts"

    When using transactions, setting only `message.timeout.ms` is insufficient. The transactional timeout takes precedence, and `message.timeout.ms` is automatically capped to `transaction.timeout.ms`. Always configure `transaction.timeout.ms` directly for transactional producers in MSK environments.

When the message timeout expires, the producer reports a `msg_timed_out` error. This error abstracts several underlying causes, all indicating that the producer was unable to successfully deliver the message to the broker within the timeout period.

**Common causes of `msg_timed_out`:**

- **Leader unavailable** - The partition leader is not available, either because leader election failed (no eligible replicas) or the leader broker is down
- **Connection failures** - Network problems preventing connection to the partition leader
- **Insufficient in-sync replicas** - The cluster cannot satisfy `min.insync.replicas` requirements (see [Not Enough Replicas](#not-enough-replicas))
- **Broker overload** - The broker is too slow to acknowledge messages within the timeout

!!! warning "Increase Timeout Before Investigating Further"

    If you encounter `msg_timed_out` errors in MSK, first increase `message.timeout.ms` to 300,000ms. Many MSK-related timeout issues resolve with this change alone, as it provides sufficient buffer for maintenance operations and temporary cluster instability.

### All Brokers Down - Why Consumers Recover

The `All brokers are down` error is particularly alarming but usually self-resolving. Understanding why consumers can recover from this state helps distinguish between temporary issues and actual failures.

**How consumers recover automatically:**

When Karafka reports "all brokers are down," it means librdkafka has temporarily lost connection to all known brokers. However, several mechanisms work to restore connectivity:

1. **Bootstrap servers are just entry points** - The bootstrap servers list is only used for initial cluster discovery. Once connected, librdkafka maintains a full list of all brokers in the cluster through metadata. Even if the original bootstrap servers become unavailable, consumers can reconnect through any broker they previously discovered.

2. **Continuous reconnection attempts** - librdkafka continuously attempts to reconnect to all known brokers using exponential backoff. It cycles through its entire broker list, not just the bootstrap servers, attempting connections with increasing delays between attempts.

3. **Metadata refresh on recovery** - Once any broker connection is restored, librdkafka immediately requests fresh cluster metadata, discovering any topology changes that occurred during the disconnection (new brokers, leadership changes, partition reassignments).

4. **Consumer group protocol handles rejoining** - After reconnection, consumers automatically rejoin their consumer groups. The consumer group coordinator manages this process, reassigning partitions as needed once the consumer is back online.

This recovery process means that consumers can survive:

- Complete bootstrap server failures (as long as other brokers are available)
- Temporary network partitions
- DNS resolution issues that resolve themselves
- Rolling broker restarts during maintenance
- Security group propagation delays

!!! info "Trust the Recovery Process"

    Unless "all brokers down" errors persist for longer than your configured `session.timeout.ms`, no intervention is required. Consumers will automatically recover, rejoin their groups, and resume processing from their last committed offsets. Premature restarts can actually slow recovery by interrupting the reconnection process.

## Consumer Fatal Errors

### Partition Count Changed from N to 0

This metadata synchronization issue presents as `rdkafka: [thrd:main]: Topic partition count changed from N to 0`, indicating librdkafka has either detected a topic deletion/recreation or is receiving corrupted or incomplete metadata from MSK brokers. While topic lifecycle changes are one cause, prolonged metadata inconsistency can also trigger this error even when topics remain unchanged.

!!! tip "Critical Error Except During Topic Operations"

    This error should be considered **critical** in stable production environments and warrants affected consumer restart - **except** when performing intentional topic lifecycle operations (deletion, recreation, repartitioning, replication factor changes). During planned topic operations, this error is expected as MSK metadata propagation can take 30+ seconds. In all other cases, this indicates a serious metadata synchronization problem that typically will not self-recover.

Across all reported cases, this error affected only individual consumer instances, never all consumers or a significant portion of the consumer group simultaneously. The affected consumer fails to recover its metadata while other consumers in the same group continue operating normally. However, partition reassignment does not occur - the partitions previously owned by the failing consumer remain assigned to it, causing lag to accumulate on those specific partitions while the consumer is unable to process messages.

**Automatic recovery implementation:**

```ruby
Karafka.monitor.subscribe('error.occurred') do |event|
  next unless event[:error].is_a?(Rdkafka::RdkafkaError)
  next unless event[:error].code == :unknown_partition
  
  # A bit of backoff and a graceful shutdown
  sleep(rand(60))
  Process.kill('TERM', Process.pid)
end
```

This ensures a clean restart rather than continuing with a potentially corrupted metadata state.

**Preventive configuration:**

```ruby
config.kafka = {
  # More aggressive metadata refresh to detect issues sooner
  'topic.metadata.refresh.interval.ms': 60000,       # 1 minute instead of 5
  'metadata.max.age.ms': 180000,                     # 3 minutes instead of 15
  
  # Account for MSK's propagation delays
  'topic.metadata.propagation.max.ms': 120000,        # 2 minutes
  
  # Recovery strategy if metadata becomes corrupted
  'metadata.recovery.strategy': 'rebootstrap',       # Re-bootstrap on metadata loss
  'metadata.recovery.rebootstrap.trigger.ms': 60000  # Trigger after 1 minute
}
```

These settings force more frequent metadata updates and enable automatic recovery attempts through re-bootstrapping when metadata becomes inconsistent.

!!! info "Capacity Planning for Metadata Stability"

    Always maintain at least 30-40% headroom on MSK and MSK Express instances. Running close to maximum recommended capacity significantly increases the risk of metadata synchronization failures, particularly with high partition counts. Monitor CPU utilization and partition counts against AWS recommended limits to ensure adequate operational margin.

Two MSK Express users reported cases where this error did **not** recover, requiring manual intervention. Both involved topics had more than 1000 partitions. In at least one confirmed case, MSK Express instances were running close to the recommended maximum capacity. The combination of high partition counts and near-capacity operation creates conditions where metadata becomes permanently skewed, possibly due to MSK Express's internal handling during automatic maintenance operations when resources are already constrained.

### Unknown Topic or Partition Errors from Broker

The broker-side error `Broker: Unknown topic or partition (unknown_topic_or_part)` indicates MSK cannot find the specified topic or partition, distinct from client-side metadata issues.

**Common causes with MSK:**

**ACL misconfiguration on public MSK clusters** is the leading cause. When `allow.everyone.if.no.acl.found=false` is set on the broker (MSK's default for public access), it supersedes `auto.create.topics.enable=true`. This means even if auto-creation is enabled, topics won't be created without explicit ACL permissions.

Always pre-create all topics before making the MSK cluster publicly accessible, or configure Kafka ACLs to grant topic creation and access permissions.

### SASL Authentication Errors After Healing Cluster Operations

MSK clusters enter a `HEALING` state when AWS runs internal operations to address infrastructure issues, such as replacing unhealthy or unresponsive brokers. While you can continue producing and consuming data during healing operations, SASL/SCRAM authenticated clusters may experience authentication failures after the cluster returns to `ACTIVE` state.

During healing, AWS replaces or restarts affected brokers while maintaining cluster availability. However, this process can disrupt SASL/SCRAM authentication state in ways that require manual intervention.

Common authentication failure scenarios:

- **Credential propagation delays** are the most frequent cause. Even after the cluster reports `ACTIVE` status with no pending changes, SASL/SCRAM credentials may take several minutes to propagate across all replaced or restarted brokers. During this window, clients receive authentication errors despite using correct credentials.

- **ACL state inconsistency** can occur when heal operations replace brokers. If the cluster uses ACLs (particularly with `allow.everyone.if.no.acl.found=false`), the newly replaced brokers may not immediately reflect the current ACL state. Clients can connect but cannot perform operations until ACL state synchronizes.

- **Secret association loss** has been reported in rare cases where AWS Secrets Manager secret associations with the MSK cluster become corrupted during broker replacements. This manifests as persistent authentication failures that resolve only after manually re-associating the secrets.

**Recovery procedures:**

For credential propagation delays (most common):

1. Wait 5-10 minutes after the cluster returns to `ACTIVE` state
1. Authentication should recover automatically as credentials propagate
1. No manual intervention required

For persistent authentication failures:

1. **Verify ACL configuration** - Ensure ACLs allow the necessary operations for your SASL/SCRAM users.
1. **Check ANONYMOUS user permissions** - If using cluster-level ACLs, verify the ANONYMOUS user has necessary permissions for inter-broker communication.
1. **Re-associate Secrets Manager secrets** - If authentication failures persist after 10+ minutes.
1. **Verify KMS key permissions** - If secrets use a custom KMS key, ensure the MSK service role maintains access to the key

!!! warning "Public MSK Clusters Require Explicit ACLs"

    If you've made your MSK cluster publicly accessible and set `allow.everyone.if.no.acl.found=false`, you **must** configure explicit ACLs for all SASL/SCRAM users. Heal operations can sometimes reset or corrupt ACL state, requiring manual re-application of ACLs. Document your ACL configuration and maintain scripts to quickly re-apply permissions if needed.

## Idempotent Producer Fatal Errors

The idempotent producer can enter a **fatal error state** that completely halts message production. Once in this state, the producer cannot recover and must be recreated. This is one of the most severe issues in production Kafka deployments.

For detailed information on fatal error handling and automatic recovery mechanisms, see the [WaterDrop Error Handling documentation](WaterDrop-Error-Handling#fatal-error-recovery).

### Not Enough Replicas

During MSK maintenance operations, producers may encounter `:not_enough_replicas` or `:not_enough_replicas_after_append` errors when the cluster cannot satisfy the configured `min.insync.replicas` requirement.

This error occurs when:

- Producer has `acks=all` (or `acks=-1`) configured
- Topic has `min.insync.replicas` set (typically to 2 or higher)
- The number of in-sync replicas falls below the configured minimum

In typical Kafka deployments with controlled maintenance windows, this error is rare because only one broker restarts at a time. However, MSK's maintenance behavior may create a critical edge case. As documented in the [MSK vs. Other Kafka Vendors](#msk-vs-other-kafka-vendors) section, MSK maintenance can cause two brokers to go offline simultaneously. While it remains unclear whether this stems from overlapping maintenance operations or independent broker failures during maintenance windows, the operational impact is clear: with two brokers down, a 3-node cluster with `min.insync.replicas=2` cannot satisfy write requirements, causing producers to fail.

**Recommended cluster sizing:**

Based on observed MSK behavior, follow these guidelines:

- **Minimum 4 brokers** for production clusters requiring high availability
- **Set `min.insync.replicas=2`** when running 4+ broker clusters
- **Avoid 3-broker clusters** for production workloads where write availability during maintenance is critical

With 4 brokers and `min.insync.replicas=2`, the cluster can tolerate two simultaneous broker outages while maintaining write availability (2 out of 4 brokers remain in-sync).

!!! warning "3-Broker Clusters Are Not Maintenance-Safe"

    While 3-broker clusters with `min.insync.replicas=2` and `replication.factor=3` appear to provide redundancy on paper, the dual-broker outage pattern observed during MSK maintenance makes this configuration unreliable for production workloads. Budget for 4+ brokers to ensure write availability during maintenance operations.

### Verifying Actual Topic Configuration

MSK cluster-level defaults for `default.replication.factor` and `min.insync.replicas` may not be applied to all topics. Topics created through different methods (Karafka Admin APIs, external tools, auto-creation) may have different settings than the cluster defaults.

Always verify actual topic configuration rather than assuming cluster defaults are in effect:

```ruby
# Check a specific topic's configuration
topic_name = 'my_topic'

# Get partition info including replica count
topic_info = Karafka::Admin.cluster_info.topics.find { |t| t[:topic_name] == topic_name }
replication_factor = topic_info[:partitions].first[:replica_count]

# Get topic-level config including min.insync.replicas
configs = Karafka::Admin::Configs.describe(
  Karafka::Admin::Configs::Resource.new(type: :topic, name: topic_name)
).first.configs

min_isr = configs.find { |c| c.name == 'min.insync.replicas' }&.value&.to_i

puts "Topic: #{topic_name}"
puts "  Replication Factor: #{replication_factor}"
puts "  min.insync.replicas: #{min_isr}"
```

!!! tip "Use Karafka Web UI for Quick Inspection"

    The [Karafka Web UI](Web-UI-Getting-Started) provides visual inspection of topic replication settings in the Health or Topics sections, making it easy to spot misconfigured topics without writing custom scripts.

### Replication Health Check Script

Use this script to audit all topics for replication issues that could cause write failures during MSK maintenance:

```ruby
#!/usr/bin/env ruby
# frozen_string_literal: true

# Checks all Kafka topics for replication issues
# Usage: bundle exec ruby bin/check_replication.rb

require 'bundler/setup'
require 'karafka'

karafka_boot = File.exist?('karafka.rb') ? 'karafka.rb' : '../karafka.rb'
require File.expand_path(karafka_boot)

issues = []

Karafka::Admin.cluster_info.topics.each do |topic|
  topic_name = topic[:topic_name]
  next if topic_name.start_with?('__')

  rf = topic[:partitions].first&.fetch(:replica_count) || 0

  configs = Karafka::Admin::Configs.describe(
    Karafka::Admin::Configs::Resource.new(type: :topic, name: topic_name)
  ).first.configs

  min_isr = configs.find { |c| c.name == 'min.insync.replicas' }&.value&.to_i || 1

  if rf == 1
    issues << "#{topic_name}: RF=#{rf} (no redundancy)"
  elsif rf <= min_isr
    issues << "#{topic_name}: RF=#{rf}, min.insync=#{min_isr} (zero fault tolerance)"
  elsif min_isr == 1
    issues << "#{topic_name}: RF=#{rf}, min.insync=#{min_isr} (low durability)"
  end
end

if issues.any?
  puts 'Issues found:'
  issues.each { |issue| puts "  - #{issue}" }
  exit 1
else
  puts 'All topics OK'
  exit 0
end
```

The script identifies three risk categories:

- **No redundancy** (RF=1): Single point of failure, any broker loss causes data unavailability
- **Zero fault tolerance** (RF <= MinISR): Cannot tolerate any broker failure during writes
- **Low durability** (MinISR=1): Messages acknowledged with only one replica, risking data loss

## AWS Health Dashboard Alerts for Replication Factor

AWS actively monitors MSK clusters for availability risks and sends notifications through the AWS Health Dashboard when it detects topics with suboptimal replication configurations. These alerts typically indicate that one or more topics have `min.insync.replicas` (MinISR) configured equal to the `replication.factor` (RF), creating a situation where write/read failures can occur during maintenance, broker failures, or other transient issues.

AWS recommends that `min.insync.replicas` must be **one less than** the `replication.factor` to preserve high availability. The standard recommendation is:

- **Replication Factor**: 3
- **MinISR**: 2

This configuration allows the cluster to tolerate one broker failure while maintaining write availability. When RF equals MinISR (for example, RF=2 and MinISR=2), any single broker failure or maintenance operation blocks writes until all replicas are back in sync.

!!! warning "Karafka Recommendation Differs from AWS"

    While AWS recommends 3-broker clusters with RF=3 and MinISR=2, **Karafka strongly recommends using at least 4 brokers** with RF=4 and MinISR=2 for production workloads. See the [Not Enough Replicas](#not-enough-replicas) section for detailed explanation.

### Changing Topic Replication Factor

Karafka does **not** provide direct support for changing topic replication factors or partition counts. These are cluster-level administrative operations that must be performed using native Kafka tools.

!!! info "Karafka Admin API Under Development"

    A Karafka Admin API feature is currently under development that will provide a more user-friendly interface for replication factor management.

---

## See Also

- [Deployment](Operations-Deployment) - General deployment strategies including AWS
- [Pro Rotating Credentials](Pro-Rotating-Credentials) - Rotating IAM credentials for MSK
- [Pro Security](Pro-Security) - Security features including SASL/SCRAM authentication
