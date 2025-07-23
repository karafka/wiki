Inline Insights is a feature of Karafka that provides a way to enhance your data processing capabilities by allowing your consumers to adjust their actions based on real-time metrics.

Not all applications and services need insights at all times. However, for critical applications, these insights can be crucial. With the `required` option, developers can ensure that their consumers only process the data when the associated insights metrics are available.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders_states do
      consumer OrdersStatesConsumer

      # Ensures that `#insights` are always present during processing
      inline_insights(required: true)
    end
  end
end
```

## How does it work?

When the `required` option is activated in Karafka Pro's Inline Insights, it automatically verifies the data processing workflow. Karafka immediately checks to ascertain if the corresponding insights are available after receiving messages for a particular topic partition. If these insights are unavailable, Karafka temporarily pauses processing for that specific topic partition rather than proceeding with potentially incomplete data processing. This pause continues until the necessary `#insights` become available. With this feature in place, developers are spared the chore of manually verifying the presence of insights using the `#insights?` method, as the system intelligently and autonomously ensures that every piece of data is paired with its analytical insights before processing.

## Summary

In sum, the `required` option in Karafka Pro's Inline Insights is an invaluable asset for developers aiming to bolster and assure the reliability of their metrics availability.
