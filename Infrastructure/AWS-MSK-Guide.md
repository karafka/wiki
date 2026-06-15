# AWS MSK Guide

This document addresses the unique operational characteristics and recurring issues observed when running Karafka with AWS Managed Streaming for Apache Kafka (MSK) and MSK Express. While AWS MSK provides a fully managed Kafka service, it introduces several distinct behaviors compared to other Kafka vendors that affect how Karafka and librdkafka operate.

Over time, users of the Karafka and rdkafka ecosystems have reported numerous recurring incidents specific to MSK deployments that rarely occur with other vendors. Issues such as `unknown_partition` errors during consumption, authentication failures after cluster maintenance, and complete consumer group stalls during broker patching prompted the creation of this guide.

While some documented issues may occur with other Kafka deployments, this guide is built on the collective experience of production MSK incidents, workarounds, and solutions discovered by the community. Each pattern and solution has been validated in real MSK environments where these problems consistently manifested.

!!! note "Applicability to Other Managed Kafka Services"

    While this guide focuses on AWS MSK, many of the principles and configurations apply to other managed Kafka services such as DigitalOcean Managed Kafka, Confluent Cloud, Aiven, and others. All managed services share common characteristics: rolling maintenance operations, potential for temporary broker unavailability, and the need for appropriate timeout and retry configurations. The specific timeout values and cluster sizing recommendations in this guide serve as reasonable starting points for any managed Kafka deployment.

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

!!! tip "Coordinator Failures During Rolling Upgrades"

    MSK rolling upgrades were the primary catalyst for the development of the [Admin Recovery API](Infrastructure-Admin-Recovery-API). During rolling broker restarts, coordinator reloads can trigger epoch conflicts or other conditions that leave the `__consumer_offsets` partition in a `FAILED` state, causing affected consumer groups to become permanently stuck. If consumers remain in `initializing` state after a maintenance event and pod restarts do not help, see the [Admin Recovery API](Infrastructure-Admin-Recovery-API) for diagnostic steps and recovery procedures.

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

Producer timeout settings control how long various operations wait before giving up. This is critical for MSK deployments where maintenance operations and network issues can cause temporary delays that exceed default timeout values.

WaterDrop default timeout values differ from librdkafka:

<table>
  <thead>
    <tr>
      <th>Setting</th>
      <th>librdkafka Default</th>
      <th>WaterDrop Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>message.timeout.ms</code></td>
      <td>300,000ms (5 minutes)</td>
      <td>150,000ms (150 seconds)</td>
    </tr>
    <tr>
      <td><code>transaction.timeout.ms</code> (transactional producers only)</td>
      <td>60,000ms (60 seconds)</td>
      <td>165,000ms (165 seconds)</td>
    </tr>
  </tbody>
</table>

WaterDrop uses a [shorter default](https://github.com/karafka/waterdrop/blob/master/lib/waterdrop/config.rb) than librdkafka to provide faster feedback in typical deployments. However, MSK's maintenance operations and rolling updates can cause delivery delays that exceed 150 seconds, particularly during dual-broker outages.

!!! note "Timeout Ordering Requirement"

    Keep `message.timeout.ms` **greater than** `socket.timeout.ms`. librdkafka computes the ProduceRequest timeout as `min(socket.timeout.ms, remaining message.timeout.ms)`. When `message.timeout.ms` is the smaller value, it becomes the ProduceRequest timeout - consuming the message's entire delivery budget with no time left for a retry. The MSK configuration above sets `socket.timeout.ms: 90_000` - ensure `message.timeout.ms` remains above this value. See [Idle Connection Reaping](#idle-connection-reaping) for the detailed mechanism.

**Recommended MSK configuration for standard producers:**

```ruby
config.kafka = {
  # Increase message timeout to handle MSK maintenance delays.
  # Must remain above socket.timeout.ms (90_000 in the recommended config above).
  # For transactional producers, also set transaction.timeout.ms (see below).
  'message.timeout.ms': 300_000 # 5 minutes, matching librdkafka default
}
```

#### Transactional Producer Timeout Configuration

When using transactional producers, timeout configuration requires additional attention. The `transaction.timeout.ms` setting controls how long the transaction coordinator waits before aborting an incomplete transaction. This setting must be greater than or equal to `message.timeout.ms`.

WaterDrop defaults for transactional producers are `message.timeout.ms` of 150,000ms (150 seconds) and `transaction.timeout.ms` of 165,000ms (165 seconds). These defaults may be insufficient for MSK environments during extended maintenance operations.

Default transactional timeout values:

<table>
  <thead>
    <tr>
      <th>Setting</th>
      <th>WaterDrop Default</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>message.timeout.ms</code></td>
      <td>150,000ms (150s)</td>
    </tr>
    <tr>
      <td><code>transaction.timeout.ms</code></td>
      <td>165,000ms (165s)</td>
    </tr>
  </tbody>
</table>

For MSK deployments with transactional producers, increase all related timeouts to accommodate maintenance delays:

```ruby
config.kafka = {
  'transactional.id': 'my-transactional-producer',
  'message.timeout.ms': 300_000,     # 5 minutes
  'transaction.timeout.ms': 305_000  # Must be >= message.timeout.ms
}
```

When the message timeout expires, the producer reports a `msg_timed_out` error. This error abstracts several underlying causes, all indicating that the producer was unable to successfully deliver the message to the broker within the timeout period.

**Common causes of `msg_timed_out`:**

- **Connection idle timeout** - Connections that are idle too long are closed by the broker (graceful TCP FIN) or silently dropped by network gear such as NLB, NAT gateways, or firewalls (no FIN delivered). On the silent path, a ProduceRequest stalls on the dead socket until its timeout expires. librdkafka computes the ProduceRequest timeout as `min(socket.timeout.ms, remaining message.timeout.ms)` - when the message budget is the smaller value, the request consumes the entire budget with no headroom left for a retry. This is the most common cause when errors cluster at a fixed interval. See [Idle Connection Reaping](#idle-connection-reaping).
- **Leader unavailable** - The partition leader is not available, either because leader election failed (no eligible replicas) or the leader broker is down
- **Connection failures** - Network problems preventing connection to the partition leader
- **Insufficient in-sync replicas** - The cluster cannot satisfy `min.insync.replicas` requirements (see [Not Enough Replicas](#not-enough-replicas))
- **Broker overload** - The broker is too slow to acknowledge messages within the timeout

!!! warning "Increase Timeout Before Investigating Further"

    If you encounter `msg_timed_out` errors in MSK, first increase `message.timeout.ms` to 300,000ms. Many MSK-related timeout issues resolve with this change alone. However, if the errors appear in pairs with a transport-level disconnect showing `(after ~600000ms in state UP)` and a healthy `average rtt`, increasing the budget alone is not sufficient - see [Idle Connection Reaping](#idle-connection-reaping).

### Idle Connection Reaping

Intermittent `msg_timed_out` errors on producers with bursty or low-frequency traffic, paired with disconnect log entries clustering at a fixed interval, are produced by connections going idle long enough to be closed by the broker or a network intermediary. Unlike most connection errors, these do not raise exceptions at the call site when using `produce_async` - they are only visible through the `error.occurred` notification channel.

These two failure paths have distinct log signatures. The **network-gear path** is the one that pairs with `msg_timed_out`. Its defining symptom is a `request(s) timed out` transport-level disconnect:

```text
librdkafka.error: Local: Timed out (timed_out) ...
  1 request(s) timed out: disconnect (average rtt 9ms) (after 643610ms in state UP)
```

Followed by a delivery failure:

```text
librdkafka.dispatch_error: Local: Message timed out (msg_timed_out)
  topic: your.topic, partition: 0
```

The healthy `average rtt` confirms the network itself was fine while the connection was alive. The `timed_out` signature specifically means librdkafka had an outstanding ProduceRequest when the socket went silent - which only happens when the socket appeared live but was dead (no FIN or RST from the other side). The clustering of `(after Nms in state UP)` values near a fixed threshold distinguishes this from general network instability.

The **broker-reaper path** (direct-ENI, no NLB in the path) produces a different log signature and does **not** pair with `msg_timed_out`:

```text
Receive failed: Disconnected (after 600Xms in state UP)
```

The broker sends a TCP FIN; librdkafka detects it promptly on the next read and reconnects. Because the broker only reaps after `connections.max.idle.ms` of genuine inactivity, there are no in-flight ProduceRequests at reap time - nothing to drop.

!!! note "msg_timed_out Means Unconfirmed, Not Necessarily Lost"

    When a ProduceRequest times out, the broker may have already written the message to the log before the client gave up waiting for the acknowledgment. The actual delivery status is **POSSIBLY_PERSISTED** - the message is unconfirmed, not guaranteed lost. For non-idempotent producers, this creates genuine ambiguity between data loss and duplication. Use idempotent or transactional producers when exactly-once delivery semantics are required.

**Two paths to this failure**

*Broker-side graceful close:* When the broker's `connections.max.idle.ms` fires (MSK default: 600 seconds), it sends a TCP FIN. librdkafka detects this promptly on its next read and logs `Receive failed: Disconnected`. Because the broker only reaps connections after genuine inactivity (any produce activity resets the idle timer), there are no in-flight ProduceRequests at reap time. librdkafka reconnects, and the next produce uses a fresh connection - no drops.

*Network gear silent drop:* If your connectivity goes through an NLB, NAT gateway, or firewall (common when using PrivateLink for cross-account or cross-VPC access), these intermediaries maintain their own idle session tables and silently drop TCP state after their idle timeout - with no FIN or RST delivered to either endpoint. librdkafka believes the socket is still live. An NLB in the path also converts the broker's own graceful TCP FIN into a silent close from the client's perspective: the NLB RSTs the server side but sends nothing to the client. AWS NLB's default TCP idle timeout is 350 seconds. On EC2 Nitro v6 instances, the instance's own ENI behaves the same way even with no NLB present - see [EC2 Nitro v6 Idle Connection Reaping](#ec2-nitro-v6-idle-connection-reaping) below.

For in-VPC MSK deployments where clients connect directly to broker ENIs, the idle timeout that applies depends on the EC2 instance generation. On Nitro v5 and earlier instances, no silent-drop intermediary is present and only the broker's 600-second graceful close applies. On Nitro v6 instances this is no longer true: the instance ENI silently reaps idle connection-tracking state at 350 seconds even for direct-ENI traffic. The `(after Nms in state UP)` value represents connection lifetime and does not distinguish the paths from logs alone. The mitigations below address all of them.

**The timeout ordering mechanism**

librdkafka computes the ProduceRequest timeout as `min(socket.timeout.ms, remaining message.timeout.ms)` for the oldest message in the batch.

With correct ordering (`message.timeout.ms` > `socket.timeout.ms`): `socket.timeout.ms` is the smaller value, the request gives up at that point, the connection is torn down, the message is re-queued with budget remaining, and librdkafka reconnects and retries. The message survives as a latency spike.

With inverted ordering (`message.timeout.ms` < `socket.timeout.ms`): the message budget is the smaller value and becomes the ProduceRequest timeout. The request consumes the entire delivery budget in one shot, leaving zero headroom for a retry. The message fails with `msg_timed_out` at budget expiry. On a stale socket, drops are not just likely - they are structural.

!!! warning "WaterDrop < 2.9.0 Default Inversion"

    Before WaterDrop 2.9.0, `message.timeout.ms` defaulted to 50,000ms while librdkafka's `socket.timeout.ms` defaults to 60,000ms. This is the inverted case: 50s < 60s means every ProduceRequest on a stale socket exhausts the message budget with no retry possible. Upgrade to WaterDrop >= 2.9.0 where the defaults (150,000ms and 60,000ms respectively) satisfy the ordering, or set `message.timeout.ms` explicitly above `socket.timeout.ms` on older versions.

**Mitigations**

Enable `socket.keepalive.enable: true` so the OS sends TCP keepalive probes on idle connections. This detects silent half-open sockets faster than waiting for a ProduceRequest to exhaust a message budget. On its own, though, this flag is rarely enough: it only sets `SO_KEEPALIVE` on the socket, and the OS keepalive timers default to very long values (Linux `net.ipv4.tcp_keepalive_time` defaults to 7,200 seconds / 2 hours), so the first probe fires long after the broker, NLB, or EC2 ENI has already dropped the connection. To detect a silent drop before any intermediary's idle timeout, tune the host-level keepalive timers below the shortest idle timeout in the path. AWS recommends starting probes at 240 seconds when the applicable idle timeout is 350 seconds:

```shell
# /etc/sysctl.d/99-kafka-keepalive.conf (apply with `sudo sysctl --system`)
net.ipv4.tcp_keepalive_time = 240   # start probing after 240s idle, below the 350s ENI/NLB timeout
net.ipv4.tcp_keepalive_intvl = 60   # then probe every 60s
net.ipv4.tcp_keepalive_probes = 3   # give up and recycle the socket after 3 failed probes
```

On Kubernetes, set these as pod-level sysctls so the Karafka or WaterDrop container sends keepalives on its broker sockets:

```yaml
spec:
  securityContext:
    sysctls:
      - name: net.ipv4.tcp_keepalive_time
        value: "240"
      - name: net.ipv4.tcp_keepalive_intvl
        value: "60"
      - name: net.ipv4.tcp_keepalive_probes
        value: "3"
```

!!! note "Kubernetes Namespaced Sysctls"

    The `net.ipv4.tcp_keepalive_*` sysctls are namespaced but are not part of the kubelet default safe set on every distribution. If a pod fails to start with a `forbidden sysctl` error, allow them on the node through the kubelet `--allowed-unsafe-sysctls` flag (or your managed cluster's equivalent), then redeploy.

Use `idle_disconnect_timeout` to proactively shut down the full producer - including the leader/bootstrap connection that librdkafka's own `connections.max.idle.ms` never closes - before either the broker or network gear reaches its idle timeout. Set it below the **shortest** idle timeout in the client-to-broker path:

```ruby
producer = WaterDrop::Producer.new do |config|
  config.kafka = {
    'bootstrap.servers': ENV['KAFKA_URL'],
    'socket.keepalive.enable': true,
    'connections.max.idle.ms': 240_000  # recycle non-leader broker connections proactively
  }

  # Idle timeouts in the path: MSK broker 600s; Nitro v6 instance ENI 350s;
  # PrivateLink/NLB (if present) 350s. Set below the shortest that applies.
  config.idle_disconnect_timeout = 300_000  # 5 min - below the 350s ENI/NLB timeout
end
```

For high-frequency producers that are continuously active, set `idle_disconnect_timeout = 0` to keep connections persistent.

!!! tip "Raising the ENI Idle Timeout on Nitro v6"

    The 350-second connection-tracking idle timeout on Nitro v6 instances is configurable per ENI, from 60 to 432,000 seconds. If you control the infrastructure and prefer a fix on the AWS side, raise it with the `ModifyNetworkInterfaceAttribute` API (also available through Launch Templates, the console, CloudFormation, and Terraform). The client-side keepalive and `idle_disconnect_timeout` mitigations are more portable, because they need no per-ENI AWS configuration and also cover the broker's 600-second reaper and any NLB in the path.

#### EC2 Nitro v6 Idle Connection Reaping

A frequent trigger for this failure is an EC2 instance generation upgrade. A producer that ran for months without issue can start timing out immediately after its instance type is changed to a newer generation, with no application or configuration change. Reverting the instance type makes the symptom disappear - the strongest single signal that this is the cause.

The root cause is a platform default change documented in [AWS's TCP connection management guidance](https://aws.amazon.com/blogs/networking-and-content-delivery/best-practices-for-tcp-connection-management-on-ec2/). Instances built on Nitro v6 (the newest generation, including the Graviton-based `*9g` families) reduced the default ENI TCP connection-tracking idle timeout from 432,000 seconds (5 days) to 350 seconds. Nitro v5 and earlier instances keep the 5-day default, which is long enough that idle Kafka connections were effectively never reaped by the host. On Nitro v6, the ENI silently drops connection-tracking state after 350 seconds of inactivity, with no FIN or RST - the same dangerous silent-drop behavior as an NLB, but now present even for direct-ENI, in-VPC traffic with no NLB, NAT gateway, or firewall in the path.

This affects low-traffic and bursty producers, whose connections sit idle past 350 seconds. Continuously active producers and consumers keep their connections busy and are typically unaffected, which is why the problem often surfaces first in QA, staging, or other low-volume environments. The failure sequence is:

1. The producer goes idle for longer than 350 seconds.
1. The instance ENI silently drops the connection's tracking state, while librdkafka still believes the socket is alive.
1. The next message is sent as a ProduceRequest on the dead socket, which stalls with no response.
1. The request fails only when `socket.timeout.ms` expires, so each stalled message blocks for as long as that timeout is set (librdkafka's default is 60 seconds). With the `socket.timeout.ms: 90_000` recommended earlier in this guide, that works out to a roughly 90-second delivery stall before the connection is torn down and the message retried.

The librdkafka warning logged during the stall looks like this:

```text
rdkafka: [thrd:sasl_ssl://b-2.cluster.kafka.us-west-2.amazonaws.com:9096/2]:
sasl_ssl://b-2.cluster.kafka.us-west-2.amazonaws.com:9096/2:
Timed out 1 in-flight, 0 retry-queued, 0 out-queue, 0 partially-sent requests
```

Apply the mitigations described above: tune the OS TCP keepalive timers so probes fire before 350 seconds (together with `socket.keepalive.enable: true`), and set `idle_disconnect_timeout` on the WaterDrop producer to recycle the full producer proactively. Either one alone resolves the stall; using both gives defense in depth. If you would rather fix it on the infrastructure side, raise the per-ENI idle timeout with `ModifyNetworkInterfaceAttribute` as described above.

See [WaterDrop Connection Management](WaterDrop-Connection-Management) for full configuration details and monitoring instrumentation.

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

    As a general rule, average CPU load should not exceed your vCPU count. With a 3-broker cluster running at 60% CPU each, losing one broker during maintenance forces the remaining two to handle 90% load each - leaving no headroom for the increased coordination overhead during failover. This can trigger cascading failures where brokers cannot acknowledge messages quickly enough, resulting in `msg_timed_out` errors even with increased timeout values.

    For production MSK clusters, target 40-50% average CPU utilization. This ensures that losing one broker (whether planned or unplanned) keeps remaining brokers at manageable load levels. If you consistently see 60%+ CPU utilization, consider scaling horizontally to 6+ brokers rather than vertically upgrading instance sizes - horizontal scaling provides better fault isolation and reduces the proportional impact of any single broker failure.

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

## See Also

- [Deployment](Infrastructure-Deployment) - General deployment strategies including AWS
- [Pro Rotating Credentials](Pro-Rotating-Credentials) - Rotating IAM credentials for MSK
- [Pro Security](Pro-Security) - Security features including SASL/SCRAM authentication
- [Admin Recovery API](Infrastructure-Admin-Recovery-API) - Recovering from coordinator failures caused by rolling upgrades
