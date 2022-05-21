Want to use Karafka with Ruby on Rails or Sinatra? It can be done easily!

## Integrating with Ruby on Rails

Karafka `2.0` can detect Ruby on Rails by itself, so no extra changes are required aside from running the standard installation process.

Add Karafka to your Gemfile:

```bash
bundle add karafka
```

and run the installation command:

```bash
bundle exec karafka install
```

It will create all the needed directories and files as well as the `karafka.rb` configuration file. After that you should be good to go.

## Integrating with Sinatra and other frameworks

Non-Rails applications differ from one another. There are single file applications and apps with similar to Rails structure. That's why we cannot provide a simple single tutorial. Here are some guidelines that you should follow in order to integrate it with Sinatra based application:

Add Karafka to your application Gemfile:

```ruby
gem 'karafka'
```

run the installation process:

```bash
bundle exec karafka install
```

After that make sure that while your application is loaded before setting up and booting Karafka.

**Note**: If by any chance you're integrating Karafka with any other framework, we will appreciate your contribution in form of an update to this Wiki page.
