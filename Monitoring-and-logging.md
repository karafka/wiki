Karafka uses [Dry-Monitor](https://github.com/dry-rb/dry-monitor) as an instrumentation layer to which you can easily hook up with your own listeners. You can use it to develop your own monitoring and logging systems (using, for example, NewRelic) or to perform some additional operations during certain phases of the Karafka framework lifecycle.

By default, the only thing hooked up to this monitoring is the Karafka logger listener (```Karafka::Instrumentation::LoggerListener```). It is based on a standard [Ruby logger](http://ruby-doc.org/stdlib-2.2.3/libdoc/logger/rdoc/Logger.html) or Ruby on Rails logger when used with Rails.

If you are looking for examples of how to implement your own listeners, [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/logger_listener.rb), you can take a look at the default Karafka logger listener implementation.

The only thing you need to be aware of when developing your own listeners is that the internals of the payload may differ depending on the instrumentation place.

Full list of the supported events can be found [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/monitor.rb).

## Subscribing to the instrumentation events

The best place to hook up your listener is at the end of the ```karafka.rb``` file. This will guarantee that your custom listener will be already loaded into memory and visible for the Karafka framework.

**Note**: The reason you should set up listeners **after** configuring the app is that Karafka sets up its internal components right after the configuration block. That way, we can be sure everything is loaded and initialized correctly.

### Subscribing with a listener class/module

```ruby
Karafka.monitor.subscribe(AirbrakeListener.new)
```

### Subscribing with a block

```ruby
Karafka.monitor.subscribe 'error.occurred' do |event|
  type = event[:type]
  error = event[:error]
  details = (error.backtrace || []).join("\n")

  puts "Oh no! An error: #{error} of type: #{type} occurred!"
  puts details
end
```

## Using the app.initialized event to initialize additional Karafka framework settings dependent libraries

Lifecycle events can be used in various situations, for example, to configure external software or run additional one-time commands before messages receiving flow starts.

```ruby
# Once everything is loaded and done, assign the Karafka app logger as a Sidekiq logger
# @note This example does not use config details, but you can use all the config values
#   via Karafka::App.config method to setup your external components
Karafka.monitor.subscribe('app.initialized') do |_event|
  Sidekiq::Logging.logger = Karafka::App.logger
end
```

## Datadog and StatsD integration

Karafka comes with (optional) full Datadog and StatsD integration that you can use. To use it:

```ruby
# require datadog/statsd and the listener as it is not loaded by default
require 'datadog/statsd'
require 'karafka/instrumentation/vendors/datadog/listener'

# initialize Karafka with statistics.interval.ms enabled so the librdkafka metrics are published
# as well (without this, you will get only part of the metrics)
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'localhost:9092',
      'statistics.interval.ms': 1_000
    }
  end
end

# initialize the listener with statsd client
dd_listener = ::Karafka::Instrumentation::Vendors::Datadog::Listener.new do |config|
  config.client = Datadog::Statsd.new('localhost', 8125)
  # Publish host as a tag alongside the rest of tags
  config.default_tags = ["host:#{Socket.gethostname}"]
end

# Subscribe with your listener to Karafka and you should be ready to go!
Karafka.monitor.subscribe(dd_listener)
```

You can also find [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/vendors/datadog/dashboard.json) a ready to import DataDog dashboard configuration file that you can use to monitor your consumers.

![Example Karafka DD dashboard](https://raw.githubusercontent.com/karafka/misc/master/printscreens/karafka_dd_dashboard_example.png)

## Example listener with Errbit/Airbrake support

Here's a simple example of a listener used to handle errors logging into Airbrake/Errbit.

```ruby
# Example Airbrake/Errbit listener for error notifications in Karafka
module AirbrakeListener
  def on_error_occurred(event)
    Airbrake.notify(event[:error])
  end
end
```

## Replacing Dry-Monitor with ActiveSupport::Notifications

Dry-Monitor has a similar API to ```ActiveSupport::Notifications```, so in case you are already using ```ActiveSupport::Notifications```, you can easily replace one with the other.

To change monitor or a logger, assign new logger/monitor during the setup process:

```ruby
class App < Karafka::App
  setup do |config|
    # Other setup stuff...
    config.logger = MyCustomLogger.new
    config.monitor = ActiveSupport::Notifications
  end
end
```

**Warning**: Keep in mind that if you replace Dry-Monitor with something else, you will have to implement your own logger listener as well, as the default one is designed to work with Dry-Monitor.
