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

3. Add the following line at the **end** of your `karafka.rb` file:

```ruby
require 'karafka/web'

Karafka::Web.enable!
```

4. Create needed topics with recommended partition count and retention policies from a Ruby or Rails console:

```ruby
Karafka::Web.bootstrap_topics!
```

By default, Karafka uses three topics with the following names:

- `karafka_errors`
- `karafka_consumers_reports`
- `karafka_consumers_states`

If you have the `auto.create.topics.enable` set to `false`, create them manually. For OSS, each of them **needs** to have one partition. In the case of Karafka Pro, `karafka_errors` can have as many partitions as you need.

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
# Require your application cod here and then...

require_relative 'karafka.rb'

run Karafka::Web::App
```

6. Run at least one `karafka server` process to populate initial data.

**Note**: Running `karafka server` is unnecessary once the initial data is populated. Once data is populated, you can use Karafka Web UI without any consumers running.

7. Enjoy Karafka Web UI.

If you do everything right, you should see this in your browser:

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui.png)

## Troubleshooting

As mentioned above, the initial setup **requires** you to run `karafka server` at least once so Karafka can build the initial data structures needed. Until this happens, upon accessing the Web UI, you may see a 404 error.

Before reporting an issue, please make sure that:

- All the topics required by Karafka Web exist
- Use `Karafka::Web.bootstrap_topics!` to create missing topics
- You have started the karafka server at least once
- You have a working connection with your Kafka cluster
- The resource you requested exists

If you were looking for a given process or other real-time information, the state might have changed, and the information you were looking for may no longer exist. 
