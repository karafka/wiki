Karafka's Routing Patterns is a powerful feature that offers flexibility in routing messages from various topics, including topics created during the runtime of Karafka processes. This feature allows you to use regular expression (regexp) patterns in routes. When a matching Kafka topic is detected, Karafka will automatically expand the routing and start consumption without additional configuration. This feature greatly simplifies the management of dynamically created Kafka topics.

## How it works

Routing Patterns is not just about using regex patterns. It's about the marriage of regexp and Karafka's topic routing system.

When you define a route using a regexp pattern, Karafka monitors the Kafka topics. As soon as a topic matching the pattern emerges, Karafka takes the initiative. Without waiting for manual interventions or service restarts, it dynamically adds the topic to the routing tree, initiates a consumer for this topic, and starts processing data.

Below, you can find a conceptual diagram of how the discovery process works:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/routing_patterns/detection_flow.svg" />
</p>
<p align="center">
  <small>*This example illustrates how the detection process works. When Karafka detects new topics in Kafka, it will try to match them, expand routes, and process incoming data.
  </small>
</p>

Upon detecting a new topic, Karafka seamlessly integrates its operations just as with pre-existing ones. Notably, regexp patterns identify topics even during application initialization, ensuring compatibility with topics established prior, provided they haven't been previously defined in the routes.

## Enabling Routing Patterns

TBA

### ActiveJob Routing Patterns

TBA

## Limitations

TBA

## Example use-cases

TBA

## Summary

TBA
