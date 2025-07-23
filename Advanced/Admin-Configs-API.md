The Karafka Admin Configs API provides tools for managing configuration settings for Kafka brokers and topics. This API supports retrieving configuration details (`describe`) and incremental alterations (`alter`) to these configurations. The operations are designed to be flexible, supporting both individual and batch operations.

!!! Tip "Asynchronous Operation Propagation"

    Many Kafka administrative operations (ACLs, configs, topics) are asynchronous in nature. When an API call returns successfully, this means the controller has accepted the request, not that the change has been fully propagated across the cluster. Configuration changes, ACL updates, and topic modifications may take several seconds to be applied on all brokers, depending on cluster size and network conditions. Always allow time for propagation and verify changes are applied across your cluster before proceeding with dependent operations.

!!! Tip "Declarative Topics Feature For Topics Management"

    The Admin Configs API provides low-level access for managing Kafka topics and broker configurations. While powerful, it requires detailed knowledge and careful management of individual settings. For a more streamlined and error-resistant approach, consider using the high-level [declarative topics](Declarative-Topics) feature provided by Karafka. This feature allows for easier and more declarative management of topic configurations, making it a superior choice for most use cases.

## What are Kafka Configurations?

Kafka configurations are key-value pairs that define the behavior of brokers and topics. Managing these configurations properly is essential for optimizing performance, ensuring security, and maintaining reliability in your Kafka environment.

## Types

The Karafka Admin Configs API involves several types that categorize the details of configuration management in Kafka. Understanding these types is crucial for effective configuration management.

### Resource Types

Resource types refer to Kafka entities that can be configured, such as topics or brokers. These are fundamental to identifying which parts of your Kafka cluster you are managing.

<table>
  <thead>
    <tr>
      <th>Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>:topic</code></td>
      <td>Represents a single Kafka topic.</td>
    </tr>
    <tr>
      <td><code>:broker</code></td>
      <td>Represents a specific Kafka broker.</td>
    </tr>
  </tbody>
</table>

### Operation Types

Operations types within this API are used to specify the configuration changes being applied, such as setting or deleting values.

<table>
  <thead>
    <tr>
      <th>Operation Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>:set</code></td>
      <td>Sets or updates a configuration value.</td>
    </tr>
    <tr>
      <td><code>:delete</code></td>
      <td>Removes a configuration entry.</td>
    </tr>
    <tr>
      <td><code>:append</code></td>
      <td>Adds a value to a list-based configuration.</td>
    </tr>
    <tr>
      <td><code>:subtract</code></td>
      <td>Removes a value from a list-based configuration.</td>
    </tr>
  </tbody>
</table>

### Methods

<table>
  <thead>
    <tr>
      <th>Method</th>
      <th>Description</th>
      <th>Arguments</th>
      <th>Returns</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>describe(*resources)</code></td>
      <td>Retrieves configurations for specified Kafka resources.</td>
      <td><code>resources</code> - A single resource or an array of resources.</td>
      <td>An array of <code>Resource</code> objects with configuration details.</td>
      <td>Fetches configuration details in a single operation, even for multiple resources.</td>
    </tr>
    <tr>
      <td><code>alter(*resources)</code></td>
      <td>Applies configuration changes to specified Kafka resources using incremental updates.</td>
      <td><code>resources</code> - A single resource or an array of resources.</td>
      <td>Applies the changes and provides a confirmation of the update.</td>
      <td>This method is non-transactional and may succeed partially; validate configurations before applying.</td>
    </tr>
  </tbody>
</table>

These methods provide a robust interface for detailed management of configurations in a Kafka environment, offering both retrieval and update functionalities.

## Usage

Here's how you might typically use the API to manage Kafka configurations:

```ruby
# Describe topic configurations
resource = Karafka::Admin::Configs::Resource.new(type: :topic, name: 'example')
topics = Karafka::Admin::Configs.describe(resource)
topics.each do |topic|
  topic.configs.each do |config|
    puts "#{topic.name} #{config.name}: #{config.value}"
  end
end

# Alter topic configurations
resource = Karafka::Admin::Configs::Resource.new(type: :topic, name: 'example')
# Set retention to 2 hours
resource.set('retention.ms', '7200000')

# Apply the changes
Karafka::Admin::Configs.alter(resource)
```

## Example Use Cases

- **Configuration Audits**: Retrieve configurations to review and ensure compliance with operational standards.

- **Dynamic Configuration Tuning**: Adjust topic or broker configurations in response to changes in usage patterns or operational requirements.

- **Batch Configuration Management**: Simultaneously update configurations for multiple brokers or topics, improving efficiency in large-scale environments.
