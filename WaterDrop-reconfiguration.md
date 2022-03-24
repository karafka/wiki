[WaterDrop](https://github.com/karafka/waterdrop) is a standalone messages producer that is integrated with Karafka out of the box.

Karafka 2.0 comes with full WaterDrop 2.2+ support. It also integrates automatically with it, populating all the options related to Kafka that were set during the Karafka framework configuration.

In case you want to change WaterDrop configuration settings, you can do this by overwriting the default `producer` while configuring Karafka application:

```ruby
class App < Karafka::App
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
