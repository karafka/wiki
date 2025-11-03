[WaterDrop](https://github.com/karafka/waterdrop) is a standalone messages producer integrated with Karafka out of the box.

Karafka comes with full WaterDrop support. It also integrates automatically with it, populating all the options related to Kafka that were set during the Karafka framework configuration.

In case you want to change WaterDrop configuration settings, you can do this by overwriting the default `producer` while configuring the Karafka application:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Karafka config...
    config.client_id = ::Settings.name

    config.producer = ::WaterDrop::Producer.new do |p_config|
      p_config.kafka = {
        'bootstrap.servers': 'localhost:9092',
        'request.required.acks': 1
      }
    end
  end

  routes.draw do
    # consumer groups definitions go here
  end
end
```

## Partial Reconfiguration

There are scenarios where you want only partially to overwrite the configuration and change one or two attributes. In cases like this, to not duplicate the Kafka cluster configuration, you can use the `Karafka::Setup::AttributesMap`. For example, you may want to disable dispatch to Kafka altogether in `test` env:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Karafka config...
    config.client_id = ::Settings.name

    config.producer = ::WaterDrop::Producer.new do |p_config|
      # Copy the default config, filtering out non-producer related settings
      p_config.kafka = ::Karafka::Setup::AttributesMap.producer(config.kafka.dup)
      # share the Karafka logger
      p_config.logger = config.logger

      # Any reconfiguration you want goes here
      #
      # Do not send messages to Kafka in test env
      p_config.deliver = !Karafka.env.test?
    end
  end
end
```

## See also

- [Producing Messages](Producing-Messages)
- [Multi Cluster Setup](Multi-Cluster-Setup)
- [WaterDrop Configuration](WaterDrop-Configuration)
