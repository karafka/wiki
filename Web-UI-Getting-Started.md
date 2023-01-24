Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications, without the need to use the command line or third party software.

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

4. Create needed topics from a Ruby or Rails console:

```ruby
Karafka::Web.bootstrap_topics!
```

5. Mount the Web interface in your Ruby on Rails application routing:

```ruby
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
