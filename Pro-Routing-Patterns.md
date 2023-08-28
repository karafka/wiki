Karafka's Routing Patterns is a powerful feature that offers flexibility in routing messages from various topics, including topics created during the runtime of Karafka processes. This feature allows you to use regular expression (regexp) patterns in routes. When a matching Kafka topic is detected, Karafka will automatically expand the routing and start consumption without additional configuration. This feature greatly simplifies the management of dynamically created Kafka topics.

## How it works

Routing Patterns is not just about using regex patterns. It's about the marriage of regexp and Kafka's topic routing system. When you define a route using a regexp pattern, Karafka monitors the Kafka topics. As soon as a topic matching the pattern emerges, Karafka takes the initiative. Without waiting for manual interventions or service restarts, it dynamically adds the topic to the routing tree, initiates a consumer for this topic, and starts processing data.



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
