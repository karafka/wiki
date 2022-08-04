There are unavoidable differences when working in dev (`development` and `test` environments) and `production` that may impact your work experience:

1. Karafka `reload` mode should **not** be used in production.
2. You **should** create all the topics you need upfront in your production Kafka cluster.
3. You should **not** use `allow.auto.create.topics` set to `true` in production.
4. Once you stabilize your topics list, you should consider locking it in the development. It is a **common** thing to make typos and forget about them.
5. Please consider that the topics created using `allow.auto.create.topics` always have only one partition. This is ok for development, but you should create more partitions upfront for the production environment.
6. Remember that rolling deployment of `N` processes will create `N` rebalances. This may affect performance and stability.
7. Creating the topic manually or by sending the first message and then starting a consumer is recommended. Karafka refreshes cluster metadata information, but it may take over five minutes to notice a new topic.
8. In the development the `topic.metadata.refresh.interval.ms` is set by default to 5 seconds. This means that a topic that did not exist the moment you started Karafka will be discovered fast. It is **not** recommended in production, and the default is 5 minutes.
