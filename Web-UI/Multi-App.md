# Multi-App Web UI Setup

Karafka Web UI can support data collection, aggregation, and presentation from multiple applications from the same environment in a single dashboard. This is particularly useful for anyone dealing with micro-services that operate in the same Kafka cluster and are part of the same application.

Here are the steps necessary to configure Karafka Web-UI to work in a multi-app mode:

1. Please follow the [Getting Started](Web-UI-Getting-Started) guidelines and configure **each** of the applications independently. You don't have to mount the routing in every application, but each app needs to be able to report to Kafka.

2. Mount the Web UI into one of your applications.

3. Disable aggregated metrics materialization in all the applications except one. One application **needs** to be able to materialize the metrics, and this application needs to use at least one `karafka server` instance. To disable metrics materialization, deactivate the reporting using the `Karafka::Web` configuration:

```ruby
# Put this at the end of your karafka.rb but BEFORE you activate the Web
Karafka::Web.setup do |config|
  # Set this to false in all apps except one
  config.processing.active = false
end
```

4. Use Karafka [Tagging API](Web-UI-Tagging) to tag each of the applications with its unique name:

```ruby
Karafka::Process.tags.add(:application_name, 'MyApp1')
```

5. Deploy all the applications, open the Web UI, and enjoy.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/printscreens/web-ui/multi-app.png" alt="karafka web multi-app processes view" />
</p>

!!! warning "Critical Setup Requirement"

    It is critical to ensure that no Karafka servers are reporting to the Web UI before executing the `bundle exec karafka-web migrate` command. This avoids conflicts and ensures the setup is accurate and functional.

    Having any Karafka server process report to the Web UI before it is correctly bootstrapped via `bundle exec karafka-web migrate` may lead to critical state inconsistencies and other hard-to-debug issues. These inconsistencies can disrupt the accurate materialization of metrics and state data, causing unreliable or incorrect information to be displayed in the Web UI. To maintain a stable and reliable setup, ensure the Web UI is fully initialized and migrated before starting any Karafka server processes.

## Limitations

While Karafka Web UI can handle multiple applications effectively, it's essential to understand that it perceives all these applications as a part of one cohesive system. In Karafka's eyes, the distinction between these applications is different from between different environments of the same application.

**Never** use the same setup with the same topics to handle reports from multiple environments like staging and production.

This is where the confusion and complications arise. Mixing data from different environments of the same application would be akin to rearranging the ingredients of two different recipes in the same bowl. The result can become unpredictable and unpalatable even if they share some common elements.

Mixing data from different environments (like staging and production) of the same application within that dashboard is **not advisable**.

There are several reasons why you should never use the same Karafka Web UI setup and the same Web UI topics for applications from multiple environments:

- **Data Collisions**: Since each environment (production, staging, development, etc.) has its unique data set and workload, having them report to the same topic can cause collisions. It might get complicated to segregate which data belongs to which environment, especially when data starts streaming in real time.

- **Ambiguity for Karafka**: Karafka is designed to handle and interpret data from topics based on specific expected patterns. When data from different environments with peculiarities stream into the same topic, Karafka will get confused. It will misinterpret the data or, worse, miss out on processing some critical data due to these discrepancies.

- **Unpredictable Web UI Behavior**: The Web UI is essentially a visual interface to the data. When it starts receiving mixed data, its behavior can become unpredictable. You might see overlapping information, duplicated records, or even data that does not belong to either environment but is an outcome of materializing them into aggregated representations.

- **Troubleshooting Difficulties**: In case of any issues or anomalies, troubleshooting will become a nightmare. Since you won't be able to identify which environment the problematic data is coming from immediately, the resolution will be delayed.

## Explorer Routing Awareness

The Karafka Web UI utilizes the routing awareness feature. Viewing messages in the Web UI Explorer automatically uses the deserializer specified in the routing setup. By doing so, whenever the Web UI displays messages from a specific topic, it utilizes the appropriate dedicated deserializer instead of defaulting to JSON.

!!! note "Deserialization Requirement"

    Keep in mind that you need to specify deserializes for all of the topics consumed by all of your applications to be able to view the relevant topics' data.

```ruby
# Web UI karafka.rb

class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  # Each topic can have custom deserializers and then, Web UI
  # will know how to deserialize and display the data correctly
  routes.draw do
    topic :incoming_requests do
      active false
      deserializers(
        payload: XmlDataDeserializer
      )
    end

    topic :events do
      active false
      deserializers(
        payload: AvroDeserializer
      )
    end

    topic :webhooks do
      active false
      deserializers(
        payload: JsonDeserializer
      )
    end
  end
end
```

## DLQ Routing Awareness

To ensure the Karafka Web UI is fully functional, particularly in identifying Dead Letter Queue (DLQ) topics, it's crucial to integrate DLQ topic references in **all** the applications directly within the `karafka.rb` configuration file of the application hosting the Web UI. This setup is essential because, without explicit routing references to DLQ topics, the Web UI lacks the context to distinguish these from regular topics, rendering it unable to accurately manage or display DLQ data.

Karafka applications leverage the routing configuration to define how messages from various topics should be understood, including deserialization and the Web UI presentation logic.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :incoming_requests do
      # Set it to inactive if this comes from different app
      # and should not be consumed
      active false

      # Indicate, that there is `general_dlq` topic that is
      # a DLQ to a different topic.
      # This definition is required for Web UI to understand
      # that topic named `general_dlq` is a DLQ topic
      dead_letter_queue(topic: :general_dlq)
    end
  end
end
```

In this configuration, the DLQ is defined with the topic marked explicitly for the Web UI's awareness. This setup ensures that the Web UI, when launched, can accurately reflect the state and contents of DLQ topics.

## Example Use Cases

This capability immensely benefits organizations that manage multiple applications or microservices but want a centralized monitoring and visualization solution. For instance:

- **Centralized Monitoring**: Instead of switching between multiple monitoring dashboards for each application, teams can monitor all their apps from a single Karafka Web UI dashboard.

- **Unified Data Presentation**: Aggregating data from different applications provides a holistic view of the entire system's performance, traffic, and other metrics, making it easier to identify patterns or issues that might span across multiple applications.

- **Efficiency & Cost Savings**: By using one platform (Karafka Web UI) for all applications, organizations can save on the costs and complexities of managing multiple monitoring solutions.
