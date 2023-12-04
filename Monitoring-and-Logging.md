Karafka uses a simple monitor with an API compatible with `dry-monitor` and `ActiveSupport::Notifications` to which you can easily hook up with your listeners. You can use it to develop your monitoring and logging systems (for example, NewRelic) or perform additional operations during certain phases of the Karafka framework lifecycle.

The only thing hooked up to this monitoring is the Karafka logger listener (```Karafka::Instrumentation::LoggerListener```). It is based on a standard [Ruby logger](https://ruby-doc.org/stdlib-3.1.2/libdoc/logger/rdoc/Logger.html) or Ruby on Rails logger when used with Rails. You can find it in your `karafka.rb` file:

```ruby
Karafka.monitor.subscribe(Karafka::Instrumentation::LoggerListener.new)
```

If you are looking for examples of implementing your listeners, [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/logger_listener.rb), you can take a look at the default Karafka logger listener implementation.

The only thing you need to be aware of when developing your listeners is that the internals of the payload may differ depending on the instrumentation place.

A complete list of the supported events can be found [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/notifications.rb).

## Subscribing to the instrumentation events

The best place to hook your listener is at the end of the ```karafka.rb``` file. This will guarantee that your custom listener will be already loaded into memory and visible for the Karafka framework.

!!! note ""

    You should set up listeners **after** configuring the app because Karafka sets up its internal components right after the configuration block. That way, we can be sure everything is loaded and initialized correctly.

### Subscribing with a listener class/module

```ruby
Karafka.monitor.subscribe(MyAirbrakeListener.new)
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

## Using the `Karafka.monitor` for application specific events

`Karafka.monitor` can be used for monitoring Karafka's internal events and for instrumenting and observing custom, application-specific events. Allowing developers to register and monitor their own events provides a unified way to instrument Karafka and custom business operations within Karafka.

### Registering and Instrumenting Custom Events

To register your custom event with the Karafka monitor, you can use the `#register_event` method:

```ruby
# Register the event
Karafka.monitor.notifications_bus.register_event('app.custom.event')
```

After registering an event, you can instrument with it as follows:

```ruby
Karafka.monitor.instrument('app.custom.event') do
  puts 'This is my instrumented custom logic!'
end
```

You can subscribe to those events the same way as you subscribe to the internal Karafka events:

```ruby
# Via a block:
Karafka.monitor.subscribe('app.custom.event') do |event|
  puts "Custom logic was executed. Details: #{event}"
end

# Or by using a listener with `#on_app_custom_event` method:
Karafka.monitor.subscribe(AppEventsListener.new)
```

### Use Cases for Custom Events

Here are some examples where instrumenting custom events can be beneficial:

- **Performance Monitoring**: If your application has a particular business operation or function that you suspect might be a performance bottleneck, you can instrument it and measure its execution time.

- **External Service Calls**: If your application interacts with external APIs or services, you can instrument events to monitor the success, failure, and response time of these external calls.

- **Data Flow Monitoring**: In data-intensive applications, you can instrument events to monitor data flow as it's ingested, processed, transformed, or exported.

### Naming Considerations for Custom Events

Ensuring that your custom events' names don't clash with Karafka's internal events is essential. As a best practice, consider prefixing your event names with a unique identifier like `app.` or any other prefix that distinguishes your events from Karafka's. This approach prevents naming conflicts and provides clarity when observing and debugging events.

For example, a custom event to monitor external API calls could be named `app.external_api_call`:

```ruby
Karafka.monitor.notifications_bus.register_event('app.external_api_call')
```

## Usage Statistics and Subscribing to `statistics.emitted` Event 

!!! warning "Always keep `statistics.emitted` handlers concise and non-blocking"

    When subscribing to `statistics.emitted`, ensure your code is concise and non-blocking, as this runs every 5 seconds and during active processing. Long-running handlers can impede the polling process, affecting message consumption. Rigorously test your handlers - failures in processing these statistics can lead to critical exceptions that disrupt your consumption process.

!!! note ""
  
    Karafka emits metrics every 5 seconds by default, governed by the Kafka setting `statistics.interval.ms`. Metrics are also published during processing and long polling. Whether you are processing data or waiting on more information being shipped from Kafka, metrics publishing will occur.

Karafka may be configured to emit internal metrics at a fixed interval by setting the `kafka` `statistics.interval.ms` configuration property to a value > `0`. Once that is done, emitted statistics are available after subscribing to the `statistics.emitted` publisher event. By default this setting is set to 5 seconds.

The statistics include all of the metrics from `librdkafka` (full list [here](https://karafka.io/docs/Librdkafka-Statistics/)) as well as the diff of those against the previously emitted values.

For several attributes like `rxmsgs`, `librdkafka` publishes only the totals. In order to make it easier to track the progress (for example number of messages received between statistics emitted events) and state changes, Karafka compares all the numeric values against previously available numbers enriching the original payload with following values:

- `METRIC_KEY_d` - delta computed as a difference between current and previous value - useful for trends.
- `METRIC_KEY_fd` - freeze duration. Informs how long (in milliseconds) the given metric did not change - helpful for staleness detection.

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

## Web UI monitoring and error tracking

Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications, without the need to use the command line or third party software. It does **not** require any additional database beyond Kafka itself.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui.png" alt="Karafka Web UI"/>
</p>

You can read more about its features [here](/docs/Web-UI-Features), and the installation documentation can be found [here](Web-UI-Getting-Started).

## AppSignal Metrics and Error Tracking

!!! tip ""
    [AppSignal](https://www.appsignal.com/) has had and continues to have, a **tremendous** impact on the Karafka ecosystem. Without their invaluable contributions and support, the progress and evolution of this ecosystem would not have been possible. For those searching for a top-notch monitoring system for Ruby and Rails applications, AppSignal stands out as a prime choice. Karafka officially recommends AppSignal as the supported integration for its community and users.

Karafka's integration with [AppSignal](https://www.appsignal.com/) offers comprehensive support for error reporting and performance monitoring, making it a seamless solution for monitoring your Kafka-based applications.

![Example Karafka AppSignal dashboard](https://raw.githubusercontent.com/karafka/misc/master/printscreens/karafka_appsignal_dashboard_example.png)

The Karafka AppSignal integration provides an extensive set of metrics with both per-topic and per-partition resolution. This granularity allows you to drill down into specific aspects of your Kafka processing pipeline.

Key Metrics Include:

- Performance Metrics: Monitor the performance of your Karafka consumers, ensuring optimal message processing times.

- Error Reporting: Gain insights into errors and exceptions within your Karafka application. AppSignal will help you identify and diagnose issues quickly, including asynchronous operation-related errors.

- Dead Letter Queue: Keep an eye on messages that have failed to be processed and understand why they ended up in the dead letter queue.

By using the Karafka AppSignal integration, you can proactively manage your Kafka-based applications, ensuring they operate smoothly and reliably.

!!! note ""

    When setting up listeners for both metrics and errors, it's **crucial** to subscribe to the error listener first and then the metrics listener. Doing so in reverse may result in incorrect propagation of namespace and transaction details, leading to potential data inconsistencies. Ensure the correct sequence for accurate monitoring and data integrity.

### Error Tracking

Monitoring errors in Karafka consumers and producers is as critical as tracking performance and stability. Doing so provides a holistic view of system health, ensuring no issues or anomalies are overlooked. With the integration of Appsignal, you gain an additional layer of instrumentation specifically for this purpose. Appsignal integration tracks and reports all errors, including the internal asynchronous ones that might arise while working with Kafka. This comprehensive error tracking ensures timely detection and resolution, safeguarding your Kafka operations' integrity and reliability.

Below, you can find instructions on how to enable the errors instrumentation:

```ruby
# First configure your app in karafka.rb
class KarafkaApp < Karafka::App
  setup do |config|
    # setup goes here...
  end
end

# require appsignal errors listener as it is not loaded by default
require 'karafka/instrumentation/vendors/appsignal/errors_listener'

# Create an appsignal errors listener
appsignal_errors_listener = ::Karafka::Instrumentation::Vendors::Appsignal::ErrorsListener.new

# Subscribe with your errors listener to Karafka and its producer and you should be ready to go!
Karafka.monitor.subscribe(appsignal_errors_listener)
Karafka.producer.monitor.subscribe(appsignal_errors_listener)

# setup the metrics listener here if you want
```

![Example Karafka AppSignal Errors dashboard](https://raw.githubusercontent.com/karafka/misc/master/printscreens/karafka_appsignal_dashboard_errors_example.png)


### Metrics Instrumentation

The AppSignal integration offers comprehensive instrumentation, ensuring that you have a clear view of your application's performance and other vital metrics. In addition, a ready-to-import dashboard has been made available for instant insights. You can access and explore this dashboard [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/vendors/appsignal/dashboard.json).

Below, you can find instructions on how to enable the metrics instrumentation:

```ruby
# First configure your app in karafka.rb
class KarafkaApp < Karafka::App
  setup do |config|
    # setup goes here...
  end
end

# require appsignal metrics listener as it is not loaded by default
require 'karafka/instrumentation/vendors/appsignal/metrics_listener'

# Create an appsignal metrics listener
appsignal_metrics_listener = ::Karafka::Instrumentation::Vendors::Appsignal::MetricsListener.new

# Subscribe with your listener to Karafka and you should be ready to go!
Karafka.monitor.subscribe(appsignal_metrics_listener)
```

Remember to import the Appsignal ready-to-import dashboard that you can find [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/vendors/appsignal/dashboard.json).

## Sentry Error Tracking Integration

If you are using Sentry and want to track errors that occurred in Karafka for both consumptions as well as any errors happening in the background threads, all you need to do is to connect to the `error.occurred` using Sentry `#capture_exception` API:

```ruby
Karafka.monitor.subscribe 'error.occurred' do |event|
  Sentry.capture_exception(event[:error])
end
```

## Datadog and StatsD integration

!!! note ""

    WaterDrop has a separate instrumentation layer that you need to enable if you want to monitor both the consumption and production of messages. Please go [here](https://github.com/karafka/waterdrop#datadog-and-statsd-integration) for more details.

Karafka comes with (optional) full Datadog and StatsD integration that you can use. To use it:

```ruby
# First configure your app in karafka.rb
class KarafkaApp < Karafka::App
  setup do |config|
    # setup goes here...
  end
end

# require datadog/statsd and the listener as it is not loaded by default
require 'datadog/statsd'
require 'karafka/instrumentation/vendors/datadog/metrics_listener'

# initialize the listener with statsd client
dd_listener = ::Karafka::Instrumentation::Vendors::Datadog::MetricsListener.new do |config|
  config.client = Datadog::Statsd.new('localhost', 8125)
  # Publish host as a tag alongside the rest of tags
  config.default_tags = ["host:#{Socket.gethostname}"]
end

# Subscribe with your listener to Karafka and you should be ready to go!
Karafka.monitor.subscribe(dd_listener)
```

You can also find [here](https://github.com/karafka/karafka/blob/master/lib/karafka/instrumentation/vendors/datadog/dashboard.json) a ready-to-import DataDog dashboard configuration file that you can use to monitor your consumers.

![Example Karafka DD dashboard](https://raw.githubusercontent.com/karafka/misc/master/printscreens/karafka_dd_dashboard_example.png)

### Tracing Consumers using DataDog Logger Listener

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

!!! note ""

    Tracing capabilities were added by [Bruno Martins](https://github.com/bruno-b-martins).

## OpenTelemetry

!!! note ""

    WaterDrop has a separate instrumentation layer that you need to enable if you want to monitor both the consumption and production of messages. You can use the same approach as Karafka and WaterDrop share the same core monitoring library.

OpenTelemetry does not support async tracing in the same way that Datadog does. Therefore it is impossible to create a tracer that will accept reporting without the code running from within a block nested inside the `#in_span` method.

Because of this, you need to subclass the default `Monitor` and inject the OpenTelemetry tracer into it. Below is an example that traces the `consumer.consumed` event. You can use this approach to trace any events Karafka publishes:

```ruby
class MonitorWithOpenTelemetry < ::Karafka::Instrumentation::Monitor
  # Events we want to trace with OpenTelemetry
  TRACEABLE_EVENTS = %w[
    consumer.consumed
  ].freeze

  def instrument(event_id, payload = EMPTY_HASH, &block)
    # Always run super, so the default instrumentation pipeline works
    return super unless TRACEABLE_EVENTS.include?(event_id)

    # If event is trackable, run it inside the opentelemetry tracer
    MyAppTracer.in_span(
      "karafka.#{event_id}",
      attributes: extract_attributes(event_id, payload)
    ) { super }
  end

  private

  # Enrich the telemetry with custom attributes information
  def extract_attributes(event_id, payload)
    payload_caller = payload[:caller]

    case event_id
    when 'consumer.consumed'
      {
        'topic' => payload_caller.topic.name,
        'consumer' => payload_caller.class.to_s
      }
    else
      raise ArgumentError, event_id
    end
  end
end
```

Once created, assign it using the `config.monitor` setting:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.monitor = MonitorWithOpenTelemetry.new
  end
end
```

## Example Listener with Errbit/Airbrake Support

Here's a simple example of a listener used to handle errors logging into Airbrake/Errbit.

```ruby
# Example Airbrake/Errbit listener for error notifications in Karafka
module AirbrakeListener
  def on_error_occurred(event)
    Airbrake.notify(event[:error])
  end
end
```

## Publishing Karafka and WaterDrop notifications events using `ActiveSupport::Notifications`

If you already use `ActiveSupport::Notifications` for notifications event tracking, you may also want to pipe all the Karafka and WaterDrop notifications events there.

To do so, subscribe to all Karafka and WaterDrop events and publish those events via `ActiveSupport::Notifications`:

```ruby
# Karafka subscriptions piping
::Karafka::Instrumentation::Notifications::EVENTS.each do |event_name|
  ::Karafka.monitor.subscribe(event_name) do |event|
    # Align with ActiveSupport::Notifications default naming convention
    event = (event_name.split('.').reverse << 'karafka').join('.')

    # Instrument via ActiveSupport
    ::ActiveSupport::Notifications.instrument(event_name, **event.payload)
  end
end
```

```ruby
# WaterDrop subscriptions piping
::WaterDrop::Instrumentation::Notifications::EVENTS.each do |event_name|
  ::Karafka.producer.subscribe(event_name) do |event|
    # Align with ActiveSupport::Notifications default naming convention
    event = (event_name.split('.').reverse << 'waterdrop').join('.')

    ::ActiveSupport::Notifications.instrument(event_name, **event.payload)
  end
end
```

Once that is done, you can subscribe directly to the events published there:

```ruby
# Note that the events naming is reverted to follow ActiveSupport::Notifications conventions
ActiveSupport::Notifications.subscribe('consumed.consumer.karafka') do |event|
  Rails.logger.info "[consumer.consumed]: #{event.inspect}"
end
```

!!! note ""

    Please note that each Karafka producer has its instrumentation instance, so if you use more producers, you need to pipe each of them independently.

## Implications of Broken Instrumentation listeners/listeners Causing Errors

Instrumentation and monitoring listeners are essential components in Karafka-based applications as they provide insight into the app's performance and behavior. They are critical in collecting metrics, measuring response times, and tracking other performance data. When functioning correctly, they enable efficient identification of issues and performance optimization. However, their malfunctioning could lead to several challenges and problems.

The first significant impact of broken instrumentation and monitoring listeners is the loss of visibility into the application's internal workings. This obscures your understanding of its performance and makes debugging more difficult. Such listeners are instrumental in spotting errors, bottlenecks, and irregular behaviors in your Karafka applications. Their malfunctioning can thus complicate identifying the root causes of issues and effective debugging.

Secondly, faulty listeners can adversely affect your Karafka application's performance. Their roles include collecting metrics and measuring response times, among other performance-related tasks. Any malfunctioning might result in missing essential performance bottlenecks, leading to performance degradation like decreased throughput and increased latency.

In specific scenarios, instrumentation errors in the Kafka listener threads can force Karafka into a recovery mode, causing continuous attempts to reconnect to Kafka and triggering rebalances. This can temporarily halt message consumption and impact workload distribution among consumer instances. Furthermore, instrumentation listener errors in worker threads responsible for processing messages might prevent proper acknowledgment of work or cause double processing of messages, resulting in issues like message loss or duplicate processing.

For those using custom instrumentation listeners, it's vital to ensure they are thoroughly tested and not performing heavy or error-prone tasks. These listeners can introduce additional complexity, and maintaining a balance between gathering valuable insights and keeping the listeners lightweight and error-free is essential.

To avert these issues, it's crucial to ensure your Karafka applications' instrumentation and monitoring listeners function correctly.

In conclusion, maintaining the stability, performance, and reliability of Karafka-based applications requires the proper functioning of any custom instrumentation and monitoring listeners.
