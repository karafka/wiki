Karafka Web UI Pro provides topic management capabilities, allowing you to create, configure, delete, and manage topics and partitions directly from the web interface. These features eliminate the need for command-line tools or separate admin interfaces, streamlining your Kafka administration workflow.

!!! info "Changes Visibility in Web UI"

    When administrative operations (creating/deleting topics, modifying configurations, adding partitions) are submitted through the Web UI, they are immediately accepted by Kafka. However, due to the refresh interval and cluster synchronization timing, the Web UI display may take several seconds to reflect these changes. Additionally, while changes become effective immediately in Kafka, they may take time to propagate across all brokers in the cluster fully. If changes don't appear immediately in the UI, wait at least 15-30 seconds, refresh the page, or navigate to another section and back to see the updated state.

## Creating Topics

The topic creation feature allows you to easily create new Kafka topics with customizable configurations directly from the Web UI.

### Topic Creation Process

To create a new topic:

1. Navigate to **Home** → **Topics**
2. Click on **Create Topic**
3. You'll see the "Topic Creation Settings" screen with important notices:

!!! info "Topic Creation Information"

    - Topic name cannot be changed after creation
    - Number of partitions can only be increased, never decreased
    - Additional settings can be configured from the topic configuration page
    - It may take Kafka up to a few minutes to fully synchronize the new topic
    - Consumers may require additional time to discover the topic, depending on their metadata refresh frequency

4. Fill in the required fields:

- **Topic Name**: Only alphanumeric characters, dots, underscores, and hyphens are allowed
- **Number of Partitions**: Minimum 1 partition (cannot be decreased after creation)
- **Replication Factor**: Number of replicas for each partition (minimum 1, recommended 3 for production)

5. Click the submit button to create your topic

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-topics-management-create.png" alt="Karafka Web UI topic creation interface" />
</p>

## Deleting Topics

When a topic is no longer needed, you can safely remove it through the Web UI.

### Topic Deletion Process

To delete a topic:

1. Navigate to **Home** → **Topics** → **[Your Topic Name]**
2. Click on **Delete Topic** at the page bottom
3. You'll see a comprehensive warning screen:

!!! warning "Topic Removal Warning"

    - All data in this topic will be permanently deleted and cannot be recovered
    - All consumers and producers for this topic will stop functioning
    - Applications dependent on this topic may experience errors or disruptions
    - Consumer group offsets associated with this topic will be lost

!!! info "Before proceeding, ensure that"

    - All applications consuming from this topic have been properly shut down
    - All producers to this topic have been stopped
    - You have backed up any critical data if needed
    - You have notified relevant team members about this deletion

4. Review the final warning showing the topic name and partition count
5. Confirm the deletion

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-topics-management-delete.png" alt="Karafka Web UI topic deletion interface" />
</p>

## Managing Topic Configuration

The topic configuration management feature allows you to view and modify the configuration settings of existing Kafka topics with a user-friendly interface.

### Viewing Topic Configuration

To view a topic's configuration:

1. Navigate to **Home** → **Topics** → **[Your Topic Name]** → **Configuration**
2. You'll see a tabular view with all configuration parameters:

   - **Name**: The configuration parameter name
   - **Value**: Current setting value
   - **Default**: Whether this is the default value
   - **Sensitive**: Whether the parameter contains sensitive information
   - **Read Only**: Whether the parameter can be modified
   - **Options**: Additional details about the parameter

The configuration table includes all standard Kafka topic settings, such as:

- `cleanup.policy`
- `compression.type`
- `delete.retention.ms`
- `file.delete.delay.ms`
- `retention.bytes`
- `retention.ms`
- `segment.bytes`
- And many more

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-topics-management-configuration.png" alt="Karafka Web UI topic configuration interface" />
</p>

### Modifying Topic Configuration

To modify a specific configuration parameter:

1. Navigate to **Home** → **Topics** → **[Your Topic Name]** → **Configuration**
2. Click on the specific parameter you want to modify
3. Click **Edit**
4. You'll see the "Configuration Update Warning":

!!! warning "Configuration Update Warning"

    - Changing topic configurations may affect topic behavior and performance
    - Some changes may take time to propagate across the cluster
    - Applications consuming from this topic may be impacted

!!! info "Before updating this configuration"

    - Ensure you understand the impact of changing this value
    - Consider testing the change in a non-production environment first
    - Monitor the topic after the change to ensure expected behavior

5. You'll see:

- The property name (e.g., `cleanup.policy`)
- Current value (e.g., `delete`)
- A field to enter the new value

6. Enter the new value and submit the change

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-topics-management-edit.png" alt="Karafka Web UI topic configuration interface" />
</p>

## Managing Topic Partitions

Karafka Web UI Pro allows you to increase the number of partitions for existing topics to scale throughput.

### Increasing Partition Count

To increase the number of partitions:

1. Navigate to **Home** → **Topics** → **[Your Topic Name]** → **Distribution**
2. Click on **Increase Partitions**
3. You'll see the "Partition Update Warning":

!!! warning "Partition Update Warning"

    - Increasing partitions is a one-way operation - partition count cannot be decreased later
    - Adding partitions affects message ordering and consistent hashing
    - Consumers will need to detect the partition count change and rebalance
    - Message distribution across partitions may become uneven until data rotates
    - Changes may take several minutes to be visible in the UI but will be applied immediately

!!! info "Before increasing partitions"

    - Ensure all consumers support dynamic partition detection
    - Consider the impact on message ordering in your applications
    - Plan for temporary rebalancing as consumers detect the change
    - Monitor consumer lag during and after the operation
    - Consider increasing partitions during low-traffic periods

4. You'll see:

- Current partition count (e.g., `1`)
- A field to enter the new partition count (must be greater than the current count)

5. Enter the new partition count and submit the change

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-topics-management-increase.png" alt="Karafka Web UI partition management interface" />
</p>

## Best Practices

When managing topics through the Karafka Web UI Pro, consider these best practices:

1. **Naming Conventions**: Establish and follow a consistent topic naming convention
1. **Right-sizing Partitions**: Start with a reasonable number of partitions based on expected throughput
1. **Replication Factor**: Use a replication factor of at least 3 for production topics
1. **Configuration Tuning**: Adjust retention and segment settings based on data volume and access patterns
1. **Caution with Deletion**: Always double-check before deleting topics, as this action cannot be undone
1. **Permission Control**: Use the [Policies feature](Pro-Web-UI-Policies) to control who can manage topics
1. **Change Documentation**: Document significant topic changes for team awareness
1. **Testing**: Test configuration changes in non-production environments when possible
1. **Monitoring**: Monitor topic metrics after making changes to ensure desired behavior

## Limitations and Considerations

- Some operations may be restricted by your Kafka cluster configuration
- Adding partitions is possible, but reducing the number of partitions is not supported by Kafka
- Topic creation and deletion operations require appropriate ACL permissions
- Configuration changes may take time to propagate across the cluster
- The broker must have `delete.topic.enable=true` to support topic deletion
- UI updates may take several minutes to reflect changes, even though they are applied immediately

## Summary

The topic management features in Karafka Web UI Pro provide a comprehensive solution for administering your Kafka topics without leaving the web interface. With intuitive interfaces for creating topics, modifying configurations, and managing partitions, these tools streamline common administrative tasks and provide a user-friendly alternative to command-line tools.

Combined with other Karafka Pro features like [Data Explorer](Pro-Web-UI-Explorer), [Topics Insights](Pro-Web-UI-Topics-Insights), and [Search](Pro-Web-UI-Search), topic management completes the toolset needed for efficient Kafka operations and maintenance.
