Want to use Karafka with Ruby on Rails or any other framework? It can be done easily!

## Integrating with Ruby on Rails

Karafka detects Ruby on Rails by itself, so no extra changes are required besides running the standard installation process.

Add Karafka to your Gemfile:

```shell
bundle add karafka --version ">= 2.3.0"
```

and run the installation command:

```shell
bundle exec karafka install
```

It will create all the needed directories and files and the `karafka.rb` configuration file. After that, you should be good to go.

We also have an [example Ruby on Rails application](https://github.com/karafka/example-apps/tree/master/v2.2-rails) that illustrates integration with this framework.

## Integrating with Sinatra and other frameworks

Non-Rails applications differ from one another. There are single-file applications and apps similar to the Rails structure. That's why we cannot provide a simple single tutorial. Here are some guidelines that you should follow to integrate it with Sinatra based application:

Add Karafka to your application Gemfile:

```ruby
gem 'karafka'
```

run the installation process:

```shell
bundle exec karafka install
```

After that, ensure that your application is loaded before setting up and booting Karafka.

---

## See Also

- [Active Job](Active-Job) - Integrate Karafka with Rails ActiveJob for background processing
- [Active Record Connections Management](Active-Record-Connections-Management) - Manage database connections in Karafka consumers
- [Producing Messages](Producing-Messages) - Send messages to Kafka from Rails controllers and models
- [Deployment](Operations-Deployment) - Deploy Karafka alongside Rails applications in production
- [Getting Started](Getting-Started) - Initial setup and installation instructions for Karafka
