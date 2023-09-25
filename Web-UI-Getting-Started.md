Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications, without the need to use the command line or third party software. It does **not** require any additional database beyond Kafka itself.

The interface, amongst others, displays:

- real-time aggregated metrics,
- real-time information on resources usage,
- errors details,
- performance statistics,
- trends
- allows for Kafka topics data exploration
- routing and system information
- status of Web UI integration within your application

Karafka Web UI is shipped as a separate [gem](https://rubygems.org/gems/karafka-web) with minimal dependencies.

To use it:

1. Make sure Apache Kafka is running. You can start it by following instructions from [here](Setting-up-Kafka).

2. Make sure you have the [listed OS commands](#external-shellos-required-commands) available; if not, install them. Not all Docker images and OSes have them out-of-the-box.

3. Add Karafka Web UI to your `Gemfile`:

```bash
bundle add karafka-web
```

4. Run the following command to install the karafka-web in your project:

```ruby
# For production you should add --replication-factor N
# Where N is the replication factor you want to use in your cluster
bundle exec karafka-web install
```

**Note**: Please ensure that `karafka server` is **not** running during the Web UI installation process and that you only start `karafka server` instances **after** running the `karafka-web install` command. Otherwise, if you use `auto.create.topics.enable` set to `true`, Kafka may accidentally create Web UI topics with incorrect settings, which may cause extensive memory usage and various performance issues.

**Note**: After Web UI is installed, `bundle exec karafka-web migrate` has to be executed on **each** of the environments to create all the needed topics with appropriate configurations.

5. Mount the Web interface in your Ruby on Rails application routing:

```ruby
require 'karafka/web'

Rails.application.routes.draw do
  # other routes...

  mount Karafka::Web::App, at: '/karafka'
end
```

Or use it as a standalone Rack application by creating `karafka_web.ru` rackup file with the following content:

```ruby
# Require your application code here and then...

require_relative 'karafka.rb'

run Karafka::Web::App
```

6. Enjoy Karafka Web UI.

If you do everything right, you should see this in your browser:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui.png" alt="Karafka Web UI"/>
</p>

## Karafka Web CLI commands

The Karafka Web UI has CLI (Command-Line Interface) commands to facilitate its setup, management, and customization. Below is a detailed breakdown of these commands and their specific functionalities.

<table border="1">
    <thead>
        <tr>
            <th>Command</th>
            <th>Description</th>
            <th>Usage</th>
            <th>Parameters</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>install</td>
            <td>Installs the Karafka Web UI, creates necessary topics, populates initial zero state, and updates the <code>karafka.rb</code> file. Ensures the empty UI is displayed even if no <code>karafka server</code> processes are running.</td>
            <td><code>karafka-web install [--replication-factor=<value>]</code></td>
            <td><code>replication_factor</code>: Optional. Replication factor to use. Defaults to 1 for dev and 2 for prod.</td>
        </tr>
        <tr>
            <td>migrate</td>
            <td>Creates missing topics and missing zero states. Necessary for each environment where you want to use the Web UI.</td>
            <td><code>karafka-web migrate [--replication-factor=<value>]</code></td>
            <td><code>replication_factor</code>: Optional. Replication factor to use. Defaults to 1 for dev and 2 for prod.</td>
        </tr>
        <tr>
            <td>reset</td>
            <td>Removes all the Karafka topics and recreates them with the same replication factor.</td>
            <td><code>karafka-web reset [--replication-factor=<value>]</code></td>
            <td><code>replication_factor</code>: Optional. Replication factor to use. Defaults to 1 for dev and 2 for prod.</td>
        </tr>
        <tr>
            <td>uninstall</td>
            <td>Removes all the Karafka Web topics and cleans up all related configurations and setups.</td>
            <td><code>karafka-web uninstall</code></td>
            <td>N/A</td>
        </tr>
    </tbody>
</table>

## Manual Web UI Topics Management

By default, Karafka uses four topics with the following names:

- `karafka_consumers_states`
- `karafka_consumers_reports`
- `karafka_consumers_metrics`
- `karafka_errors`

If you have the `auto.create.topics.enable` set to `false` or problems running the install command, create them manually. The recommended settings are as followed:

<table>
<thead>
  <tr>
    <th>Topic name</th>
    <th>Settings</th>
  </tr>
</thead>
<tbody>
  <tr>
    <td>karafka_consumers_states</td>
    <td>
      <ul>
        <li>
          partitions: <code>1</code>
        </li>
        <li>
          replication factor: aligned with your company policy
        </li>
        <li>
          <code>'cleanup.policy': 'compact'</code>
        </li>
        <li>
          <code>'retention.ms': 60 * 60 * 1_000 # 1h</code>
        </li>
        <li>
          <code>'segment.ms': 24 * 60 * 60 * 1_000 # 1 day</code>
        </li>
        <li>
          <code>'segment.bytes': 104_857_600 # 100MB</code>
        </li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>karafka_consumers_reports</td>
    <td>
      <ul>
        <li>
          partitions: <code>1</code>
        </li>
        <li>
          replication factor: aligned with your company policy
        </li>
        <li>
          <code>'retention.ms': 24 * 60 * 60 * 1_000 # 1 day</code>
        </li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>karafka_consumers_metrics</td>
    <td>
      <ul>
        <li>
          partitions: <code>1</code>
        </li>
        <li>
          replication factor: aligned with your company policy
        </li>
        <li>
          <code>'cleanup.policy': 'compact'</code>
        </li>
        <li>
          <code>'retention.ms': 60 * 60 * 1_000 # 1h</code>
        </li>
        <li>
          <code>'segment.ms': 24 * 60 * 60 * 1_000 # 1 day</code>
        </li>
        <li>
          <code>'segment.bytes': 104_857_600 # 100MB</code>
        </li>
      </ul>
    </td>
  </tr>
  <tr>
    <td>karafka_errors</td>
    <td>
      <ul>
        <li>
          partitions:
          <ul>
            <li>OSS: <code>1</code></li>
            <li>Pro: As many as needed</li>
          </ul>
        </li>
        <li>
          replication factor: aligned with your company policy
        </li>
        <li>
          <code>'retention.ms': 3 * 31 * 24 * 60 * 60 * 1_000 # 3 months</code>
        </li>
      </ul>
    </td>
  </tr>
</tbody>
</table>

**Note**: Karafka Web UI topics are **not** managed via the [Declarative topics API](/docs/Topics-management-and-administration#declarative-topics). It is done that way, so your destructive infrastructure changes do not break the Web UI. If you want to include their management in your declarative topic's code, you can do so by defining their configuration manually in your routing setup. Injected routing can be found [here](https://github.com/karafka/karafka-web/blob/df679e742aa2988577b084abc3e3a83dd8cff055/lib/karafka/web/installer.rb#L42).

## External Shell/OS Required Commands

Karafka Web UI relies on a few operating system commands to function correctly and collect OS data. The table below lists these commands according to the relevant operating systems:

<table border="1">
    <thead>
        <tr>
            <th>OS Command</th>
            <th>Linux</th>
            <th>macOS</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td>ps</td>
            <td>✓</td>
            <td>✓</td>
        </tr>
        <tr>
            <td>grep</td>
            <td>✓</td>
            <td></td>
        </tr>
        <tr>
            <td>sysctl</td>
            <td></td>
            <td>✓</td>
        </tr>
        <tr>
            <td>w</td>
            <td>✓</td>
            <td>✓</td>
        </tr>
        <tr>
            <td>head</td>
            <td>✓</td>
            <td>✓</td>
        </tr>
    </tbody>
</table>


Note: The required commands may not be pre-installed when using minimal Docker images. Install them in your Docker image to allow Karafka Web UI to work correctly.

## Zero-Downtime Deployment

For those who consider `karafka server` indispensable to their production infrastructure, there's a way to integrate the Karafka Web UI without inducing downtime. Let's dive into the steps to introduce it seamlessly:

1. **Integration**: Begin by installing the Karafka Web UI. Ensure it's appropriately configured in your `karafka.rb` and works for you locally.

1. **Topic Creation - `karafka_consumers_reports`**: Manually set up this topic using the specific configuration mentioned in the table provided above.

1. **Topic Creation - `karafka_errors`**: Similarly, manually establish this topic based on the details in the table as mentioned above.

1. **Avoidance**: Refrain from initiating any other topics related to the Karafka Web UI at this point.

1. **Deployment**: Update and launch your `karafka server` versions incorporating the Web UI. When Karafka identifies the missing topics, it will yield errors and execute a backoff—this behavior is expected. Meanwhile, the Karafka Web UI will be on standby, awaiting the availability of the remaining topics.

1. **Migration**: Use the `bundle exec karafka-web migrate` command. It will generate the remaining topics and bootstrap the initial states.

1. **Activation**: About five minutes after the previous action, Karafka will pinpoint the missing topics, adjust to operate, and catch up on the reporting.

The procedure ensures the uninterrupted operation of your Karafka servers while integrating the enhanced capabilities of the Web UI.

## Multi-App / Multi-Tenant configuration

Karafka Web UI can be configured to monitor and report data about many applications to a single dashboard.

Please visit the [Web UI Multi-App](Web-UI-Multi-App) documentation page to learn more about it.

## Authentication

Karafka Web UI is "just" a Rack application, and it can be protected the same way as any other. For Ruby on Rails, in case you use Devise, you can just:

```ruby
authenticate :user, lambda { |user| user.admin? } do
  mount Karafka::Web::App, at: '/karafka'
end
```

or in case you want the HTTP Basic Auth, you can wrap the Web UI with the Basic Auth callable:

```ruby
Rails.application.routes.draw do
  with_dev_auth = lambda do |app|
      Rack::Builder.new do
        use Rack::Auth::Basic do |username, password|
          username == 'username' && password == 'password'
        end

        run app
      end
    end

  mount with_dev_auth.call(Karafka::Web::App), at: 'karafka'
end
```

You can find an explanation of how that works [here](https://blog.arkency.com/common-authentication-for-mounted-rack-apps-in-rails/).

## Troubleshooting

As mentioned above, the initial setup **requires** you to run `bundle exec karafka-web install` once so Karafka can build the initial data structures needed. Until this happens, upon accessing the Web UI, you may see a 404 error.

Before reporting an issue, please make sure that:

- You have visited the Karafka Web [status](Web-UI-Features#status) page
- All the topics required by Karafka Web exist
- Use `bundle exec karafka-web migrate` to create missing topics
- You have a working connection with your Kafka cluster
- The resource you requested exists
- You have granted correct ACL permissions to the `CLIENT_ID_karafka_admin` consumer group that Web UI uses internally in case of a `Rdkafka::RdkafkaError: Broker: Group authorization failed (group_authorization_failed)` error. You can find more about admin consumer group [here](https://karafka.io/docs/Topics-management-and-administration/#configuration).

If you were looking for a given process or other real-time information, the state might have changed, and the information you were looking for may no longer exist.

### Web UI Topics Not Receiving Data Despite Processes Running

Suppose your Web UI topics aren't displaying data despite active Karafka processes, and you encounter errors like `Rdkafka::AbstractHandle::WaitTimeoutError`. In that case, the topics might have been inadvertently auto-created while a Karafka process was running rather than being correctly initialized using the CLI commands.

To address this:

1. **Stop All Karafka Processes**: First, halt **all** running instances of `karafka server`. This step ensures no interference or further accidental topic creation during your troubleshooting.

1. **Re-create Web UI Topics**: With all Karafka processes stopped, utilize the appropriate CLI commands to recreate the Web UI topics. This action guarantees that the topics are configured properly to receive and present data in the Web UI.

1. **Start Karafka Processes**: After the topics have been recreated, restart the `karafka server` processes. Keep an eye on the Web UI to ensure that the topics are now displaying data.

You should carefully follow these steps to resolve the data display issue in the Web UI topics. Always use the prescribed methods for creating topics to sidestep such issues in the future.

### Web UI status page

The Karafka Web UI status page allows you to check and troubleshoot the state of your Karafka Web UI integration with your application.

It can help you identify and mitigate problems that would cause the Web UI to malfunction or misbehave. If you see the `404` page or have issues with Karafka Web UI, this page is worth visiting.

You can read more about it [here](Web-UI-Features#status).

### Resetting the Web UI state

If you want to reset the overall counters without removing the errors collection, you can run the `bundle exec karafka-web reset` again.

If you want to fully reset the Web UI state, you can run the `bundle exec karafka-web reset` command. This command **will** remove all the Web UI topics and re-create them with an empty state.

### Uninstalling the Web UI

If you want to remove Karafka Web UI, you need to:

1. Remove all the Web app routes from your routing.
2. Run `bundle exec karafka-web uninstall`.
3. Remove `karafka-web` from your `Gemfile`.

And that is all.

### `statistics.interval.ms` alignment

Karafka uses its internal state knowledge and `librdkafka` metrics to report the states. This means that the `statistics.interval.ms` needs to be enabled and should match the reporting interval.

**Note**: Both are enabled by default, and both report every 5 seconds, so unless you altered the defaults, you should be good.

### Message-producing permissions for consumers

Karafka Web UI uses `Karafka.producer` to produce state reports out of processes. This means that you need to make sure that the default `Karafka.producer` can deliver messages to the following topics:

- `karafka_consumers_states`
- `karafka_consumers_reports`
- `karafka_consumers_metrics`
- `karafka_errors`

Without that, Karafka will **not** be able to report anything.

### Limitations

Karafka Web UI materializes the aggregated state into Kafka. Aggregated metrics and statistics use 32 kilobytes of data. Additionally, each process monitored by Karafka adds around 120 bytes of data to this. This means that the overall amount of space needed is proportional to the number of processes it's monitoring.

By default, Kafka has a payload limit of 1 megabyte. Considering the size of a fully bootstrapped Karafka state and the additional bytes for each monitored process, you should be able to handle up to around 1000 Karafka instances within the default Kafka payload limit.

However, it's important to note that as the number of instances increases, the space demand likewise increases. Therefore, if the number of Karafka instances exceeds 1000, it is recommended to increase the `karafka_consumers_states` topic max message size to 10MB. This accommodates the additional memory requirement, ensuring that Karafka Web UI continues to function optimally and efficiently.

### Web UI Schema Compatibility Notice

When upgrading Karafka Web UI, particularly to versions with breaking changes, as noted in the changelogs, it's crucial to understand the implications for the rolling upgrades. Specifically, performing rolling upgrades under such circumstances can lead to schematic mismatches, which might introduce unintended behaviors.

Starting from version `0.7.4`, the Karafka Web UI introduces enhanced schema detection capabilities. If an older consumer responsible for materializing the Web UI results encounters an unsupported newer schema, it will detect this incompatibility. Upon detection, the consumer will emit an error and initiate a backoff procedure, ensuring the system's stability and predictability.

Furthermore, it's worth noting that if Karafka Web UI detects older schema reports during its operation, it will ignore such reports. However, this behavior is exclusive to short-lived per-process reports and only occurs in the context of upgrades introducing breaking changes to the schema. Importantly, error reports will **always** be processed and are **never** ignored, regardless of their schema version.

Ignoring these older schema reports might introduce slight discrepancies in the metrics. However, this approach is deliberate and is designed to safeguard the system. By ignoring such reports, we ensure that any potential incompatibilities in the reporting do not adversely affect the system's functionality. This serves as a safety mechanism, especially when it was impossible or overlooked to shut down all consumers during an upgrade.

It's therefore highly recommended to refrain from rolling upgrades when updating versions with breaking changes. If such upgrades are inevitable, users can rely on the Karafka Web UI's built-in mechanisms to mitigate risks associated with schema incompatibilities.

### `Rdkafka::AbstractHandle::WaitTimeoutError` during installation or migration

If you need to debug this problem further, adjusting the producer's timeout settings might be beneficial. Here's a simple code example of how to create and configure a producer with a reduced timeout and direct stdout reporting for both inline and async errors:

```ruby
# Create a producer configuration based on the Karafka one
producer_kafka_cfg = ::Karafka::Setup::AttributesMap.producer(
  Karafka::App.config.kafka.dup
)

# Set the message timeout to five seconds to get the underlying error fast
producer_kafka_cfg[:'message.timeout.ms'] = 5_000

# Build a producer
producer = ::WaterDrop::Producer.new do |p_config|
  p_config.kafka = producer_kafka_cfg
  p_config.logger = Karafka::App.config.logger
end

# Print all async errors details
producer.monitor.subscribe('error.occurred') do |event|
  p event
  p event[:error]
end

# Try to dispatch the initial state to the consumers states in case it was
# the one failing.
#
# Please note, that we use `#produce_async` here and wait.
# That's because we do not want to crash the execution but instead wait on
# the async error to appear.
producer.produce_async(
  topic: Karafka::Web.config.topics.consumers.states,
  key: Karafka::Web.config.topics.consumers.states,
  payload: {
    processes: {},
    stats: {
      batches: 0,
      messages: 0,
      retries: 0,
      dead: 0,
      busy: 0,
      enqueued: 0,
      threads_count: 0,
      processes: 0,
      rss: 0,
      listeners_count: 0,
      utilization: 0
    }
  }.to_json
)

# Wait for the async error (if any)
# librdkafka will give up after 5 seconds, so this should be more than enough
sleep(30)
```
