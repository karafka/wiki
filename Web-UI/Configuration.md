# Web UI Configuration

Similar to configuring Karafka, a few configuration options can also be used in Karafka Web.

Those options can be used to control things like topics names, frequency of data reports, encrypted data visibility, pagination settings, and more.

You can find the whole list of settings [here](https://github.com/karafka/karafka-web/blob/master/lib/karafka/web/config.rb).

You can configure Web UI by using the `#setup` method in your `karafka.rb`:

```ruby
Karafka::Web.setup do |config|
  # Report every 10 seconds
  config.tracking.interval = 10_000
end

Karafka::Web.enable!
```

## Using a Custom Web UI Producer

Karafka Web UI produces data on its own: consumer state reports, error records, aggregated metrics, and messages republished from the Explorer. All of it goes through the producer available under `Karafka::Web.producer`.

By default, the Web UI does not create a producer of its own. It uses `Karafka.producer`, that is, the very same producer instance and connection your application uses:

- For an idempotent or transactional default producer, `Karafka.producer` is used as-is, because the acknowledgment settings of such producers cannot be altered.
- For a regular (non-idempotent, non-transactional) default producer, the Web UI dispatches through a low-ack [variant](WaterDrop-Variants) of it (`acks: 0`). A variant is only a per-dispatch settings overlay on top of the same producer, not a separate one. Web UI reporting is analytical rather than mission-critical, so fire-and-forget semantics reduce its latency and overhead at the cost of occasional message loss.

Either way, the Web UI reporting shares the producer, its connection, and its queue with your application.

You may want to assign a fully separate producer instance when:

- Your default producer is transactional and heavy transaction usage in your code can stall the Web UI reporting. See [Web UI Transactions Support](Web-UI-Transactions) for details.
- The Web UI should report to a different cluster or use different credentials than your application data.
- You want the Web UI reporting to have its own delivery settings, buffers, and connection, fully isolated from your application traffic.

You can assign it during the Web UI configuration phase:

```ruby
Karafka::Web.setup do |config|
  # Create and assign producer that will be used by the Web UI components
  config.producer = ::WaterDrop::Producer.new do |p_config|
    # Use Karafka configuration.
    # You can also of course define all settings independently
    karafka_app_config = ::Karafka::App.config

    # Copy the kafka configuration hash
    kafka_config = karafka_app_config.kafka.dup

    # Set the kafka configuration for the Web dedicated producer
    p_config.kafka = ::Karafka::Setup::AttributesMap.producer(kafka_config)

    # Use the same logger as Karafka
    p_config.logger = karafka_app_config.logger
  end
end
```

Once the dedicated Web UI producer is set up, it becomes the default for all the Web UI components.

!!! warning "Ensure Access to the Web UI Topics"

    A custom Web UI producer must be able to deliver messages to all the Web UI internal topics. If it points to a different cluster or uses restricted credentials, the Web UI will not be able to report or materialize its states. You can find the list of the required topics in the [Getting Started](Web-UI-Getting-Started) guide.

!!! note "The Web UI Producer Is Instrumented Automatically"

    A producer assigned via `config.producer` is automatically subscribed with the producer tracking listeners, so its errors are reported like the ones from `Karafka.producer`. This is not the case for other custom producers you create in your application. Those need to be subscribed manually, as described below.

Karafka Web UI also closes its producer when `karafka server` terminates, so you do not need to manage its lifecycle yourself.

## Monitoring Non-Default Producer Instances

A Karafka errors page UI view allows users to inspect errors occurring during messages consumption and production, including all the asynchronous errors coming from `librdkafka`

By default, Karafka Web UI is set only to monitor and track the default producer, which is initialized automatically and made available under `Karafka.producer`.

This means that if you manually create and initialize custom producers (using WaterDrop), these custom producers are not automatically tracked or monitored in the Web UI. They aren't connected to the monitoring instruments that the Web UI uses to track events and states of the producers.

To have these custom producers tracked in the Karafka Web UI, you need to subscribe the appropriate listeners to them manually. This is achieved by using the following code:

```ruby
MY_CUSTOM_PRODUCER = WaterDrop::Producer.new

::Karafka::Web.config.tracking.producers.listeners.each do |listener|
  MY_CUSTOM_PRODUCER.monitor.subscribe(listener)
end
```

## Opting out of All the Monitoring

In specific scenarios, you may want to keep the Karafka Web UI without active reporting, for example, when you are only interested in the Explorer functionality. To turn off all the reporting and states materialization, overwrite all the listeners and turn off processing as follows:

```ruby
Karafka::Web.setup do |config|
  config.processing.active = false
  config.tracking.consumers.listeners = []
  config.tracking.producers.listeners = []
end
```

## Opting out of Producers' Monitoring

In specific scenarios, you may not want the Karafka Web UI to monitor your Kafka producers. For instance:

1. Performance considerations: Depending on the scale of your application, having numerous producers being tracked might add unnecessary overhead to your application, thereby reducing overall performance. This could be especially relevant in a production environment where efficiency and resource utilization are critical.
2. Privacy or Security concerns: You might have producers dealing with sensitive data that you prefer not to expose through monitoring, or your security guidelines might not allow such tracking.
3. Simplicity: If you have many producers and only a subset of them are relevant for your current debugging or monitoring needs, tracking all producers could clutter the Web UI, making it harder to focus on the issues at hand.
In such cases, you can opt out of monitoring producers with the Karafka Web UI by using the provided code:

```ruby
Karafka::Web.setup do |config|
  # Do not instrument producers with web-ui listeners
  config.tracking.producers.listeners = []
end
```

## Reconfiguring Web UI Topics for Various Kafka Providers

Karafka Web UI ships with sensible default configurations for its internal topics, but these defaults may not be compatible with all Kafka providers. Managed services like Amazon MSK, Confluent Cloud, and other cloud-based Kafka offerings often have specific requirements or restrictions that can conflict with the default topic configurations.

Karafka Web UI allows you to override the default topic configurations for each internal topic to address these compatibility issues. You can customize these settings using the `.config` method on individual topic configurations:

```ruby
Karafka::Web.setup do |config|
  # Other config...

  # Configure the errors topic for your cluster compatibility
  config.topics.errors.config = {
    'retention.ms' => '604800000',  # 7 days
    'segment.ms' => '86400000'      # 1 day
  }

  # Configure consumers reports topic
  config.topics.consumers.reports.config = {
    'retention.ms' => '259200000',  # 3 days
    'min.compaction.lag.ms' => '3600000'  # 1 hour
  }

  # Configure consumers states topic
  config.topics.consumers.states.config = {
    'segment.ms' => '3600000',      # 1 hour
    'min.compaction.lag.ms' => '1800000'  # 30 minutes
  }

  # Configure consumers metrics topic
  config.topics.consumers.metrics.config = {
    'retention.ms' => '172800000',  # 2 days
    'segment.ms' => '43200000'      # 12 hours
  }

  # Configure consumers commands topic
  config.topics.consumers.commands.config = {
    'retention.ms' => '86400000',   # 1 day
    'segment.ms' => '21600000'      # 6 hours
  }
end
```

!!! warning "Avoid Changing Cleanup Policies"

    We strongly recommend against modifying the `cleanup.policy` setting for Web UI topics. Each topic's cleanup policy is carefully aligned with its purpose and data usage patterns. Changing these policies may result in data loss, performance degradation, or unexpected behavior in the Web UI functionality.

## Using a Shared Kafka Cluster for Multiple Karafka Application Environments

You can configure Karafka to use a single Kafka cluster across multiple environments or applications. This can be beneficial for scenarios such as when you have different stages of development, including development, testing, staging, and production, all needing isolated data sets within the same Kafka cluster.

To achieve this, each environment must maintain its unique set of Web-UI internal topics. This is accomplished by appending the environment's name to the base topic name for each Web-UI internal topic.
Here is how you can configure it in your Karafka setup:

```ruby
Karafka::Web.setup do |config|
  env_suffix = Rails.env.to_s

  config.group_id = "karafka_web_#{env_suffix}"

  config.topics.errors.name = "karafka_errors_#{env_suffix}"
  config.topics.consumers.reports.name = "karafka_consumers_reports_#{env_suffix}"
  config.topics.consumers.states.name = "karafka_consumers_states_#{env_suffix}"
  config.topics.consumers.metrics.name = "karafka_consumers_metrics_#{env_suffix}"
  config.topics.consumers.commands.name = "karafka_consumers_commands_#{env_suffix}"
end
```

In this setup, the `env_suffix` is created by converting the current Rails environment into a string. The `env_suffix` is then appended to the base topic name for each of the internal topics (`karafka_errors`, `karafka_consumers_reports`, `karafka_consumers_states`, `karafka_consumers_metrics` and `karafka_consumers_commands`).

This naming convention ensures that each environment has its own unique set of topics, allowing you to monitor and manage each environment separately within the same Kafka cluster without fear of data overlap or collision.

After setting up your environments, it's important to remember to run `bundle exec karafka-web install` for each environment. This command will create the appropriate topics per environment with the expected settings and populate these topics with initial data. Running this command ensures that all topics are set up correctly and ready for use within their respective environments.

## In-Memory Cluster Data Caching

Karafka Web UI implements an in-memory cache mechanism to optimize its performance and responsiveness. This cache is instrumental in storing essential cluster metadata, including the list of topics.

### Cache Duration

The default duration for which this cache remains valid is 5 minutes. This means that after performing actions such as topic creation, removal, or repartitioning in the cluster, the changes might not be immediately visible on the Karafka Web UI. There might be a delay of up to 5 minutes before the UI reflects these changes.

### Configurability

For those who require a different cache duration, perhaps due to more frequent cluster changes or other specific needs, Karafka allows this duration to be customizable. You can set the cache duration by modifying the `config.ui.cache` value to your desired timeframe.

```ruby
Karafka::Web.setup do |config|
  # Lower the cache to 1 minute
  config.ui.cache = Karafka::Web::Ui::Lib::Cache.new(60_000)
end
```

### Cache Refresh

One of the features to note is that whenever the Status view is accessed, the cache gets invalidated and refreshed. This ensures that users get the most recent and accurate information when they visit this view.

### Consideration for Multiple Processes Deployment

If you've deployed Karafka Web UI across multiple processes, simply refreshing the cache in one process (by visiting the Cluster view) might not be sufficient. This is because subsequent requests could be routed to different processes, each with its cache state. In such scenarios, the cache would need to be refreshed in each of these processes to ensure consistency.

### Summary

In summary, while the in-memory cache in Karafka Web UI significantly enhances its efficiency, it's essential to understand its workings, especially in dynamic environments where cluster changes are frequent or when deploying across multiple processes, and to configure it according to your needs.

## See Also

- [Web UI Getting Started](Web-UI-Getting-Started) - Quick start guide for setting up Karafka Web UI
- [Web UI About](Web-UI-About) - Introduction and overview of Karafka Web UI capabilities
- [Web UI Transactions Support](Web-UI-Transactions) - Why a transactional default producer warrants a dedicated Web UI producer
- [Pro Web UI Policies](Pro-Web-UI-Policies) - Configure access control and security policies
- [Pro Web UI Branding](Pro-Web-UI-Branding) - Customize Web UI appearance and branding
