1. [Why can't I connect to Kafka from another Docker container?](#why-cant-i-connect-to-kafka-from-another-docker-container)
1. [What does static consumer fenced by other consumer with same group.instance.id mean?](#what-does-static-consumer-fenced-by-other-consumer-with-same-groupinstanceid-mean)
1. [Why am I seeing an `Implement this in a subclass` error?](#why-am-i-seeing-an-implement-this-in-a-subclass-error)
1. [What is the Unsupported value "SSL" for configuration property "security.protocol": OpenSSL not available at build time?](#what-is-the-unsupported-value-ssl-for-configuration-property-securityprotocol-openssl-not-available-at-build-time)
1. [Why Karafka prints some of the logs with a time delay?](#why-karafka-prints-some-of-the-logs-with-a-time-delay)
1. [Why am I getting `error:0A000086:SSL routines::certificate verify failed` after upgrading Karafka?](#why-am-i-getting-error0a000086ssl-routinescertificate-verify-failed-after-upgrading-karafka)
1. [Why am I seeing Broker failed to validate record (invalid_record) error?](#why-am-i-seeing-broker-failed-to-validate-record-invalid_record-error)
1. [What does `Broker: Unknown topic or partition` error mean?](#what-does-broker-unknown-topic-or-partition-error-mean)
1. [Why am I having problems running Karafka and Karafka Web with remote Kafka?](#why-am-i-having-problems-running-karafka-and-karafka-web-with-remote-kafka)
1. [Why am I getting `env: can't execute 'bash'` when installing Karafka in an Alpine Docker?](#why-am-i-getting-env-cant-execute-bash-when-installing-karafka-in-an-alpine-docker)
1. [Why am I getting a `Local: Broker transport failure (transport)` error with the `Disconnected` info?](#why-am-i-getting-a-local-broker-transport-failure-transport-error-with-the-disconnected-info)
1. [Why am I getting a `All broker connections are down (all_brokers_down)` error together with the `Disconnected` info?](#why-am-i-getting-a-all-broker-connections-are-down-all_brokers_down-error-together-with-the-disconnected-info)
1. [What does `Broker: Invalid message (invalid_msg)` error mean?](#what-does-broker-invalid-message-invalid_msg-error-mean)
1. [Why do I see `SASL authentication error` after AWS MSK finished the `Heal cluster` operation?](#why-do-i-see-sasl-authentication-error-after-aws-msk-finished-the-heal-cluster-operation)
1. [Why Karafka and WaterDrop are behaving differently than `rdkafka`?](#why-karafka-and-waterdrop-are-behaving-differently-than-rdkafka)
1. [Why am I seeing `Inconsistent group protocol` in Karafka logs?](#why-am-i-seeing-inconsistent-group-protocol-in-karafka-logs)
1. [Why can I produce messages to my local Kafka docker instance but cannot consume?](#why-can-i-produce-messages-to-my-local-kafka-docker-instance-but-cannot-consume)
1. [Why am I getting `Broker: Group authorization failed (group_authorization_failed)` when using Admin API or the Web UI?](#why-am-i-getting-broker-group-authorization-failed-group_authorization_failed-when-using-admin-api-or-the-web-ui)
1. [Why am I getting an `ArgumentError: undefined class/module YAML::Syck` when trying to install `karafka-license`?](#why-am-i-getting-an-argumenterror-undefined-classmodule-yamlsyck-when-trying-to-install-karafka-license)
1. [Why do I see `Rdkafka::Config::ClientCreationError` when changing the `partition.assignment.strategy`?](#why-do-i-see-rdkafkaconfigclientcreationerror-when-changing-the-partitionassignmentstrategy)
1. [Why am I getting the `Broker: Policy violation (policy_violation)` error?](#why-am-i-getting-the-broker-policy-violation-policy_violation-error)
1. [Why am I getting a `Error querying watermark offsets for partition 0 of karafka_consumers_states` error?](#why-am-i-getting-a-error-querying-watermark-offsets-for-partition-0-of-karafka_consumers_states-error)
1. [We faced downtime due to a failure in updating the SSL certs. How can we retrieve messages that were sent during this downtime?](#we-faced-downtime-due-to-a-failure-in-updating-the-ssl-certs-how-can-we-retrieve-messages-that-were-sent-during-this-downtime)
1. [Where can I find details on troubleshooting and debugging for Karafka?](#where-can-i-find-details-on-troubleshooting-and-debugging-for-karafka)
1. [I see a "JoinGroup error: Broker: Invalid session timeout" error. What does this mean, and how can I resolve it?](#i-see-a-joingroup-error-broker-invalid-session-timeout-error-what-does-this-mean-and-how-can-i-resolve-it)
1. [Can I log errors in Karafka with topic, partition, and other consumer details?](#can-i-log-errors-in-karafka-with-topic-partition-and-other-consumer-details)
1. [Why am I getting `+[NSCharacterSet initialize] may have been in progress in another thread when fork()` error when forking on macOS?](#why-am-i-getting-nscharacterset-initialize-may-have-been-in-progress-in-another-thread-when-fork-error-when-forking-on-macos)
1. [What causes a "Broker: Policy violation (policy_violation)" error when using Karafka, and how can I resolve it?](#what-causes-a-broker-policy-violation-policy_violation-error-when-using-karafka-and-how-can-i-resolve-it)
1. [What should I do if I encounter a loading issue with Karafka after upgrading Bundler to version `2.3.22`?](#what-should-i-do-if-i-encounter-a-loading-issue-with-karafka-after-upgrading-bundler-to-version-2322)
1. [What should I do if I encounter the `Broker: Not enough in-sync replicas` error?](#what-should-i-do-if-i-encounter-the-broker-not-enough-in-sync-replicas-error)
1. [Why am I getting the error: "No provider for SASL mechanism GSSAPI: recompile librdkafka with libsasl2 or openssl support"?](#why-am-i-getting-the-error-no-provider-for-sasl-mechanism-gssapi-recompile-librdkafka-with-libsasl2-or-openssl-support)
1. [How can I check if `librdkafka` was compiled with SSL and SASL support in Karafka?](#how-can-i-check-if-librdkafka-was-compiled-with-ssl-and-sasl-support-in-karafka)
1. [Why does `librdkafka` lose SSL and SASL support in my multi-stage Docker build?](#why-does-librdkafka-lose-ssl-and-sasl-support-in-my-multi-stage-docker-build)
1. [Why am I getting "could not obtain a connection from the pool" errors?](#why-am-i-getting-could-not-obtain-a-connection-from-the-pool-errors)
1. [I received a Confluent KIP-896 deprecation notice. Is Karafka using deprecated Kafka protocol APIs?](#i-received-a-confluent-kip-896-deprecation-notice-is-karafka-using-deprecated-kafka-protocol-apis)

---

## Why can't I connect to Kafka from another Docker container?

You need to modify the `docker-compose.yml` `KAFKA_ADVERTISED_HOST_NAME` value. You can read more about it [here](Kafka-Setup#connecting-to-kafka-from-other-docker-containers).

## What does static consumer fenced by other consumer with same group.instance.id mean?

If you see such messages in your logs:

```shell
Fatal error: Broker: Static consumer fenced by other consumer with same group.instance.id
```

It can mean two things:

1. You are using the Karafka version before `2.0.20`. If that is the case, please upgrade.
1. Your `group.instance.id` is not unique within your consumer group. You must always ensure that the value you assign to `group.instance.id` is unique within the whole consumer group, not unique per process or machine.

## Why am I seeing an `Implement this in a subclass` error?

```shell
[bc01b9e1535f] Consume job for ExampleConsumer on my_topic started
Worker processing failed due to an error: Implement this in a subclass
```

This error occurs when you have defined your consumer but without a `#consume` method:

**BAD**:

```ruby
class ExampleConsumer < Karafka::BaseConsumer
  # No consumption method
end
```

**GOOD**:

```ruby
class ExampleConsumer < Karafka::BaseConsumer
  def consume
    messages.each do |message|
      puts message.payload
    end
  end
end
```

## What is the Unsupported value "SSL" for configuration property "security.protocol": OpenSSL not available at build time?

If you are seeing the following error:

```shell
`validate!':
{:kafka=>"Unsupported value "SSL" for configuration property "security.protocol":
 OpenSSL not available at build time"} (Karafka::Errors::InvalidConfigurationError)
```

It means you want to use SSL, but `librdkafka` was built without it. You have to:

1. Uninstal it by running `gem remove karafka-rdkafka`
1. Install `openssl` (OS dependant but for macos, that would be `brew install openssl`)
1. Run `bundle install` again, so `librdkafka` is recompiled with SSL support.

## Why Karafka prints some of the logs with a time delay?

Karafka `LoggerListener` dispatches messages to the logger immediately. You may be encountering buffering in the stdout itself. This is done because IO operations are slow, and usually it makes more sense to avoid writing every single character immediately to the console.

To avoid this behavior and instead write immediately to stdout, you can set it to a sync mode:

```ruby
$stdout.sync = true
```

You can read more about sync [here](https://docs.ruby-lang.org/en/3.3/IO.html#method-i-sync).

## Why am I getting `error:0A000086:SSL routines::certificate verify failed` after upgrading Karafka?

If you are getting following error after upgrading `karafka` and `karafka-core`:

```shell
SSL handshake failed: error:0A000086:SSL routines::certificate verify failed:
broker certificate could not be verified, verify that ssl.ca.location is correctly configured or
root CA certificates are installed (brew install openssl) (after 170ms in state SSL_HANDSHAKE)
```

Please disable the SSL verification in your configuration:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      # Other settings...
      'enable.ssl.certificate.verification': false,
      'ssl.endpoint.identification.algorithm': 'none'
    }
  end
end
```

## Why am I seeing Broker failed to validate record (invalid_record) error?

The error `Broker failed to validate record (invalid_record)` in Kafka means that the broker received a record that it could not accept. This error can occur if the record is malformed or does not conform to the schema expected by the broker.

There are several reasons why a Kafka broker might reject some messages:

- Invalid message format: If the message format does not match the expected format of the topic, the broker may reject the message.
- Missing message key. If you use log compaction as your `cleanup.policy` Kafka will require you to provide the key. Log compaction ensures that Kafka will always retain at least the last known value for each message key within the log of data for a single topic partition. If you enable compaction for a topic, messages without a key may be rejected.
- Schema validation failure: If the message contains data that does not conform to the schema, the broker may reject the message. This can happen if the schema has changed or the data was not properly validated before being sent to Kafka.
- Authorization failure: If the client does not have the required permissions to write to the topic, the broker may reject the message.
- Broker capacity limitations: If the broker has limited resources and cannot handle the incoming message traffic, it may reject some messages.

To resolve this error, it is essential to identify the root cause of the issue. Checking the message format and schema, ensuring proper authorization and permission, checking broker capacity, and addressing network issues can help resolve the issue. Additionally, monitoring Karafka logs to identify and resolve problems as quickly as possible is crucial.

## What does `Broker: Unknown topic or partition` error mean?

`The Broker: Unknown topic or partition` error typically indicates that the Kafka broker cannot find the specified topic or partition that the client is trying to access.

There are several possible reasons why this error might occur:

- The topic or partition may not exist on the broker. Double-check that the topic and partition you are trying to access exists on the Kafka cluster you are connecting to.
- The topic or partition may still need to be created. If you are trying to access a topic or partition that has not been created yet, you will need to create it before you can use it.
- The client may not have permission to access the topic or partition. Ensure that the client has the necessary permissions to read from or write to the topic or partition you are trying to access.
- The client may be using an incorrect topic or partition name. Ensure you use the correct topic or partition name in your client code.

You can use Karafka Web UI or Karafka Admin API to inspect your cluster topics and ensure that the requested topic and partition exist.

## Why am I having problems running Karafka and Karafka Web with remote Kafka?

Karafka and librdkafka are not designed to work over unstable and slow network connections, and these libraries contain internal timeouts on network operations that slow networks may impact. As a result, it is recommended to use a local Docker-based Kafka instance for local development. We are aware of this issue and are actively working to make these timeouts configurable in the future. Using a local Kafka instance for local development can help you avoid network-related problems and ensure a smoother development experience.

## Why am I getting `env: can't execute 'bash'` when installing Karafka in an Alpine Docker?

If you encounter the following error:

```text
========================================================================
env: can't execute 'bash': No such file or directory
========================================================================
rake aborted!
Failed to complete configure task
/app/vendor/bundle/ruby/2.7.0/gems/mini_portile2-2.8.0/lib/mini_portile2/mini_portile.rb:460:in
`block in execute'
```

you need to make sure that your Alpine-based image includes bash. Alpine Linux Docker image by default does **not** include it. To add it, please make sure to add this line before you run the `bundle install` process:

```shell
RUN apk update && apk add bash
```

## Why am I getting a `Local: Broker transport failure (transport)` error with the `Disconnected` info?

If you are seeing following or similar error:

```text
rdkafka: [thrd:node_url]: node_url: Disconnected (after 660461ms in state UP)
librdkafka internal error occurred: Local: Broker transport failure (transport)
```

The error message you mentioned may be related to the connection reaper in Kafka disconnecting because the TCP socket has been idle for a long time. The connection reaper is a mechanism in Kafka that monitors the idle TCP connections and disconnects them if they exceed a specific time limit. This is done to free up resources on the broker side and to prevent the accumulation of inactive connections.

If the client application is not sending or receiving data over the TCP connection for a long time, the connection reaper may kick in and disconnect the client from the broker.

However, this disconnection does not mean that any produced data will be lost. When the client application reconnects to the broker, it can resume sending or receiving messages from where it left off.

Suppose your data production patterns are not stable, and there are times when your client application is not producing any data to Kafka for over 10 minutes. In that case, you may want to consider setting the `log.connection.close` value to `false` in your configuration. This configuration parameter controls whether the client logs a message when a connection is closed by the broker. By default, the client will log a message indicating that the connection was closed, which can generate false alarms if the connection was closed due to inactivity by the connection reaper.

Setting `log.connection.close` to false will suppress these log messages and prevent the error from being raised. It's important to note that even if you set `log.connection.close` to `false,` critical non-recoverable errors that occur in Karafka and WaterDrop will still be reported via the instrumentation pipeline.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"

    config.kafka = {
      # other settings...
      'log.connection.close': false
    }
  end
end
```

Please note that you can control the `connections.max.idle.ms` on both Kafka and Karafka consumer / WaterDrop producer basis.

You can read more about this issue [here](https://github.com/confluentinc/librdkafka/wiki/FAQ#why-am-i-seeing-receive-failed-disconnected).

## Why am I getting a `All broker connections are down (all_brokers_down)` error together with the `Disconnected` info?

When you see both the `Disconnected` error and the `all_brokers_down` error, it means that the TCP connection to the cluster was closed and that you no longer have any active connections.

Please read the explanation of the previous question to understand the reasons and get tips on mitigating this issue.

```text
rdkafka: [thrd:node_url]: node_url: Disconnected (after 660461ms in state UP)
librdkafka internal error occurred: Local: Broker transport failure (transport)
Error occurred: Local: All broker connections are down (all_brokers_down) - librdkafka.error
```

## What does `Broker: Invalid message (invalid_msg)` error mean?

If you see the following error in your error tracking system:

```text
ERROR -- : Listener fetch loop error: Broker: Invalid message (invalid_msg)
ERROR -- : gems/karafka-rdkafka-0.12.1/lib/rdkafka/consumer.rb:432:in `poll'
ERROR -- : gems/karafka-2.0.41/lib/karafka/connection/client.rb:368:in `poll'
```

It indicates that the broker contains a message that it cannot parse or understand. This error usually occurs when there is a mismatch or inconsistency in the format or structure of the message or when the message is corrupted.

It is advised to check the Kafka logs around the polling time, as it may be a Kafka issue. You may encounter the following or similar errors:

```text
org.apache.kafka.common.errors.CorruptRecordException:
  Found record size 0 smaller than minimum record overhead (14)
  in file /var/lib/my_topic-0/00000000000019077350.log.
```

This exception indicates a record has failed its internal CRC check; this generally indicates network or disk corruption.

## Why do I see `SASL authentication error` after AWS MSK finished the `Heal cluster` operation?

Healing means that Amazon MSK is running an internal operation, like replacing an unhealthy broker. For example, the broker might be unresponsive. During this stage, under certain circumstances, the MSK permissions may be not restored correctly. We recommend that you reassign them back if the problem persists.

## Why Karafka and WaterDrop are behaving differently than `rdkafka`?

1. **`rdkafka-ruby` lack of instrumentation callbacks hooks by default**: By default, `rdkafka` does not include instrumentation callback hooks. This means that it does not publish asynchronous errors unless explicitly configured to do so. On the other hand, Karafka and WaterDrop, provide a unified instrumentation framework that reports errors, even those happening asynchronously, by default.

1. **WaterDrop and Karafka use `karafka-rdkafka`, which is patched and provides specific improvements**: Both WaterDrop and Karafka use a variant of `rdkafka-ruby`, known as `karafka-rdkafka`. This version is patched, meaning it includes improvements and modifications that the standard `rdkafka-ruby` client does not. These patches may offer enhanced performance, additional features, and/or bug fixes that can impact how the two systems behaves.

1. **Different setup conditions**: Comparing different Kafka clients or frameworks can be like comparing apples to oranges if they aren't set up under the same conditions. Factors such as client configuration, Kafka cluster configuration, network latency, message sizes, targeted topics, and batching settings can significantly influence the behavior and performance of Kafka clients. Therefore, when you notice a discrepancy between the behavior of `rdkafka-ruby` and Karafka or WaterDrop, it might be because the conditions they are running under are not identical. To make a fair comparison, ensure that they are configured similarly and are running under the same conditions.

In summary, while `rdkafka-ruby`, Karafka, and WaterDrop all provide ways to interact with Kafka from a Ruby environment, differences in their design, their handling of errors, and the conditions under which they are run can result in different behavior. Always consider these factors when evaluating or troubleshooting these systems.

## Why am I seeing `Inconsistent group protocol` in Karafka logs?

Seeing an `Inconsistent group protocol` message in your Karafka logs indicates a mismatch in the protocol type or version among the members of a Kafka consumer group.

In Kafka, a consumer group consists of one or more consumers that jointly consume data from a topic. These consumers communicate with the Kafka broker and coordinate with each other to consume different partitions of the data. This coordination process is managed using group protocols.

An `Inconsistent group protocol` error typically arises in the following scenarios:

- **Different consumers within the same group are using different protocol types or versions**: Kafka supports several group protocols for consumer coordination, such as range or round-robin. If different consumers within the same group are configured with varying protocols or versions, this inconsistency will cause an error. Make sure all consumers in the group are using the same protocol.

- **A mix of consumers with different session timeouts**: When consumers in a group have different session timeout settings, they may not always be in sync, leading to this error. Ensure all consumers have the same session timeout setting.
Misconfiguration during consumer setup: If you have recently made changes to your consumer setup, you might have inadvertently introduced a configuration that causes this error. Review your configuration changes to ensure consistency.

Consistency in consumer configuration within a group is vital to prevent this error. Review your consumers' settings and configurations to ensure they use the same group protocol, and adjust if necessary.

## Why can I produce messages to my local Kafka docker instance but cannot consume?

There are several potential reasons why you can produce messages to your local Kafka Docker instance but cannot consume them. Here are some of the common issues and how to resolve them:

1. **Network Issues**: Docker's networking can cause problems if not configured correctly. Make sure your Kafka and Zookeeper instances can communicate with each other. Use the docker inspect command to examine the network settings of your containers.

1. **Configuration Errors**: Incorrect settings in Kafka configuration files, such as the `server.properties` file, could lead to this issue. Make sure that you've configured things like the `advertised.listeners` property correctly.

1. **Incorrect Consumer Group**: If you're consuming messages from a topic that a different consumer has already consumed in the same group, you won't see any messages. Kafka uses consumer groups to manage which messages have been consumed. You should use a new group or reset the offset of the existing group.

1. **Security Protocols**: If you've set up your Kafka instance with security protocols like SSL/TLS or SASL, you'll need to ensure that your consumer is correctly configured to use these protocols.

1. **Offset Issue**: The consumer might be reading from an offset where no messages exist. This often happens if the offset is set to the latest, but the messages were produced before the consumer started. Try consuming from the earliest offset to see if this resolves the issue.

1. **Zookeeper Connection Issue**: Sometimes, the issue could be a faulty connection between Kafka and Zookeeper. Ensure that your Zookeeper instance is running without issues.

Remember, these issues are common, so don't worry if you face them. Persistence and careful debugging are key in these situations.

If you're looking for a Kafka setup that doesn't require Zookeeper, consider using KRaft (KRaft is short for Kafka Raft mode), a mode in which Kafka operates in a self-managed way without Zookeeper. This new mode introduced in Kafka `2.8.0` allows you to reduce the operational complexity by eliminating the Zookeeper dependency.

## Why am I getting `Broker: Group authorization failed (group_authorization_failed)` when using Admin API or the Web UI?

If you are seeing the following error

```text
Broker: Group authorization failed (group_authorization_failed)
```

it most likely arises when there's an authorization issue related to the consumer group in your Kafka setup. This error indicates the lack of the necessary permissions for the consumer group to perform certain operations.

When using the Admin API or the Web UI in the context of Karafka, you are operating under the consumer groups named `karafka_admin` and `karafka_web`.

Please review and update your Kafka ACLs or broker configurations to ensure these groups have all the permissions they need.

## Why am I getting an `ArgumentError: undefined class/module YAML::Syck` when trying to install `karafka-license`?

The error `ArgumentError: undefined class/module YAML::Syck` you're seeing when trying to install `karafka-license` is not directly related to the `karafka-license` gem. It's important to note that `karafka-license` does not serialize data using `YAML::Syck`.

Instead, this error is a manifestation of a known bug within the Bundler and the Ruby gems ecosystem. During the installation of `karafka-license`, other gems may also be installed or rebuilt, triggering this issue.

To address and potentially resolve this problem, you can update your system gems to the most recent version, which doesn't have this bug. You can do this by running:

```shell
gem update --system
```

Once you've done this, attempt to install the `karafka-license` gem again. If the problem persists, please get in touch with us.

## Why do I see `Rdkafka::Config::ClientCreationError` when changing the `partition.assignment.strategy`?

If you are seeing the following error:

```shell
All partition.assignment.strategy (cooperative-sticky,range)
assignors must have the same protocol type,
online migration between assignors with different protocol types
is not supported (Rdkafka::Config::ClientCreationError)
```

It indicates that you're attempting an online/rolling migration between two different `partition.assignment.strategy` assignors with different protocol types. Specifically, you might try switching between "cooperative-sticky" and "range" strategies without first shutting down all consumers.

In Kafka, all consumers within a consumer group must utilize the same partition assignment strategy. Changing this strategy requires a careful offline migration process to prevent inconsistencies and errors like the one you've encountered.

You can read more about this process [here](Infrastructure-Application-Development-vs-Production#avoid-rolling-upgrades-for-rebalance-protocol-changes).

## Why am I getting the `Broker: Policy violation (policy_violation)` error?

The `Broker: Policy violation (policy_violation)` error in Karafka is typically related to violating some broker-set policies or configurations.

In Karafka, this error might surface during two scenarios:

- When upgrading the [Web UI](Web-UI-Getting-Started) using the command `karafka-web migrate`.
- When employing the [Declarative Topics](Infrastructure-Declarative-Topics) with the `karafka topics migrate` command, especially if trying to establish a topic that doesn't align with the broker's policies.

Should you encounter this error during a Web UI migration, we recommend manually creating the necessary topics and fine-tuning the settings to match your policies. You can review the settings Karafka relies on for these topics [here](Web-UI-Getting-Started#manual-web-ui-topics-management).

On the other hand, if this error appears while using Declarative Topics, kindly review your current configuration. Ensure that it's in harmony with the broker's policies and limitations.

## Why am I getting a `Error querying watermark offsets for partition 0 of karafka_consumers_states` error?

```text
Error querying watermark offsets for partition 0 of karafka_consumers_states
Local: All broker connections are down (all_brokers_down)
```

It is indicative of a connectivity issue. Let's break down the meaning and implications of this error:

1. **Main Message**: The primary message is about querying watermark offsets. Watermark offsets are pointers indicating the highest and lowest offsets (positions) in a Kafka topic partition the consumer has read. The error suggests that the client is facing difficulties in querying these offsets for a particular partition (in this case, partition 0) of the karafka_consumers_states topic.

1. **Local: All broker connections are down (all_brokers_down)**: Despite the starkness of the phrasing, this doesn't necessarily mean that all the brokers in the Kafka cluster are offline. Instead, it suggests that the Karafka client cannot establish a connection to any of the brokers responsible for the mentioned partition. The reasons could be manifold:
    - **Connectivity Issues**: Network interruptions between your Karafka client and the Kafka brokers might occur. This can be due to firewalls, routing issues, or other network-related blocks.

    - **Broker Problems**: There's a possibility that the specific broker or brokers responsible for the mentioned partition are down or facing internal issues.

    - **Misconfiguration**: Incorrect configurations, such as too short connection or request timeouts, could lead to premature termination of requests, yielding such errors.

1. **Implications for Karafka Web UI**:

    - If you're experiencing this issue with topics related to Karafka Web UI, upgrading to the latest Karafka and Karafka Web UI versions is recommended as error handling has been continuously improved.

    - Another scenario where this error might pop up is during rolling upgrades of the Kafka cluster. If the Karafka Web UI topics have a replication factor 1, there's no redundancy for the partition data. During a rolling upgrade, as brokers are taken down sequentially for upgrades, there might be brief windows where the partition's data isn't available due to its residing broker being offline.

Below, you can find a few recommendations in case you encounter this error:

1. **Upgrade Karafka**: Always use the latest stable versions of Karafka and Karafka Web UI to benefit from improved error handling and bug fixes.

1. **Review Configurations**: Examine your Karafka client configurations, especially timeouts and broker addresses, to ensure they're set appropriately.

1. **Replication Factor**: For critical topics, especially if you're using Karafka Web UI, consider setting a replication factor greater than 1. This ensures data redundancy and availability even if a broker goes down.

In summary, while the error message might seem daunting, understanding its nuances can guide targeted troubleshooting, and being on the latest software versions can often preemptively avoid such challenges.

## We faced downtime due to a failure in updating the SSL certs. How can we retrieve messages that were sent during this downtime?

If the SSL certificates failed on the producer side, the data might not have been produced to Kafka in the first place. If your data is still present and not compacted due to the retention policy, then you should be able to read it.

You can read from the last known consumed offset by seeking this offset + 1 or use Karafka [Iterator API](Pro-Consumer-Groups-Iterator-API) or Web UI [Explorer](Web-UI-Features#explorer) to view those messages.

## Where can I find details on troubleshooting and debugging for Karafka?

You can refer to [this](Infrastructure-Problems-and-Troubleshooting) documentation page.

## I see a "JoinGroup error: Broker: Invalid session timeout" error. What does this mean, and how can I resolve it?

This error occurs when a consumer tries to join a consumer group in Apache Kafka but provides an invalid session timeout value. The session timeout is when the broker waits after losing contact with a consumer before considering it gone and starting a rebalance of the consumer group. If this value is too low or too high (outside the broker's allowed range), the broker will reject the consumer's request to join the group.

1. Check the configuration of your consumer to ensure you're setting an appropriate session timeout value.

1. Ensure that the value lies within the broker's allowable range, which you can find in the broker's configuration.

1. Adjust the consumer's session timeout value to be within this range and try reconnecting.

Remember to make sure that the timeout value you set is suitable for your use case, as it can affect the responsiveness of your consumer group to failures.

## Can I log errors in Karafka with topic, partition, and other consumer details?

Yes, it is possible to log errors with associated topic, partitions, and other information in Karafka, but it depends on the context and type of the event. Karafka's `error.occurred` event is used for logging any errors, including errors not only within your consumption code but also in other application areas due to its asynchronous nature.

Key Points to Remember:

- **Check Event Type**: Always examine the `event[:type]` to understand the nature of the error. This helps determine whether the error is related to message consumption and will have the relevant topic and partition information.

- **Errors Outside Consumption Flow**: There can be instances where the caller is a consumer, but the error occurs outside the consumption flow. In such cases, the necessary details might not be available.

The rationale for this Approach:

Karafka provides a single, simplified API for all error instrumentation. This design choice aims to streamline error handling across different parts of the application, even though some errors may only sometimes have the complete contextual information you are looking for.

Checking the `event[:type]` and recognizing the role of the `event[:caller]` will guide you in determining whether the necessary details are available for a specific error. Remember, due to the asynchronous nature of Karafka, not all errors will have associated topic and partition details.

## Why am I getting `+[NSCharacterSet initialize] may have been in progress in another thread when fork()` error when forking on macOS?

When running a Rails application with Karafka and Puma on macOS, hitting the Karafka dashboard or endpoints can cause crashes with an error related to fork() and Objective-C initialization. This is especially prevalent in Puma's clustered mode.

The error message is usually along the lines of:

```shell
objc[<pid>]: +[NSCharacterSet initialize]
may have been in progress in another thread when fork() was called.
We cannot safely call it or ignore it in the fork() child process.
Crashing instead. Set a breakpoint on objc_initializeAfterForkError to debug.
```

The issue concerns initializing specific libraries or components in a macOS environment, particularly in a multi-process environment. It may involve Objective-C libraries being initialized unsafely after a fork, which macOS does not allow.

There are a few potential workarounds:

1. Setting the environment variable `OBJC_DISABLE_INITIALIZE_FORK_SAFETY=YES` when running Puma. This is not ideal as it might introduce other issues.

1. Creating an instance of `Rdkafka` that would force-load all the needed components before the fork as follows:

    ```ruby
    require 'rdkafka'

    before_fork do
      # Make sure to configure it according to your cluster location
      config = {
        'bootstrap.servers': 'localhost:9092'
      }

      # Create a new instance and close it
      # This will load or dynamic components on macOS
      # Not needed under other OSes, so not worth running
      if RUBY_PLATFORM.include?('darwin')
        ::Rdkafka::Config.new(config).admin.close
      end
    end
    ```

It is worth pointing out that this is not a Karafka-specific issue. While the issue manifests when using Karafka with Puma, it's more related to how macOS handles forking with Objective-C libraries and specific initializations post-fork.

## What causes a "Broker: Policy violation (policy_violation)" error when using Karafka, and how can I resolve it?

The `Broker: Policy violation (policy_violation)` error in Karafka typically occurs due to exceeding Kafka's quota limitations or issues with Access Control Lists (ACLs). This error indicates that an operation attempted by Karafka has violated the policies set on your Kafka cluster. To resolve this issue, follow these steps:

1. **ACL Verification**: Ensure that your Kafka cluster's ACLs are configured correctly. ACLs control the permissions for topic creation, access, and modification. If ACLs are not properly set up, Karafka might be blocked from performing necessary operations.

1. **Quota Checks**: Kafka administrators can set quotas on various resources, such as data throughput rates and the number of client connections. If Karafka exceeds these quotas, it may trigger a `policy_violation` error. Review your Kafka cluster's quota settings to ensure they align with your usage patterns.

1. **Adjust Configurations**: Make the necessary adjustments based on your findings from the ACL and quota checks. This might involve modifying ACL settings to grant appropriate permissions or altering quota limits to accommodate your application's needs.

## What should I do if I encounter a loading issue with Karafka after upgrading Bundler to version `2.3.22`?

This issue is typically caused by a gem conflict related to the Thor gem version. It has been observed that Thor version `1.3` can lead to errors when loading Karafka. The problem is addressed in newer versions of Karafka, which no longer depend on Thor. To resolve the issue:

1. Ensure you're using a version of Thor earlier than `1.3`, as recommended by community members.

1. Upgrade to a newer version of Karafka that does not use Thor. It's recommended to upgrade to at least version `2.2.8` for stability and to take advantage of improvements.

## What should I do if I encounter the `Broker: Not enough in-sync replicas` error?

This error indicates that there are not enough in-sync replicas to handle the message persistence. Here's how to address the issue:

1. **Check Cluster Size and Configuration:** Ensure that your Kafka cluster has enough brokers to meet the required replication factor for the topics. If your replication factor is set to `3`, you need at least `3` brokers.

1. **Increase Broker Storage Size:** If your brokers are running out of storage space, they will not be able to stay in sync. Increasing the storage size, if insufficient, can help maintain enough in-sync replicas.

1. **Check the Cluster's `min.insync.replicas` Setting:** Ensure that the `min.insync.replicas` setting in your Kafka cluster is not higher than the replication factor of your topics. If `min.insync.replicas` is set to a value higher than the replication factor of a topic, this error will persist. In such cases, manually adjust the affected topics' replication factor to match the required `min.insync.replicas` or recreating the topics with the correct replication factor.

1. **Check for RF=MinISR Misconfiguration:** Setting `min.insync.replicas` equal to `replication.factor` causes write failures during broker maintenance. See [Broker Failures and Fault Tolerance](Infrastructure-Broker-Failures-and-Fault-Tolerance) for detailed scenarios and recommendations.

By following these steps, you should be able to resolve the "Broker: Not enough in-sync replicas" error and ensure your Kafka cluster is correctly configured to handle the required replication.

## Why am I getting the error: "No provider for SASL mechanism GSSAPI: recompile librdkafka with libsasl2 or openssl support"?

This error:

```shell
No provider for SASL mechanism GSSAPI:
  recompile librdkafka with libsasl2 or openssl support.
  Current build options: PLAIN SASL_SCRAM OAUTHBEARER (Rdkafka::Config::ClientCreationError)
```

indicates that `librdkafka` was not built with support for GSSAPI (Kerberos). This often occurs when the necessary development packages (`libsasl2-dev`, `libssl-dev` and `libkrb5-dev`) were not available during the `librdkafka` build process. To fix this, make sure to install these packages before compiling librdkafka. On a Debian-based system, use:

```shell
sudo apt-get update && sudo apt-get install -y libsasl2-dev libssl-dev libkrb5-dev
```

## How can I check if `librdkafka` was compiled with SSL and SASL support in Karafka?

You can check if `librdkafka` has SSL and SASL support by running the following code in an interactive Ruby session (`irb`):

```ruby
require 'rdkafka'

config = {
  :"bootstrap.servers" => "localhost:9092",
  :"group.id" => "ruby-test",
  debug: 'all'
}

consumer = Rdkafka::Config.new(config).consumer
consumer.subscribe("ruby-test-topic")
consumer.close
```

This will generate logs. Look for lines containing `builtin.features` that list `ssl` and `sasl_scram`:

```shell
rdkafka#consumer-1 initialized (builtin.features gzip,snappy,ssl,sasl,regex,lz4, \
  sasl_gssapi,sasl_plain,sasl_scram,plugins,zstd,sasl_oauthbearer,http,oidc, GCC \
  GXX PKGCONFIG INSTALL GNULD LDS C11THREADS LIBDL PLUGINS ZLIB SSL SASL_CYRUS \
  ZSTD CURL HDRHISTOGRAM LZ4_EXT SYSLOG SNAPPY SOCKEM SASL_SCRAM SASL_OAUTHBEARER \
  OAUTHBEARER_OIDC CRC32C_HW, debug 0xfffff)
```

## Why does `librdkafka` lose SSL and SASL support in my multi-stage Docker build?

There are a couple of reasons `librdkafka` might lose SSL and SASL support in a multi-stage Docker build:

1. **Removing Essential Build Dependencies Too Early**: In multi-stage builds, it's common to install libraries and development tools in an earlier stage and then copy the built software into a slimmer final stage to reduce the image size. However, if the necessary packages (like `libssl-dev` and `libsasl2-dev`) are removed or not available during the initial build stage, librdkafka will compile without SSL and SASL support.

    **Solution**: Ensure that `libssl-dev`, `libsasl2-dev`, and other required libraries are installed in the stage where you build librdkafka. Only clean up or remove these libraries after the build is complete.

1. **Build Layers Removal During Docker Image Creation**:

    During the process of building Docker images, each command in the Dockerfile creates a new layer. When a layer is removed, all the changes made in that layer (including installed libraries) are also discarded. If the layers containing the installation of `libssl-dev`, `libsasl2-dev`, or other dependencies are removed before librdkafka is fully built and linked, then the resulting image will lack SSL and SASL support.

    **Solution**: To avoid this issue, ensure that any cleanup commands (like `apt-get` remove or `rm`) are executed after the software is compiled and only if you do not need those libraries anymore for runtime.

## Why am I getting "could not obtain a connection from the pool" errors?

This error occurs when your database connection pool is smaller than your concurrency setting.

If you have `concurrency` in Karafka set to `10` but your Rails database pool is set to the default of 5, you'll get connection pool timeouts because one database connection may be needed per worker thread.

To fix this, increase your database pool size to at least match your concurrency setting:

```ruby
# database.yml
production:
 pool: <%= ENV.fetch("DB_POOL", 15) %>  # Set higher than your concurrency
```

## I received a Confluent KIP-896 deprecation notice. Is Karafka using deprecated Kafka protocol APIs?

**No**. Karafka does not use any deprecated Kafka protocol APIs. The Karafka ecosystem (including `karafka-rdkafka` and `karafka-web`) uses librdkafka versions that are well above the minimum required by KIP-896. For example, Karafka 2.5.0 ships with librdkafka 2.8.0, while the Confluent minimum is 1.8.2. The librdkafka version used by Karafka has not been close to 1.8.2 since 2022.

If you receive a KIP-896 deprecation notice from Confluent and see Karafka Web UI topics (`karafka_consumers_metrics`, `karafka_consumers_states`) mentioned, it does not mean Karafka is the source. Karafka identifies itself to the broker in two ways:

- **`client.id`**: Set to your configured `config.client_id` value (not the default `rdkafka`). If you see a raw `rdkafka` client ID, that client is **not** Karafka.
- **`client.software.version`**: Karafka reports a detailed version string containing the Karafka, rdkafka-ruby, and librdkafka versions (for example, `v2.5.0-rdkafka-ruby-v0.19.5-librdkafka-v2.8.0`). You can ask Confluent support to identify the offending client using this field.

If the deprecation notice references a different language (such as Python) or a default `rdkafka` client ID, the source is most likely a different application or script connecting to your cluster. Common causes include:

- A forgotten monitoring script, lag exporter, or data pipeline tool consuming from Karafka's internal topics.
- An older application using a different Kafka client library with an outdated librdkafka version.
- A misidentification on the Confluent side. If in doubt, ask Confluent support to provide the exact `client.software.version` and `client.id` of the flagged client so you can trace its origin.
