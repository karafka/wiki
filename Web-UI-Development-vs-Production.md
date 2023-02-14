Karafka Web UI can operate in production mode. It is, however, essential to understand how it works and its limitations.

To materialize and prepare the data for the Web UI, Karafka Web adds an additional consumer group to the routes. This is ok for a development environment as you usually run one or two `karafka server` instances in this mode.

It may not be, however, desirable to do this in production, mainly because it would be a waste of resources. Each Karafka server instance would subscribe to the reports topic, and all except one would do nothing.

For a production setup, we recommend you run one or two karafka server instances dedicated to the Web UI alongside your regular Karafka consumers and exclude the Web consumer group from the rest.

You can use the `--exclude-consumer-groups karafka_web` flag to start consumer processes that run only your consumer groups. Then, you can use the `--include-consumer-groups karafka_web` to start Karafka Web UI dedicated consumer instances. 

```bash
# Run below to start a consumer instance dedicated only to karafka_web operations
bundle exec karafka server --include-consumer-groups karafka_web

# Run below to start a consumer instance without the extra web consumer group
bundle exec karafka server --exclude-consumer-groups karafka_web
```

It is also worth pointing out certain other limitations of the Web UI:

- Karafka Web UI data explorer may not work well with compacted topics as it computes the paginated offsets manually. Per message display should work as expected, though.
- Karafka Web UI may be slow if you have more than 1 000 active consumer processes running. If you encounter this, please get in touch with us so we can work with you to optimize this case.

## Web UI topics replication factor

When running `bundle exec karafka-web install`, Karafka Web will create needed topics with the replication factor of `1`. Such a value may not be desirable in a production environment.

You can increase the replication factor by providing the `--replication-factor N` with `N` being the desired replication factor in your cluster:

```bash
bundle exec karafka-web install --replication-factor 5
```
