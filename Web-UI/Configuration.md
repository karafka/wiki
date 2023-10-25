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

## Monitoring non-default producer instances

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

## Opting out of all the monitoring

In specific scenarios, you may want to keep the Karafka Web UI without active reporting, for example, when you are only interested in the Explorer functionality. To turn off all the reporting and states materialization, overwrite all the listeners and turn off processing as follows:

```ruby
Karafka::Web.setup do |config|
  config.processing.active = false
  config.tracking.consumers.listeners = []
  config.tracking.producers.listeners = []
end
```

## Opting out of producers' monitoring

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

## Using a Shared Kafka Cluster for multiple Karafka application environments

You can configure Karafka to use a single Kafka cluster across multiple environments. This can be beneficial for scenarios such as when you have different stages of development, including development, testing, staging, and production, all needing isolated data sets within the same Kafka cluster.

To achieve this, each environment must maintain its unique set of Web-UI internal topics. This is accomplished by appending the environment's name to the base topic name for each Web-UI internal topic.
Here is how you can configure it in your Karafka setup:

```ruby
Karafka::Web.setup do |config|
  env_suffix = Rails.env.to_s

  config.topics.errors = "karafka_errors_#{env_suffix}"
  config.topics.consumers.reports = "karafka_consumers_reports_#{env_suffix}"
  config.topics.consumers.states = "karafka_consumers_states_#{env_suffix}"
end
```

In this setup, the `env_suffix` is created by converting the current Rails environment into a string. The `env_suffix` is then appended to the base topic name for each of the internal topics (`karafka_errors`, `karafka_consumers_reports`, and `karafka_consumers_states`).

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
  config.ui.cache = Karafka::Web::Ui::Lib::TtlCache.new(60_000)
end
```

### Cache Refresh

One of the features to note is that whenever the Cluster view is accessed, the cache gets invalidated and refreshed. This ensures that users get the most recent and accurate cluster information when they visit this view.

### Consideration for Multiple Processes Deployment

If you've deployed Karafka Web UI across multiple processes, simply refreshing the cache in one process (by visiting the Cluster view) might not be sufficient. This is because subsequent requests could be routed to different processes, each with its cache state. In such scenarios, the cache would need to be refreshed in each of these processes to ensure consistency.

### Summary

In summary, while the in-memory cache in Karafka Web UI significantly enhances its efficiency, it's essential to understand its workings, especially in dynamic environments where cluster changes are frequent or when deploying across multiple processes, and to configure it according to your needs.

## Transactions Support

Karafka's Web UI has been designed to support transactionally created data. This aligns with the increasing use of Kafka transactions for maintaining data consistency and atomicity across distributed systems.

There are a few things worth keeping in mind if you work with transactional data:

- **Dynamic Producer Types**: Karafka Web UI allows flexibility with its producer configuration. It's feasible to toggle your Karafka producer from transactional to non-transactional mode and vice versa, depending on the specific needs of a given process.

- **Offset-Based Explorer**: The Karafka Explorer operates on an offset-based system. This means that it does more than just showcase the user messages. Instead, it fully views the Kafka topic, including compacted offsets, system entries, and aborted messages represented as system records. This comprehensive view gives users a granular understanding of the topic's state and helps diagnose potential issues or anomalies.

    Below, you can find an example of how the Karafka Web UI reports topic looks when all the records are created using the transactional producer:

    <p align="center">
      <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/explorer_transactional.png" alt="karafka web ui transactional explorer"/>
    </p>

- **Limitations with "Recent" Feature**: Given the offset-based nature of the Karafka Explorer, the "Recent" feature, which typically displays the latest entries, might encounter difficulties if the first ten pages predominantly consist of aborted messages and system entries.

- **Producer Locking & Web UI Impact**: An essential aspect to note is that when a WaterDrop transaction is initiated, the producer is locked to the specific thread executing the transaction. This means that other threads could be left waiting for the current transaction to complete. This thread-specific locking has implications for the Karafka Web UI's reporting and processing capabilities. For instance, if a user-initiated transaction lasts 30 seconds, the Karafka Web UI may be incapable of reporting states during this duration.

    To mitigate this, in case of heavy usage of transactions, users are advised to create and use a dedicated Web UI producer that operates alongside the default producer. By doing this, even if user code transactions take longer, the Web UI's capability to report states remains unaffected, ensuring consistent and uninterrupted monitoring.
