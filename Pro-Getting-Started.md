To activate your Karafka Pro subscription, you need to do three things:

1. Follow the standard Karafka [installation](Getting-Started) procedure.

2. Obtain credentials to a registry hosting a custom `karafka-license` gem. This gem contains all the code for Karafka to detect the Pro components. You can get them [here](https://gems.karafka.io/pro).

3. Add this to your Gemfile and `bundle install`:

```ruby
source 'https://USERNAME:PASSWORD@gems.karafka.io' do
  gem 'karafka-license', 'LICENSE_ID'
end

gem 'karafka'
# other gems...
```

**Note**: You still need to have the standard `gem 'karafka'` definition in your `Gemfile`. License gem is just providing the license. 
