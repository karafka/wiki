# JRuby Support

!!! warning "JRuby Support Is a Work in Progress and Not Yet Ready"

    Karafka support for JRuby is a work in progress. It is not ready for use until this notice is removed from this page.

This page lists what you need to run Karafka and WaterDrop on JRuby, the limits that apply there, and the state of the Web UI. The target is JRuby 10.0, which is compatible with Ruby 3.4. Older JRuby versions are not a target. JRuby fixes land in the current releases of the gems. See the [Karafka](Changelog-Karafka) and [WaterDrop](Changelog-WaterDrop) changelogs for details.

!!! warning "The Web UI Is Not Ready for JRuby"

    The Web UI is not ready for use on JRuby.

## JRuby Versions

Use JRuby 10.0.8.0 or newer. Older JRuby 10.0 releases can leave a `Mutex` locked after a `Timeout` or `Thread#raise`. See [Do Not Wrap Producer Calls in `Timeout`](#do-not-wrap-producer-calls-in-timeout).

JRuby 10.1.3.0 does not work. A regression in this JRuby release makes WaterDrop raise `ArgumentError: wrong number of arguments (given 1, expected 0)` when it sets up a producer. Karafka sets up a WaterDrop producer when it starts, so Karafka does not start either.

## Installation

Karafka and WaterDrop use librdkafka. On JRuby, there is no precompiled librdkafka, so `gem install` and `bundle install` compile it from source when they install Karafka or WaterDrop. The machine that installs the gems needs:

- A C and C++ compiler and `make`, for example the `build-essential` package on Debian and Ubuntu.
- The OpenSSL development headers, for example `libssl-dev`. Without them, the build succeeds, but librdkafka has no SSL, SASL SCRAM or SASL OAUTHBEARER support, and connections that use them fail.
- The SASL development headers, for example `libsasl2-dev`, if you use SASL GSSAPI (Kerberos).

The Ubuntu images of GitHub Actions have the compilers, `make` and the OpenSSL headers. See [Native Extensions](Development-Native-Extensions#source-compilation-fallback) for more about source compilation.

## Process Model

JRuby has no `Process.fork`. Swarm Mode forks its nodes, so it does not run on JRuby: `karafka swarm` fails at boot. Use `karafka server`. It runs one process with many threads, and these threads run in parallel because JRuby has no GVL. See [Swarm / Multi Process](Infrastructure-Swarm-Multi-Process) for details.

Puma cluster mode (`workers`) also forks, so it does not run on JRuby: Puma stops at boot with `ERROR: worker mode not supported on jruby on this platform`. To [embed Karafka](Infrastructure-Embedding) in Puma on JRuby, run Puma in single mode.

## Rails Commands and Consoles

On JRuby 10.0, a JRuby bug breaks the commands that load Rails before Karafka. They fail with `LoadError: cannot load such file -- .../waterdrop/clients`:

<table>
  <thead>
    <tr>
      <th>Command</th>
      <th>JRuby 10.0</th>
      <th>MRI</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><code>bundle exec karafka server</code></td>
      <td>Works</td>
      <td>Works</td>
    </tr>
    <tr>
      <td><code>bin/rails runner</code></td>
      <td>Fails</td>
      <td>Works</td>
    </tr>
    <tr>
      <td><code>bin/rails server</code></td>
      <td>Fails at boot</td>
      <td>Works</td>
    </tr>
    <tr>
      <td><code>bundle exec rails console</code></td>
      <td>Fails</td>
      <td>Works</td>
    </tr>
    <tr>
      <td><code>bundle exec karafka console</code></td>
      <td>Fails</td>
      <td>Works</td>
    </tr>
  </tbody>
</table>

In a Rails app, `karafka console` runs `bundle exec rails console`, so it fails the same way. Outside Rails, `karafka console` fails with the same error, because irb loads the `prism` gem.

The cause is load order. When `prism` loads before Zeitwerk and WaterDrop, JRuby 10.0 `autoload` no longer goes through the Zeitwerk `Kernel#require`, and WaterDrop cannot load its files. Rails loads `prism` when `config/application.rb` requires the Rails frameworks, before `Bundler.require` loads Karafka. `karafka server` works, because `bin/karafka` loads Karafka, Zeitwerk and WaterDrop before the Rails app.

To run the Rails commands on JRuby 10.0, load Zeitwerk before Rails. Set `RUBYOPT`:

```shell
RUBYOPT=-rzeitwerk bin/rails console
```

Or require Zeitwerk in `config/application.rb` before the Rails frameworks:

```ruby
# config/application.rb
require_relative "boot"

# Load Zeitwerk before Rails on JRuby 10.0
require "zeitwerk"

require "rails/all"
```

`require "karafka"` in the same place also works. A console on JRuby takes much longer to start than on MRI, from seconds to tens of seconds.

This is a JRuby bug, not a Karafka bug. See [jruby/jruby#9589](https://github.com/jruby/jruby/issues/9589).

## Signals

Stop `karafka server` with `TERM`. On JRuby, `QUIT` prints a JVM thread dump and does not stop the process. See [Signals and States](Infrastructure-Signals-and-States) for details.

## Pro Encryption

The `:envelope` mode of [Messages At Rest Encryption](Pro-Messages-At-Rest-Encryption) works only on MRI, because the OpenSSL library of JRuby does not provide `OpenSSL::PKey::RSA#encrypt` and `#decrypt`. The `:direct` mode works on JRuby.

## Async and Fiber Scheduler

On JRuby 10.0, `Kernel#sleep`, `ConditionVariable#wait` and `Queue#pop` in a non-blocking fiber do not call the fiber scheduler, so they block the whole thread. With WaterDrop in an Async reactor, each `#produce_sync` and each `DeliveryHandle#wait` blocks all fibers of the reactor until the delivery report arrives. `#produce_async` does not wait for the delivery report, so it does not block the reactor for that time.

This is a JRuby bug, not a Karafka bug. See [jruby/jruby#9622](https://github.com/jruby/jruby/issues/9622), [jruby/jruby#9790](https://github.com/jruby/jruby/issues/9790) and [jruby/jruby#9805](https://github.com/jruby/jruby/issues/9805). See [Async Ecosystem Integration](WaterDrop-Async-Integration) for how WaterDrop works with the fiber scheduler on MRI.

## Do Not Wrap Producer Calls in `Timeout`

!!! warning "A `Timeout` Around `#produce_sync` or `#produce_async` Can Hang the Producer on JRuby"

    On JRuby 10.0.7.0 and older, a `Timeout` or `Thread#raise` that interrupts a thread while it waits for a busy `Mutex` can leave the lock held by that thread. Another thread that needs the same lock then waits forever. If you wrap `#produce_sync` or `#produce_async` in a `Timeout`, the producer can hang. JRuby 10.0.8.0 and MRI do not have this problem.

    This is a JRuby bug, not a Karafka bug. See [jruby/jruby#9972](https://github.com/jruby/jruby/issues/9972).

    Use the WaterDrop timeouts instead: `max_wait_timeout` and the `message.timeout.ms` setting. See [WaterDrop Configuration](WaterDrop-Configuration) for details.
