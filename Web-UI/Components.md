# Web UI Components

Karafka Web UI is an intuitive tool that visually displays metrics related to the operational status of Karafka processes. It centralizes data, provides insights into the system's health, and enables users to understand and analyze the functioning of their Karafka processes in real time.

## How Karafka Web UI Works

- **Tracking**: Each Karafka process automatically publishes operational metrics every 5 seconds. This periodic data publishing, called `tracking`, provides detailed insights into individual consumer operations and related information.

- **Processing**: After tracking data is published, it is not shown directly on the Web UI. Instead, a dedicated consumer for Karafka Web UI aggregates the raw data and transforms it into meaningful information for display. Karafka uses a separate consumer group for this process, which is activated when the Web UI is in use. This conversion of raw data into structured models for presentation is known as `processing`.

- **Presenting**: After processing the data, the final step is to display it via the Web UI. This means presenting structured, aggregated data visually in an appealing, clear way so you can easily gauge the status and health of your Karafka processes.

## Active Consumption vs. Storage Topics

It is important to understand how Karafka Web UI interacts with different topics:

- **Reports Topic (Active Consumption)**: Karafka Web UI actively consumes only the `karafka_consumers_reports` topic. You will see this consumer group subscription in your logs. This is the primary data source for tracking and processing consumer states.

- **Error and Other Topics (Key-Value Storage)**: Topics such as `karafka_errors` and `karafka_consumers_states` serve as key-value stores. While consumer errors and state information are **sent** to these topics by your Karafka processes, the Web UI does **not actively consume** them. Instead, the Web UI reads from these topics on demand when you access specific pages (e.g., viewing errors in the UI). This is expected behavior and not a misconfiguration.

This design ensures efficient resource usage. Only the reports topic requires continuous processing, while other data is accessed as needed.

The following diagram illustrates how tracking consumers route data through Kafka before it reaches the processing layer and the web server:

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/web-ui-flow.svg" alt="karafka web ui data flow"/>
</p>

!!! note

    Please note, that this is an **abstract** flow visualisation. Karafka Web works well even when there is one `karafka server` process running.
