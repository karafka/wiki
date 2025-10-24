# Web UI Setup for Development vs Production

Karafka Web UI can operate in production mode. It is, however, essential to understand how it works and its limitations.

## Dedicated Web UI Processes

To materialize and prepare data for the Karafka Web UI, Karafka adds an additional consumer group to your routes responsible for consuming internal Karafka Web UI topics. In a development environment, this setup works fine because you typically run a small number of `karafka server` instances, and resource contention is minimal.

However, in a production environment, things can get more complex. The Web UI consumer that processes and materializes data does not have any priority over other consumers running within the same Karafka process. This means that unless the Web UI has dedicated resources, the consumption, and materialization of data for the UI could be delayed if other consumers are processing large volumes of messages or if there are significant lags on other topics. Essentially, the Web UI will compete for resources (CPU, memory, I/O) with other consumers in the same process, which can lead to slow or laggy UI performance, especially in cases where other consumer topics have higher processing loads.

### Performance and Resource Management in Production

In larger or more complex production environments, especially when dealing with multi-app setups or large-scale message flows, running the Web UI consumer group in its own dedicated Karafka process is recommended. This way, the Web UI will not be affected by lags or resource bottlenecks from other consumers, ensuring smoother performance and faster data availability in the UI.

To achieve this, you can either:

1. **Use `config.processing.active`**: In the Karafka configuration, you can set `config.processing.active` to `false` for all processes that should exclude the Web UI consumer group. This will ensure that only dedicated processes handle Web UI topics while the rest focus on your application's primary consumers.

1. **Use the `--include` and `--exclude` flags**: Alternatively, you can explicitly control which consumer groups run on each Karafka server instance using the `--include-consumer-groups` and `--exclude-consumer-groups` flags. This method provides more flexibility for explicitly including or excluding the Web UI consumer group in certain processes without modifying the global configuration.

    ```shell
    # Use the --include-consumer-groups flag to start a dedicated Web UI process
    bundle exec karafka server --include-consumer-groups karafka_web

    # Use the --exclude-consumer-groups flag to start processes without the Web UI consumer group
    bundle exec karafka server --exclude-consumer-groups karafka_web
    ```

    For a production environment, the ideal setup would involve:

    - Running one or more Karafka server instances dedicated **solely** to the Web UI consumer group. These processes should only handle the Web UI topics and not process any other consumer groups.

    - For the remaining Karafka server instances that handle your application's consumers, either:
        - Set `config.processing.active` to `false` to exclude the Web UI consumer group, or
        - Use the `--exclude-consumer-groups karafka_web` flag to ensure these instances ignore the Web UI consumer group.

    This approach ensures that the Web UI can consume and display data efficiently without being affected by the load on other consumers.

1. **Dedicate a Swarm Node solely to the Web UI**: Configure your Karafka swarm to reserve a specific node exclusively for Web UI processing, completely isolating it from your application's consumer workloads.

1. **Use Embedded Mode for the Web UI**: Run the Karafka Web UI consumer in [Embedded Mode](Embedding) within a Puma process. This approach is convenient for sharing resources between the Web UI consumer and web server, but should only be used when the Puma process is **dedicated exclusively** to the Web UI and not part of a larger, world-facing application.

### Dedicated Web UI Swarm Node

When operating Karafka in a swarm configuration with multiple nodes, you can dedicate a specific node exclusively to the Web UI consumer group. This approach provides several benefits:

1. Improved resource isolation between your application consumers and the Web UI
1. Better performance for both your main application and the Web UI interface
1. Easier monitoring and debugging of Web UI-specific processes

To configure a dedicated node for the Web UI, follow these steps:

1. First, define your total number of swarm nodes in your configuration:

    ```ruby
    config.swarm.nodes = 4
    ```

1. Configure your default routes to use only the first three nodes, reserving the last one for Web UI:

    ```ruby
    # You can also do this on a per-topic basis for granular configuration
    routes.draw do
      defaults do
        swarm(nodes: [0, 1, 2])
      end

      # consumer groups and topics definitions...
    end
    ```

1. Enable Karafka Web UI:

    ```ruby
    Karafka::Web.enable!
    ```

1. After enabling the Web UI, assign the dedicated node to the Web UI consumer group's topics. Since the Web UI routes are injected after your application routes, you need to locate and modify them:

    ```ruby
    Karafka::App
      .routes
      .last
      .topics
      .find('karafka_consumers_reports')
      .swarm
      .nodes = [3]
    ```

This configuration ensures that node `3` (the fourth node, as indexing starts at `0`) is exclusively dedicated to processing the Web UI consumer topics, while nodes `0`, `1`, and `2` handle your application's regular workload.

The key benefit of this setup is that the Web UI's performance remains consistent regardless of the load on your main application consumers. By isolating the Web UI to a dedicated node, you prevent resource contention that could otherwise impact the UI's responsiveness during high-traffic periods.

Remember that this approach requires at least one additional node in your swarm configuration. Consider using the other approaches mentioned in the previous sections if you have a smaller setup with fewer nodes.

## Web UI Topics Replication Factor

When running `bundle exec karafka-web install`, Karafka Web will create needed topics with the replication factor of `2` as long as there are at least two brokers available. Such a value may not be desirable in a larger production environment.

You can increase the replication factor by providing the `--replication-factor N` with `N` being the desired replication factor in your cluster:

```shell
bundle exec karafka-web install --replication-factor 5
```

## Usage with Heroku Kafka Multi-Tenant add-on

!!! note

    This section **only** applies to the Multi-Tenant add-on mode.

Please keep in mind that in order for Karafka Web UI to work with Heroku Kafka Multi-Tenant Addon, **all** Karafka Web UI, topics need to be prefixed with your `KAFKA_PREFIX`:

### Topics Automatic Prefix

```ruby
Karafka::Web.setup do |config|
  config.topics.errors.name = "#{ENV['KAFKA_PREFIX']}_karafka_errors"
  config.topics.consumers.reports.name = "#{ENV['KAFKA_PREFIX']}_karafka_consumers_reports"
  config.topics.consumers.states.name = "#{ENV['KAFKA_PREFIX']}_karafka_consumers_states"
  config.topics.consumers.metrics.name = "#{ENV['KAFKA_PREFIX']}_karafka_consumers_metrics"
  config.topics.consumers.commands.name = "#{ENV['KAFKA_PREFIX']}_karafka_consumers_commands"
end
```

### Web UI Consumer Group Creation

Additionally, if you decided to reconfigure the `config.admin.group_id` value, you might also need to update the Web UI `config.group_id`:

```ruby
Karafka::Web.setup do |config|
  # After configuration, do not forget to use Heroku CLI to assign proper ACL permissions to this group.
  config.group_id = 'karafka-web'
end
```

### Heroku Multi-Tenant Retention Policy Impact

When using Heroku Kafka in MultiTenant mode, it's important to know that the default message retention period is only one day. This limited retention time can pose challenges, especially for applications that rely heavily on Kafka for storage, such as Karafka Web UI. Karafka Web UI uses Kafka as its sole storage source, meaning longer retention is necessary for effective operation. It is highly recommended that you read more about this [here](Operations-Deployment#heroku-retention-policy-impact-on-the-web-ui).

You can read about working with Heroku Kafka Multi-Tenant add-on [here](Operations-Deployment#heroku).

## Upgrade Recommendations

Upgrading your Karafka Web UI to a newer version is a three-step operation. You must be diligent about the order of operations to avoid unexpected errors. The process is as follows:

1. **Update Karafka and Its Dependencies**: First, ensure that you're running the latest version of Karafka, along with its key dependencies, which include `karafka-core`, `karafka-rdkafka`, and `waterdrop`.
1. **Deploy All Karafka Consumer Processes**: Your first step should be to deploy all the Karafka consumer processes on all nodes where the `karafka server` command runs. Ensure that all your consumers are up-to-date and working with the most recent consumer version.
1. **Deploy the Web UI Update to Your Web Server**: After all the consumer processes have been upgraded, you can safely deploy the updated Web UI to your web server. The updated web UI will have the necessary code and schema changes to work with the latest consumer version.

Please take note of the following potential issue:

If you attempt to deploy the updated Web UI before the Karafka consumer processes, you may encounter errors. This could range from 500 Internal Server errors to incorrect or missing offset-related data displays.

It's critical to ensure the order of operations - Karafka consumers processes first, then the Web UI. This will provide a smoother transition to the new version of the Web UI.
