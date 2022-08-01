To activate your Karafka Pro subscription, you need to do two things:


1. First of all, you need to obtain an credentials to a registry that hosts a custom `karafka-license` gem. This gem contains all the code needed for Karafka to detect the Pro compoments.

2. Add it to your Gemfile and `bundle install`:

```ruby
source 'https://LOGIN:PASSWORD@pro.karafka.io' do
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
