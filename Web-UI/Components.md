# Web UI Components

Karafka Web UI is an intuitive tool that visually represents the metrics related to the operation status of Karafka processes. It centralizes data, offers insights into the system's health, and ensures that users can understand and analyze the functioning of their Karafka processes in real time.

## How Karafka Web UI Works

- **Tracking**: Every Karafka process is responsible for publishing metrics that reflect its operational status. This is done automatically every 5 seconds by default. This periodic data publishing is termed as `tracking`. It captures information granularly, offering insights into individual consumer operations and other related data.

- **Processing**: Once the tracking data is published, it isn't displayed directly on the Web UI. Instead, a specialized consumer dedicated to Karafka Web UI aggregates this raw data. The purpose is to transform this raw data into meaningful information that can be easily represented and interpreted. Creating representations or models around the tracking data makes it easier to understand and present. For this purpose, Karafka employs a separate consumer group, which gets activated when the Web UI is in use. This stage of converting raw data into structured models for presentation is termed `processing`.

- **Presenting**: After processing the data, the final step is to display it via the Web UI. This involves presenting the structured and aggregated data visually appealing and comprehensibly, ensuring you can easily gauge the status and health of your Karafka processes.

## Active Consumption vs. Storage Topics

It's important to understand how Karafka Web UI interacts with different topics:

- **Reports Topic (Active Consumption)**: Karafka Web UI actively consumes only the `karafka_consumers_reports` topic. You will see this consumer group subscription in your logs. This is the primary data source for tracking and processing consumer states.

- **Error and Other Topics (Key-Value Storage)**: Topics such as `karafka_errors` and `karafka_consumers_states` serve as key-value stores. While consumer errors and state information are **sent** to these topics by your Karafka processes, the Web UI does **not actively consume** them. Instead, the Web UI reads from these topics on-demand when you access specific pages (e.g., viewing errors in the UI). This is expected behavior and not a misconfiguration.

This design ensures efficient resource usage - only the reports topic requires continuous processing, while other data is accessed as needed.

Below you can find the diagram of the whole data flow:

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/web-ui-flow.svg" alt="karafka web ui data flow"/>
</p>

!!! note

    Please note, that this is an **abstract** flow visualisation. Karafka Web works well even when there is one `karafka server` process running.
