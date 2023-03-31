**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Karafka Web UI can support data collection, aggregation, and presentation from multiple applications in a single dashboard. This is particularly useful for anyone dealing with micro-services that operate in the same Kafka cluster and are part of the same application.

Here are the steps necessary to configure Karafka Web-UI to work in a multi-app mode:

1. Please follow the [Getting Started](Web-UI-Getting-Started) guidelines and configure **each** of the applications independently. You don't have to mount the routing in every application, but each app needs to be able to report to Kafka.

2. Mount the Web UI into one of your applications.

3. Disable aggregated metrics materialization in all the applications except one. One application **needs** to be able to materialize the metrics, and this application needs to use at least one `karafka server` instance. To disable metrics materialization, deactivate the reporting using the `Karafka::Web` configuration:

```ruby
# Put this at the end of your karafka.rb but BEFORE you activate the Web
Karafka::Web.setup do |config|
  # Set this to false in all apps except one
  config.processing.active = false
end
```

4. Use Karafka [Tagging API](Web-UI-Tagging) to tag each of the applications with its unique name:

```ruby
Karafka::Process.tags.add(:application_name, 'MyApp1')
```

5. Deploy all the applications, open the Web UI, and enjoy.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/multi-app.png" alt="karafka web multi-app processes view" />
</p>
