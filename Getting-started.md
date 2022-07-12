Add this line to your application's Gemfile:

```ruby
gem 'karafka'
```

And then execute:

```bash
bundle install
```

and install Karafka (works for both Rails and standalone applications):

```bash
bundle exec karafka install
```

this will create all the necessary files and directories to get you started.

## Example applications

If you want to get started with Kafka and Karafka as fast as possible, then the best idea is to just clone our examples repository:

```bash
git clone https://github.com/karafka/example-apps ./example_apps
```

and follow the instructions from the [example apps Wiki](https://github.com/karafka/example-apps/blob/master/README.md).

## Use-cases, edge-cases and usage examples

Karafka ships with a full integration test suite that illustrates various use-cases and edge-cases of working with Karafka and Kafka. Please visit [this directory](https://github.com/karafka/karafka/tree/2.0/spec/integrations) of the Karafka repository to see them.
