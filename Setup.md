### Table of Contents
  - [Application](#application)
  - [Configurators](#configurators)
  - [Environment variables settings](#environment-variables-settings)
  - [Kafka brokers auto-discovery](#kafka-brokers-auto-discovery)
  - [Topic mappers](#topic-mappers)

### Application
Karafka has following configuration options:

| Option                        | Required | Value type        | Description                                                                                                |
|-------------------------------|----------|-------------------|------------------------------------------------------------------------------------------------------------|
| name                          | true     | String            | Application name                                                                                           |
| topic_mapper                  | false    | Class/Module      | Mapper for hiding Kafka provider specific topic prefixes/postfixes, so internaly we use "pure" topics      |
| redis                         | false    | Hash              | Hash with Redis configuration options. It is required if inline_mode is off.                               |
| inline_mode                   | false    | Boolean           | Do we want to perform logic without enqueuing it with Sidekiq (directly and asap)                          |
| batch_mode                    | false    | Boolean           | Should the incoming messages be consumed in batches, or one at a time                                      |
| start_from_beginning          | false    | Boolean           | Consume messages starting at the beginning or consume new messages that are produced at first run          |
| monitor                       | false    | Object            | Monitor instance (defaults to Karafka::Monitor)                                                            |
| logger                        | false    | Object            | Logger instance (defaults to Karafka::Logger)                                                              |
| kafka.hosts                   | true     | Array<String>     | Kafka server hosts. If 1 provided, Karafka will discover cluster structure automatically                   |
| kafka.session_timeout         | false    | Integer           | The number of seconds after which, if a consumer hasn't contacted the Kafka cluster, it will be kicked out |
| kafka.offset_commit_interval  | false    | Integer           | The interval between offset commits in seconds                                                             |
| kafka.offset_commit_threshold | false    | Integer           | The number of messages that can be processed before their offsets are committed                            |
| kafka.heartbeat_interval      | false    | Integer           | The interval between heartbeats                                                                            |
| kafka.ssl.ca_cert             | false    | String            | SSL CA certificate                                                                                         |
| kafka.ssl.client_cert         | false    | String            | SSL client certificate                                                                                     |
| kafka.ssl.client_cert_key     | false    | String            | SSL client certificate password                                                                            |
| connection_pool.size          | false    | Integer           | Connection pool size for message producers connection pool                                                 |
| connection_pool.timeout       | false    | Integer           | Connection pool timeout for message producers connection pool                                              |

To apply this configuration, you need to use a *setup* method from the Karafka::App class (app.rb):

```ruby
class App < Karafka::App
  setup do |config|
    config.kafka.hosts = %w( 127.0.0.1:9092 )
    config.inline_mode = false
    config.batch_mode = false
    config.redis = {
      url: 'redis://redis.example.com:7372/1'
    }
    config.name = 'my_application'
    config.logger = MyCustomLogger.new # not required
  end
end
```

Note: You can use any library like [Settingslogic](https://github.com/binarylogic/settingslogic) to handle your application configuration.

### Configurators

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