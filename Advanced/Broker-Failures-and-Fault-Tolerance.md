When Kafka clusters experience broker failures (whether during planned maintenance, rolling updates, or unexpected outages), **Karafka will continue consuming and producing messages during individual broker downtime** with minimal interruption, provided topics are configured with **appropriate** replication factors (`≥3`) and `min.insync.replicas` settings. The framework, powered by librdkafka, implements failover mechanisms that automatically handle broker failures, connection issues, and changes in partition leadership.

**Bottom Line**: Your consumers should continue processing messages during broker failures, though you may see temporary connection errors in logs. However, **this fault tolerance requires proper topic configuration** - topics with insufficient replication may become unavailable if the only broker containing their data goes offline.

## How Kafka Handles Broker Failures

Kafka allows for an offline broker. A single offline broker in a healthy and balanced cluster, following best practices, will not impact or cause failure to produce or consume. This is because another broker will take over partition leadership, and because the client will automatically fail over and start sending requests to the new leader brokers.

### Failover Process

When a broker goes down (during maintenance, rolling updates, or unexpected failure), the following sequence occurs:

1. **Broker Offline Detection**: Broker enters an offline state. Kafka client receives an exception (typically network disconnect or `not_leader_for_partition`)

2. **Metadata Update**: These exceptions trigger the Kafka client to update its metadata so that it knows about the latest leaders

3. **Automatic Reconnection**: Kafka client resumes sending requests to the new partition leaders on other brokers

4. **Recovery Time**: Kafka clients will automatically resolve these errors, typically within 1 second and at most 15 seconds

### Metadata Transition Edge Cases

#### Edge Case 1: Split-Brain During Leader Election

During broker failures, there can be brief periods where:

- The old leader hasn't fully acknowledged that it's no longer the leader
- The new leader hasn't fully assumed leadership
- Client metadata is temporarily inconsistent across the cluster

**Impact**: Producers may receive `not_leader_for_partition` errors even after metadata refresh. librdkafka handles this by:

- Triggering additional metadata refreshes with exponential backoff
- Using `topic.metadata.refresh.fast.interval.ms` (default: 250ms) for rapid updates
- Falling back to `topic.metadata.refresh.interval.ms` after several attempts

#### Edge Case 2: Partial Metadata Updates

In large clusters, metadata propagation isn't always atomic. You may encounter:

- Some brokers report the new leader, while others still report the old one
- Inconsistent ISR (In-Sync Replica) information across brokers
- Temporary mismatches between producer and consumer views of partition leadership

**librdkafka Handling**:

- Validates metadata consistency before acting on leadership changes
- Uses multiple brokers for metadata requests to cross-verify information
- Implements circuit-breaker patterns to avoid rapid metadata refresh storms

#### Edge Case 3: Network Partition Scenarios

When network partitions isolate brokers, complex scenarios emerge:

- **Producer Perspective**: May continue sending to the isolated former leader
- **Consumer Perspective**: May see partition as unavailable despite data being produced elsewhere
- **Metadata Confusion**: Different parts of the cluster report conflicting states

**Modern librdkafka (2.0.0+) Improvements**:

- Enhanced detection of network partition scenarios
- Better handling of `fenced_leader_epoch` errors

#### Edge Case 4: Rapid Successive Failures

When multiple brokers fail in quick succession:

- Leadership may bounce between multiple candidates
- ISR sets may shrink rapidly, potentially below `min.insync.replicas`
- Clients may experience multiple rounds of metadata invalidation

**Mitigation Strategies**:

- librdkafka uses jittered backoff to avoid thundering herd during recovery
- Implements broker connection pooling to maintain connections to healthy brokers
- Uses persistent connections to reduce reconnection overhead

## Kafka Cluster Maintenance and Rolling Updates

### Common Maintenance Scenarios

Kafka clusters commonly experience broker downtime during:

- **Rolling software updates** (Kafka version upgrades)
- **Hardware maintenance** (broker instance restarts)
- **Configuration changes** (broker setting updates)
- **Scaling operations** (adding/removing brokers)
- **Unexpected failures** (network issues, hardware problems)

### Update Process Patterns

Most Kafka operations follow a rolling pattern:

- One broker is taken out of service at a time
- Partition leadership is reassigned to other brokers
- The broker is updated/maintained, and brought back online
- The process continues with the next broker
- Update time typically ranges from 5-15 minutes per broker

### Expected Duration and Impact

During rolling operations:

- Individual brokers may be offline for 5-15 minutes
- Partition leadership changes occur automatically
- Overall, the cluster remains available and functional
- Client connections may experience temporary disruptions

## Karafka Connection Behavior

### Continuous Reconnection Strategy

The core philosophy of librdkafka is to hide all complex Kafka communication details from the application. Having one or all brokers down might be a permanent error, but it may also be a temporary failure (incomplete routing, firewall rules, cluster not yet started, etc.). Instead of librdkafka bailing out, it will quietly sit on whatever messages the application has tried to produce until the cluster comes back to life.

### Connection Refused Handling

When you see `Connect to ipv4#XX.XXX.XXX.XXX:XXXX failed: Connection refused`, this is librdkafka's normal behavior. librdkafka should attempt to connect to all known brokers indefinitely. What it does is suppress log messages of failed connection attempts if the error is the same as the last attempt (e.g., Connection refused). This may be what you are seeing (or not seeing): a lack of log messages. As soon as brokers start coming back up, it should reconnect to them within a couple of seconds.

### Message Timeout Behavior

This waiting time is governed by the `message.timeout.ms` setting in the `kafka` scope configuration. This setting determines how long the producer should keep the message in the queue and how long it should retry to deliver it. By default, this is set to 50 seconds. Effectively, this means that if the Kafka cluster is down, WaterDrop will not terminate or give up on delivering messages until after the default timeout period of 50 seconds has elapsed.

## Karafka-Specific Behavior During Broker Failures

### Consumer Behavior

During broker failures, Karafka consumers:

- **Continue Processing**: Messages already fetched continue to be processed
- **Automatic Reconnection**: librdkafka handles reconnection transparently
- **Partition Rebalancing**: May trigger rebalances as brokers go offline/online
- **Offset Management**: Commits may be temporarily delayed, but will resume

### Producer Behavior

For message production during failures:

- **Message Queuing**: Messages are queued for up to message.timeout.ms when no leader is available
- **Automatic Retry**: librdkafka continues reconnection attempts indefinitely
- **Delivery Guarantees**: Messages are held in memory until successfully delivered or timeout

### Expected Error Messages and Their Meanings

#### Connection Refused Errors

```text
Connect to ipv4#XX.XXX.XXX.XXX:XXXX failed: Connection refused (after 0ms in state CONNECT)
```

- **Meaning**: librdkafka is attempting to connect to a broker that is currently unavailable.
- **Action**: No action required - this is expected during rolling updates.

#### All Brokers Down

```text
Local: All broker connections are down (all_brokers_down)
```

- **Meaning**: Friendly indication that currently there are no brokers available to communicate with.
- **Action**: Monitor for recovery - should resolve automatically when brokers come back online.

#### Network Disconnect

```text
Producer clientId=producer-1] Got error produce response with correlation id X on topic-partition Y, retrying. Error: NETWORK_EXCEPTION
```

- **Meaning**: Temporary network disconnection during broker transition.
- **Action**: Normal during rolling updates - librdkafka will retry automatically.

#### Metadata-Related Errors During Transitions

##### `leader_not_available` (Transient)

```text
Broker: Leader not available (`leader_not_available`)
```

- **Context**: Common during leadership transitions when the cluster is electing a new leader
- **Duration**: Typically resolves within seconds as new leader is elected
- **Action**: Normal during broker failover - librdkafka will retry automatically

##### `not_leader_for_partition` (Requires Metadata Refresh)

```text
Broker: Not leader for partition (`not_leader_for_partition`)
```

- **Context**: Producer/consumer is talking to a broker that is no longer the leader for this partition
- **Trigger**: Automatic metadata refresh in librdkafka
- **Recovery**: Usually resolves within 1-3 metadata refresh cycles

##### `fenced_leader_epoch` (Advanced Error Handling)

```text
Broker: Leader epoch is older than broker epoch (`fenced_leader_epoch`)
```

- **Context**: Advanced error indicating leadership conflicts during complex failure scenarios
- **Handling**: librdkafka automatically refreshes metadata and revalidates leadership
- **Version**: Better handling in librdkafka 1.4.0+ with improved epoch tracking

## Critical Configuration: Replication Factor and `min.insync.replicas`

### Understanding the Relationship

The combination of `replication.factor` and `min.insync.replicas` determines your cluster's tolerance to broker failures and directly impacts whether Karafka can continue producing and consuming during outages.

### Replication Factor Impact

**What it controls**: How many copies of each partition are maintained across brokers

- `replication.factor=1`: **DANGEROUS** - Only one copy exists. If that broker fails, partition becomes unavailable
- `replication.factor=2`: **RISKY** - Can tolerate one broker failure, but no redundancy during maintenance
- `replication.factor=3`: **RECOMMENDED** - Can tolerate one broker failure with redundancy remaining

### min.insync.replicas Impact

**What it controls**: Minimum number of replicas that must acknowledge a write for it to be considered successful

- `min.insync.replicas=1`: Writes succeed as long as leader is available
- `min.insync.replicas=2`: Writes require leader + 1 follower (recommended for replication.factor=3)
- `min.insync.replicas=3`: Writes require all replicas (only works if replication.factor=3 and no brokers down)

### Dangerous Configurations and Their Impact

#### Scenario 1: replication.factor=1

```yaml
Topic Configuration:
  replication.factor: 1
  min.insync.replicas: 1
```

**Risk**: If the single broker hosting the partition goes down:

- **Producers**: Will receive `not_enough_replicas` errors and cannot produce
- **Consumers**: Cannot read from the partition until broker recovers
- **Data Loss**: Potential permanent data loss if broker storage is corrupted

#### Scenario 2: replication.factor=2, min.insync.replicas=2

```yaml
Topic Configuration:
  replication.factor: 2
  min.insync.replicas: 2
```

**Risk**: If one broker goes down:

- **Producers**: Will receive `not_enough_replicas_after_append` errors
- **Consumers**: Can still read from available replica
- **During Maintenance**: Cannot produce during rolling updates

#### Scenario 3: replication.factor=3, min.insync.replicas=3

```yaml
Topic Configuration:
  replication.factor: 3
  min.insync.replicas: 3
```

**Risk**: If any broker goes down:

- **Producers**: Will fail with `not_enough_replicas_after_append`
- **Consumers**: Can still read from available replicas
- **During Maintenance**: Production halts when any broker is offline

### Recommended Configuration

```yaml
Topic Configuration:
  replication.factor: 3
  min.insync.replicas: 2
```

**Benefits**:

- **Fault Tolerance**: Can lose 1 broker and continue operating
- **Maintenance Safe**: Can perform rolling updates without production interruption
- **Data Durability**: Writes are acknowledged by 2 replicas before success
- **Consumer Availability**: Consumers can read as long as any replica is available

### Karafka Behavior with Different Configurations

#### With Proper Configuration (3/2)

During broker failure, Karafka will:

```ruby
# Producers continue working
producer.produce_async(topic: 'events', payload: data)  # ✅ Succeeds

# Consumers continue processing
def consume
  messages.each { |msg| process(msg) }  # ✅ Continues reading
end
```

#### With Dangerous Configuration (1/1 or 2/2)

During broker failure, Karafka experiences:

```ruby
# Producers may fail
producer.produce_async(topic: 'events', payload: data)
# ❌ May raise: Rdkafka::RdkafkaError: Broker: Not enough in-sync replicas

# Consumers may be blocked
def consume
  messages.each { |msg| process(msg) }  # ❌ No messages available
end
```

### Error Messages You'll See

#### `not_enough_replicas` (Error Code 19)

```text
Broker: Not enough in-sync replicas (not_enough_replicas)
```

- **Cause**: Trying to produce with `acks=all` but insufficient replicas available
- **Solution**: Check broker health, reduce min.insync.replicas temporarily, or wait for brokers to recover

#### `not_enough_replicas_after_append` (Error Code 20)

```text
Broker: Messages are rejected since there are fewer in-sync replicas than required
```

- **Cause**: Message was written to leader but couldn't be replicated to enough followers
- **Solution**: Same as above

### Configuration Commands

#### Check Current Topic Configuration

You can obtain relevant details about your topics by using the following combination of the [Admin](Admin-API#getting-cluster-info) and [Configs](Admin-Configs-API) APIs:

```ruby
topic_name = 'YOUR_TOPIC_NAME'

topic_info = Karafka::Admin.cluster_info.topics.find do |t|
  t[:topic_name] == topic_name
end

replica_counts = []
in_sync_brokers = []

topic_info[:partitions].map do |partition|
  replica_counts << partition[:replica_count]
  in_sync_brokers << partition[:in_sync_replica_brokers]
end

resource = Karafka::Admin::Configs::Resource.new(type: :topic, name: topic_name)
min_insync_replicas_config = -1

Karafka::Admin::Configs.describe(resource).each do |topic_config|
  topic_config.configs.each do |config|
    next unless config.name == 'min.insync.replicas'
    min_insync_replicas_config = config.value.to_i
  end
end

puts "  Replica Count: #{replica_counts.min}"
puts "  Min In Sync Replicas (config): #{min_insync_replicas_config}"
puts "  Current Sync Replicas (min per partition): #{in_sync_brokers.min}"
```

#### Update Topic Configuration

Topic configurations can be updated through multiple approaches in Karafka. The `min.insync.replicas` configuration can be modified using the Admin Configs API or through the Web UI interface. However, updating the replication factor requires using the standard Kafka CLI tools as it involves partition reassignment.

```shell
# Update replication factor using Kafka CLI (requires partition reassignment)
kafka-reassign-partitions.sh --bootstrap-server localhost:9092 \
  --reassignment-json-file increase-replication.json --execute
```

```ruby
# Update min.insync.replicas programmatically
resource = Karafka::Admin::Configs::Resource.new(type: :topic, name: 'your-topic')
resource.set('min.insync.replicas', '2')
Karafka::Admin::Configs.alter(resource)
```

**Via Web UI:**

The topic configuration management feature allows you to view and modify the configuration settings of existing Kafka topics with a user-friendly interface in Karafka Pro. You can update `min.insync.replicas` and other topic settings directly through the Web UI's Topics Management interface.

## Best Practices for Kafka Cluster Maintenance

### Pre-Maintenance Configuration

1. **Replication Factor**: Ensure topics have a replication factor of `3` or higher for any production environment. Setting a replication factor of `1` might lead to offline partitions during broker maintenance

2. **Minimum In-Sync Replicas**: Set minimum in-sync replicas (`min.insync.replicas`) to a value of (replication factor - 1) or less. A minISR value that's equal to the replication factor might prevent you from producing to the cluster during maintenance

3. **Connection Strings**: Ensure client connection strings include brokers from multiple availability zones or racks. Having multiple brokers in a client's connection string allows for failover when specific brokers are offline

### Monitoring During Maintenance

Monitor these metrics during cluster maintenance:

- **Consumer Lag**: Should remain stable or increase slightly
- **Error Rates**: Temporary spikes in connection errors are normal
- **Processing Rates**: May temporarily decrease, but should recover
- **Rebalance Events**: May see increased rebalancing activity

## Recovery and Troubleshooting

### When to Be Concerned

Alert on these conditions:

- **Extended Downtime**: If errors persist > 15 minutes after maintenance completion
- **Message Loss**: If consumer lag increases permanently
- **Application Errors**: If business logic fails due to connectivity issues

### Recovery Actions

1. **Check Cluster Status**: Verify all brokers are healthy in your monitoring system
2. **Review Configurations**: Ensure topic replication factor ≥ 3
3. **Monitor Metrics**: Watch for recovery in consumer lag and error rates
4. **Application Restart**: As a last resort, restart Karafka processes

## Conclusion

Karafka **is designed** to handle Kafka broker failures gracefully. During maintenance operations and unexpected outages:

- **Messages will continue to be consumed** (from available brokers)
- **Producers will queue messages** until brokers are available  
- **Automatic reconnection** handles broker transitions
- **Connection refused errors** are expected and normal
- **Recovery typically occurs within 1-15 seconds** of broker restoration

The key is understanding that temporary connection errors during Kafka cluster maintenance are **expected behavior**, not application failures. Karafka's librdkafka foundation provides robust, production-ready handling of these scenarios without requiring application-level intervention.

Connection refused errors during broker maintenance indicate the system is working correctly and attempting to reconnect to brokers as they become available again.

---

## See Also

- [Error Handling and Back Off Policy](Operations-Error-Handling-and-Back-Off-Policy) - Configure retry strategies and backoff policies for consumer errors
- [Dead Letter Queue](Dead-Letter-Queue) - Handle persistent failures by routing problematic messages to DLQ
- [Enhanced Dead Letter Queue](Pro-Enhanced-Dead-Letter-Queue) - Advanced DLQ features for complex failure scenarios
- [Monitoring and Logging](Operations-Monitoring-and-Logging) - Track broker connection health and system performance
- [Admin API](Admin-API) - Programmatically inspect and manage Kafka cluster configuration
