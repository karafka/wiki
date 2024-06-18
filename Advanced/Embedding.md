Karafka can be embedded within another process so you do not need to run a separate process.

This is called embedding.

## Usage

To use embedding you need to:

1. Configure Karafka as if it would be running independently as a separate process (standard configuration).
2. Connect Karafka embedding API events to your primary process lifecycle flow.

There are two embedding API calls that you need to connect to your main process lifecycle:

- `::Karafka::Embedded.start` - Starts Karafka without process supervision and ownership of signals in a background thread. This method is non-blocking, and it won't interrupt other things running
- `::Karafka::Embedded.stop` - Stops Karafka in a blocking fashion. It waits for all the current work to be done and then shuts down all the threads, connections, etc.

!!! Tip "Safe and Unsafe Trap Context Usage"

    It is safe to use both `#quiet` and `#stop` from the trap context of a process that controls the execution in embedded mode, but it is **not** safe to run `#start` from the trap context.

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
