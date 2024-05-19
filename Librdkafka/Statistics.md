<style>
  .md-grid {
    max-width: 100%;
  }
</style>

# Librdkafka Statistics Metrics Details

!!! note ""

    This page is a copy of the [STATISTICS.md](https://github.com/confluentinc/librdkafka/blob/master/STATISTICS.md) of `librdkafka`. 

The statistics presented below are based on the raw metrics from `librdkafka`. However, Karafka and WaterDrop enhance these metrics for a more comprehensive view. By default, both frameworks have the `statistics.interval.ms` set to 5 seconds, meaning statistics are refreshed at this interval. Be mindful of this default setting when analyzing metric data.

***
