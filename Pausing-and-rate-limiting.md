[Karafka Pro](/docs/Pro-Getting-Started) provides an excellent filtering and [rate-limiting](Pro-Rate-Limiting) APIs, making it a highly recommended option over manually managing message processing flow. By using Karafka Pro, developers can easily configure filtering and rate limiting on a per-topic basis, which allows them to fine-tune the message processing flow according to the requirements of their application.

Using Karafka Pro for filtering and rate limiting also eliminates the need for developers to manually manage message processing, which can be time-consuming and error-prone. With Karafka Pro, you can rely on a robust and efficient system that automatically takes care of these tasks.

Overall, using Karafka Pro for filtering and rate limiting not only simplifies the development process but also ensures that message processing is handled in a reliable and scalable manner.

---

Karafka allows you to pause processing for a defined time. This can be used, for example, to apply a manual back-off policy or throttling. To pause a given partition from within the consumer, you need to use the `#pause` method that accepts the pause offset (what should be the first message to get again after resuming) and the time for which the pause should be valid.

```ruby
def consume
  messages.each do |message|
    # Sends requests to an API that can be throttled
    result = DispatchViaHttp.call(message)

    next unless result.throttled?

    # Pause and resume from the first message that was throttled
    # Pause based on our fake API throttle backoff information
    pause(message.offset, result.backoff)

    # We need to return, otherwise the messages loop would continue sending messages
    return
  end
end
```

!!! note ""

    It is important to remember that the `#pause` invocation does **not** stop the processing flow. You need to do it yourself:

**BAD**:

Without stopping the processing, the `messages#each` loop will continue:

```ruby
def consume
  messages.each do |message|
    # Wait for 10 seconds and try again if we've received messages
    # that are younger than 1 minute
    pause(message.offset, 10.seconds * 1_000) if message.timestamp >= 1.minute.ago

    save_to_db(message)
  end
end
```

**GOOD**:

Invoking `return` after `#pause` will ensure no consecutive messages are processed. They will be processed after pause has expired:

```ruby
def consume
  messages.each do |message|
    if message.timestamp >= 1.minute.ago
      pause(message.offset, 10.seconds * 1_000)
      # After pausing do not continue processing consecutive messages
      return
    end

    save_to_db(message)
  end
end
```

**GOOD**:

Another good approach is by using the `#find` on messages to detect if throttling is needed and what was the message that was throttled:

```ruby
def consume
  throttled = messages.find do |message|
    DispatchViaHttp.call(message).throttled?
  end

  # Done if nothing was throttled
  return unless throttled

  # Try again in 5 seconds
  pause(throttled.offset, 5_000)
end
```

## `#pause` Usage Potential Networking Impact

When using the `#pause` method in Karafka, you're essentially instructing the system to halt the fetching of messages for a specific topic partition. However, this is not just a simple "pause" in the regular sense of the word.

When `#pause` is invoked, Karafka stops fetching new messages and purges its internal buffer that holds messages from that specific partition. It's essential to recognize that Karafka, by default, pre-buffers 1MB of data per topic partition for efficiency reasons. This buffer ensures that there is always a consistent supply of messages ready for processing without constantly waiting for new fetches.

The challenge arises here: If you use the `#pause` method frequently and for short durations, you might inadvertently create substantial network traffic. Every time you resume from a pause, Karafka will attempt to re-buffer the 1MB of data, which can result in frequently re-fetching the same data, thereby causing redundant network activity.

### Potential Solutions

- **Adjust Buffer Size**: If you're pausing and resuming often, consider adjusting the `fetch.message.max.bytes` setting for affected topics. This will lower the buffer size to reduce the volume of redundant data fetched, but do note that this might affect performance during regular operations.

- **Optimize Pause Usage**: Reevaluate your use cases for the `#pause` method. Perhaps there are ways to minimize its usage or extend the duration of pauses to reduce the frequency of data re-fetches.

- **Monitor and Alert**: Set up alerts to notify you of a spike in network traffic or frequent use of the `#pause` method. This way, you can quickly address any issues or misconfigurations.


### Cost Implications with Third-party Providers

It's crucial to be aware, especially if you're using a third-party Kafka provider that charges based on the number of messages sent, that frequent pausing and resuming can inflate costs. This is due to the aforementioned frequent prefetching of the same data, which can result in the same messages being counted multiple times for billing purposes. Always ensure alignment and configuration are optimized to prevent unnecessary financial implications.

### Summary

In conclusion, while the `#pause` method in Karafka provides valuable functionality, it's vital to understand its implications regarding system performance and potential costs. Proper configuration and mindful usage can help leverage its benefits while mitigating downsides.
