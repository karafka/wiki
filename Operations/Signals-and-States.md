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

!!! note

    You need to have the `LoggerListener` enabled for this signal to print. It is enabled by default, so this signal should work out of the box unless you altered that.

### TSTP

`TSTP` tells Karafka process to "quiet" as it will shut down shortly. It will stop processing new messages but continue working on current jobs and will not unsubscribe from the topics and partitions it owns. If a given process gets new topics or partitions assigned during this phase, they will not be processed.

Using `TSTP` allows you to gracefully finish all the work and shut down without causing several rebalances in case you would be stopping many consumer processes.

Use `TSTP` + `TERM` to guarantee shut down within a period. The best practice is sending `TSTP` at the start of deployment and `TERM` at the end.

!!! note

    You still need to send `TERM` to exit the Karafka process.

### TERM and QUIT

Send `TERM` or `QUIT` signal to a Karafka process to shut it down. It will stop accepting new work but continue working on current messages.  Workers who do not finish within the `shutdown_timeout` are forcefully terminated.

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

## See also

- [Deployment](Deployment) - Using signals for graceful deployments
- [Exit codes](Exit-codes) - Understanding exit codes after shutdown
- [Long Running Jobs](Long-Running-Jobs) - Handling signals with long-running operations
