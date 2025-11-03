Karafka can be embedded within another process so you do not need to run a separate process.

This is called embedding.

## Usage

To use embedding you need to:

1. Configure Karafka as if it would be running independently as a separate process (standard configuration).
2. Connect Karafka embedding API events to your primary process lifecycle flow.

There are two embedding API calls that you need to connect to your main process lifecycle:

- `::Karafka::Embedded.start` - Starts Karafka without process supervision and ownership of signals in a background thread. This method is non-blocking, and it won't interrupt other things running
- `::Karafka::Embedded.stop` - Stops Karafka in a blocking fashion. It waits for all the current work to be done and then shuts down all the threads, connections, etc.

!!! tip "Safe and Unsafe Trap Context Usage"

    It is safe to use both `#quiet` and `#stop` from the trap context of a process that controls the execution in embedded mode, but it is **not** safe to run `#start` from the trap context.

### Usage with Puma

In a cluster mode:

**For Puma < 7:**

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

**For Puma >= 7:**

```ruby
# config/puma.rb 

workers 2
threads 1, 3

preload_app!

before_worker_boot do
  ::Karafka::Embedded.start
end

before_worker_shutdown do
  ::Karafka::Embedded.stop
end
```

In a single node mode:

**For Puma < 7:**

```ruby
# config/puma.rb 

preload_app!

@config.options[:events].on_booted do
  ::Karafka::Embedded.start
end

# There is no `on_worker_shutdown` equivalent for single mode
@config.options[:events].on_stopped do
  ::Karafka::Embedded.stop
end
```

**For Puma >= 7:**

```ruby
# config/puma.rb 

preload_app!

@config.options[:events].after_booted do
  ::Karafka::Embedded.start
end

# There is no `before_worker_shutdown` equivalent for single mode
@config.options[:events].after_stopped do
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

## Limitations

### Long-living Processes Requirement

Karafka is not designed to be periodically started and stopped within the same process. You might encounter unexpected behavior or errors if you attempt to do so. This design decision aligns with the nature of long-living processes in applications and services like Puma or Sidekiq. If you want to embed Karafka in your process, ensure it's persistent and long-living.

### Signal Handling

If your process captures signals, know Karafka won't intercept or handle them. This means actions like stopping the process using Ctrl-C, sending a TERM signal, or any other signals won't be managed by Karafka. The responsibility for signal handling lies entirely with the process owner. Properly managing these signals is crucial to avoid abrupt terminations or unforeseen consequences. Karafka won't react to Ctrl-C, TERM, or any other signal.

### Code Reload

When Karafka is embedded in another process, you might find that code reloading doesn't function as you'd expect or might not work altogether. This can be particularly problematic during development when code changes are frequent.

### Concurrency Settings

Maintaining a conservative approach when setting concurrency levels with Karafka in the Embedded mode is advisable. A high concurrency setting might overtax your system resources, leading to potential slowdowns or bottlenecks. By keeping your concurrency settings on the lower side, you ensure that all tasks and responsibilities of your process can effectively access and utilize the resources they need without causing undue strain.

### Preloading/Eager Loading

Before you initiate the embedded Karafka server, your application code must be preloaded or eager loaded. This ensures that all necessary components, classes, and modules are available and loaded into memory when Karafka starts. Please do this to avoid missing dependencies or unexpected errors during runtime.

### Critical Error Handling

When operating Karafka in Embedded mode, it's crucial to understand that certain critical errors might be silently overlooked if the supervising process for Karafka Embedding does not correctly signal those errors. While Karafka might recognize and attempt to raise an error and notify about it via its instrumentation pipeline, the supervising process might not propagate or report this, leading to potential silent failures or unnoticed issues. For robust and reliable production deployments, it's critical to ensure that any errors Karafka might produce are not only correctly signaled by the supervising process but also reported and monitored. 

### Partial/Silent Crashes

When utilizing Karafka in an embedded mode, it's vital to be aware of Partial or Silent Crash scenarios. These refer to situations where the Karafka process encounters a critical error and decides to halt its operations, but the overarching process in which Karafka runs continues to operate. This behavior can lead to situations where critical components have failed silently, but the system appears to be running, potentially leading to undetected issues or data loss.

Certain critical errors, such as incompatible changes to the `partition.assignment.strategy`, can cause the embedded Karafka process to emit an error and terminate. However, this termination is isolated to Karafka itself, and may not propagate to the parent or supervising process.

For example, when running Karafka within a Puma worker in the event of a critical Karafka crash, the Puma worker will remain unaffected. This means the HTTP server, despite the Karafka crash, will continue to accept and process messages. While this ensures that your HTTP server remains responsive, it also poses a risk since Karafka, a crucial component for processing, is no longer operational.

To ensure system resilience and reliability:

- **Monitoring**: Implement comprehensive monitoring tools that can detect and alert on both Karafka-specific errors and general system anomalies.

- **Error Propagation**: Ensure critical errors from embedded processes like Karafka are reported.

- **Regular Testing**: Periodically simulate critical errors in non-production environments to understand the system's response and to improve recovery mechanisms.

In conclusion, while embedding Karafka within larger processes can be efficient, knowing the potential for Partial or Silent Crashes is crucial. By understanding their implications and implementing mitigation strategies, you can ensure a more robust and resilient system.

### Process Termination

When Karafka operates in an Embedded mode, it is essential to recognize that the Karafka supervisor does not have the final say regarding the termination of the entire process. In practice, if your surrounding process has a shutdown timeout shorter than Karafka's, there is a risk that Karafka could be forcefully terminated before it has had a chance to dispatch and delegate all work and states properly. While this might not pose an issue due to how offsets are managed, it can affect monitoring and management tools. For instance, Karafka Web UI interface monitoring Karafka might not capture the final state transition from "stopping" to "stopped". Instead, it may give an impression that the Karafka process is perpetually in the "stopping" phase, which can be misleading and make diagnostics more challenging.

Always ensure you account for this behavior when integrating Karafka in an Embedded mode, especially if you rely on external tools or interfaces to monitor and manage your processes. Adjusting your surrounding process's shutdown timeout or ensuring it respects Karafka's requirements can help avoid such discrepancies.

### Web UI Limitations in Embedding Mode

When using Karafka in embedding mode, the Karafka Pro Web UI controlling feature will be limited. This is because, in embedding mode, Karafka does not have control over the entire Ruby process. As a result, some process management and control functionalities may not be fully available or operational. To leverage the full capabilities of the Karafka Pro Web UI, it is recommended that Karafka be run as a standalone application that can maintain complete control over the Ruby process.

### Thread Priority Management

When embedding Karafka within other processes like Puma or Sidekiq, thread priorities are crucial in balancing CPU time between Karafka's background processing and the host application's primary responsibilities. Unlike the pure priority concept, where threads with different priorities must compete for CPU time, Ruby's thread priority controls the thread scheduling quantum - how much GVL (Global VM Lock) time a thread gets before yielding to others.

Ruby's thread priority is calculated as bit shifts of the default 100ms quantum:

- priority 0 = 100ms
- priority -1 = 50ms
- priority -2 = 25ms
- priority -3 = 12.5ms

This mechanism determines how frequently a thread releases the GVL, which is critical when mixing CPU-bound background processing with IO-bound request handling.

When a background processing thread has normal priority (0), it holds the GVL for 100ms between network I/O operations. Meanwhile, request handler threads waiting to serve quick operations (like cached value lookups) must wait for these 100ms slices to complete. This can transform a 10ms request into a much longer operation, explaining the importance of proper priority tuning in embedded mode:

```ruby
Karafka.setup do |config|
  # Worker thread priority (default: -1 = 50ms quantum)
  config.worker_thread_priority = -2  # 25ms quantum for embedded mode

  # Listener thread priority remains internal
  # config.internal.connection.listener_thread_priority = 0
end
```

The default worker thread priority is -1 (50ms quantum) to prevent CPU-intensive message processing from dominating the GVL. For embedded environments, lowering to -2 or -3 allows web requests to interleave more frequently with Kafka message processing, reducing tail latency while having minimal impact on background processing throughput.

Here's the recommended configuration for different scenarios:

**For Puma < 7:**

```ruby
# Puma configuration
on_worker_boot do
  Karafka.setup do |config|
    # Lower quantum for better request responsiveness
    config.worker_thread_priority = -2
  end

  ::Karafka::Embedded.start
end
```

**For Puma >= 7:**

```ruby
# Puma configuration
before_worker_boot do
  Karafka.setup do |config|
    # Lower quantum for better request responsiveness
    config.worker_thread_priority = -2
  end

  ::Karafka::Embedded.start
end
```

```ruby
# Sidekiq configuration  
Sidekiq.configure_server do |config|
  config.on(:startup) do
    Karafka.setup do |config|
      # Sidekiq's own processing may benefit from less aggressive priority
      config.worker_thread_priority = -1
    end

    ::Karafka::Embedded.start
  end
end
```

The listener thread priority (internal setting `internal.connection.listener_thread_priority`, default 0) should not be modified unless necessary. Listener threads efficiently release the GVL while waiting for poll results, making the standard 100ms quantum appropriate for their workload.

!!! warning "Performance Trade-offs"

    Lower priorities reduce GVL time per quantum, which can slightly increase message processing latency. However, this trade-off usually improves overall system responsiveness. Monitor your specific workload and adjust priorities accordingly - the practical range is -3 to 3, with -3 providing the minimum 20ms quantum in practice due to Ruby's internal tick system.

---

## See Also

- [CLI](CLI) - Command-line interface for running Karafka standalone
- [Deployment](Operations-Deployment) - Strategies for deploying Karafka in various environments
