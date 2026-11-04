# JRuby Support

!!! warning "JRuby Support Is a Work in Progress and Not Yet Ready"

    Karafka support for JRuby is a work in progress. It is not ready for use until this notice is removed from this page.

This page lists what you need to run Karafka, WaterDrop and karafka-rdkafka on JRuby, and the limits that apply there. The target is JRuby 10.0, which is compatible with Ruby 3.4. Older JRuby versions are not a target. JRuby fixes land in the current releases of the gems. See the [Karafka](Changelog-Karafka), [WaterDrop](Changelog-WaterDrop) and [Karafka-Rdkafka](Changelog-Karafka-Rdkafka) changelogs for details.

Web UI support on JRuby is in progress.

## Installation

karafka-rdkafka has no precompiled gem for JRuby. On JRuby, `gem install` and `bundle install` compile librdkafka from source when they install karafka-rdkafka. The machine that installs the gem needs:

- A C and C++ compiler and `make`, for example the `build-essential` package on Debian and Ubuntu.
- The OpenSSL development headers, for example `libssl-dev`. Without them, the build succeeds, but librdkafka has no SSL, SASL SCRAM or SASL OAUTHBEARER support, and connections that use them fail.
- The SASL development headers, for example `libsasl2-dev`, if you use SASL GSSAPI (Kerberos).
- `git`, when you install karafka-rdkafka from a Git repository or a local checkout, because its gemspec calls `git ls-files`.

The Ubuntu images of GitHub Actions have the compilers, `make`, `git` and the OpenSSL headers. See [Native Extensions](Development-Native-Extensions#source-compilation-fallback) for more about source compilation.

## Process Model

JRuby has no `Process.fork`. Swarm Mode forks its nodes, so it does not run on JRuby: `karafka swarm` fails at boot. Use `karafka server`. It runs one process with many threads, and these threads run in parallel because JRuby has no GVL. See [Swarm / Multi Process](Infrastructure-Swarm-Multi-Process) for details.

Karafka polls each consumer client only from the listener thread that owns it, as on MRI. If you use karafka-rdkafka directly, do not share one `Rdkafka::Consumer` between threads for polling.

The blocking and non-blocking (`_nb`) poll variants of karafka-rdkafka behave the same on JRuby. JRuby ignores the FFI `blocking: true` option, because it has no GVL to release.

## Signals

Stop `karafka server` with `TERM`, or with `INT` in an interactive terminal. On JRuby, `QUIT` prints a JVM thread dump and does not stop the process. A process started with `INT` ignored (for example, with `&` in a non-interactive shell) does not react to `INT`, but `TERM` works. See [Signals and States](Infrastructure-Signals-and-States) for details.

## Callbacks and Finalizers

On JRuby, the GC finalizer of a client runs on the JVM `Finalizer` thread. If you create a karafka-rdkafka consumer directly and do not close it, its finalizer closes it. When that close fails, karafka-rdkafka calls `Rdkafka::Config.error_callback` from the `Finalizer` thread, so make this callback thread-safe. Karafka closes its own consumers, so this does not apply to them.

## Pro Encryption

The `:envelope` mode of [Messages At Rest Encryption](Pro-Messages-At-Rest-Encryption) works only on MRI, because the OpenSSL library of JRuby does not provide `OpenSSL::PKey::RSA#encrypt` and `#decrypt`. The `:direct` mode works on JRuby.

## Do Not Wrap Producer Calls in `Timeout`

!!! warning "A `Timeout` Around `#produce_sync` or `#produce_async` Can Hang the Producer on JRuby"

    On JRuby 10.0, a `Timeout` or `Thread#raise` that interrupts a thread while it waits for a busy `Mutex` can leave the lock held by that thread. Another thread that needs the same lock then waits forever. If you wrap `#produce_sync`, `#produce_async` or another call that waits on a busy lock in a `Timeout`, the producer can hang. MRI does not have this problem.

    This is a JRuby bug, not a Karafka bug. See [jruby/jruby#9972](https://github.com/jruby/jruby/issues/9972).

    Do not wrap producer calls in `Timeout`. Use the WaterDrop timeouts instead: `max_wait_timeout` and the `message.timeout.ms` setting. See [WaterDrop Configuration](WaterDrop-Configuration) for details.
