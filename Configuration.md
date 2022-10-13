Karafka contains multiple configuration options. To keep everything organized, all the configuration options were divided into two groups:

* `karafka` options - options directly related to the Karafka framework and its components.

* `librdkafka` options - options related to [librdkafka](https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md)

To apply all those configuration options, you need to use the ```#setup``` method from the `Karafka::App` class:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_application'
    # librdkafka configuration options need to be set as symbol values
    config.kafka = {
      'bootstrap.servers': '127.0.0.1:9092'
    }
  end
end
```

**Note**: Karafka allows you to redefine some of the settings per each topic, which means that you can have a specific custom configuration that might differ from the default one configured at the app level. This allows you for example, to connect to multiple Kafka clusters.

## Karafka configuration options

A list of all the karafka configuration options with their details and defaults can be found [here](https://github.com/karafka/karafka/blob/master/lib/karafka/setup/config.rb).

## librdkafka driver configuration options

A list of all the configuration options related to `librdkafka` with their details and defaults can be found [here](https://github.com/edenhill/librdkafka/blob/master/CONFIGURATION.md).

## External components configurators

For additional setup and/or configuration tasks, you can use the `app.initialized` event hook. It is executed **once** per process, right after all the framework components are ready (including those dynamically built). It can be used, for example, to configure some external components that need to be based on Karafka internal settings.

```ruby
class KarafkaApp < Karafka::App
  # Setup and other things...

  # Once everything is loaded and done, assign Karafka app logger as a MyComponent logger
  # @note This example does not use config details, but you can use all the config values
  #   to setup your external components
  monitor.subscribe('app.initialized') do
    MyComponent::Logging.logger = Karafka::App.logger
  end
end

# Or if you prefer, you can do it from the outside of the app
Karafka.monitor.subscribe('app.initialized') do
  MyComponent::Logging.logger = Karafka::App.logger
end
```

## Environment variables settings

There are several env settings you can use:

| ENV name          | Default | Description                                                                           |
|-------------------|-----------------|-------------------------------------------------------------------------------|
| KARAFKA_ENV       | development     | In what mode this application should boot (production/development/test/etc)   |
| KARAFKA_BOOT_FILE | app_root/karafka.rb | Path to a file that contains Karafka app configuration and booting procedures |

## Messages compression

Kafka lets you compress your messages as they travel over the wire. By default, producer messages are sent uncompressed.

Karafka producer ([WaterDrop](https://github.com/karafka/waterdrop)) supports following compression types:

- `gzip`
- `zstd`
- `lz4`
- `snappy`

You can enable the compression by using the `compression.codec` and `compression.level` settings:

```ruby
setup_karafka do |config|
  config.kafka = {
    # Other kafka settings...
    'compression.codec': 'gzip',
    'compression.levle': '12'
  }
end
```

*Note*: In order to use `zstd`, you need to install `libzstd-dev`:

```bash
apt-get install -y libzstd-dev
```
