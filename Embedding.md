**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Karafka can be embedded within another process so you do not need to run a separate process.

This is called embedding.

## Usage

To use embedding you need to:

1. Configure Karafka as if it would be running independently as a separate process (standard configuration).
2. Connect Karafka embedding API events to your primary process lifecycle flow.

There are two embedding API calls that you need to connect to your main process lifecycle:

- `::Karafka::Embedded.start` - Starts Karafka without process supervision and ownership of signals in a background thread. This method is non-blocking, and it won't interrupt other things running
- `::Karafka::Embedded.stop` - Stops Karafka in a blocking fashion. It waits for all the current work to be done and then shuts down all the threads, connections, etc.

### Usage with Puma

```ruby
# config/puma.rb 

workers 2
threads 1, 3

preload_app!

on_worker_boot do
  ::Karafka::Embedded.start
end

on_worker_shutdown do
  ::Karafka::Embedded.stop
end
```

### Usage with Sidekiq

```ruby
# config/initializers/sidekiq.rb

Sidekiq.configure_server do |config|
  config.on(:startup) do
    ::Karafka::Embedded.start
  end

  config.on(:quiet) do
    # You may or may not want to have it here on quiet, depending on your use-case.
    ::Karafka::Embedded.stop
  end

  config.on(:shutdown) do
    ::Karafka::Embedded.stop
  end
end
```

### Usage with Passenger

```ruby
PhusionPassenger.on_event(:starting_worker_process) do
  ::Karafka::Embedded.start
end

PhusionPassenger.on_event(:stopping_worker_process) do
  ::Karafka::Embedded.stop
end
```

## Notes

- Karafka **cannot** be periodically started and stopped within the same process. Embedding was designed for long-living processes like Puma or Sidekiq.
- The process owner owns any signal traps. Karafka won't react to Ctrl-C, TERM, or any other signal.
- Code reload may not work as expected when Karafka is embedded or may not work at all.
- Keep your concurrency settings low, so all the responsibilities of your process can get enough resources.
- Your code application should be preloaded/eager loaded prior to starting the embedded Karafka server.
