**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Want to use Karafka with Ruby on Rails or any other framework? It can be done easily!

## Integrating with Ruby on Rails

Karafka detects Ruby on Rails by itself, so no extra changes are required besides running the standard installation process.

Add Karafka to your Gemfile:

```bash
bundle add karafka --version ">= 2.0.34"
```

and run the installation command:

```bash
bundle exec karafka install
```

It will create all the needed directories and files and the `karafka.rb` configuration file. After that, you should be good to go.

We also have an [example Ruby on Rails application](https://github.com/karafka/example-apps/tree/master/v2.0-rails) that illustrates integration with this framework.

## Integrating with Sinatra and other frameworks

Non-Rails applications differ from one another. There are single-file applications and apps similar to the Rails structure. That's why we cannot provide a simple single tutorial. Here are some guidelines that you should follow to integrate it with Sinatra based application:

Add Karafka to your application Gemfile:

```ruby
gem 'karafka'
```

run the installation process:

```bash
bundle exec karafka install
```

After that, ensure that your application is loaded before setting up and booting Karafka.
