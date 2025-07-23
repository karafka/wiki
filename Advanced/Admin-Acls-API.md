# Admin ACLs (Access Control Lists) API

Apache Kafka ACLs (Access Control Lists) provide a robust mechanism to control permissions and access rights for Kafka resources. They are crucial for ensuring data security, managing consumer and producer interactions, and maintaining overall cluster integrity. Karafka extends these capabilities with a simplified, Ruby-friendly API.

The Karafka Admin ACLs API provides a structured and easy-to-use interface for managing Kafka ACLs. It allows developers to create, delete, and describe ACLs with Ruby symbol-based definitions, enhancing readability and ease of use compared to the direct usage of `librdkafka` types.

This documentation provides an overview of Kafka ACLs, how to use the ACLs with Karafka, primary use cases, and code samples to get you started.

!!! Tip "Asynchronous Operation Propagation"

    Many Kafka administrative operations (ACLs, configs, topics) are asynchronous in nature. When an API call returns successfully, this means the controller has accepted the request, not that the change has been fully propagated across the cluster. Configuration changes, ACL updates, and topic modifications may take several seconds to be applied on all brokers, depending on cluster size and network conditions. Always allow time for propagation and verify changes are applied across your cluster before proceeding with dependent operations.

## What are Kafka ACLs?

Kafka ACLs are rules that determine how users and applications can interact with Kafka resources, such as topics, consumer groups, and brokers. Each ACL entry specifies the allowed or denied operations for a particular principal (user or client) on a given resource. Operations can include reading from a topic, writing to a topic, or creating a consumer group.

ACLs ensure that only authorized entities can access Kafka's functionalities, which is vital for maintaining data security and operational integrity.

## Types

The Karafka Admin ACLs API defines several "types" that categorize and specify details for ACL management in a Kafka environment. These types are crucial for setting up detailed and secure access controls.

These types play a critical role in the Karafka Admin ACLs API, providing a structured and comprehensive way to manage access controls within a Kafka environment. Understanding and utilizing these types enables you to secure and regulate operations in your Kafka clusters effectively.

### Resource Types

Resource types are entities within Kafka for which ACLs can be defined. They specify the scope of the ACL.

<table>
  <thead>
    <tr>
      <th class="nowrap">Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="nowrap"><code>:any</code></td>
      <td>Used for lookups, not for setting permissions.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:topic</code></td>
      <td>Represents a single Kafka topic.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:consumer_group</code></td>
      <td>Represents a single Kafka consumer group.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:broker</code></td>
      <td>Represents a given Kafka broker.</td>
    </tr>
  </tbody>
</table>

### Resource Pattern Types

Resource pattern types dictate how ACLs are applied to resources, defining the precision and scope of access rules.

<table>
  <thead>
    <tr>
      <th class="nowrap">Pattern Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="nowrap"><code>:any</code></td>
      <td>For lookups only; not for setting permissions.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:match</code></td>
      <td>Targets resources with a pattern matching for broader control.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:literal</code></td>
      <td>Applies ACLs to a specifically named resource.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:prefixed</code></td>
      <td>Applies ACLs to all resources with a common name prefix.</td>
    </tr>
  </tbody>
</table>

### Operation Types

Operations are the actions that can be permitted or denied on Kafka resources, defining what a user or service can do.

<table>
  <thead>
    <tr>
      <th class="nowrap">Operation Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="nowrap"><code>:any</code></td>
      <td>For lookups, indicating no specific operation type.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:all</code></td>
      <td>Allows all operations (complete access).</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:read</code></td>
      <td>Grants read access to a resource.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:write</code></td>
      <td>Allows writing data to a resource.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:create</code></td>
      <td>Permits the creation of resources.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:delete</code></td>
      <td>Enables the deletion of resources.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:alter</code></td>
      <td>Allows modifications to resources.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:describe</code></td>
      <td>Grants the ability to view resource details.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:cluster_action</code></td>
      <td>Permits actions related to the Kafka cluster.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:describe_configs</code></td>
      <td>Allows viewing configurations for resources.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:alter_configs</code></td>
      <td>Enables modification of resource configurations.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:idempotent_write</code></td>
      <td>Grants the ability for idempotent writes.</td>
    </tr>
  </tbody>
</table>

### Permission Types

Permission types indicate the nature of the access being granted or denied, essentially determining whether an operation is allowed.

<table>
  <thead>
    <tr>
      <th class="nowrap">Permission Type</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="nowrap"><code>:any</code></td>
      <td>Used for lookups, indicating no specific permission type.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:allow</code></td>
      <td>Grants the specified operations, enabling actions on the resource.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>:deny</code></td>
      <td>Blocks the specified operations, preventing actions on the resource.</td>
    </tr>
  </tbody>
</table>

## Usage

When initializing an ACL in Karafka, you'll use several parameters to define these rules. Here's a breakdown of each argument you'll provide:

<table>
  <thead>
    <tr>
      <th>Argument</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td class="nowrap"><code>resource_type</code></td>
      <td>Determines the type of Kafka resource you're securing, such as a topic (<code>:topic</code>) or consumer group (<code>:consumer_group</code>). You can specify this as a symbol from <code>RESOURCE_TYPES_MAP</code> for readability or use a direct numerical type from <code>rdkafka</code>. Choose the resource type that aligns with the item you wish to control access to.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>resource_name</code></td>
      <td>The specific name of the resource, like the name of a topic. This can sometimes be <code>nil</code>, mainly when your resource pattern type doesn't require a particular name. Use this to pinpoint the exact resource you're setting the ACL for.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>resource_pattern_type</code></td>
      <td>Defines how the ACL applies to the resource. You might set it to a literal match for a specific resource or a prefixed pattern to cover a group of resources. This is specified using a symbol from <code>RESOURCE_PATTERNS_TYPE_MAP</code> or a direct numerical type.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>principal</code></td>
      <td>The principal (usually a user or client identity) the ACL is for. This specifies who the ACL will apply to. It can sometimes be <code>nil</code> if you're defining a more general rule that isn't principal-specific.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>host</code></td>
      <td>Indicates the host from which the principal can access the resource. It defaults to <code>*</code> (all hosts), but can be set to a specific IP or hostname to restrict access further.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>operation</code></td>
      <td>What action the principal can or cannot perform, like read, write, or create. This is chosen from the <code>OPERATIONS_MAP</code> and can be a descriptive symbol or a numerical type. Select the operation that best fits the action you wish to allow or prevent.</td>
    </tr>
    <tr>
      <td class="nowrap"><code>permission_type</code></td>
      <td>Specifies whether to allow or deny the operation defined. This is where you enforce the rule, granting or restricting access as needed. Choose 'allow' to enable the operation for the principal or 'deny' to block it.</td>
    </tr>
  </tbody>
</table>

### Creating an ACL

To create an ACL, you need to instantiate a `Karafka::Admin::Acl` object and use the `#create` method:

```ruby
acl = Karafka::Admin::Acl.new(
  resource_type: :topic,
  resource_name: 'my_topic',
  resource_pattern_type: :literal,
  principal: 'user:Bob',
  host: '*',
  operation: :write,
  permission_type: :allow
)

Karafka::Admin::Acl.create(acl)
```

### Deleting an ACL

To delete an ACL, you can use the `#delete` method with an existing ACL object:

```ruby
acls = Karafka::Admin::Acl.all

Karafka::Admin::Acl.delete(acls.first)
```

or you may explicitly define the ACL to remove:

```ruby
acl = Karafka::Admin::Acl.new(
  resource_type: :topic,
  resource_name: 'my_topic',
  resource_pattern_type: :literal,
  principal: 'user:Bob',
  host: '*',
  operation: :write,
  permission_type: :allow
)

Karafka::Admin::Acl.delete(acl)
```

### Describing ACLs

To retrieve details about existing ACLs, use the `#describe` method. It returns all ACLs matching the provided criteria:

```ruby
acl_match = Karafka::Admin::Acl.all.first

acls = Karafka::Admin::Acl.describe(acl_match)

acls.each do |acl|
  puts acl.inspect
end
```

### Listing All ACLs

To list all ACLs within the Kafka cluster, you can use the `#all` method:

```ruby
all_acls = Karafka::Admin::Acl.all

all_acls.each do |acl|
  puts acl.inspect
end
```

## Example Use Cases and When to Use It

- **Topic Access Control**: Restrict read/write operations on specific topics to certain users or applications.
- **Consumer Group Management**: Control which principals can create or interact with consumer groups.
- **Administrative Restriction**: Limit who can create, alter, or delete topics within the Kafka cluster.
- **Security**: Ensure that only authorized entities can perform operations, maintaining data integrity and security.
- **Securing Data**: Whenever you need to secure your Kafka data, ensure that only authorized users and services can access or modify it.
- **Multi-tenant Systems**: In systems where multiple users or services interact with Kafka, you must enforce strict access controls.
- **Compliance and Auditing**: Your application must comply with security standards or require auditing capabilities for access and operations.

## Summary

Karafka's Admin ACLs API provides a powerful yet user-friendly way to manage Kafka ACLs, ensuring secure and authorized access to Kafka resources. By leveraging Ruby symbols and a structured API, it simplifies the process of ACL management, making it more accessible and less error-prone for Ruby developers.

Whether securing a small project or an enterprise-scale system, understanding and utilizing Kafka ACLs through Karafka can significantly enhance your application's security and data governance.
