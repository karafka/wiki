Karafka uses a simple monitor with an API compatible with `dry-monitor` and `ActiveSupport::Notifications` to which you can easily hook up with your listeners. You can use it to develop your monitoring and logging systems (for example, NewRelic) or perform additional operations during certain phases of the Karafka framework lifecycle.

The only thing hooked up to this monitoring is the Karafka logger listener (```Karafka::Instrumentation::LoggerListener```). It is based on a standard [Ruby logger](https://ruby-doc.org/stdlib-3.1.2/libdoc/logger/rdoc/Logger.html) or Ruby on Rails logger when used with Rails.

If you are looking for examples of implementing your listeners, [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/logger_listener.rb), you can take a look at the default Karafka logger listener implementation.

The only thing you need to be aware of when developing your listeners is that the internals of the payload may differ depending on the instrumentation place.

A complete list of the supported events can be found [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/notifications.rb).

## Subscribing to the instrumentation events

The best place to hook your listener is at the end of the ```karafka.rb``` file. This will guarantee that your custom listener will be already loaded into memory and visible for the Karafka framework.

**Note**: You should set up listeners **after** configuring the app because Karafka sets up its internal components right after the configuration block. That way, we can be sure everything is loaded and initialized correctly.

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

## Usage statistics and subscribing to `statistics.emitted` event 

Karafka may be configured to emit internal metrics at a fixed interval by setting the `kafka` `statistics.interval.ms` configuration property to a value > `0`. Once that is done, emitted statistics are available after subscribing to the `statistics.emitted` publisher event.

The statistics include all of the metrics from `librdkafka` (full list [here](https://github.com/edenhill/librdkafka/blob/master/STATISTICS.md)) as well as the diff of those against the previously emitted values.

For several attributes like `rxmsgs`, `librdkafka` publishes only the totals. In order to make it easier to track the progress (for example number of messages received between statistics emitted events), Karafka diffs all the numeric values against previously available numbers. All of those metrics are available under the same key as the metric but with additional `_d` postfix:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      'bootstrap.servers': 'localhost:9092',
      # Emit statistics every second
      'statistics.interval.ms': 1_000
    }
  end
end

Karafka::App.monitor.subscribe('statistics.emitted') do |event|
  sum = event[:statistics]['rxmsgs']
  diff = event[:statistics]['rxmsgs_d']

  p "Received messages: #{sum}"
  p "Messages received from last statistics report: #{diff}"
end
```

## Datadog and StatsD integration

**Note**: WaterDrop has a separate instrumentation layer that you need to enable if you want to monitor both the consumption and production of messages. Please go [here](https://github.com/karafka/waterdrop#datadog-and-statsd-integration) for more details.

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

You can also find [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/vendors/datadog/dashboard.json) a ready-to-import DataDog dashboard configuration file that you can use to monitor your consumers.

![Example Karafka DD dashboard](https://raw.githubusercontent.com/karafka/misc/master/printscreens/karafka_dd_dashboard_example.png)

### Tracing consumers using DataDog logger listener

If you are interested in tracing your consumers' work with DataDog, you can use our DataDog logger listener:

```ruby
# you need to add ddtrace to your Gemfile
require 'ddtrace'
require 'karafka/instrumentation/vendors/datadog/logger_listener'

# Initialize the listener
dd_logger_listener = Karafka::Instrumentation::Vendors::Datadog::LoggerListener.new do |config|
  config.client = Datadog::Tracing
end

# Use the DD tracing only for staging and production
Karafka.monitor.subscribe(dd_logger_listener) if %w[staging production].include?(Rails.env)
```

![Example Karafka DD dashboard](https://raw.githubusercontent.com/karafka/misc/master/printscreens/karafka_dd_tracing.png)

**Note**: Tracing capabilities were added by [Bruno Martins](https://github.com/bruno-b-martins).

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
