[![Build Status](https://github.com/karafka/karafka-web/workflows/ci/badge.svg)](https://github.com/karafka/karafka-web/actions?query=workflow%3Aci)
[![Gem Version](https://badge.fury.io/rb/karafka-web.svg)](http://badge.fury.io/rb/karafka-web)
[![Join the chat at https://slack.karafka.io](https://raw.githubusercontent.com/karafka/misc/master/slack.svg)](https://slack.karafka.io)

Karafka Web UI is a user interface for the [Karafka framework](https://github.com/karafka/karafka). The Web UI provides a convenient way for developers to monitor and manage their Karafka-based applications, without the need to use the command line or third party software. It does **not** require any additional database beyond Kafka itself.

The interface, amongst others, displays:

- real-time aggregated metrics,
- real-time information on resources usage,
- errors details,
- performance statistics,
- trends
- allows for Kafka topics data exploration
- routing and system information
- status of Web UI integration within your application

Karafka Web UI is shipped as a separate [gem](https://rubygems.org/gems/karafka-web) with minimal dependencies.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui.png" alt="Karafka Web UI"/>
</p>
