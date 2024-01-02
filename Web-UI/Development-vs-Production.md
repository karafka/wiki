# Web UI Setup for Development vs Production

Karafka Web UI can operate in production mode. It is, however, essential to understand how it works and its limitations.

To materialize and prepare the data for the Web UI, Karafka Web adds an additional consumer group to the routes. This is ok for a development environment as you usually run one or two `karafka server` instances in this mode.

It may not be, however, desirable to do this in production, mainly because it would be a waste of resources. Each Karafka server instance would subscribe to the reports topic, and all except one would do nothing.

For a production setup, we recommend you run one or two karafka server instances dedicated to the Web UI alongside your regular Karafka consumers and exclude the Web consumer group from the rest.

You can use the `--exclude-consumer-groups karafka_web` flag to start consumer processes that run only your consumer groups. Then, you can use the `--include-consumer-groups karafka_web` to start Karafka Web UI dedicated consumer instances. 

```bash
# Run below to start a consumer instance dedicated only to karafka_web operations
bundle exec karafka server --include-consumer-groups karafka_web

# Run below to start a consumer instance without the extra web consumer group
bundle exec karafka server --exclude-consumer-groups karafka_web
```

It is also worth pointing out certain other limitations of the Web UI:

- Karafka Web UI may be slow if you have more than 1 000 active consumer processes running. If you encounter this, please get in touch with us so we can work with you to optimize this case.
- Karafka explorer can be slow when listing old messages from heavily compacted topics.

## Web UI topics replication factor

When running `bundle exec karafka-web install`, Karafka Web will create needed topics with the replication factor of `2` as long as there are at least two brokers available. Such a value may not be desirable in a larger production environment.

You can increase the replication factor by providing the `--replication-factor N` with `N` being the desired replication factor in your cluster:

```bash
bundle exec karafka-web install --replication-factor 5
```

## Usage with Heroku Kafka Multi-Tenant add-on

!!! note ""

    This section **only** applies to the Multi-Tenant add-on mode.

Please keep in mind that in order for Karafka Web UI to work with Heroku Kafka Multi-Tenant Addon, **all** Karafka Web UI, topics need to be prefixed with your `KAFKA_PREFIX`:

```ruby
Karafka::Web.setup do |config|
  config.topics.errors = "#{ENV['KAFKA_PREFIX']}_karafka_errors"
  config.topics.consumers.reports = "#{ENV['KAFKA_PREFIX']}_karafka_consumers_reports"
  config.topics.consumers.states = "#{ENV['KAFKA_PREFIX']}_karafka_consumers_states"
end
```

Additionally, if you decided to reconfigure the `config.admin.group_id` value, you might also need to update the Web UI `config.processing.consumer_group`:

```ruby
Karafka::Web.setup do |config|
  # After configuration, do not forget to use Heroku CLI to assign proper ACL permissions to this group.
  config.processing.consumer_group = 'karafka-web'
end
```

You can read about working with Heroku Kafka Multi-Tenant add-on [here](Deployment#heroku).

## Upgrade recommendations

Upgrading your Karafka Web UI to a newer version is a three-step operation. You must be diligent about the order of operations to avoid unexpected errors. The process is as follows:

1. **Update Karafka and Its Dependencies**: First, ensure that you're running the latest version of Karafka, along with its key dependencies, which include `karafka-core`, `karafka-rdkafka`, and `waterdrop`.
2. **Deploy All Karafka Consumer Processes**: Your first step should be to deploy all the Karafka consumer processes on all nodes where the `karafka server` command runs. Ensure that all your consumers are up-to-date and working with the most recent consumer version.
3. **Deploy the Web UI Update to Your Web Server**: After all the consumer processes have been upgraded, you can safely deploy the updated Web UI to your web server. The updated web UI will have the necessary code and schema changes to work with the latest consumer version.

Please take note of the following potential issue:

If you attempt to deploy the updated Web UI before the Karafka consumer processes, you may encounter errors. This could range from 500 Internal Server errors to incorrect or missing offset-related data displays.

It's critical to ensure the order of operations - Karafka consumers processes first, then the Web UI. This will provide a smoother transition to the new version of the Web UI.
