# Single Process Setup

!!! info "Single Process Setup Limitation"

    If you're embedding the Karafka Web UI directly into your Rails routes or Rackup, the Single Process Setup is not advisable. This approach is suited only for deploying the Web UI as a standalone dedicated process.

[Karafka's Web UI](Web-UI-About) is a visual treat and a powerful tool that displays aggregated metrics, graphs, and other insightful information. To achieve this, a lot goes on behind the scenes. There's an intermediate entity at its core – the Karafka Web UI consumer. This consumer is responsible for collecting per-process data, churning it, and publishing the unified, comprehensive states you see on the Web UI.

For it to be possible, the Karafka framework adopts a dual-process method by default. How does this work? It cleverly injects a separate consumer group into your Karafka setup. So, when you start a `karafka server` one of the processes, apart from the topics you want it to consume, will also consume Web UI data topics.

This approach is the default because the Web UI Rack application was designed to be [embeddable](Embedding) within your Rails and Ruby projects, whether you run a single Puma process or multiple. There is, however, a second approach. There's a tailored solution, particularly for those who don't intend to integrate the Web UI directly into their application but want to serve it through an independent process – say, via a standalone rack application. The Karafka Web UI consumer doesn't necessarily have to run from `karafka server` process. It can operate within Puma itself in the "Embedded mode".

## Benefits

Single Process Setup provides few benefits over the default one:

1. **Ease of Management**: You simplify the entire management process by consolidating the tasks into a single process type, like Puma or another HTTP server. The necessity for juggling multiple processes vanishes. In the most streamlined scenario, a singular Ruby process effortlessly handles data aggregation and presentation.

1. **Ease of Upgrade**: With just one process to consider, upgrading becomes a breeze. The Web UI's Puma (or your chosen HTTP server) and the Embedded consumer can be updated simultaneously, ensuring all components evolve cohesively without leaving any part behind.

1. **Ease of Deployment**: Deployment complexities are minimized when there's only one process to contend with. This unified approach ensures quicker deployment cycles and reduces the chances of deployment-related issues.

1. **Consistent Setup**: The single-process setup eradicates potential inconsistencies, especially the dilemma of multi-process version collisions. With everything bundled into one, you're assured that all parts are on the same page, version-wise.

1. **Resource Efficiency**: Operating in a single process mode can lead to better resource utilization, especially since, within this setup, your `karafka server` processes do not have to handle the Web UI consumer group.

1. **Reduced Complexity**: Having everything in one process simplifies the architecture, making it easier to understand for developers new to the project or those unfamiliar with Karafka's intricacies.

## Configuration

!!! tip "Puma Configuration Depends on Node Mode"

    Your `puma.rb` configuration depends on whether you run Puma in a single-node or cluster mode.

To operate the Karafka Web UI in the single process mode, a couple of essential steps are required:

1. You need to enable the Embedding functionality that allows the karafka server to run directly within the Puma process. To do so, alter your `puma.rb` to start and stop Karafka during its lifecycle:

1.1. Use this config when your Puma operates in a cluster mode:

```ruby
# config/puma.rb
# Use only when your Web UI Puma does not host your main application!
# Use when you run your Puma in a cluster mode

workers 2
threads 1, 3

preload_app!

# Puma < 7
on_worker_boot do
  ::Karafka::Embedded.start
end

on_worker_shutdown do
  ::Karafka::Embedded.stop
end

# Puma >= 7
before_worker_boot do
  ::Karafka::Embedded.start
end

before_worker_shutdown do
  ::Karafka::Embedded.stop
end
```

1.2. Use this configuration when running Puma in a single node mode:

```ruby
preload_app!

# Puma < 7
@config.options[:events].on_booted do
  ::Karafka::Embedded.start
end

# There is no `on_worker_shutdown` equivalent for single mode
@config.options[:events].on_stopped do
  ::Karafka::Embedded.stop
end

# Puma >= 7
@config.options[:events].after_booted do
  ::Karafka::Embedded.start
end

# There is no `before_worker_shutdown` equivalent for single mode
@config.options[:events].after_stopped do
  ::Karafka::Embedded.stop
end
```

2. It's vital to also adjust the `karafka.rb` configuration file. This ensures that when the `karafka server` runs, none of the processes pick up the Web UI consumer group for processing, preserving the integrity and purpose of the single process mode:

```ruby
# Other Karafka configuration here...

Karafka::Web.setup do |config|
  # Other config of Web UI here...

  # Only set it to true 
  config.processing.active = ENV.key?('WEB_UI_PUMA')
end
```

3. When running puma, set the `WEB_UI_PUMA` to `true`: `WEB_UI_PUMA=true bundle exec puma`, so Karafka will start consuming and materializing the Web UI inside of the Puma process.

By taking these steps, you effectively configure the system for an optimal Single Process Setup experience.

After you start your Puma process, it will consume the necessary Karafka Web UI topics to process and materialize the state data.
