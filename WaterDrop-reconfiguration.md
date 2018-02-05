[WaterDrop](https://github.com/karafka/waterdrop) is a standalone messages producer that is integrated with Karafka out of the box.

Karafka 1.2 comes with full WaterDrop 1.0 support, including both synchronous and asynchronous producers. It also integrates automatically with it, populating all the options related to Kafka that were set during the Karafka framework configuration.

In case you want to change WaterDrop configuration settings, you can do this after you setup and boot Karafka framework in the karafka.rb file:

```ruby
class App < Karafka::App
  setup do |config|
    config.kafka.seed_brokers = ::Settings.kafka.seed_brokers
    config.kafka.offset_commit_threshold = 30
    config.client_id = ::Settings.name
  end

  consumer_groups.draw do
    # consumer groups definitions go here
  end
end

App.boot!

# Overwrite default delivery setting and don't send in the test env
WaterDrop.setup do |water_config|
  water_config.deliver = !Karafka.env.test?
end
```