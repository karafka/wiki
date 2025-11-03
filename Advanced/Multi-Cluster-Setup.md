# Multi-Cluster Setup

Karafka is a robust framework that allows applications to interact with multiple Kafka clusters simultaneously. This provides enhanced scalability, redundancy, and flexibility, enabling developers to optimize data processing and manage message streams across various clusters with ease. 

## Overview

1. **Karafka and Multiple Clusters**: Karafka can be used both to consume from and produce to multiple Kafka clusters.

2. **Default Configuration**: By default, Karafka is set up to operate with a single Kafka cluster, which is the most common case.

3. **Primary Cluster Reference**:

    - The `Karafka.producer` will always refer to the primary cluster defined unless overwritten.

    - ActiveJob jobs, when scheduled with Karafka's ActiveJob backend, will also always go to the primary cluster.

4. Admin Operations and Web UI:

    - All admin operations are performed on the primary cluster.

    - While the Web UI can work with multiple clusters, both reporting and processing of the Web UI data will take place on the primary cluster unless `Karafka::Web.producer` is redefined.

## Configuration

Configuring Karafka for multiple clusters requires attention to two primary areas: consumer settings and producer settings.

### Consumer Settings

To consume data from multiple clusters, the configuration within the `kafka` scope needs to be updated per topic. Specifically, for topics that originate from a secondary cluster, you need to ensure that they are correctly pointed to the appropriate cluster. By doing this, you enable Karafka to know from which cluster to fetch the messages for a particular topic:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Primary cluster
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092'
    }

    # Other settings...
  end

  routes.draw do
    # This topic will be consumed from the primary cluster
    topic :example do
      consumer ExampleConsumer
    end

    topic :example2 do
      consumer Example2Consumer
      # This topic will be consumed from a secondary cluster
      kafka('bootstrap.servers': 'example.org:9092')
    end
  end
end
```

!!! note

    Karafka intelligently groups topics targeting different clusters into distinct subscription groups. This approach optimizes and conserves connections to Kafka, ensuring efficient resource utilization and streamlined data consumption across clusters.

### Producer Settings

While the consumption settings ensure Karafka knows where to pull messages from, the production settings dictate where Karafka sends the outbound messages. An extra setup is essential when producing messages to multiple clusters to ensure that the messages are directed to the correct location.

Remember, a correct configuration is crucial for the efficient and error-free operation of Karafka when working with multiple Kafka clusters.

If you want to configure the primary `Karafka.producer` to write messages to a cluster different than the default one, please refer to [this](WaterDrop-reconfiguration) documentation section.

To produce data across multiple clusters, set up individual producers for each targeted cluster. However, it's essential to manually integrate instrumentation and error tracking, as these producers won't be monitored by the default Karafka Web UI.

```ruby
# Just create producers targeting other clusters
SECONDARY_CLUSTER_PRODUCER = WaterDrop::Producer.new do |config|
  config.deliver = true
  config.kafka = {
    'bootstrap.servers': 'example.com:9092',
    'request.required.acks': 1
  }
end
```

## Common Mistakes

- **Ignoring Primary Default**: Forgetting that `Karafka.producer` and ActiveJob jobs default to the primary cluster can lead to unexpected routing of messages.

- **Mismatched Cluster Configuration**: Ensure that all specified clusters in the configuration have the correct broker addresses.

- **Web UI Assumption**: Assuming that the Web UI processes data on the cluster it shows. Remember, data processing is done on the primary cluster unless overridden.

- **Overcomplicating Setup**: Using multiple clusters can add complexity to your setup. Ensure there's a clear need for this before diving in.

- **Monitoring Challenges**: Monitoring and alerting can become challenging with multiple clusters. Ensure you have a solid monitoring strategy.

## Example use-cases

- **Geographical Distribution**: For businesses operating in different regions, separate clusters can help localize data processing closer to where data is produced or consumed.

- **Disaster Recovery**: A secondary cluster can be crucial for backup and recovery, ensuring business continuity even if the primary cluster fails.

- **Data Segregation**: For businesses handling data with different security or compliance requirements, other clusters can segregate data based on these requirements.

- **Load Distribution**: High-traffic applications can distribute their load across multiple clusters to ensure no single cluster becomes a bottleneck.

- **Multi-Tenancy**: For businesses offering multi-tenant solutions, different clusters can cater to various tenants, ensuring isolation and independent scalability.

## Conclusion

While Karafka's ability to operate with multiple clusters offers flexibility and scalability, it's essential to understand the nuances and potential pitfalls of such a setup. Plan your configuration carefully, and ensure you're leveraging the multi-cluster configuration for valid business reasons.

---

## See Also

- [Configuration](Configuration) - Configure Karafka for multiple clusters
- [Routing](Routing) - Set up routing for different clusters
- [Producing Messages](Producing-Messages) - Produce to multiple clusters with WaterDrop
