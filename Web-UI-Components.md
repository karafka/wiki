**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Karafka Web UI data aggregation is combined out of a few stages:

- Tracking - Refers to collecting per-consumer and other data related to each process's operations.
- Processing - Refers to taking the tracking data and building proper representation models around it for presentation.
- Presenting - Refers to all the work needed to present the data via the Web UI.

This conceptual separation impacts the Web code design. It is divided into three main pieces:

- `Tracking` - All the code related to per-process data tracking and reporting to Kafka
- `Processing`- All code related to processing the tracked data and their aggregation
- `Web` - All code related to the presentation layer

Below you can find the diagram of the whole data flow:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/charts/web-ui-flow.svg" alt="karafka web ui data flow"/>
</p>

**Note**: Please note, that this is an **abstract** flow visualisation. Karafka Web works well even when one `karafka server` process running.
