To activate your Karafka Pro subscription, you need to do two things:


1. First, you must obtain credentials to a registry hosting a custom `karafka-license` gem. This gem contains all the code for Karafka to detect the Pro components.

2. Add it to your Gemfile and `bundle install`:

```ruby
source 'https://LOGIN:PASSWORD@gems.karafka.io' do
  gem 'karafka-license', 'LICENSE-ID'
end
```

2. Then, instead of inheriting from `Karafka::BaseConsumer`, your `ApplicationConsumer` should inherit from the `Karafka::Pro::BaseConsumer`:

```ruby
# Replace this:
# class ApplicationConsumer < Karafka::BaseConsumer

# With this
class ApplicationConsumer < Karafka::Pro::BaseConsumer
end
```

That is all. You are now consuming messages like a Pro and can use all of the Pro features!
