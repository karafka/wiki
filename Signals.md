Karafka responds to few signals. On a Unix machine, you can use the `kill` binary or the `Process.kill` API in Ruby, e.g.

```
kill -TTIN pid
Process.kill("TTIN", pid)
```

## TTIN

Karafka will respond to `TTIN` by printing backtraces for all threads to the logger.  This is useful for debugging if you have a Karafka process that appears dead or stuck.

**Note**: You need to have the `LoggerListener` enabled for this signal to print. It is enabled by default, so this signal should work out of the box unless you altered that.

## TSTP

`TSTP` tells Karafka process to "quiet" as it will shut down shortly. It will stop processing new messages but continue working on current jobs and will not unsubscribe from the topics and partitions it owns. If a given process gets new topics or partitions assigned during this phase, they will not be processed.

Using `TSTP` allows you to gracefully finish all the work and shut down without causing several rebalances in case you would be stopping many consumer processes.

Use `TSTP` + `TERM` to guarantee shut down within a period. The best practice is sending `TSTP` at the start of deployment and `TERM` at the end.

**Note**: you still need to send `TERM` to exit the Karafka process.

## TERM and QUIT

Send `TERM` or `QUIT` signal to a Karafka process to shut it down. It will stop accepting new work but continue working on current messages.  Workers who do not finish within the `shutdown_timeout` are forcefully terminated.
