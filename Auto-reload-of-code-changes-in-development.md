Karafka `1.3` and never support auto-reload of code changes for both Rails and vanilla integrations.

All you need to do is enabling this part of the code before the `App.boot` in your `karafka.rb` file:

```ruby
# For a non-Rails app with Zeitwerk loader
if Karafka::App.env.development?
  Karafka.monitor.subscribe(
    Karafka::CodeReloader.new(
      APP_LOADER
    )
  )
end
 
# Or for Ruby on Rails
if Karafka::App.env.development?
  Karafka.monitor.subscribe(
    Karafka::CodeReloader.new(
      *Rails.application.reloaders
    )
  )
end
```

and your code changes will be applied after each message/messages batch fetch.

Keep in mind, though, that there are a couple of limitations to it:

* Changes in the routing are NOT reflected. This would require reconnections and would drastically complicate reloading.
* Any background work that you run, outside of the Karafka framework but still within, might not be caught in the reloading.
* If you use in-memory consumer data buffering that spans across multiple batches (or messages in a single message fetch mode), it WON’T work as code reload means re-initializing all of the consumers instances. In cases like that. You will be better, not using the reload mode at all.

It is also worth pointing out, that if you have a code that should be re-initialized in any way during the reload phase, you can pass it to the `Karafka::CodeReloader initializer`:

```ruby
if Karafka::App.env.development?
  Karafka.monitor.subscribe(
    Karafka::CodeReloader.new(
      *Rails.application.reloaders
    ) { Dry::Events::Publisher.registry.clear }
  )
end
```