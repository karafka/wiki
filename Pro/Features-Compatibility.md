# Karafka Pro Features Compatibility

Karafka provides several features that can work together. Unless explicitly stated otherwise, Karafka Pro features should work with each other without any limitations

## Long Running Jobs + Virtual Partitions

Long-Running Jobs work together with [Virtual Partitions](Pro-Virtual-Partitions). All the Virtual Partitions consumers will respond to `#revoked?` if the partition is lost, similar to regular consumers.

## Enhanced Active Job + Virtual Partitions

Virtual Partitions **can** be used with Active Job without any limitations. The only thing worth keeping in mind is that the message payload for Active Job contains serialized job details and should not be deserialized in the partitioner.

The recommended approach is to use the Enhanced Active Job headers support to add a key that can be used for partitioning:

```ruby
class Job < ActiveJob::Base
  queue_as :jobs

  karafka_options(
    dispatch_method: :produce_async,
    partitioner: ->(job) { job.arguments.first[0] }
  )
end

class KarafkaApp < Karafka::App
  routes.draw do
    active_job_topic :jobs do
      virtual_partitions(
        partitioner: ->(job) { job.key }
      )
    end
  end
end
```

Please keep in mind that with Virtual Partitions, the offset will be committed after all the Virtual Partitions work is done. There is **no** "per job" marking as processed.

## Enhanced Dead Letter Queue + Virtual Partitions

Virtual Partitions can be used together with the Dead Letter Queue. This can be done due to Virtual Partitions' ability to collapse upon errors.

The only limitation when combining Virtual Partitions with the Dead Letter Queue is the minimum number of retries. It needs to be set to at least `1`:

```ruby
routes.draw do
  topic :orders_states do
    consumer OrdersStatesConsumer
    virtual_partitions(
      partitioner: ->(message) { message.headers['order_id'] }
    )
    dead_letter_queue(
      topic: 'dead_messages',
      # Minimum one retry because VPs needs to switch to the collapsed mode
      max_retries: 1
    )
  end
end
```

## Virtual Partitions + Transactions

Due to the Virtual Partitions' nature, message production transactions work entirely as expected. However, transactions involving offset storage operate in a simulated mode. This means that even if `#mark_as_consumed` is used within a transaction, it doesn't become part of the transaction itself. Instead, it's committed right after the transaction successfully ends. This creates an edge case: there could be inconsistencies if a consumer is killed or loses its assignment right after the Kafka transaction completes but before the consumer offset is sent to Kafka.

This behavior aligns with the principles of the underlying Virtual Offset Management system. This system is crafted to handle offsets in a way distinct from Kafka's native offset handling due to the underlying parallelization process. As a result, certain operations, like `#mark_as_consumed`, are executed outside the main transaction scope, which is a direct consequence of the design and functionality of the Virtual Offset Management.

The transactional behavior aligns with standard expectations in a collapsed virtual partition flow scenario. The associated offset is included in the transaction when a message is marked as consumed.

```ruby
class VirtualPartitionedEventsConsumer < ApplicationConsumer
  def consume
    transaction do
      produce topic: totals, payload: messages.payloads.sum(&:count).to_s

      # if this topic uses virtual partitions this will NOT be part of the transaction and will be
      # executed right after the transaction has ended.
      #
      # In case `#collapsed?` would be true, this will behave like a regular transaction
      mark_as_consumed messages.last
    end
  end
end
```

## Virtual Partitions + Offset Metadata Storage

In Karafka's Virtual Partitions, the offset_metadata_strategy setting, configurable during routing, dictates whether the system should use the most recent (`:current`) or the exact (`:exact`) metadata associated with a materialized offset, a choice crucial for aligning processing logic with data consistency requirements. For detailed usage and configuration, refer to [this](https://karafka.io/docs/Pro-Offset-Metadata-Storage/#interaction-with-virtual-partitions) Karafka documentation section.

## Routing Patterns + Dead Letter Queue

While Karafka's Routing Patterns feature integrates seamlessly with the Dead Letter Queue (DLQ) mechanism, developers are advised to exercise caution. Specifically, there's a potential issue where an imprecisely crafted regular expression could inadvertently match both primary and DLQ topics. This misconfiguration might result in messages from the DLQ being consumed in an unexpected loop, especially if the DLQ topic isn't explicitly targeted for consumption.

You can read more about this issue [here](https://karafka.io/docs/Pro-Routing-Patterns/#dlq-accidental-auto-consumption).

## Messages At Rest Encryption + Custom Headers Deserializer and Encryption

When using Karafka's encryption features, it's important to note that encryption may not work as expected if you use a custom headers deserializer. Custom deserialization of headers can alter how encryption headers are processed, potentially leading to issues in correctly encrypting or decrypting messages. In cases where custom headers deserialization is necessary, it is recommended to consult with Karafka Pro support for guidance to ensure that encryption functionalities are properly integrated and maintained within your application.

## Adaptive Iterator + Long-Running Jobs

Adaptive Iterator should not be used with Long-Running Jobs because their operating principles are fundamentally incompatible. Long-Running Jobs have their own resource lifecycle management, while Adaptive Iterator dynamically adjusts batch sizes based on processing speed. This combination leads to conflicting resource allocation, disrupted timeout mechanisms, and inconsistent offset commitment patterns.
