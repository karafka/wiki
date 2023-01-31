Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications, without the need to use the command line or third party software. It does **not** require any additional database beyond Kafka itself.

The interface, amongst others, displays:

- real-time aggregated metrics,
- real-time information on resource usage,
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

## Troubleshooting

As mentioned above, the initial setup **requires** you to run `bundle exec karafka-web install` once so Karafka can build the initial data structures needed. Until this happens, upon accessing the Web UI, you may see a 404 error.

Before reporting an issue, please make sure that:

- All the topics required by Karafka Web exist
- Use `bundle exec karafka-web install` to create missing topics
- You have a working connection with your Kafka cluster
- The resource you requested exists

If you were looking for a given process or other real-time information, the state might have changed, and the information you were looking for may no longer exist. 

**Note**: To reset the state of the UI for any reason, you can just run the `bundle exec karafka-web install` again. Upon usage, it materializes a new empty state of the Web UI aggregations.

If you want to remove all errors and other data, please remove the relevant Karafka Web UI topics and run `bundle exec karafka-web install`.
