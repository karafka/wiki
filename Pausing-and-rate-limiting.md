[Karafka Pro](Pro-Getting-Started) provides an excellent filtering and [rate-limiting](Pro-Rate-Limiting) APIs, making it a highly recommended option over manually managing message processing flow. By using Karafka Pro, developers can easily configure filtering and rate limiting on a per-topic basis, which allows them to fine-tune the message processing flow according to the requirements of their application.

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

**Note**: It is important to remember that the `#pause` invocation does **not** stop the processing flow. You need to do it yourself:

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
