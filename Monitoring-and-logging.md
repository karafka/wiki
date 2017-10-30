Karafka provides a simple monitor (Karafka::Monitor) with a really small API. You can use it to develop your own monitoring system (using for example NewRelic). By default, the only thing that is hooked up to this monitoring is a Karafka logger (Karafka::Logger). It is based on a standard [Ruby logger](http://ruby-doc.org/stdlib-2.2.3/libdoc/logger/rdoc/Logger.html).

To change monitor or a logger assign new logger/monitor during setup:

```ruby
class App < Karafka::App
  setup do |config|
    # Other setup stuff...
    config.logger = MyCustomLogger.new
    config.monitor = CustomMonitor.instance
  end
end
```

Keep in mind, that if you replace monitor with a custom one, you will have to implement logging as well. It is because monitoring is used for both monitoring and logging and a default monitor handles logging as well.

## Ruby-Kafka driver monitoring layer

Under the hook Karafka uses [ruby-kafka](https://github.com/zendesk/ruby-kafka) to handle low level aspects of working with Apache Kafka. You can use [all the instrumentation made available by that library](https://github.com/zendesk/ruby-kafka#instrumentation). You can also use the existing monitoring solutions that integrate with various [monitoring services](https://github.com/zendesk/ruby-kafka#monitoring).

## Example monitor with Errbit/Airbrake support

Here's a simple example of monitor that is used to handle errors logging into Airbrake/Errbit.

```ruby
class AppMonitor < Karafka::Monitor
  def notice_error(caller_class, e)
    super
    Airbrake.notify(e)
  end
end
```

## Example monitor with NewRelic support

Here's a simple example of monitor that is used to handle events and errors logging into NewRelic. It will send metrics with information about amount of consumed (processed) messages per topic and how many of them were scheduled to be performed async.

```ruby
# NewRelic example monitor for Karafka
class AppMonitor < Karafka::Monitor
  # @param [Class] caller class for this notice
  # @param [Hash] hash with options for this notice
  def notice(caller_class, options = {})
    # Use default Karafka monitor logging
    super
    # Handle differently proper actions that we want to monit with NewRelic
    return unless respond_to?(caller_label, true)
    send(caller_label, options[:topic])
  end

  # @param [Class] caller class for this notice error
  # @param e [Exception] error that happened
  def notice_error(caller_class, e)
    super
    NewRelic::Agent.notice_error(e)
  end

  private

  # Log that message for a given topic was consumed
  # @param topic [String] topic name
  def consume(topic)
    record_count metric_key(topic, __method__)
  end

  # Log that message for topic was scheduled to be performed async
  # @param topic [String] topic name
  def perform_async(topic)
    record_count metric_key(topic, __method__)
  end

  # Log that message for topic was performed async
  # @param topic [String] topic name
  def perform(topic)
    record_count metric_key(topic, __method__)
  end

  # @param topic [String] topic name
  # @param action [String] action that we want to log (consume)
  # @return [String] a proper metric key for NewRelic
  # @example
  #   metric_key('videos', 'perform_async') #=> 'Custom/videos/perform_async'
  def metric_key(topic, action)
    "Custom/#{topic}/#{action}"
  end

  # Records occurence of a given event
  # @param [String] key under which we want to log
  def record_count(key)
    NewRelic::Agent.record_metric(key, count: 1)
  end
end
```