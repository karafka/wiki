There are unavoidable differences when working in dev (`development` and `test` environments) and `production` that may impact your work experience:

1. Karafka `reload` mode should **not** be used in production.
2. You **should** create all the topics you need upfront in your production Kafka cluster.
3. You should **not** use `allow.auto.create.topics` set to `true` in production.
4. Once you stabilize your topics list, you should also consider locking it in the development. It is a **common** thing to make typos and forget about them.
5. Please consider that the topics created using `allow.auto.create.topics` always have only one partition. This is ok for development, but you should create more partitions upfront for the production environment.
6. Remember that rolling deployment of `N` processes will create `N` rebalances. This may affect performance and stability.
