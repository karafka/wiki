Karafka uses [Dry-Monitor](https://github.com/dry-rb/dry-monitor) as an instrumentation layer to which you can easily hook up with your own listeners. You can use it to develop your own monitoring and logging systems (using for example NewRelic) or to perform some additional operations during certain phases of Karafka framework lifecycle.

By default, the only thing that is hooked up to this monitoring is Karafka logger listener (```Karafka::Instrumentation::LoggerListener```). It is based on a standard [Ruby logger](http://ruby-doc.org/stdlib-2.2.3/libdoc/logger/rdoc/Logger.html).

If you are looking for some examples on how to implement your own listeners, [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/logger_listener.rb) you can take a look at the default Karafka logger listener implementation.

The only thing you need to be aware when developing your own listeners is that the internals of the payload may differ depending on the place that is instrumented.

*Full* list of the supported events can be found [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/monitor.rb).

## Subscribing to the instrumentation events

The best place to hook up your listener is at the end of the ```karafka.rb``` file. This will guarantee, that your custom listener will be already loaded into memory and visible for Karafka framework.

**Note**: The reason why you should set up listeners **after** configuring the app, is the fact, that Karafka sets up its internal components right after the configuration block. That way, we can be sure everything is loaded and initialized correctly.

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
# Once everything is loaded and done, assign Karafka app logger as a Sidekiq logger
# @note This example does not use config details, but you can use all the config values via Karafka::App.config method.
#   to setup your external components
Karafka.monitor.subscribe('app.initialized') do |_event|
  Sidekiq::Logging.logger = Karafka::App.logger
end
```

## Example listener with Errbit/Airbrake support

Here's a simple example of a listener that is used to handle errors logging into Airbrake/Errbit.

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

**Warning**: Keep in mind, that if you replace Dry-Monitor with something else, you will have to implement your own logger listener as well, as the default one is designed to work with Dry-Monitor.
