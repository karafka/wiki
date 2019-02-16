Karafka uses [Dry-Monitor](https://github.com/dry-rb/dry-monitor) as an instrumentation layer to which you can easily hook up with your own listeners. You can use it to develop your own monitoring and logging systems (using for example NewRelic) or to perform some additional operations during certain phases of Karafka framework lifecycle.

By default, the only thing that is hooked up to this monitoring is Karafka stdout logger (```Karafka::Instrumentation::StdoutLogger```). It is based on a standard [Ruby logger](http://ruby-doc.org/stdlib-2.2.3/libdoc/logger/rdoc/Logger.html).

If you are looking for some examples on how to implement your own listeners, [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/stdout_listener.rb) you can take a look at the default Karafka logger listener implementation.

The only thing you need to be aware when developing your own listeners is that the internals of the payload may differ depending on the place that is instrumented.

*Full* list of the supported events can be found [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/monitor.rb).

## Subscribing to the instrumentation events

The best place to hook up your listener is in the ```karafka.rb``` file, right after the ```App.boot!```. This will guarantee, that your custom listener will be already loaded into memory and visible for Karafka framework.

### Subscribing with a listener class/module

```ruby
Karafka.monitor.subscribe(AirbrakeListener)
```

### Subscribing with a block

```ruby
Karafka.monitor.subscribe 'params.params.parse.error' do |event|
  puts "Oh no! An error: #{event[:error]}"
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

## Using the connection.listener.before_fetch_loop for topic seeking

This is a great event if you need to use the *seek* Kafka functionality to reprocess already fetched messages again.

**Note**: Keep in mind, that this is a per process configuration (not per consumer group) so you need to check if a provided consumer_group (if you use multiple) is the one you want to seek against.

```ruby

# Moves the offset back to 100 message, so we can reprocess messages again
# @note If you use multiple consumers group, make sure you execute ```#seek``` on a client of
#   a proper consumer group not on all of them
Karafka.monitor.subscribe('connection.listener.before_fetch_loop') do |event|
  consumer_group = event[:consumer_group]
  client = event[:client]

  topic = 'my_topic'
  partition = 0
  offset = 100

  if consumer_group.topics.map(&:name).include?(topic)
    client.seek(topic, partition, offset)
  end
end
```

## Example listener with Errbit/Airbrake support

Here's a simple example of a listener that is used to handle errors logging into Airbrake/Errbit. Keep in mind, that it uses ```#method_missing```, so if you are looking for something really fast, you may want to subscribe to given events, instead of dynamic matching.

```ruby
# frozen_string_literal: true

# Example Airbrake/Errbit listener for error only notifications upon Karafka problems
module AirbrakeListener
  # Postfixes of things that we need to log
  PROBLEM_POSTFIXES = %w[
    _error
    _retry
  ].freeze

  class << self
    # All the events in which something went wrong trigger the *_error
    # method, so we can catch all of them and notify Airbrake about that.
    #
    # @param method_name [Symbol] name of a method we want to run
    # @param args [Array] arguments of this method
    # @param block [Proc] additional block of this method
    def method_missing(method_name, *args, &block)
      return super unless eligible?(method_name)

      Airbrake.notify(args.last[:error])
    end

    # @param method_name [Symbol] name of a method we want to run
    # @return [Boolean] true if we respond to this missing method
    def respond_to_missing?(method_name, include_private = false)
      eligible?(method_name) || super
    end

    private

    # @param method_name [Symbol] name of invoked method
    # @return [Boolean] true if we are supposed to do something with
    #   a given method execution
    def eligible?(method_name)
      PROBLEM_POSTFIXES.any? do |postfix|
        method_name.to_s.end_with?(postfix)
      end
    end
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

## Ruby-Kafka driver monitoring layer

Under the hood, Karafka uses [ruby-kafka](https://github.com/zendesk/ruby-kafka) to handle low-level aspects of working with Apache Kafka. You can use [all the instrumentation made available by that library](https://github.com/zendesk/ruby-kafka#instrumentation). You can also use the existing monitoring solutions that integrate with various [monitoring services](https://github.com/zendesk/ruby-kafka#monitoring).
