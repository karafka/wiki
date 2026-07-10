## Signals

Karafka responds to a few signals. On a Unix machine, you can use the `kill` binary or the `Process.kill` API in Ruby, e.g.

```text
kill -TTIN pid
Process.kill("TTIN", pid)
```

### TTIN

Karafka will respond to `TTIN` by printing backtraces for all threads to the logger.  This is useful for debugging if you have a Karafka process that appears dead or stuck.

```text
Thread TID-c70x
processing/jobs_queue.rb:64:in `pop'
processing/jobs_queue.rb:64:in `pop'
processing/worker.rb:47:in `process'
processing/worker.rb:37:in `block in call'
...
Thread TID-c72h
instrumentation/logger_listener.rb:83:in `backtrace'
instrumentation/logger_listener.rb:83:in `block in on_process_notice_signal'
instrumentation/logger_listener.rb:77:in `each'
instrumentation/logger_listener.rb:77:in `on_process_notice_signal'
...
```

!!! note "Note"

    You need to have the `LoggerListener` enabled for this signal to print. It is enabled by default, so this signal should work out of the box unless you altered that.

### TSTP

`TSTP` tells Karafka process to "quiet" as it will shut down shortly. It will stop processing new messages but continue working on current jobs and will not unsubscribe from the topics and partitions it owns. If a given process gets new topics or partitions assigned during this phase, they will not be processed.

Using `TSTP` allows you to gracefully finish all the work and shut down without causing several rebalances in case you would be stopping many consumer processes.

Use `TSTP` + `TERM` to guarantee shut down within a period. The best practice is sending `TSTP` at the start of deployment and `TERM` at the end.

!!! note "Note"

    You still need to send `TERM` to exit the Karafka process.

### TERM and QUIT

Send `TERM` or `QUIT` signal to a Karafka process to shut it down. It will stop accepting new work but continue working on current messages.  Workers who do not finish within the `shutdown_timeout` are forcefully terminated.

#### Forceful Shutdown

When Karafka cannot shut down gracefully within the `shutdown_timeout`, it escalates to a forceful shutdown: it terminates the still-running workers and listeners, closes the Kafka clients, and then exits immediately with [exit code](Infrastructure-Exit-codes) `2`.

A forceful shutdown is triggered by either of two conditions:

- **Work still in progress** - one or more workers are still processing jobs when the `shutdown_timeout` elapses.

- **A listener that will not stop** - one or more connection listeners cannot finish stopping and closing their underlying `librdkafka` client within the `shutdown_timeout`. In this case the process appears "stuck" while closing the consumer (for example inside the client's `rd_kafka_consumer_close` call) even though no user job is running. A listener can hang for several reasons - an unreachable broker, or the client blocking during its own teardown - but by far the most common cause is an unresolved rebalance or partition revocation: the group coordinator is still waiting on replies from all members of the consumer group before the rebalance can finish. This is inherent to the classic and cooperative-sticky rebalance protocols and is one of the main drivers of the "rebalance storm" you can observe when many consumers restart during a deployment. See [Rebalance Storms During Deployments](Infrastructure-Application-Development-vs-Production#rebalance-storms-during-deployments) for mitigations.

!!! tip "Identifying What Blocks a Forceful Shutdown"

    Since Karafka `2.5.7`, when a forceful shutdown occurs, Karafka logs detailed blocking information - the active listeners, alive workers, and in-processing jobs - instead of only aggregate counts. Inspect this log line to determine whether a long-running job or a stuck listener is holding the process. If workers are still processing, the culprit is your consumer code; if instead a listener cannot close while nothing is actively processing, the delay is in the client teardown - most often an unresolved rebalance.

A forceful shutdown is a **last resort**, and it is **expected that in-flight data may be lost**. Because the process ends with an immediate `exit!`, the regular `ensure`-based cleanup is skipped and the producer is **not** flushed: any async-buffered messages that have not yet been delivered - for example user `produce_async` calls or Dead Letter Queue copies - may be discarded.

This is intentional. Flushing the producer during a forceful shutdown would be risky exactly when it matters most: the producer (or its connection pool) may itself be the resource that is blocked - for example an unreachable broker - and waiting on it could stall or even hang the forceful exit whose entire purpose is to guarantee the process terminates.

The blocking cleanup that Karafka does perform on this path (stopping the listeners' underlying clients) is time-boxed by the `forceful_shutdown_wait` setting - it defaults to `5_000` (milliseconds) and can be adjusted via `config.internal.forceful_shutdown_wait` - so that a hung resource cannot delay the forceful exit indefinitely.

!!! note "Preventing Data Loss on Shutdown"

    If losing in-flight buffered data on shutdown is unacceptable for your workload, do not rely on the forceful path. Make sure jobs finish within `shutdown_timeout` - extend it to match your processing patterns, or investigate what is running longer than expected - so that shutdown completes gracefully and the producer is flushed normally.

## States

The Karafka process can be in a few states during its lifecycle, and each has a separate meaning and indicates different things happening internally.

- `initializing` - The initial state of the application before configuration or routes are loaded.
- `initialized` - The process is configured in this state but has yet to start listeners and workers.
- `running` - The process started Kafka clients and is polling data.
- `quieting` - The process received the `TSTP` signal and is finishing the current work.
- `quiet` - The process no longer processes work and will keep running in quiet mode.
- `stopping` - The process is finishing current work, no longer accepting more, and shutting down.
- `stopped` - The process finished everything and closed all the Kafka connections.
- `terminated` - The process is going to exit shortly.

## See Also

- [Deployment](Infrastructure-Deployment) - Using signals for graceful deployments
- [Exit codes](Infrastructure-Exit-codes) - Understanding exit codes after shutdown
- [Long Running Jobs](Pro-Consumer-Groups-Long-Running-Jobs) - Handling signals with long-running operations
