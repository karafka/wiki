# Persistent Topic Pausing with Karafka Filtering API and Flipper

!!! info "Future Web UI Enhancement"

    Persistent pausing support in Karafka Web UI is planned, but there is no ETA for it yet. This is a complex feature that requires careful consideration of distributed state management, rebalancing scenarios, and API design to ensure it works reliably across different deployment architectures. Until then, the Filtering API approach described below provides a robust solution for persistent pausing needs.

Karafka's [Web UI pausing](Pro-Web-UI-Commanding#pause-and-resume-partitions) is **not** persistent - it's designed for emergency "oh gosh, there's a bug" scenarios where you need immediate, temporary relief. When the process restarts or rebalances, Web UI pauses are lost.

For **planned migrations, maintenance windows, or controlled rollouts**, you need persistent pausing that survives restarts and affects all consumers. This is where the [Filtering API](Pro-Filtering-API), combined with feature toggles like Flipper, comes into play.

## How Karafka's Filtering API enables persistent control

The [Filtering API](Pro-Filtering-API) provides pre-processing hooks that can alter consumption behavior before messages reach your consumer code. Filters are **long-lived objects** created per partition that can return three actions:

- **`:skip`** - Normal processing (default)
- **`:pause`** - Halt consumption for a specified timeout (see [Pausing, Seeking and Rate Limiting](Pausing-Seeking-and-Rate-Limiting))
- **`:seek`** - Move to a different offset

Critically, filters run **before** message processing and persist across poll cycles, making them ideal for implementing durable pausing logic based on external state like feature flags.

## Integrating Flipper for feature-toggle-based pausing

Create a custom filter that checks Flipper flags to determine whether to pause a topic. This pattern externalizes pause control to a persistent data store that Flipper works with:

```ruby
# app/filters/flipper_pause_filter.rb
# Inherits from the Filtering API base class
# See: https://karafka.io/docs/Pro-Filtering-API/
class FlipperPauseFilter < Karafka::Pro::Processing::Filters::Base
  # 60 seconds - check flag every minute
  PAUSE_DURATION = 60_000

  def initialize(topic, partition)
    @topic = topic
    @partition = partition
    @applied = false
    @paused = false
  end

  def apply!(messages)
    # Check Flipper flag for this topic
    flag_name = "pause_topic_#{@topic}"
    @paused = Flipper.enabled?(flag_name)
    
    if @paused
      @applied = true
      # Don't modify messages, just signal pause action
    end
  end

  def applied?
    @applied
  end

  def action
    @paused ? :pause : :skip
  end

  def timeout
    # Return pause duration only when pausing
    @paused ? PAUSE_DURATION : nil
  end
end
```

Register the filter in your Karafka routing configuration:

```ruby
# karafka.rb
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders do
      consumer OrdersConsumer
      filter ->(topic, partition) { FlipperPauseFilter.new(topic, partition) }
    end

    topic :payments do
      consumer PaymentsConsumer
      filter ->(topic, partition) { FlipperPauseFilter.new(topic, partition) }
    end
  end
end
```

!!! warning "Keep Pause Check Intervals Reasonable"

    When implementing persistent pausing with filters, it's crucial to keep the `PAUSE_DURATION` (check interval) relatively short - typically around 60 seconds is recommended. This is because when a partition is paused, librdkafka does not refresh its metadata, so lag statistics and other metrics will not update in real time until the partition is resumed.

    **Avoid long pause check intervals** (e.g., 10-20 minutes or more) as this will:

    - Prevent accurate lag monitoring in the Web UI and metrics
    - Make it harder to understand the true state of your consumers
    - Delay the consumer's awareness of flag changes when you want to resume processing

    A 60-second check interval provides a good balance between reducing Flipper query overhead and maintaining reasonable visibility into consumer state. For more details on lag reporting limitations during pauses, see [Web UI Health documentation](Pro-Web-UI-Health).

!!! info "Web UI Visibility and Expected Flickering"

    You can monitor the pause status of partitions in the [Web UI Health section](Pro-Web-UI-Health). However, because this implementation uses time-based pausing (e.g., 60-second intervals), you may observe brief flickering in the UI where a partition appears to unpause momentarily and then pause again.

    **This is expected behavior.** Here's what happens:

    1. The filter pauses the partition for 60 seconds
    2. After 60 seconds, Karafka automatically unpauses to poll
    3. The filter immediately checks Flipper and re-pauses if the flag is still enabled
    4. During this brief unpause/re-pause cycle, the Web UI may show the partition as active for a moment

    This flickering is harmless and simply reflects the filter's periodic check mechanism. The partition is effectively paused - no messages are being processed during these transitions.

## Using it in practice

**Before a planned migration:**

```ruby
# Enable pause for orders topic - all consumers will respect this
Flipper.enable("pause_topic_orders")
```

All running consumers will check this flag every 60 seconds (the `PAUSE_DURATION`) and stop fetching new messages. The pause persists across process restarts, rebalances, and deployments.

**During migration:**
Perform your database migrations, schema changes, or maintenance work. Consumers remain paused but healthy - they're still part of the consumer group and maintain their partition assignments.

**Resume processing:**

```ruby
# Disable pause - consumers will resume within 60 seconds
Flipper.disable("pause_topic_orders")
```

This approach gives you **persistent, centrally-managed topic pausing** that's perfect for planned maintenance, migrations, and controlled rollouts - without touching the Web UI or redeploying code.

---

## See Also

- [Filtering API](Pro-Filtering-API) - Complete documentation on creating and using filters
- [Pausing, Seeking and Rate Limiting](Pausing-Seeking-and-Rate-Limiting) - Understanding pause mechanisms in Karafka
- [Web UI Commanding: Pause and Resume Partitions](Pro-Web-UI-Commanding#pause-and-resume-partitions) - Emergency partition pausing via Web UI
- [Error Handling and Back-Off Policy](Error-Handling-and-Back-Off-Policy) - How Karafka handles automatic pausing on errors
- [Transactional offsets pattern](https://mensfeld.pl/2023/06/inside-kafka-enhancing-data-reliability-through-transactional-offsets-with-karafka/) - Related pattern for reliable message processing
