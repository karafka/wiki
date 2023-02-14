Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications, without the need to use the command line or third party software. It does **not** require any additional database beyond Kafka itself.

The interface, amongst others, displays:

- real-time aggregated metrics,
- real-time information on resources usage,
- errors details,
- performance statistics,
- trends
- allows for Kafka topics data exploration
- routing and system information

Karafka Web UI is shipped as a separate [gem](https://rubygems.org/gems/karafka-web) with minimal dependencies.

To use it:

1. Make sure Apache Kafka is running. You can start it by following instructions from [here](Setting-up-Kafka).

2. Add Karafka Web-UI to your `Gemfile`:

```bash
bundle add karafka-web
```

3. Run the following command to install the karafka-web in your project:

```ruby
# For production you should add --replication-factor N
# Where N is the replication factor you want to use in your cluster
bundle exec karafka-web install
```

By default, Karafka uses three topics with the following names:

- `karafka_errors`
- `karafka_consumers_reports`
- `karafka_consumers_states`

If you have the `auto.create.topics.enable` set to `false`, create them manually.

For OSS, each of them **needs** to have one partition. In the case of Karafka Pro, `karafka_errors` can have as many partitions as you need.

4. Mount the Web interface in your Ruby on Rails application routing:

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

5. Enjoy Karafka Web UI.

If you do everything right, you should see this in your browser:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui.png" alt="Karafka Web UI"/>
</p>

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

- All the topics required by Karafka Web exist
- Use `bundle exec karafka-web install` to create missing topics
- You have a working connection with your Kafka cluster
- The resource you requested exists

If you were looking for a given process or other real-time information, the state might have changed, and the information you were looking for may no longer exist. 

### Resetting the Web UI state

If you want to reset the overall counters without removing the errors collection, you can run the `bundle exec karafka-web install` again.

If you want to remove all errors and other data, please remove the relevant Karafka Web UI topics and run `bundle exec karafka-web install`.

If you want to fully reset the Web UI state, you can run the `bundle exec karafka-web reset` command. This command **will** remove all the Web UI topics and re-create them with an empty state.

### `statistics.interval.ms` alignment

Karafka uses its internal state knowledge and `librdkafka` metrics to report the states. This means that the `statistics.interval.ms` needs to be enabled and should match the reporting interval.

**Note**: Both are enabled by default, and both report every 5 seconds, so unless you altered the defaults, you should be good.

### Message-producing permissions for consumers

Karafka Web-UI uses `Karafka.producer` to produce state reports out of processes. This means that you need to make sure that the default `Karafka.producer` can deliver messages to the following topics:

- `karafka_consumers_states`
- `karafka_errors`

Without that, Karafka will **not** be able to report anything.
