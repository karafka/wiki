### Table of Contents
  - [Configuration](#configuration)
    - [Karafka configuration options](#karafka-configuration-options)
    - [Connection pool configuration options](#connection-pool-configuration-options)
    - [Ruby-Kafka driver configuration options](#ruby-kafka-driver-configuration-options)
  - [External components configurators](#external-components-configurators)
  - [Environment variables settings](#environment-variables-settings)
  - [Kafka brokers auto-discovery](#kafka-brokers-auto-discovery)
  - [Topic mappers](#topic-mappers)

### Configuration

Karafka is a complex tool, that contains multiple configuration options. To keep everything organized, all the configuration options were divided into three groups:

* Karafka options - options directly related to Karafka framework and it's components
* Connection pool options - options related to messages producers connection pool
* Ruby-Kafka driver options - options related to [Ruby-Kafka](https://github.com/zendesk/ruby-kafka)

To apply all those configuration options, you need to use the ```#setup``` method from the Karafka::App class (app.rb):

```ruby
class App < Karafka::App
  setup do |config|
    config.client_id = 'my_application'
    config.inline_processing = false
    config.batch_consuming = true
    config.batch_processing = true
    config.redis = { url: 'redis://redis.example.com:7372/1' }
    config.kafka.seed_brokers = %w( 127.0.0.1:9092 )
  end
end
```

Note: Karafka allows you to redefine most of the settings per each consumer group, which means that you can have specific custom configuration, that might differ from the default one configured on the app level. This allows you for example, to connect to multiple Kafka clusters.

### Karafka configuration options

| Option            | Required | Value type   | Description                                                                                           |
|-------------------|----------|--------------|-------------------------------------------------------------------------------------------------------|
| client_id         | true     | String       | Application name that will be used as a client_id for Kafka cluster                                   |
| topic_mapper      | false    | Class/Module | Mapper for hiding Kafka provider specific topic prefixes/postfixes, so internaly we use "pure" topics |
| redis             | false    | Hash         | Hash with Redis configuration options. It is required if ```inline_processing``` mode is off.         |
| batch_consuming   | false    | Boolean      | Should the incoming messages be consumed in batches, or one at a time                                 |
| batch_processing  | false    | Boolean      | Should the incoming messages be processed in batches, or one at a time                                |
| inline_processing | false    | Boolean      | Do we want to perform logic without enqueuing it with Sidekiq (directly and asap)                     |
| monitor           | false    | Object       | Monitor instance (defaults to Karafka::Monitor)                                                       |
| logger            | false    | Object       | Logger instance (defaults to Karafka::Logger)                                                         |

### Connection pool configuration option

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

### External components configurators

For additional setup and/or configuration tasks you can create custom configurators. Similar to Rails these are added to a `config/initializers` directory and run after app initialization.

Your new configurator class must inherit from `Karafka::Setup::Configurators::Base` and implement a `setup` method.

Example configuration class:

```ruby
class ExampleConfigurator < Karafka::Setup::Configurators::Base
  def setup
    ExampleClass.logger = Karafka.logger
    ExampleClass.redis = config.redis
  end
end
```

### Environment variables settings

There are several env settings you can use:

| ENV name          | Default | Description                                                                           |
|-------------------|-----------------|-------------------------------------------------------------------------------|
| KARAFKA_ENV       | development     | In what mode this application should boot (production/development/test/etc)   |
| KARAFKA_BOOT_FILE | app_root/app.rb | Path to a file that contains Karafka app configuration and booting procedures |

### Kafka brokers auto-discovery

Karafka supports Kafka brokers auto-discovery during startup and on failures. You need to provide at least one Kafka broker, from which the entire Kafka cluster will be discovered. Karafka will refresh list of available brokers if something goes wrong. This allows it to be aware of changes that happen in the infrastructure (adding and removing nodes).

### Topic mappers

Some Kafka cloud providers require topics to be namespaced with user name. This approach is understandable, but at the same time, makes your applications less provider agnostic. To target that issue, you can create your own topic mapper that will sanitize incoming/outgoing topic names, so your logic won't be binded to those specific versions of topic names.

Mapper needs to implement two following methods:

  - ```#incoming``` - accepts an incoming "namespace dirty" version ot topic. Needs to return sanitized topic.
  - ```#outgoing``` - accepts outgoing sanitized topic version. Needs to return namespaced one.

Given each of the topics needs to have "karafka." prefix, your mapper could look like that:

```ruby
class KarafkaTopicMapper
  def initialize(prefix)
    @prefix = prefix
  end

  def incoming(topic)
    topic.to_s.gsub("#{@prefix}.", '')
  end

  def outgoing(topic)
    "#{@prefix}.#{topic}"
  end
end

mapper = KarafkaTopicMapper.new('karafka')
mapper.incoming('karafka.my_super_topic') #=> 'my_super_topic'
mapper.outgoing('my_other_topic') #=> 'karafka.my_other_topic'
```

To use custom mapper, just assign it during application configuration:

```ruby
class App < Karafka::App
  setup do |config|
    # Other settings
    config.topic_mapper = MyCustomMapper.new('username')
  end
end
```

Topic mapper automatically integrates with both messages consumer and responders.