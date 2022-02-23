## Starting with the example app

If you want to get started with Kafka and Karafka as fast as possible, then the best idea is to just clone our examples repository:

```bash
git clone https://github.com/karafka/example-apps ./example_apps
```

and follow the instructions from the [example apps Wiki](https://github.com/karafka/example-apps/blob/master/README.md).

**Note**: We highly recommend you using Karafka `2.0` but in case you would need, the example repository also includes code for Karafka `1.4`.

## Use-cases, edge-cases and usage examples

Karafka `2.0` ships with a full integration test suite that illustrates various use-cases and edge-cases of working with Karafka and Kafka. Please visit [this directory](https://github.com/karafka/karafka/tree/2.0/spec/integrations) of the Karafka repository to see them.

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
