Karafka responds to few signals. On a Unix machine, you can use the `kill` binary or the `Process.kill` API in Ruby, e.g.

```
kill -TTIN pid
Process.kill("TTIN", pid)
```

## TTIN

Karafka will respond to `TTIN` by printing backtraces for all threads to the logger.  This is useful for debugging if you have a Karafka process that appears dead or stuck.

**Note**: You need to have the `LoggerListener` enabled for this signal to print. It is enabled by default, so this signal should work out of the box unless you altered that.

## TERM and QUIT

Send `TERM` or `QUIT` signal to a Karafka process to shut it down. It will stop accepting new work but continue working on current messages.  Workers who do not finish within the `shutdown_timeout` are forcefully terminated.
