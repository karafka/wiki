# Web UI Transactions Support

Karafka's Web UI has been designed to support transactionally created data. This aligns with the increasing use of Kafka transactions for maintaining data consistency and atomicity across distributed systems.

There are a few things worth keeping in mind if you work with transactional data:

- **Dynamic Producer Types**: Karafka Web UI allows flexibility with its producer configuration. It's feasible to toggle your Karafka producer from transactional to non-transactional mode and vice versa, depending on the specific needs of a given process.

- **Offset-Based Explorer**: The Karafka Explorer operates on an offset-based system. This means that it does more than just showcase the user messages. Instead, it fully views the Kafka topic, including compacted offsets, system entries, and aborted messages represented as system records. This comprehensive view gives users a granular understanding of the topic's state and helps diagnose potential issues or anomalies.

    Below, you can find an example of how the Karafka Web UI reports topic looks when all the records are created using the transactional producer:

    <p align="center">
      <img src="https://cdn.karafka.io/assets/misc/printscreens/web-ui/explorer_transactional.png" alt="karafka web ui transactional explorer"/>
    </p>

- **Limitations with "Recent" Feature**: Given the offset-based nature of the Karafka Explorer, the "Recent" feature, which typically displays the latest entries, might encounter difficulties if the first ten pages predominantly consist of aborted messages and system entries.

- **Producer Locking & Web UI Impact**: An essential aspect to note is that when a WaterDrop transaction is initiated, the producer is locked to the specific thread executing the transaction. This means that other threads could be left waiting for the current transaction to complete. This thread-specific locking has implications for the Karafka Web UI's reporting and processing capabilities. For instance, if a user-initiated transaction lasts 30 seconds, the Karafka Web UI may be incapable of reporting states during this duration.

    To mitigate this, in case of heavy usage of transactions, users are advised to create and use a dedicated Web UI producer that operates alongside the default producer. By doing this, even if user code transactions take longer, the Web UI's capability to report states remains unaffected, ensuring consistent and uninterrupted monitoring.

## Configuring a Dedicated Web UI Producer

When initiating a WaterDrop transaction, the producer locks to the executing thread, preventing other threads from proceeding. This affects the Karafka Web UI; for example, a 30-second transaction might halt the UI's reporting for that duration.

When using transactions heavily within consumers paired with the Web UI, it's advised to set up a specific `Karafka::Web.producer`.
By default, if the Web UI producer isn't set, the system will default to `Karafka.producer`.

To optimize this, you can assign a dedicated producer during the Web UI's configuration phase. The example below demonstrates how to configure a dedicated producer that mirrors the Kafka setup but excludes the transactional aspect. Karafka Web UI only produces atomic data sets, so it doesn't require transactional data production. For better performance, a standard producer is recommended.

```ruby
Karafka::Web.setup do |config|
  # Create and assign producer that will be used by the Web UI components
  config.producer = ::WaterDrop::Producer.new do |p_config|
    # Use Karafka configuration.
    # You can also of course define all settings independently
    karafka_app_config = ::Karafka::App.config

    # Copy the kafka configuration hash
    kafka_config = karafka_app_config.kafka.dup
    # Remove transactions (will do nothing if not configured in the first place)
    kafka_config.delete(:'transactional.id')

    # Set the kafka configuration for the Web dedicated producer
    p_config.kafka = ::Karafka::Setup::AttributesMap.producer(kafka_config)

    # Use the same logger as Karafka
    p_config.logger = karafka_app_config.logger
  end
end
```

Once the dedicated Web UI producer is set up, it becomes the default for all Web UI components. It is pivotal in various tasks, from reporting consumer states and tracking producers' errors to publishing aggregated data states. Additionally, if there's a need to republish data, this producer facilitates the process directly from the Web UI.
