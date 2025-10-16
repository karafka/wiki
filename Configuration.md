Karafka contains multiple configuration options. To keep everything organized, all the configuration options were divided into two groups:

- root `karafka` options - options directly related to the Karafka framework and its components.

- kafka scoped `librdkafka` options - options related to [librdkafka](Librdkafka-Configuration)

To apply all those configuration options, you need to use the ```#setup``` method from the `Karafka::App` class:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"
    # librdkafka configuration options need to be set as symbol values
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092'
    }
  end
end
```

!!! note

    Karafka allows you to redefine some of the settings per each topic, which means that you can have a specific custom configuration that might differ from the default one configured at the app level. This allows you for example, to connect to multiple Kafka clusters.

!!! note

    kafka `client.id` is a string passed to the server when making requests. This is to track the source of requests beyond just IP/port by allowing a logical application name to be included in server-side request logging. Therefore the `client_id` should **not** be shared across multiple instances in a cluster or horizontally scaled application but distinct for each application instance.

## Karafka configuration options

A list of all the karafka configuration options with their details and defaults can be found [here](https://github.com/karafka/karafka/blob/master/lib/karafka/setup/config.rb).

## librdkafka driver configuration options

A list of all the configuration options related to `librdkafka` with their details and defaults can be found [here](Librdkafka-Configuration).

## External components configurators

For additional setup and/or configuration tasks, you can use the `app.initialized` event hook. It is executed **once** per process, right after all the framework components are ready (including those dynamically built). It can be used, for example, to configure some external components that need to be based on Karafka internal settings.

Because of how the Karafka framework lifecycle works, this event is triggered after the `#setup` is done. You need to subscribe to this event before that happens, either from the `#setup` block or before.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # All the config magic

    # Once everything is configured and done, assign Karafka app logger as a MyComponent logger
    # @note This example does not use config details, but you can use all the config values
    #   to setup your external components
    config.monitor.subscribe('app.initialized') do
      MyComponent::Logging.logger = Karafka::App.logger
    end
  end
end
```

## Environment variables settings

There are several env settings you can use with Karafka. They are described under the [Env Variables](Env-Variables) section of this Wiki.

## Messages compression

Kafka lets you compress your messages as they travel over the wire. By default, producer messages are sent uncompressed.

Karafka producer ([WaterDrop](https://github.com/karafka/waterdrop)) supports following compression types:

- `gzip`
- `zstd`
- `lz4`
- `snappy`

You can enable the compression by using the `compression.codec` and `compression.level` settings:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      # Other kafka settings...
      'compression.codec': 'gzip',
      'compression.level': '12'
    }
  end
end
```

!!! note

    In order to use `zstd`, you need to install `libzstd-dev`:

    ```shell
    apt-get install -y libzstd-dev
    ```

## Types of Configuration in Karafka

When working with Karafka, it is crucial to understand the different configurations available, as these settings directly influence how Karafka interacts with your application code and the underlying Kafka infrastructure.

### Root Configuration in the Setup Block

The root configuration within the `setup` block of Karafka pertains directly to the Karafka framework and its components. This includes settings that influence the behavior of your Karafka application at a fundamental level, such as client identification, logging preferences, and consumer groups details.

Example of root configuration:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = "my_application-#{Process.pid}-#{Socket.gethostname}"
    config.initial_offset = 'latest'
  end
end
```

### Kafka Scoped `librdkafka` Options

librdkafka configuration options are specified within the same setup block but scoped specifically under the `kafka` key. These settings are passed directly to the librdkafka library, the underlying Kafka client library that Karafka uses. This includes configurations for Kafka connections, such as bootstrap servers, SSL settings, and timeouts.

Example of `librdkafka` scoped options:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092',
      'ssl.ca.location': '/etc/ssl/certs'
    }
  end
end
```

### Admin Configs API

Karafka also supports the Admin Configs API, which is designed to view and manage configurations at the Kafka broker and topic levels. These settings are different from the client configurations (root and Kafka scoped) as they pertain to the infrastructure level of Kafka itself rather than how your application interacts with it.

Examples of these settings include:

- **Broker Configurations**: Like log file sizes, message sizes, and default retention policies.

- **Topic Configurations**: Such as partition counts, replication factors, and topic-level overrides for retention.

To put it in perspective, these configurations can be likened to those in a database. Just as a database has client, database, and table configurations, Kafka has its own set of configurations at different levels.

- **Client Configurations**: Similar to client-specific settings in SQL databases, such as query timeouts or statement timeouts.

- **Database Configurations**: Analogous to database-level settings such as database encoding, connection limits, or default transaction isolation levels.

- **Table Configurations**: Similar to table-specific settings like storage engine choices or per-table cache settings in a database.

These infrastructural settings are crucial for managing Kafka more efficiently. They ensure that the Kafka cluster is optimized for both performance and durability according to the needs of the applications it supports.

!!! tip "Managing Topics Configuration with Declarative Topics API"

    If you want to manage topic configurations more effectively, we recommend using Karafka's higher-level API, Declarative Topics. This API simplifies defining and managing your Kafka topics, allowing for clear and concise topic configurations within your application code. For detailed usage and examples, refer to our comprehensive guide on [Declarative Topics](Declarative-Topics).
