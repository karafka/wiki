# JRuby Support

!!! warning "JRuby Support Is a Work in Progress and Not Yet Ready"

    Karafka support for JRuby is a work in progress. It is not ready for use until this notice is removed from this page.

This page lists what you need to run Karafka, WaterDrop and the Web UI on JRuby, and the limits that apply there. The target is JRuby 10.0, which is compatible with Ruby 3.4. Older JRuby versions are not a target. JRuby fixes land in the current releases of the gems. See the [Karafka](Changelog-Karafka) and [WaterDrop](Changelog-WaterDrop) changelogs for details.

!!! warning "The Web UI Is Not Ready for JRuby"

    The Web UI is not ready for use on JRuby.

## Installation

Karafka and WaterDrop use librdkafka. On JRuby, there is no precompiled librdkafka, so `gem install` and `bundle install` compile it from source when they install Karafka or WaterDrop. The machine that installs the gems needs:

- A C and C++ compiler and `make`, for example the `build-essential` package on Debian and Ubuntu.
- The OpenSSL development headers, for example `libssl-dev`. Without them, the build succeeds, but librdkafka has no SSL, SASL SCRAM or SASL OAUTHBEARER support, and connections that use them fail.
- The SASL development headers, for example `libsasl2-dev`, if you use SASL GSSAPI (Kerberos).

The Ubuntu images of GitHub Actions have the compilers, `make` and the OpenSSL headers. See [Native Extensions](Development-Native-Extensions#source-compilation-fallback) for more about source compilation.

## Process Model

JRuby has no `Process.fork`. Swarm Mode forks its nodes, so it does not run on JRuby: `karafka swarm` fails at boot. Use `karafka server`. It runs one process with many threads, and these threads run in parallel because JRuby has no GVL. See [Swarm / Multi Process](Infrastructure-Swarm-Multi-Process) for details.

## Signals

Stop `karafka server` with `TERM`. On JRuby, `QUIT` prints a JVM thread dump and does not stop the process. See [Signals and States](Infrastructure-Signals-and-States) for details.

## Pro Encryption

The `:envelope` mode of [Messages At Rest Encryption](Pro-Messages-At-Rest-Encryption) works only on MRI, because the OpenSSL library of JRuby does not provide `OpenSSL::PKey::RSA#encrypt` and `#decrypt`. The `:direct` mode works on JRuby.

## Do Not Wrap Producer Calls in `Timeout`

!!! warning "A `Timeout` Around `#produce_sync` or `#produce_async` Can Hang the Producer on JRuby"

    On JRuby 10.0, a `Timeout` or `Thread#raise` that interrupts a thread while it waits for a busy `Mutex` can leave the lock held by that thread. Another thread that needs the same lock then waits forever. If you wrap `#produce_sync` or `#produce_async` in a `Timeout`, the producer can hang. MRI does not have this problem.

    This is a JRuby bug, not a Karafka bug. See [jruby/jruby#9972](https://github.com/jruby/jruby/issues/9972).

    Use the WaterDrop timeouts instead: `max_wait_timeout` and the `message.timeout.ms` setting. See [WaterDrop Configuration](WaterDrop-Configuration) for details.
