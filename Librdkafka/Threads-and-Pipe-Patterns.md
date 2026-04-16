# librdkafka Thread and Pipe Patterns

Karafka and WaterDrop rely on librdkafka as the underlying C client for Apache Kafka. librdkafka manages its own native threads and uses pipe file descriptors for internal signaling. Understanding these patterns is essential for capacity planning, debugging resource usage, and diagnosing issues in production environments.

This document explains what native resources librdkafka creates, how they map to Karafka's consumer and WaterDrop's producer lifecycle, and what to expect when inspecting a running process.

## Native Threads Created by librdkafka

Every `rd_kafka_t` instance (the native Kafka client handle created by rdkafka) spawns multiple native threads. These threads are **not** Ruby threads - they are POSIX threads created by librdkafka in C and are invisible to Ruby's `Thread.list`.

There are three categories of native threads per `rd_kafka_t`:

- **Main thread** (`rdk:main`): One per handle. Processes the internal operations queue, runs timers (metadata refresh, statistics, rebootstrap), and coordinates broker thread lifecycle. This thread exists for both consumers and producers.

- **Broker threads** (`rdk:brokerN`): One per known Kafka broker. librdkafka creates a broker thread for every broker it discovers via metadata responses, not just the ones a consumer actively reads from. Each broker thread maintains a connection (or attempts to connect) to its assigned broker, handles Kafka protocol requests (Fetch, Heartbeat, OffsetCommit, Metadata), and sleeps on a condition variable when idle.

    A broker thread is created when:

    - The handle initializes with bootstrap servers from `bootstrap.servers` (one thread per entry)
    - Metadata responses reveal new brokers not previously known (learned brokers)

- **Internal broker thread** (`rdk:broker-1`): One per handle. Handles internal coordination tasks that do not target a specific external broker, such as group coordinator lookups.

The thread names follow the pattern `rdk:main` and `rdk:broker<ID>` where `<ID>` is the Kafka broker node ID. The internal broker uses node ID `-1`.

### Thread Count Formula

For a single `rd_kafka_t` instance connected to a Kafka cluster with **N** brokers:

```
threads_per_handle = 1 (main) + 1 (internal) + B (bootstrap) + N (learned brokers)
```

Where `B` is the number of entries in `bootstrap.servers`. After the initial metadata response, bootstrap broker threads may overlap with learned broker threads if they resolve to the same broker, but they are separate threads until decommissioned.

In practice, with a single bootstrap server and a 3-broker cluster:

```
threads = 1 (main) + 1 (internal) + 1 (bootstrap) + 3 (learned) = 6
```

After the bootstrap broker is decommissioned (it gets replaced by a learned broker for the same node), the steady-state count settles to approximately:

```
threads ≈ 1 (main) + 1 (internal) + N (learned brokers)
```

!!! note "Thread Count Scaling"

    With 132 subscription groups (consumers in a process) and a 16-broker cluster, the expected native thread count is approximately `132 × (2 + 16) = 2,376` threads. This is normal and expected behavior, not a leak.

!!! tip "Upcoming: Event Loop Based Consumers"

    Karafka is moving subscription groups away from the current model where each subscription group requires its own Ruby thread. WaterDrop producers already made this transition - replacing the Ruby polling thread with a file descriptor-based event loop. Karafka subscription groups will follow the same approach, which will significantly reduce Ruby thread count in processes with many subscription groups. This change is planned for a future Karafka release.

## Pipe File Descriptors

Each broker thread creates a **pipe pair** (two file descriptors: one read end, one write end) during initialization. This pipe serves as a wakeup mechanism - other threads write a single byte `"\1"` to the write end to interrupt a broker thread's `poll()` loop when there is work to do (new operations queued, state changes, shutdown signals).

### Pipe Count Formula

```
pipe_fds_per_handle = (number_of_broker_threads) × 2
```

For a single handle connected to a 3-broker cluster with 4 broker threads:

```
pipe_fds = 4 × 2 = 8
```

For 132 handles connected to a 16-broker cluster:

```
pipe_fds ≈ 132 × 18 × 2 = 4,752
```

### Identifying Pipe FDs

Pipe file descriptors can be identified in `/proc/<pid>/fd/`:

```bash
ls -la /proc/<pid>/fd/ | grep pipe
```

Each pipe inode appears twice (read end and write end). Both ends being open is normal. A pipe with only one end open may indicate stdout/stderr redirection (FDs 1, 2) which is typical in containerized environments.

## Thread Behavior Patterns in strace

When examining a Karafka process with `strace`, broker threads exhibit two distinct patterns:

Active broker threads cycle through:

```
poll([{fd=SOCKET, events=POLLIN}, {fd=PIPE, events=POLLIN}], 2, 1000)
read(PIPE, "\1", 1024)
sendmsg(SOCKET, ..., MSG_DONTWAIT|MSG_NOSIGNAL)
recvmsg(SOCKET, ..., MSG_DONTWAIT)
```

They `poll()` on both a TCP socket (for Kafka protocol) and the wakeup pipe, with a 1-second timeout.

Idle broker threads that are connected to brokers not currently serving the consumer's partitions spend their time in condition variable waits:

```
futex(ADDR, FUTEX_WAIT_BITSET_PRIVATE|FUTEX_CLOCK_REALTIME, 0, {tv_sec=...}, ...)
```

These threads wake periodically (every ~1-3 seconds) to check for work, then go back to sleep. They hold their pipe pair open but never read from it during idle periods. This is normal behavior - librdkafka keeps connections to all known brokers ready for partition reassignment or coordinator changes.

## Broker Lifecycle and Decommissioning

librdkafka manages broker threads dynamically based on cluster metadata:

- **Adding brokers**: When a metadata response contains a broker ID not previously known, librdkafka creates a new `LEARNED` broker thread. The broker is matched by node ID, not by address. If a known broker changes its advertised address (common during Kubernetes pod rescheduling), librdkafka updates the existing broker thread's target address rather than creating a new thread.

- **Decommissioning brokers**: After processing a metadata response, librdkafka checks all `LEARNED` brokers against the current metadata broker list. Any learned broker whose node ID no longer appears in metadata is decommissioned - its thread receives a `TERMINATE` signal, exits its main loop, closes its pipe pair, and is joined by the main thread.

- **Configured brokers**: Bootstrap brokers from `bootstrap.servers` are tagged as `CONFIGURED` and follow a different lifecycle - once a `CONFIGURED` broker connects and metadata is received, `LEARNED` broker threads are created for the actual cluster brokers, and the `CONFIGURED` broker may be decommissioned as it is no longer needed.

### Cleanup on Close

When `rd_kafka_destroy()` is called (triggered by `Consumer#close` or `Producer#close` in karafka-rdkafka):

1. All broker threads are decommissioned and sent `TERMINATE` signals
2. The main thread is joined (blocks until it exits)
3. All broker threads are joined (blocks until each exits)
4. All pipe file descriptors are closed
5. All memory is freed

This cleanup is synchronous and thorough. After `close` returns, all native threads have exited and all pipe FDs are closed. This has been verified through reproduction testing - even rapid create/close cycles produce zero resource leaks.

## Estimating Resource Usage

To estimate the native resource footprint of a Karafka process:

```
total_handles = subscription_groups + producers + admin_clients

threads_per_handle = 2 + N  (where N = number of Kafka brokers)

total_native_threads = total_handles × threads_per_handle
total_pipe_fds = total_handles × (threads_per_handle - 1) × 2
```

### Example Calculation

For a Karafka process with 50 subscription groups, 1 producer, and a 10-broker Kafka cluster:

```
handles = 50 + 1 = 51
threads_per_handle = 2 + 10 = 12
native_threads = 51 × 12 = 612
pipe_fds = 51 × 11 × 2 = 1,122
```

Plus Ruby's own threads (main thread, GC thread, etc.), the total thread count would be approximately 615-620.

## Inspecting a Running Process

### Counting Threads

```bash
# Total thread count
ls /proc/<pid>/task/ | wc -l

# Thread names (shows rdk:main, rdk:brokerN patterns)
for task in /proc/<pid>/task/*; do
  echo "$(basename $task): $(cat $task/comm 2>/dev/null)"
done | sort -t: -k2 | uniq -c -f1 | sort -rn
```

### Counting Pipe FDs

```bash
# Total pipe FDs
ls -la /proc/<pid>/fd/ | grep -c pipe

# Unique pipe pairs (each inode = one pipe, appears twice for read+write ends)
ls -la /proc/<pid>/fd/ | grep pipe | grep -oP 'pipe:\[\d+\]' | sort -u | wc -l
```

### Verifying Stability

Thread and pipe counts should remain stable once all subscription groups are initialized and the cluster topology stabilizes. If counts grow over time, investigate:

- **Cluster scaling**: New brokers added to the Kafka cluster create new broker threads in every consumer handle
- **Consumer resets**: Exceptions in the fetch loop trigger `reset` which closes and recreates the consumer. The old consumer's threads should be fully cleaned up before new ones are created. Check for `connection.listener.fetch_loop.error` instrumentation events
- **Orphaned handles**: `rd_kafka_t` handles that are dropped without calling `close` will leak all their threads and pipes permanently, as the Ruby GC finalizer is not reliable for native resource cleanup

## Common Misconceptions

**"Ruby threads create pipes"**: They do **not**. Ruby's `Thread.new` allocates a POSIX thread but no pipe file descriptors. Only librdkafka broker threads create pipes.

**"Each consumer only creates threads for brokers it reads from"**: Incorrect. librdkafka creates a broker thread for **every** broker discovered in cluster metadata, regardless of whether that broker hosts partitions relevant to the consumer.

**"High thread counts indicate a leak"**: Not necessarily. A process with many subscription groups connected to a large Kafka cluster will legitimately have thousands of native threads. Calculate the expected count using the formulas above before investigating a suspected leak.

**"GC will clean up unreferenced consumers"**: While karafka-rdkafka registers a GC finalizer on consumer and producer objects, Ruby's garbage collector does **not** guarantee timely or reliable finalizer execution. The exact finalizer behavior has also varied across karafka-rdkafka versions. Always call `close` explicitly rather than relying on GC for native resource cleanup.