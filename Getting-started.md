## Starting with the example app

If you want to get started with Kafka and Karafka as fast as possible, then the best idea is to just clone our example repository:

```bash
git clone https://github.com/karafka/example-apps ./example_apps
```

**Note**: We highly recommend you using Karafka `2.0` or higher but in case you would need, the example repository also includes code for Karafka `1.4`.

Select the example you are interested in and then, just bundle install all the dependencies:

```bash
cd ./example_apps/v2.0-rails
bundle install
```

and follow the instructions from the [example app Wiki](https://github.com/karafka/example-apps/blob/master/README.md).

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
