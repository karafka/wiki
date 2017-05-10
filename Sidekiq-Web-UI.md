Karafka comes with a Sidekiq Web UI application that can display the current state of a Sidekiq installation. If you installed Karafka based on the install instructions, you will have a **config.ru** file that allows you to run standalone Puma instance with a Sidekiq Web UI.

To be able to use it (since Karafka does not depend on Puma and Sinatra) add both of them into your Gemfile:

```ruby
gem 'puma'
gem 'sinatra'
```

bundle and run:

```
bundle exec rackup
# Puma starting...
# * Min threads: 0, max threads: 16
# * Environment: development
# * Listening on tcp://localhost:9292
```

You can then navigate to displayer url to check your Sidekiq status. Sidekiq Web UI by default is password protected. To check (or change) your login and password, please review **config.ru** file in your application.