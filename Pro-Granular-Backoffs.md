Granular Backoffs is a feature in Karafka that provides a heightened level of control over the error handling backoffs. It offers per-topic customization of pause, backoff, and retry time settings. This functionality allows for more personalized management of how your application backs off after errors, as you can define specific conditions for each topic.

When a consumer faces an issue while processing a message from a topic (e.g., a temporary network outage, an intermittently unavailable resource, or a processing error), it pauses for a specified duration before trying to process the message again - a behavior known as "backoff".

The Granular Backoffs feature enables you to customize backoff settings for each topic. That is, for different topics, you can outline distinct backoff policies. Having such granular control over these settings allows you to optimize message processing based on the unique characteristics of the specific topics, such as its size, update frequency, and relevance to your application.

## Usage

Karafka, by default, includes three configuration-level settings for computing pause time:

1. `pause_timeout`: This setting determines the waiting period after a processing error. The wait time is expressed in milliseconds, and the default is set to 1000 milliseconds (or 1 second).

2. `pause_max_timeout`: This is the maximum time to wait in an exponential backoff scenario. The wait time is in milliseconds; by default, it's set to 30,000 milliseconds (or 30 seconds).

3. `pause_with_exponential_backoff`: This Boolean setting determines whether or not the system should use exponential backoff. The default setting is true, meaning that the system will utilize an exponential backoff approach by default.

However, these default settings aren't set in stone. You can override them on a per-topic basis using the routing `#pause` method. This method accepts the following keyword arguments:

1. `timeout`: this argument allows you to set the pause time after a processing error.

2. `max_timeout`: this lets you set the maximum time for the system to wait in case of an exponential backoff.

3. `with_exponential_backoff`: when set to false, this argument will tell the system not to use an exponential backoff approach.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    # This topic will use the setup defaults
    topic :example do
      consumer ExampleConsumer
    end

    # This topic has a custom pause times
    topic :externals do
      consumer ExternalsConsumer
      pause(
        # Wait for at least 5 seconds after an error
        timeout: 5_000,
        # Wait for at most 1 minute after error
        max_timeout: 60_000,
        # Backoff exponentially on consecutive attempts
        with_exponential_backoff: true
      )
    end

    # This topic is expected to recover really fast
    topic :events do
      consumer EventsConsumer
      pause(
        # 100 ms at most and no exponential
        timeout: 100,
        with_exponential_backoff: false
      )
    end
  end
end
```

If the `#pause` method is called without any of these keyword arguments, the system will fall back on using the default settings for those parameters. This means you have a great deal of flexibility and can adjust the system's behavior on a topic-by-topic basis, depending on your specific needs and use cases.

## Usefulness

Granular Backoffs can be valuable in numerous situations, including:

1. **High-Importance Topics**: For a topic of high relevance to your application (e.g., containing updates that need immediate processing), you should assign a shorter backoff time and a higher retry count. This ensures any processing issues related to this topic are addressed promptly.

2. **Low-Importance Topics**: In contrast, for a topic of low relevance to your application, you should assign a longer backoff time and a lower retry count. This can help alleviate system load as less processing power is expended in resolving issues with this topic.

3. **High-Frequency Updates**: For a topic that updates frequently, you should assign a shorter pause time and a higher retry count. This ensures your consumer can keep pace with the update rate.

4. **Resource-Intensive Topics**: For a topic that requires substantial resources to process (e.g., containing messages that necessitate complex computations), you should assign a longer backoff time. This ensures your consumer has adequate time to free up resources before retrying to process a message from this topic.

5. **Topics Making External HTTP Calls**: Topics involving external HTTP calls could benefit from a longer backoff time. This ensures external systems, especially those encountering temporary issues, have enough recovery time before the subsequent request.

## Example use-cases

- **E-commerce Applications**: An e-commerce application may have a high-priority topic for order processing and a low-priority topic for recommendation updates. Using granular backoffs, the application can prioritize order processing and avoid overwhelming the system with recommendation updates.

- **Real-time Analytics**: In a real-time analytics application, a topic with high-frequency updates, like user clickstreams, may require a different pause and retry strategy compared to a topic with batched daily updates, such as database backups.

- **Financial Applications**: In financial applications, topics with real-time trading information may require shorter backoff times and higher retry counts to maintain market competitiveness. Conversely, topics dealing with less time-sensitive information, such as user account updates, can have longer backoff times.

- **IoT Applications**: IoT applications may have multiple topics receiving data from various types of sensors. Depending on the sensor's importance, data frequency, and processing requirements, different backoff, pause, and retry settings could be beneficial.

- **Distributed Systems**: In distributed systems with a high level of microservice communication, some services might be more critical than others. Granular backoffs allow adjusting the pause and retry parameters based on each service's importance and load.

- **Systems Making External HTTP Calls**: Systems that interact with external services via HTTP calls can use longer backoff times for these topics. This gives the external system adequate recovery time in case of issues, improving the overall success rate of requests.

## Summary

Granular Backoffs is a powerful feature, allowing for the per-topic customization of pause, backoff, and retry time settings. This ensures a flexible and tailored approach to handling and processing messages based on their respective topic characteristics.
