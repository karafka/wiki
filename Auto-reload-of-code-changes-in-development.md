Karafka `2.0` supports auto-reload of code changes for Ruby on Rails out of the box, similar to how Puma or Sidekiq does it.

Due to consumers persistence in Karafka (long-living consumer instances), in order to make it work, you need to turn it on yourself by setting a `consumer_persistence` configuration option in the `karafka.rb` file to `false` in the development mode:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = { 'bootstrap.servers': '127.0.0.1:9092' }
    config.client_id = 'example_app'
    config.concurrency = 2
    # Recreate consumers with each batch. This will allow Rails code reload to work in the
    # development mode. Otherwise Karafka process would not be aware of code changes
    config.consumer_persistence = !Rails.env.development?
  end
end
```

Your code changes will be applied after processing of current messages batch .

Keep in mind, though, that there are a couple of limitations to it:

* Changes in the routing are **not** reflected. This would require reconnections and would drastically complicate reloading.
* Any background work that you run outside of the Karafka framework but still within the process, might not be caught in the reloading.
* If you use in-memory consumer data buffering that spans across multiple batches, it **won't** work as code reload means re-initializing consumers instances. In cases like that, you will be better not using the reload mode at all.
* Code reload may be slow for some edge cases. It is a bug in Ruby on Rails reported [here](https://github.com/rails/rails/issues/44183).
