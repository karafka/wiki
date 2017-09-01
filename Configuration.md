- [Karafka configuration options](#karafka-configuration-options)
- [Connection pool configuration options](#connection-pool-configuration-options)
- [Ruby-Kafka driver configuration options](#ruby-kafka-driver-configuration-options)
- [External components configurators](#external-components-configurators)
- [Environment variables settings](#environment-variables-settings)
- [Kafka brokers auto-discovery](#kafka-brokers-auto-discovery)

Karafka is a complex tool, that contains multiple configuration options. To keep everything organized, all the configuration options were divided into three groups:

* Karafka options - options directly related to Karafka framework and it's components
* Connection pool options - options related to messages producers connection pool
* Ruby-Kafka driver options - options related to [Ruby-Kafka](https://github.com/zendesk/ruby-kafka)

To apply all those configuration options, you need to use the ```#setup``` method from the Karafka::App class (karafka.rb):

```ruby
class App < Karafka::App
  setup do |config|
    config.client_id = 'my_application'
    config.backend = :inline
    config.batch_consuming = true
    config.batch_processing = true
    config.kafka.seed_brokers = %w( 127.0.0.1:9092 )
  end
end
```

Note: Karafka allows you to redefine most of the settings per each consumer group, which means that you can have specific custom configuration, that might differ from the default one configured on the app level. This allows you for example, to connect to multiple Kafka clusters.

## Karafka configuration options

| Option            | Required | Value type   | Description                                                                                           |
|-------------------|----------|--------------|-------------------------------------------------------------------------------------------------------|
| client_id         | true     | String       | Application name that will be used as a client_id for Kafka cluster                                   |
| topic_mapper      | false    | Class/Module | Mapper for hiding Kafka provider specific topic prefixes/postfixes, so internaly we use "pure" topics |
| batch_consuming   | false    | Boolean      | Should the incoming messages be consumed in batches, or one at a time                                 |
| batch_processing  | false    | Boolean      | Should the incoming messages be processed in batches, or one at a time                                |
| backend | false    | Symbol      | Backend for processing that we want to use (currently :inline or :sidekiq)|
| monitor           | false    | Object       | Monitor instance (defaults to Karafka::Monitor)                                                       |
| logger            | false    | Object       | Logger instance (defaults to Karafka::Logger)                                                         |

## Connection pool configuration options

| Option                  | Required | Value type | Description                                                   |
|-------------------------|----------|------------|---------------------------------------------------------------|
| connection_pool.size    | false    | Integer    | Connection pool size for message producers connection pool    |
| connection_pool.timeout | false    | Integer    | Connection pool timeout for message producers connection pool |

### Ruby-Kafka driver configuration options

We've listed here only **the most important** configuration options. If you're interested in all the options, please go to the [config.rb](https://github.com/karafka/karafka/blob/master/lib/karafka/setup/config.rb) file for more details.

| Option                        | Required | Value type    | Description                                                                                       |
|-------------------------------|----------|---------------|---------------------------------------------------------------------------------------------------|
| kafka.seed_brokers            | true     | Array<String> | Kafka server hosts. Karafka will discover whole cluster structure automatically                   |
| kafka.start_from_beginning    | false    | Boolean       | Consume messages starting at the beginning or consume new messages that are produced at first run |
| kafka.offset_commit_interval  | false    | Integer       | The interval between offset commits in seconds                                                    |
| kafka.offset_commit_threshold | false    | Integer       | The number of messages that can be processed before their offsets are committed                   |
| kafka.heartbeat_interval      | false    | Integer       | The interval between heartbeats                                                                   |
| kafka.ssl_ca_cert             | false    | String        | SSL CA certificate                                                                                |
| kafka.ssl_client_cert         | false    | String        | SSL client certificate                                                                            |
| kafka.ssl_client_cert_key     | false    | String        | SSL client certificate password                                                                   |

## External components configurators

For additional setup and/or configuration tasks you can create custom configurators. Similar to Rails these are added to a `config/initializers` directory and run after app initialization.

Your new configurator class must inherit from `Karafka::Setup::Configurators::Base` and implement a `setup` method.

Example configuration class:

```ruby
class ExampleConfigurator < Karafka::Setup::Configurators::Base
  def setup
    ExampleClass.logger = Karafka.logger
  end
end
```

## Environment variables settings

There are several env settings you can use:

| ENV name          | Default | Description                                                                           |
|-------------------|-----------------|-------------------------------------------------------------------------------|
| KARAFKA_ENV       | development     | In what mode this application should boot (production/development/test/etc)   |
| KARAFKA_BOOT_FILE | app_root/karafka.rb | Path to a file that contains Karafka app configuration and booting procedures |

## Kafka brokers auto-discovery

Karafka supports Kafka brokers auto-discovery during startup and on failures. You need to provide at least one Kafka broker, from which the entire Kafka cluster will be discovered. Karafka will refresh list of available brokers if something goes wrong. This allows it to be aware of changes that happen in the infrastructure (adding and removing nodes).