Karafka supports auto-reload of code changes for Ruby on Rails, similar to Puma or Sidekiq.

Due to consumers persistence in Karafka (long-living consumer instances), in order to make it work, you need to turn it on yourself by setting a `consumer_persistence` configuration option in the `karafka.rb` file to `false` in the development mode:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = { 'bootstrap.servers': '127.0.0.1:9092' }
    config.client_id = "example_app-#{Process.pid}-#{Socket.gethostname}"
    config.concurrency = 2
    # Recreate consumers with each batch. This will allow Rails code reload to work in the
    # development mode. Otherwise Karafka process would not be aware of code changes
    config.consumer_persistence = !Rails.env.development?
  end
end
```

Your code changes will be applied after processing of current messages batch.

Keep in mind, though, that there are a couple of limitations to it:

* Changes in the routing are **not** reflected. This would require reconnections and would drastically complicate reloading.
* Any background work you run outside the Karafka framework but within the process might not be caught in the reloading.
* If you use in-memory consumer data buffering that spans multiple batches, it **won't** work as code reload means re-initializing consumer instances. In cases like that, you will be better off not using the reload mode.
