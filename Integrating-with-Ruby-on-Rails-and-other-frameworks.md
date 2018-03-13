Want to use Karafka with Ruby on Rails or Sinatra? It can be done!

## Integrating with Ruby on Rails

Add Karafka to your Ruby on Rails application Gemfile:

```ruby
gem 'karafka'
```

Copy the ```karafka.rb``` file from your Karafka application into your Rails app. If you don't have this file, you can copy the [example](https://github.com/karafka/karafka/blob/master/lib/karafka/templates/karafka.rb.example) one. This file is responsible for booting up Karafka framework. To make it work with Ruby on Rails, you need to load whole Rails application in this file.

### karafka.rb changes

Please open your ```karafka.rb``` file and replace:

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

and replace default Karafka logger with Rails logger:


```ruby
class App < Karafka::App
  setup do |config|
    # Other config details...
    config.logger = Rails.logger
  end
end
```
**Note**: ```Rails.logger``` when loaded outside of the ```rails console``` and ```rails server``` commands does not print to the stdout but instead into a log file appropriate to the environment in which it runs. This affects also Karafka. If you don't see any output, please check your log file.

### config/environment.rb changes

Append this line at the end of the ```config/environment.rb``` file:

```ruby
require Rails.root.join(Karafka.boot_file)
```

and you are ready to go!

### Using Karafka with HashWithIndifferentAccess

**Note**: There is a performance penalty for using ```HashWithIndifferentAccess```. You have been warned.

If you are integrating Karafka with Ruby on Rails applications, there's a high probability, that your codebase already relies on ```HashWithIndifferentAccess```. Karafka framework by default uses standard Ruby ```Hash``` class with some extra flavour because of performance reasons. However, if you want, you can replace it with ```HashWithIndifferentAccess``` by setting up the ```params_base_class``` config value as followed:

```ruby
class App < Karafka::App
  setup do |config|
    # Other config details...
    config.params_base_class = HashWithIndifferentAccess
  end
end
```

## Integrating with Sinatra

Sinatra applications differ from one another. There are single file applications and apps with similar to Rails structure. That's why we cannot provide a simple single tutorial. Here are some guidelines that you should follow in order to integrate it with Sinatra based application:

Add Karafka to your Sinatra application Gemfile:

```ruby
gem 'karafka'
```

After that make sure that whole your application is loaded before setting up and booting Karafka (see Ruby on Rails integration for more details about that).