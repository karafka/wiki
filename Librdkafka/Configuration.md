<style>
  .md-grid {
    max-width: 100%;
  }
</style>

# Librdkafka Configuration Properties

!!! note ""

    This page is a copy of the [CONFIGURATION.md](https://github.com/confluentinc/librdkafka/blob/master/CONFIGURATION.md) of `librdkafka`. 

    This page has been made full-screen to ease navigation.

The configuration values below fall under the `kafka` scope within WaterDrop and Karafka. Aside from these, both frameworks have multiple root configuration options that dictate their overall behavior. Ensure you differentiate between kafka-specific settings and the broader root configurations for effective setup and adjustments.

!!! warning "Notice on Configuration Defaults"

    Please be aware that the settings listed below are the default configurations for `librdkafka` and not for Karafka or WaterDrop. It's important to note that, in some cases, Karafka and WaterDrop employ different default values for their configurations. We strongly recommend consulting the documentation and the configuration code to understand the exact values used within the Karafka ecosystem.

***
