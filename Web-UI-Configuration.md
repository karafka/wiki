Similar to configuring Karafka, a few configuration options can also be used in Karafka Web.

Those options can be used to control things like topics names, frequency of data reports, encrypted data visibility, pagination settings, and more.

You can find the whole list of settings [here](https://github.com/karafka/karafka-web/blob/master/lib/karafka/web/config.rb).

You can configure Web UI by using the `#setup` method in your `karafka.rb`:

```ruby
Karafka::Web.setup do |config|
  # Report every 10 seconds
  config.tracking.interval = 10_000
end

Karafka::Web.enable!
```

## Monitoring non-default producer instances

A Karafka errors page UI view allows users to inspect errors occurring during messages consumption and production, including all the asynchronous errors coming from `librdkafka`

By default, Karafka Web UI is set only to monitor and track the default producer, which is initialized automatically and made available under `Karafka.producer`.

This means that if you manually create and initialize custom producers (using WaterDrop), these custom producers are not automatically tracked or monitored in the Web UI. They aren't connected to the monitoring instruments that the Web UI uses to track events and states of the producers.

To have these custom producers tracked in the Karafka Web UI, you need to subscribe the appropriate listeners to them manually. This is achieved by using the following code:

```ruby
MY_CUSTOM_PRODUCER = WaterDrop::Producer.new

::Karafka::Web.config.tracking.producers.listeners.each do |listener|
  MY_CUSTOM_PRODUCER.monitor.subscribe(listener)
end
```

## Opting out of producers' monitoring

In specific scenarios, you may not want the Karafka Web UI to monitor your Kafka producers. For instance:

1. Performance considerations: Depending on the scale of your application, having numerous producers being tracked might add unnecessary overhead to your application, thereby reducing overall performance. This could be especially relevant in a production environment where efficiency and resource utilization are critical.
2. Privacy or Security concerns: You might have producers dealing with sensitive data that you prefer not to expose through monitoring, or your security guidelines might not allow such tracking.
3. Simplicity: If you have many producers and only a subset of them are relevant for your current debugging or monitoring needs, tracking all producers could clutter the Web UI, making it harder to focus on the issues at hand.
In such cases, you can opt out of monitoring producers with the Karafka Web UI by using the provided code:

```ruby
Karafka::Web.setup do |config|
  # Do not instrument producers with web-ui listeners
  config.tracking.producers.listeners = []
end
```
