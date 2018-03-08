Karafka uses [Dry-Monitor](https://github.com/dry-rb/dry-monitor) as an instrumentation layer to which you can easily hook up with your own listeners. You can use it to develop your own monitoring and logging systems (using for example NewRelic).

By default, the only thing that is hooked up to this monitoring is Karafka logger (```Karafka::Instrumentation::Logger```). It is based on a standard [Ruby logger](http://ruby-doc.org/stdlib-2.2.3/libdoc/logger/rdoc/Logger.html).

If you are looking for some examples on how to implement your own listeners, [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/listener.rb) you can take a look at the default Karafka logger listener implementation.

The only thing you need to be aware when developing your own listeners, is that the internals of the payload may differ depending on the place that is instrumented.

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

## Example listener with Errbit/Airbrake support

Here's a simple example of a listener that is used to handle errors logging into Airbrake/Errbit. Keep in mind, that is uses ```#method_missing```, so if you are looking for something really fast, you may want to subscribe to given events, instead of dynamic matching.

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

## Example monitor with NewRelic support

Here's a simple example of a listener that is used to handle events and errors logging into NewRelic. It will send metrics with information about amount of consumed (processed) messages per topic.

```ruby
# frozen_string_literal: true

# NewRelic example monitor for Karafka
class NewRelicListener
  class << self
    # This method is triggered when fetched messages are being delegated to proper
    # consumer instance
    # This method will record metrics for a custom key that is combined of the topic
    # name and consumer class. For example: Custom/user_created/UsersConsumer
    def on_connection_delegator_call(event)
      consumer = event[:consumer]
      topic = consumer.topic.name
      count = event[:kafka_messages].count
      key = "Custom/#{topic}/#{consumer.class}"
      NewRelic::Agent.record_metric(key, count: count)
    end

    # All the events in which something went wrong trigger the *_error method,
    #   so we can catch all of them and notify Airbrake about that.
    #
    # @param method_name [Symbol] name of a method we want to run
    # @param args [Array] arguments of this method
    # @param block [Proc] additional block of this method
    def method_missing(method_name, *args, &block)
      return super unless method_name.to_s.end_with?('_error')
      NewRelic::Agent.notice_error(args.last[:error])
    end

    # @param method_name [Symbol] name of a method we want to run
    # @return [Boolean] true if we respond to this missing method
    def respond_to_missing?(method_name, include_private = false)
      method_name.to_s.end_with?('_error') || super
    end
  end
end
```

Don't forget to subscribe your listener to the instrumentation:

```ruby
Karafka.monitor.subscribe NewRelicListener
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

**Warning**: Keep in mind, that if you replace Dry-Monitor with something else, you will have to implement your own logger listener as well as the defaut one is designed to work with Dry-Monitor.

## Ruby-Kafka driver monitoring layer

Under the hook Karafka uses [ruby-kafka](https://github.com/zendesk/ruby-kafka) to handle low level aspects of working with Apache Kafka. You can use [all the instrumentation made available by that library](https://github.com/zendesk/ruby-kafka#instrumentation). You can also use the existing monitoring solutions that integrate with various [monitoring services](https://github.com/zendesk/ruby-kafka#monitoring).
