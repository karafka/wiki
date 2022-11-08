To activate your Karafka Pro subscription, you need to do three things:

1. Follow the standard Karafka [installation](Getting-Started) procedure.

2. Obtain credentials to a registry hosting a custom `karafka-license` gem. This gem contains all the code for Karafka to detect the Pro components.

3. Add it to your Gemfile and `bundle install`:

```ruby
source 'https://LOGIN:PASSWORD@gems.karafka.io' do
  gem 'karafka-license', 'LICENSE-ID'
end

gem 'karafka'
# other gems...
```

**Note**: You still need to have the standard `gem 'karafka'` definition in your `Gemfile`. License gem is just providing the license. 
