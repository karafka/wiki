# Unexpected Message Reprocessing

When using Karafka with batch consumption and a Dead Letter Queue (DLQ), it is possible to observe messages being processed more times than `max_retries` would suggest. This document explains the three primary causes of this behavior, how to identify which one applies, and what to do about each.

!!! note "Note"

    In the vast majority of reported cases, the root cause is one of the expected behaviors described below rather than a Karafka bug. That said, bugs have occurred in the past, and if none of these explanations fit your observations, sharing a minimal reproduction with the Karafka team is the right next step.

## Cause 1: Retry Counter Tracks Offset Position, Not Individual Messages

The `#attempt` counter and the DLQ retry counter both track **how many times Karafka has attempted to process starting from the current committed offset**, not how many times a specific individual message has been processed.

With `max_messages 100`, a full batch of up to 100 messages is pulled for each processing cycle. If messages 0-98 succeed but message 99 fails, and you have not called `mark_as_consumed` for each message individually, Karafka retries the entire batch from the last committed offset (the offset of message 0). Messages 0-98 are therefore reprocessed on every retry of message 99.

This is not a bug. It is the expected consequence of not tracking per-message consumption progress. Each of those earlier messages is processed `max_retries + 1` additional times despite never failing.

**How to avoid it:** Call `mark_as_consumed` (or `mark_as_consumed!`) for each message individually as it is successfully processed:

```ruby
class OrdersConsumer < ApplicationConsumer
  def consume
    messages.each do |message|
      process(message)
      mark_as_consumed(message)
    end
  end
end
```

With per-message offset marking, a retry only reprocesses the message that actually failed, not the entire preceding batch.

See also [Offset Management (Checkpointing)](Consumer-Groups-Offset-management) for a full discussion of offset marking strategies.

## Cause 2: DLQ Error Counter Is Shared Across the Batch

Without the `independent: true` flag on your DLQ configuration, Karafka treats the entire batch as a collective unit for error counting purposes. The retry counter does not reset between messages within a batch.

Consider a batch where message 4 fails three times before succeeding, and message 7 then fails. Because the error counter has already accumulated from message 4's failures, message 7 will be dispatched to the DLQ sooner than `max_retries` implies, because it has "inherited" part of the count.

The same counter accumulation can, in certain patterns, cause individual messages to be retried fewer times than expected rather than more, depending on which messages fail and in which order.

**How to fix it:** Add `independent: true` to your DLQ configuration and mark each message as consumed individually:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :orders do
      consumer OrdersConsumer

      dead_letter_queue(
        topic: 'orders_dlq',
        max_retries: 10,
        independent: true
      )
    end
  end
end
```

With `independent: true`, the error counter resets after each successfully consumed message, so each message is evaluated against `max_retries` on its own. See [Independent Error Counting](Consumer-Groups-Dead-Letter-Queue#independent-error-counting) for diagrams and further detail.

## Cause 3: Consumer Restart or Rebalance Resets the Retry Counter

The retry counter is held **in memory** for the duration of a consumer's current assignment. If any of the following occur mid-retry cycle, the counter resets to zero and `max_retries` effectively starts over for the affected message:

- The Karafka process restarts (deploy, crash, OOM kill)
- A partition rebalance reassigns the partition to the same or a different consumer instance
- The consumer group coordinator triggers a rebalance due to a heartbeat timeout

This means a message that has already been retried 9 times out of a configured `max_retries: 10` can receive a full new set of 10 retries after a restart or rebalance. Across multiple restarts the same message can be attempted many more times than `max_retries` alone would imply.

**What to do:** If idempotency is a requirement, implement it at the processing level (for example, using a database upsert keyed on message offset or a deduplicated identifier in the payload) rather than relying solely on the retry counter. Rebalances are a normal part of Kafka consumer group operation and cannot be eliminated entirely.

See [Error Handling and Back Off Policy](Consumer-Groups-Error-Handling-and-Back-Off-Policy) for background on how the retry cycle interacts with partition pause and resume.

## Diagnosing Which Cause Applies

| Observation | Likely cause |
| --- | --- |
| Messages that never fail are still processed multiple times | Cause 1: offset not marked per message |
| Later messages in a batch hit the DLQ with fewer retries than earlier ones | Cause 2: shared error counter without `independent: true` |
| Over-retrying correlates with deploys, pod restarts, or rebalance events | Cause 3: in-memory counter reset |
| None of the above, and the pattern is reproducible in isolation | Possible Karafka bug - report with a reproduction at [GitHub Issues](https://github.com/karafka/karafka/issues) |

You can use the `#attempt` method inside your consumer to observe the current retry count at runtime, and subscribe to `error.occurred` events for structured logging of each retry. See [Altering Consumer Behaviour upon Reprocessing](Consumer-Groups-Error-Handling-and-Back-Off-Policy#altering-the-consumer-behaviour-upon-reprocessing) for usage examples.
