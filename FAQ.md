1. [Does Karafka require Ruby on Rails?](#does-karafka-require-ruby-on-rails)
2. [Why there used to be an ApplicationController mentioned in the Wiki and some articles?](#why-there-used-to-be-an-applicationcontroller-mentioned-in-the-wiki-and-some-articles)
3. [Does Karafka require Redis and/or Sidekiq to work?](#does-karafka-require-redis-andor-sidekiq-to-work)
4. [Could an HTTP controller also consume a fetched message through the Karafka router?](#could-an-http-controller-also-consume-a-fetched-message-through-the-karafka-router)
5. [Does Karafka require a separate process running?](#does-karafka-require-a-separate-process-running)
6. [Can I start Karafka process with only particular consumer groups running for given topics?](#can-i-start-karafka-process-with-only-particular-consumer-groups-running-for-given-topics)
7. [Can I use ```#seek``` to start processing topics partition from a certain point?](#can-i-use-seek-to-start-processing-topics-partition-from-a-certain-point)
8. [Why Karafka does not pre-initialize consumers so all the callbacks can be executed in their context?](#why-karafka-does-not-pre-initialize-consumers-so-all-the-callbacks-can-be-executed-in-their-context)
9. [Why Karafka does not restart dead PG connections?](#why-karafka-does-not-restart-dead-pg-connections)
10. [Does Karafka require gems to be thread-safe?](#does-karafka-require-gems-to-be-thread-safe)
11. [When Karafka is loaded via railtie in test env, SimpleCov does not track code changes](#when-karafka-is-loaded-via-a-railtie-in-test-env-simplecov-does-not-track-code-changes)
12. [Can I use Thread.current to store data in between batches?](#can-i-use-threadcurrent-to-store-data-between-batches)
13. [Why Karafka process does not pick up newly created topics until restarted?](#why-karafka-process-does-not-pick-up-newly-created-topics-until-restarted)
14. [Why is Karafka not doing work in parallel when I started two processes?](#why-is-karafka-not-doing-work-in-parallel-when-i-started-two-processes)
15. [Can I remove a topic while the Karafka server is running?](#can-i-remove-a-topic-while-the-karafka-server-is-running)
16. [What is a forceful Karafka stop?](#what-is-a-forceful-karafka-stop)
17. [Can I use AWS MSK Serverless with IAM authentication?](#can-i-use-aws-msk-serverless-with-iam-authentication)
18. [Why can't I connect to Kafka from another Docker container?](#why-cant-i-connect-to-kafka-from-another-docker-container)
19. [How can I configure multiple bootstrap servers?](#how-can-i-configure-multiple-bootstrap-servers)
20. [Why, when using `cooperative-sticky` rebalance strategy, all topics get revoked on rebalance?](#why-when-using-cooperative-sticky-rebalance-strategy-all-topics-get-revoked-on-rebalance)
21. [What will happen with uncommitted offsets during a rebalance?](#what-will-happen-with-uncommitted-offsets-during-a-rebalance)

### Does Karafka require Ruby on Rails?

**No**. Karafka is a fully independent framework that can operate in a standalone mode. It can be easily integrated with any Ruby-based application, including those written with Ruby on Rails. Please follow the [Integrating with Ruby on Rails and other frameworks](https://github.com/karafka/karafka/wiki/Integrating-with-Ruby-on-Rails-and-other-frameworks) Wiki section.

### Why there used to be an ApplicationController mentioned in the Wiki and some articles?

You can name the main application consumer with any name. You can even call it ```ApplicationController``` or anything else you want. Karafka will sort that out, as long as your root application consumer inherits from the ```Karafka::BaseConsumer```. It's not related to Ruby on Rails controllers. Karafka framework used to use the ```*Controller``` naming convention up until Karafka 1.2 where it was changed because many people had problems with name collisions.

### Does Karafka require Redis and/or Sidekiq to work?

**No**. Karafka is a standalone framework, with an additional process that will be used to consume Kafka messages.

### Could an HTTP controller also consume a fetched message through the Karafka router?

**No**. Kafka messages can be consumed only using Karafka consumers. You cannot use your Ruby on Rails HTTP consumers to consume Kafka messages, as Karafka is **not** an HTTP Kafka proxy. Karafka uses Kafka API for messages consumption.

### Does Karafka require a separate process running?

**Yes**. Karafka  requires a separate process to be running (Karafka server) to consume and process messages. You can read about it in the [Consuming messages](https://github.com/karafka/karafka/wiki/Consuming-messages) section of the Wiki.

### Can I start Karafka process with only particular consumer groups running for given topics?

Yes. Karafka allows you to listen with a single consumer group on multiple topics, which means that you can tune up the number of threads that Karafka server runs, accordingly to your needs. You can also run multiple Karafka instances, specifying consumer groups that should be running per each process using the ```--consumer_groups``` server flag as follows:

```bash
bundle exec karafka server --consumer_groups group_name1 group_name3
```

### Can I use ```#seek``` to start processing topics partition from a certain point?

Karafka has a ```#seek``` consumer method that can be used to do that.

### Why Karafka does not pre-initializes consumers prior to first message from a given topic being received?

Because Karafka does not have knowledge about the whole topology of a given Kafka cluster. We work on what we receive dynamically building consumers when it is required.

### Why Karafka does not restart dead PG connections?

When running `karafka server` with a Rails application that uses ActiveRecord, if the database connection is terminated, the Rails HTTP server is able to reconnect with the database. However, the Karafka server is unable to do so. Any subsequent calls to the database fail with the following error:

```
PG::ConnectionBad: PQsocket() can't get socket descriptor
```

Related sub-questions:

-  Shouldn't the database connection be re-established in case it disconnects?
- What would be the recommended way to check if the database connection is still active?

#### Short answer

This is expected behavior because Karafka is meant to be a transaction supporting system for long-living consumers.

#### Long answer

Karafka consumers **are** persistent. It means, that multiple messages / message batches from the same topic and partition will be processed by **the same** consumer instance.

Thanks to that approach, it is super easy to implement flushing engines and support in memory computation and transactions (for example when listening to a topic with user state changes), without actually hitting the DB. There may be a case where you want to start a transaction and run it across several received batches and only close it (COMMIT) once everything is done. If Karafka would handle the reconnection on its own, there would be a chance that data is not being wrapped within a transaction, as the transaction would have ended with the disconnected connection. In a case like that, the code would keep running with an assumption that there's an active transaction. This could have a critical impact on some of the systems that rely heavily on SQL transactions.

But you may ask: **why Puma is restarting the connections?** Truth be told it is doing exactly the same thing as Karafka, just the operation scope is different. For Puma, we don't spin up a single cross-request transactions as HTTP requests by definition should be stateless. This means that we can easily "recover" from a disconnection event for a brand new request. Exactly the same happens within Sidekiq. Due to the fact, that it encourages you to use **reentrancy**, it will fail for the current job and within the new scope (after retry) it will reconnect. But the reconnection will take care of a new job (despite the fact that it is restarted - it is still new).

#### How can I make Karafka restart dead PG connections?

You can easily catch the ```ActiveRecord::StatementInvalid``` error and decide on your own how to handle a dead connection. If you do atomic (per received batch) operations, you can just catch this and run the `::ActiveRecord::Base.clear_active_connections!` method.

Depending on your approach towards building robust applications and providing reusable code, you may:

- **a)** separate this from your business logic and leave the retry to Karafka layer;
- **b)** make it part of your business logic (wouldn't recommend it).

For the solution **a)** you can clear the connections upon an error by defining a proper instrumentation handle:

```ruby
# This instrumentation will kick in on each error but will only clear connections
# when expected type of error is detected
class ActiveRecordConnectionsCleaner
  def on_error_occurred(event)
    return unless event[:error].is_a?(ActiveRecord::StatementInvalid)

    ::ActiveRecord::Base.clear_active_connections!
  end
end

# Subscribe with this cleaner to the message bus
Karafka.monitor.subscribe(ActiveRecordConnectionsCleaner.new)
```

That way, you don't have to worry about the retries within your business logic. Karafka will back off and retry after some time. Please be aware that you will have to design your software to support **reentrancy** especially if you're batch processing within a `#consume` operation.

If you decide to go with the solution **b)**, here's how you can implement it:

```ruby
class ApplicationRecord < ActiveRecord::Base
  self.abstract_class = true

  class << self
    def with_disconnection_retry
      yield
    rescue ActiveRecord::StatementInvalid
      ::ActiveRecord::Base.clear_active_connections!
      # You probably want to implement a counter and a custom error not to
      # end up with an endless loop
      retry
    end
  end
end
```

Now you can just use it for anything you need like so:

```ruby
def consume
  messages.each do |message|
    ApplicationRecord.with_disconnection_retry do
      Example.create!(message.payload['example'])
    end
  end
end
```

### Does Karafka require gems to be thread-safe?

Yes. Karafka uses multiple threads to process data, similar to how Puma or Sidekiq does it. The same rules apply.

### When Karafka is loaded via a railtie in test env, SimpleCov does not track code changes

Karafka hooks with railtie to load `karafka.rb`. Simplecov **needs** to be required [before](https://github.com/simplecov-ruby/simplecov#getting-started=) any code is loaded.

### Can I use Thread.current to store data between batches?

**No**. The first available thread will pick up work from the queue to better distribute work. This means that you should **not** use `Thread.current` for any type of data storage.


### Why Karafka process does not pick up newly created topics until restarted?

- Karafka in the `development` mode will refresh cluster metadata every 5 seconds. It means that it will detect topic changes fairly fast.
- Karafka in `production` will refresh cluster metadata every 5 minutes. It is recommended to create production topics before running consumers.

The frequency of cluster metadata refreshes can be changed via `topic.metadata.refresh.interval.ms` in the `kafka` config section.

### Why is Karafka not doing work in parallel when I started two processes?

Please make sure your topic contains more than one partition. Only then Karafka can distribute the work to more processes. Keep in mind, that all the topics create automatically with the first message sent will always contain only one partition. Use the Admin API to create topics with more partitions.


### Can I remove a topic while the Karafka server is running?

**Not recommended**. You may encounter the following errors if you decide to do so:

```
ERROR -- : librdkafka internal error occurred: Local: Unknown partition (unknown_partition)
ERROR -- : 
INFO -- : rdkafka: [thrd:main]: Topic extractor partition count changed from 1 to 0
ERROR -- : librdkafka internal error occurred: Broker: Unknown topic or partition (unknown_topic_or_part)
```

It is recommended to stop Karafka server instances and then remove and recreate the topic.

### What is a forceful Karafka stop?

When you attempt to stop Karafka, you may notice the following information in your logs:

```bash
Received SIGINT system signal
Stopping Karafka server
Forceful Karafka server stop
```

When you ask Karafka to stop, it will wait for all the currently running jobs to finish. The `shutdown_timeout` configuration setting limits the time it waits. After this time passes and any work in listeners or workers are still being performed, Karafka will attempt to forcefully close itself, stopping all the work in the middle. If you see it happen, it means you need to either:

- extend the `shutdown_timeout` value to match your processing patterns
- debug your code to check what is causing the extensive processing beyond the `shutdown_timeout`

In any case, it is **not** recommended to ignore this if it happens frequently.

### Can I use AWS MSK Serverless with IAM authentication?

No. IAM is a custom authentication engine that is not a part of the Kafka protocol and is not supported by `librdkafka`.

Karafka supports the standard SASL + SSL mechanisms available for MSK. You can read more about it [here](Deployment#aws-msk-cluster-setup).

### Why can't I connect to Kafka from another Docker container?

You need to modify the `docker-compose.yml` `KAFKA_ADVERTISED_HOST_NAME` value. You can read more about it [here](Setting-up-Kafka#connecting-to-kafka-from-other-docker-containers).

### How can I configure multiple bootstrap servers?

You need to define them comma-separated under `kafka` `bootstrap.servers` configuration key:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.client_id = 'my_application'

    # This value needs to be a string string with comma separated servers
    config.kafka = {
      'bootstrap.servers': 'server1.address:9092, server2.address:9092'
    }
  end
end
```

### Why, when using `cooperative-sticky` rebalance strategy, all topics get revoked on rebalance?

This behavior can occur if you are using blocking `mark_as_consumed!` method and the offsets commit happens during rebalance. When using `cooperative-sticky` we recommend using `mark_as_consumed` instead.

### What will happen with uncommitted offsets during a rebalance?

When using `mark_as_consumed`, offsets are stored locally and periodically flushed to Kafka asynchronously.

Upon rebalance, all uncommitted offsets will be committed before a given partition is re-assigned.
