# Why Kafka and Karafka

Apache Kafka is a distributed event streaming platform built around a simple idea: instead of moving messages between services and deleting them after delivery, you write every event to an append-only, replicated log and let any number of consumers read from it independently. This single design decision changes what distributed systems can do, how they fail, and how they scale. This page explains why teams choose Kafka over simpler alternatives and how Karafka makes Kafka a first-class citizen in the Ruby and Rails world.

## The Core Difference: A Log, Not a Queue

Traditional message queues - including Sidekiq backed by Redis, RabbitMQ, and SolidQueue - are built around the concept of work delivery: a job goes in, a worker picks it up, and the queue forgets it ever existed. This model is excellent for background tasks that fit neatly into a command pattern ("send this email," "resize this image").

Kafka is built around a different abstraction: the **event log**. When something happens in your system, you append a record describing what happened. That record stays in Kafka. Every consumer who is interested in that event reads it on their own schedule, at their own pace, from their own position in the log. Kafka does not care how many consumers you have or whether they are keeping up.

This is not just an implementation detail. It fundamentally changes what you can build.

## What This Unlocks for Ruby and Rails Applications

Rails applications are naturally shaped around the request-response cycle. A user submits a form, a controller runs, and a response goes back. This works well until systems grow large enough that different parts of the application need to react to the same events, or until processing volumes exceed what a single synchronous stack can handle.

Kafka breaks the request-response constraint without requiring you to rewrite your application. Your Rails controllers continue handling HTTP traffic. Alongside them, you publish events to Kafka topics. Every other service - internal or external, Ruby or not - consumes those events independently. You achieve loose coupling without sacrificing consistency.

The practical consequences are significant:

- **New consumers cost nothing to add.** A new service that needs to react to `order.placed` events simply subscribes to the topic. The publishing side changes nothing. There is no tight coupling between producers and consumers.
- **Replay is possible.** If you ship a bug in a consumer, fix it, reset the consumer offset, and reprocess from the point of failure. With Sidekiq, those jobs are gone.
- **Multiple independent consumers read the same data.** Your analytics pipeline, your notification service, and your data warehouse can all read the same `user.signup` topic simultaneously without any of them affecting the others.
- **Cross-service communication becomes a data contract.** Publishing a well-defined event is a stable interface that other teams can depend on without coordinating deployments.

The Ruby and Rails ecosystem has historically lacked good tools for this pattern. Karafka exists to fill that gap.

## Kafka vs. the Alternatives

Choosing a message system is a trade-off. Here is how Kafka compares to the tools most Ruby teams already use:

<table>
  <thead>
    <tr>
      <th>Dimension</th>
      <th>Kafka / Karafka</th>
      <th>Sidekiq / Redis</th>
      <th>RabbitMQ</th>
      <th>AWS SQS</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td><strong>Message persistence</strong></td>
      <td>Immutable log, configurable retention (hours to forever)</td>
      <td>Deleted after processing</td>
      <td>Deleted after acknowledgment</td>
      <td>Deleted after acknowledgment (up to 14 days max)</td>
    </tr>
    <tr>
      <td><strong>Replay</strong></td>
      <td>Yes - rewind any consumer to any offset</td>
      <td>No</td>
      <td>No</td>
      <td>No</td>
    </tr>
    <tr>
      <td><strong>Multiple independent consumers</strong></td>
      <td>Yes - unlimited consumer groups, zero interference</td>
      <td>No - one queue, one set of workers</td>
      <td>Partial - fan-out exchanges, but no replay</td>
      <td>No - one queue, one set of consumers</td>
    </tr>
    <tr>
      <td><strong>Ordering guarantees</strong></td>
      <td>Strict ordering within a partition</td>
      <td>None</td>
      <td>Per-queue only</td>
      <td>None (Standard); limited (FIFO, 300 msg/s cap)</td>
    </tr>
    <tr>
      <td><strong>Throughput ceiling</strong></td>
      <td>Millions of messages per second per cluster</td>
      <td>Tens of thousands per second</td>
      <td>Hundreds of thousands per second</td>
      <td>Scales, but per-queue limits apply</td>
    </tr>
    <tr>
      <td><strong>Language agnostic</strong></td>
      <td>Yes</td>
      <td>Ruby only</td>
      <td>Yes</td>
      <td>Yes</td>
    </tr>
    <tr>
      <td><strong>Consumer scaling model</strong></td>
      <td>Add consumers up to partition count; scale partitions independently</td>
      <td>Add Sidekiq processes</td>
      <td>Add consumers per queue</td>
      <td>Add consumers</td>
    </tr>
    <tr>
      <td><strong>Operational complexity</strong></td>
      <td>Medium</td>
      <td>Low</td>
      <td>Medium</td>
      <td>Very low (managed)</td>
    </tr>
  </tbody>
</table>

## Key Kafka Capabilities

### Key Kafka Capabilities / Throughput and Latency

Kafka's architecture is optimized for sustained high throughput. Sequential disk writes, zero-copy I/O via `sendfile`, and aggressive batching at every layer allow Kafka to move data at rates that other systems cannot match without significant infrastructure.

A single Karafka process can comfortably handle tens of thousands of messages per second. At the cluster level, throughput scales horizontally by adding brokers and partitions.

### Key Kafka Capabilities / Durability and Replication

Kafka writes every message to disk immediately and replicates it across a configurable number of brokers. With a replication factor of three - the standard production configuration - your data survives the loss of two brokers without losing a single message.

This durability differs from that of a transaction database. Kafka is not trying to be a database. It is trying to be an extremely reliable, extremely fast log that happens to outlast the processes reading from it.

Retention policies let you configure how long messages are kept: by time (retain for 7 days), by size (retain up to 100 GB), or indefinitely. Infinite retention makes Kafka a natural choice for an event store.

### Key Kafka Capabilities / Consumer Groups and Horizontal Scaling

Consumer groups are how Kafka distributes work across multiple processes. Every consumer in a group is assigned a subset of partitions. Each partition is processed by exactly one consumer at a time, giving you ordered, parallel processing without the overhead of coordination.

Adding more consumers to a group scales throughput linearly, up to the number of partitions. When you need more parallelism, add partitions. Kafka handles the rebalancing.

Crucially, different consumer groups are completely independent. Your analytics pipeline and your notification service both subscribe to the same topic. Kafka maintains separate offsets for each group. Neither knows the other exists, and neither can affect the other's progress.

### Key Kafka Capabilities / Ordering

Within a partition, Kafka guarantees that messages arrive in exactly the order they were produced. Messages with the same key are always routed to the same partition. This gives you per-entity ordering without giving up parallelism.

If you need to ensure all events for a given user, order, or account are processed in sequence, use that entity's ID as the message key. Kafka handles the rest.

This is a meaningful advantage over typical queueing systems, which offer no ordering guarantee, and over SQS Standard, which explicitly does not guarantee ordering.

## Decoupling: The Biggest Practical Win

The most significant long-term benefit of adopting Kafka is not throughput or durability. It is **decoupling**.

In a tightly coupled Rails monolith or microservices architecture, every component that needs to react to an event must be wired up directly: callbacks, service calls, HTTP requests, Sidekiq jobs triggered from within the same transaction. Adding a new consumer of that event means modifying the producer. Removing one requires coordination. Testing the producer in isolation becomes difficult.

With Kafka, the producer publishes an event and stops caring. It has fulfilled its contract. Every consumer subscribes and processes on its own terms. You can add, remove, deploy, or debug any consumer without touching the producer. You can bring up an experimental consumer against the production topic stream with zero risk to the main application.

This is the design pattern that makes large systems maintainable.

## When Kafka Is the Right Choice

Kafka tends to be the right choice when:

- You need events consumed by more than one service or component independently
- You need to replay historical events - for backfills, migrations, audits, or bug recovery
- You are building across multiple services in different languages
- You need strict per-entity event ordering
- You are implementing event sourcing or CQRS patterns
- You want to decouple producers and consumers so they can be deployed and scaled independently

## When Kafka Is Not the Right Choice

Kafka adds real operational complexity. It is **not** the right tool for every situation.

Sidekiq is simpler, well-understood, and sufficient for the vast majority of Rails background processing. If your use case is "send a welcome email when a user signs up" or "generate a PDF in the background," you do not need Kafka.

Consider staying with simpler alternatives when:

- You are processing simple, self-contained background jobs with no replay or fan-out requirements
- Your volumes are low (thousands of messages per day, not per second)
- You have no need for multiple independent consumers of the same events

!!! tip "Start with managed Kafka"
    If Kafka is the right fit but operational complexity is a concern, consider starting with a managed service such as Confluent Cloud or Amazon MSK. You get the full Kafka API with significantly reduced operational burden. Karafka works with all of them.

## Kafka Queues: Queue Semantics Coming to Kafka

Kafka has historically required partitioning upfront: you need to know how much parallelism you want and configure partitions accordingly. Consumer groups are limited to one consumer per partition, which can make certain workloads - those that need many workers processing jobs from a single stream - harder to express naturally.

KIP-932 introduces **share groups**, a new consumer model that brings queue-like semantics to Kafka. Share groups allow multiple consumers to cooperatively consume from the same partition with individual per-message acknowledgment. Each message can be accepted, released for retry, or rejected after a configurable number of delivery attempts. Unlike traditional consumer groups, share groups have no upper bound on consumer count tied to partition count.

This closes the gap between Kafka and classic message queues for workloads that benefit from it, while keeping all of Kafka's durability, replication, and multi-consumer group capabilities intact.

!!! note "Kafka Queues support in Karafka is under development"
    Karafka has committed to supporting Kafka Queues (KIP-932 / share groups) once the underlying librdkafka driver implements the protocol. The feature reached production-ready status in Kafka 4.2 (February 2026). librdkafka support is on the near-term roadmap. Karafka will add support as soon as the driver is ready - follow [GitHub issue #2953](https://github.com/karafka/karafka/issues/2953) for updates.

    In the meantime, Karafka Pro's [Virtual Partitions](https://karafka.io/docs/Pro-Virtual-Partitions) and [Parallel Segments](https://karafka.io/docs/Pro-Parallel-Segments) provide high-concurrency processing options for workloads that would benefit from queue-like parallelism.

## Where Karafka Fits

Karafka is a production-ready Ruby and Rails framework for building Kafka consumers. It handles the operational concerns that would otherwise fall on you: consumer lifecycle management, offset committing, partition rebalancing, multi-threaded processing, error handling, and observability.

WaterDrop, part of the same ecosystem, handles the producer side - publishing messages to Kafka topics from any Ruby process, including Rails controllers, ActiveJob callbacks, and Rake tasks.

Karafka Web UI rounds out the picture on the operational side. It is a self-hosted monitoring interface that gives you real-time visibility into consumer group health, partition lag, message throughput, and individual consumer status - all without leaving your browser and without any external dependencies beyond what you already run. When something goes wrong at two in the morning, you will want it.

Together, these three components give you the full Kafka integration surface within familiar Ruby idioms: WaterDrop for producing, Karafka for consuming, and a Web UI for observing and exploring.

![Karafka Web UI dashboard](https://karafka.io/assets/misc/printscreens/web-ui.png)

## The Ecosystem Advantage

Karafka is used by thousands of companies in production - from early-stage startups processing their first event streams to enterprises moving billions of messages a day. That scale of adoption is not just a vanity metric. It is a direct, practical benefit to every user.

Every bug that surfaces in one environment gets fixed for all of them. Every edge case that bites a company running Kafka on degraded infrastructure becomes a hardened code path. Every disaster - lag spikes, rebalance storms, broker failures, poison-pill messages - that has been encountered and survived by someone in the community has shaped how Karafka handles the same scenario for you. You inherit years of battle-tested recovery protocols without having to experience the disasters yourself.

The same applies to capabilities. Features that started as specific production needs - Virtual Partitions, Long-Running Jobs, Parallel Segments, the Enhanced Dead Letter Queue - exist because real teams hit real limits and the solutions were folded back into the framework. When you adopt Karafka, you get the accumulated discoveries of an active ecosystem, not just the code that existed when you first ran `bundle install`.

## Administrative APIs and Operational Control

Kafka is operationally dense. Partitions need to be managed. Offsets need to be reset. Consumer groups need to be inspected, paused, or stopped cleanly without losing data. Topics need to be created, altered, and monitored. None of this is optional in a production system - it is the work that keeps everything running.

Karafka exposes extensive administrative APIs that make these operations first-class Ruby citizens. You can query cluster state, manage consumer group offsets, inspect topic configurations, and coordinate consumer lifecycle from within your application or from a Rake task - without dropping into the Kafka CLI or writing bespoke JVM tooling.

This matters most at the worst moments. When lag is climbing at two in the morning, the difference between resolving an incident in minutes and resolving it in hours is often whether you can act precisely and quickly from a familiar interface. Karafka's administrative APIs, combined with the Web UI, give you that leverage. Pause a consumer, inspect what is backed up, reset to a safe offset, and resume - without a deployment, without waking up a second person, and without guessing.

![Karafka Web UI health dashboard](https://karafka.io/assets/misc/printscreens/web-ui/health.png)

!!! tip "Karafka Pro extends administrative capabilities further"
    Karafka Pro adds enhanced operational tooling including granular consumer control, advanced offset management, and deeper Web UI integrations. For teams running Kafka at scale or with strict SLA requirements, these capabilities can reduce incident response time significantly.

## Practical Use Cases: What People Actually Build

The question "what would I actually use Kafka for?" comes up frequently. Below are concrete scenarios drawn from how teams use Kafka and Karafka in production.

### Marketplace Order Checkout That Triggers Ten Things at Once

A Rails marketplace app has a `PlaceOrder` service. Today, placing an order means: decrement inventory, capture the Stripe payment, email the buyer, notify the seller, generate a shipping label, update the search index so the listing shows "sold," push an event to the analytics warehouse, and enqueue a review-request email for 7 days later. All of that lives in one fat service object or a chain of Sidekiq jobs kicked off from a single controller action. Adding a loyalty points feature means editing the checkout code. Removing the review email means coordinating with whoever owns the order flow.

With Kafka, the checkout controller publishes a single `order.placed` event and returns a 200:

```ruby
# app/services/place_order.rb
class PlaceOrder
  def call(cart)
    order = Order.create!(cart: cart)

    Karafka.producer.produce_async(
      topic: 'orders',
      payload: { event: 'order.placed', order_id: order.id, items: order.items }.to_json,
      key: order.id.to_s
    )

    order
  end
end
```

Each downstream concern is an independent Karafka consumer. The inventory team writes theirs, the notification team writes theirs, and they never need to coordinate:

```ruby
# Inventory team owns this consumer - no checkout code changes needed
class InventoryConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      order = message.payload
      InventoryService.decrement(order['items'])
    end
  end
end

# Notification team owns this consumer - deployed independently
class OrderNotificationConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      order = message.payload
      OrderMailer.confirmation(order['order_id']).deliver_later
    end
  end
end
```

The team building the loyalty points feature subscribes to `orders` and ships without touching checkout. The team removing the review email deletes their consumer. Nobody coordinates.

### Stripe Webhook Ingestion Without Dropping Events

A SaaS billing system receives Stripe webhooks for subscription changes, payment successes, payment failures, and refunds. The naive approach processes them synchronously in the controller: look up the customer, update the subscription record, maybe send a dunning email. But when Stripe sends a burst of events during a billing cycle rollover, the controller blocks, response times spike, and Stripe starts retrying - creating duplicates.

With Kafka, the webhook controller does one thing:

```ruby
class StripeWebhooksController < ApplicationController
  def create
    Karafka.producer.produce_async(
      topic: 'stripe_webhooks',
      payload: request.raw_post,
      key: request.headers['Stripe-Signature']
    )

    head :ok
  end
end
```

The controller responds in under a millisecond. A Karafka consumer processes webhook events at its own pace, idempotently updating subscription records. A second consumer handles dunning emails. A third feeds the finance team's reconciliation dashboard. During a billing cycle spike, events queue up in Kafka and get processed steadily instead of overwhelming the web tier.

### User Profile Updates That Must Happen in Order

A Rails app lets users update their profile: name, email, avatar, notification preferences. Each update is a background job. With Sidekiq, if a user changes their email to `new@example.com` and then changes it again to `final@example.com`, there is no guarantee which job runs first. The user might end up with `new@example.com` because the second job finished before the first.

With Kafka, using the user ID as the message key guarantees every update for user 12345 goes to the same partition and is processed in exactly the order it was produced. The first email change processes, then the second. No race conditions, no locks, no retries.

```ruby
# The key: parameter ensures all updates for the same user
# land on the same partition and are processed in order
Karafka.producer.produce_async(
  topic: 'user_profile_updates',
  payload: { user_id: user.id, email: 'final@example.com' }.to_json,
  key: user.id.to_s
)
```

Karafka's [Active Job](Consumer-Groups-Active-Job) adapter lets you keep the standard `UpdateProfileJob.perform_later(user_id, changes)` pattern while gaining Kafka's ordering guarantees underneath.

### E-Commerce Fraud Detection With a Cancellation Window

An online store processes thousands of orders per hour. Some are fraudulent. The team wants a short window - say 5 minutes - between when an order is placed and when fulfillment begins, so the fraud detection model can score it. If the order is flagged, it gets moved to a review queue. If the customer cancels within the window, the cancellation is free.

[Delayed Topics](Pro-Delayed-Topics) handle this naturally: order events are delayed by 5 minutes before the fulfillment consumer sees them. During that window, a separate fraud-scoring consumer evaluates each order in real time. Flagged orders are moved to a [Dead Letter Queue](Consumer-Groups-Dead-Letter-Queue) for human review. Clean orders proceed to fulfillment after the delay.

![Delayed topics processing flow](https://karafka.io/assets/misc/charts/delayed_topics/flow.svg)

### Healthcare Portal With HIPAA Audit Trail

A patient portal lets doctors view medical records, nurses update medication lists, and patients access their own data. HIPAA requires a complete, tamper-proof audit trail of who accessed what, and when. Traditionally this means careful `after_action` callbacks writing to an audit table, hoping nothing gets missed.

With Kafka, every access event is published to an audit topic. Kafka's immutable, append-only log is the audit trail - records cannot be silently deleted or modified:

```ruby
class ApplicationController < ActionController::Base
  after_action :publish_audit_event

  private

  def publish_audit_event
    Karafka.producer.produce_async(
      topic: 'hipaa_audit_log',
      payload: {
        user_id: current_user.id,
        role: current_user.role,
        action: "#{controller_name}##{action_name}",
        resource: request.path,
        ip: request.remote_ip,
        timestamp: Time.current.iso8601
      }.to_json,
      key: current_user.id.to_s
    )
  end
end
```

One consumer writes to the compliance database. Another feeds the security team's anomaly detection. A third archives to cold storage for the legally required retention period. [Messages At Rest Encryption](Pro-Messages-At-Rest-Encryption) encrypts patient data in the Kafka log itself.

### Product Listing That Must Update Search, Recommendations, and Analytics

A seller on a marketplace publishes a new product listing. The listing needs to appear in Elasticsearch within seconds, the recommendation engine needs to know about it for "similar items" suggestions, the category counts on the browse page need updating, and the analytics warehouse needs the event for seller performance dashboards.

Without Kafka, the `ProductsController#create` action ends up calling four different services inline or enqueuing four tightly-coupled jobs. When the recommendations team wants to add a fifth consumer, they file a ticket with the marketplace team to add another job to the controller.

With Kafka, the controller publishes `product.listed` to a topic. Each downstream system has its own Karafka consumer group:

```ruby
# The marketplace team publishes once - that is their only responsibility
class ProductsController < ApplicationController
  def create
    @product = Product.create!(product_params)

    Karafka.producer.produce_async(
      topic: 'products',
      payload: { event: 'product.listed', product_id: @product.id }.to_json,
      key: @product.id.to_s
    )

    redirect_to @product
  end
end
```

```ruby
# The search team owns this consumer in their own service - no coordination needed
class SearchIndexConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      product = Product.find(message.payload['product_id'])
      SearchIndex.update(product)
    end
  end
end
```

The search team, recommendations team, browse team, and analytics team each deploy independently, process at their own pace, and the marketplace team never hears about it.

## See Also

- [Getting Started](https://karafka.io/docs/Basics-Getting-Started) - Install and configure Karafka in a new or existing Rails application
- [WaterDrop](https://karafka.io/docs/WaterDrop-Usage) - Produce messages from Ruby and Rails
- [Karafka Web UI](https://karafka.io/docs/Web-UI-Getting-Started) - Real-time monitoring for consumers, topics, and partition lag
- [Admin API](https://karafka.io/docs/Infrastructure-Admin-API) - Manage topics, consumer groups, and offsets from Ruby
- [Consumer Groups and Topics](https://karafka.io/docs/Basics-Consuming-Messages) - How Karafka maps consumer groups to Kafka topics
- [Pro Virtual Partitions](https://karafka.io/docs/Pro-Virtual-Partitions) - Multi-threaded processing within a single partition
- [Dead Letter Queue](https://karafka.io/docs/Consumer-Groups-Dead-Letter-Queue) - Handle unprocessable messages without blocking consumption
- [Kafka Best Practices](https://karafka.io/docs/Kafka-Best-Practices) - Topic design, partition sizing, and operational guidance
