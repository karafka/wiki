Karafka Web UI is an intuitive tool that visually represents the metrics related to the operation status of Karafka processes. It centralizes data, offers insights into the system's health, and ensures that users can understand and analyze the functioning of their Karafka processes in real time.

## How Karafka Web UI Works

- **Tracking**: Every Karafka process is responsible for publishing metrics that reflect its operational status. This is done automatically every 5 seconds by default. This periodic data publishing is termed as `tracking`. It captures information granularly, offering insights into individual consumer operations and other related data.

- **Processing**: Once the tracking data is published, it isn't displayed directly on the Web UI. Instead, a specialized consumer dedicated to Karafka Web UI aggregates this raw data. The purpose is to transform this raw data into meaningful information that can be easily represented and interpreted. Creating representations or models around the tracking data makes it easier to understand and present. For this purpose, Karafka employs a separate consumer group, which gets activated when the Web UI is in use. This stage of converting raw data into structured models for presentation is termed `processing`.

- **Presenting**: After processing the data, the final step is to display it via the Web UI. This involves presenting the structured and aggregated data visually appealing and comprehensibly, ensuring you can easily gauge the status and health of your Karafka processes.

Below you can find the diagram of the whole data flow:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/web-ui-flow.svg" alt="karafka web ui data flow"/>
</p>

**Note**: Please note, that this is an **abstract** flow visualisation. Karafka Web works well even when one `karafka server` process running.
