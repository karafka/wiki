## Starting with the example app

If you want to get started with Kafka and Karafka as fast as possible, then the best idea is to just clone our example repository:

```bash
git clone https://github.com/karafka/example-app ./example_app
```

then, just bundle install all the dependencies:

```bash
cd ./example_app
bundle install
```

and follow the instructions from the [example app Wiki](https://github.com/karafka/karafka-example-app/blob/master/README.md).

**Note**: you need to ensure, that you have Kafka up and running and you need to configure Kafka seed_brokers in the ```karafka.rb``` file.

## Starting with a clean installation

Create a directory for your project:

```
mkdir app_dir
cd app_dir
```

Create a Gemfile with Karafka:
```
echo "source 'https://rubygems.org'" > Gemfile
echo "gem 'karafka'" >> Gemfile
```
Bundle afterwards
```
bundle install
```
Use karafka CLI:
```
bundle exec karafka install
```

If you need more details about each of the CLI commands, go to [CLI section](https://github.com/karafka/karafka/wiki/CLI)