Want to use Karafka with Ruby on Rails or Sinatra? It can be done!

## Integrating with Ruby on Rails

Add Karafka to your Ruby on Rails application Gemfile:

```ruby
gem 'karafka'
```

Copy the ```karafka.rb``` file from your Karafka application into your Rails app (if you don't have this file, just create an empty Karafka app and copy it). This file is responsible for booting up Karafka framework. To make it work with Ruby on Rails, you need to load whole Rails application in this file. To do so, replace:

```ruby
ENV['RACK_ENV'] ||= 'development'
ENV['KARAFKA_ENV'] = ENV['RACK_ENV']
Bundler.require(:default, ENV['KARAFKA_ENV'])
Karafka::Loader.new.load(Karafka::App.root)
```

with

```ruby
ENV['RAILS_ENV'] ||= 'development'
ENV['KARAFKA_ENV'] = ENV['RAILS_ENV']
require ::File.expand_path('../config/environment', __FILE__)
Rails.application.eager_load!
```

and you are ready to go!

## Integrating with Sinatra

Sinatra applications differ from one another. There are single file applications and apps with similar to Rails structure. That's why we cannot provide a simple single tutorial. Here are some guidelines that you should follow in order to integrate it with Sinatra based application:

Add Karafka to your Sinatra application Gemfile:

```ruby
gem 'karafka'
```

After that make sure that whole your application is loaded before setting up and booting Karafka (see Ruby on Rails integration for more details about that).