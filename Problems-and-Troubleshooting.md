# Help!

Read below for tips.  If you still need help, you can:

* Ask your question in [The Karafka official Gitter channel](https://gitter.im/karafka/karafka)
* [Open a GitHub issue](../issues/new).  (Don't be afraid to open an issue, even if it's not a Karafka bug.  An issue is just a conversation, not an accusation!)

You **should not** email any Karafka committer privately. Please respect our time and efforts by sticking to one of the two above.

## Table of content

- [Why Karafka does not restart dead PG connections?](#why-karafka-does-not-restart-dead-pg-connections-)
  + [Short answer](#short-answer)
  + [Long answer](#long-answer)
  + [How can I make Karafka restart dead PG connections?](#how-can-i-make-karafka-restart-dead-pg-connections-)

## Why Karafka does not restart dead PG connections?

When running `karafka server` with a Rails application that uses ActiveRecord, if the database connection is terminated, the Rails HTTP server is able to reconnect with the database, however, Karafka server is unable to do so. Any subsequent calls to database fail with the following error:

```
PG::ConnectionBad: PQsocket() can't get socket descriptor
```

Related sub-questions:

-  Shouldn't the database connection be re-established in case it disconnects?
- What would be the recommended way to check if the database connection is still active?

### Short answer

This is an expected behavior because Karafka is meant to be transaction supporting system with long living consumers.

### Long answer

Karafka consumers **are** persistent. It means, that multiple messages / message batches from the same topic and partition will be processed by **the same** consumer instance.

Thanks to that approach, it is super easy to implement flushing engines and support in memory computation and transactions (for example when listening to a topic with user state changes), without actually hitting the DB. There may be a case where you want to start a transaction and run it across several received batches and only close it (COMMIT) once everything is done. If Karafka would handle the reconnection on its own, there would be a chance that data is not being wrapped within a transaction, as the transaction would have ended with the disconnected connection. In a case like that, the code would keep running with an assumption that there's an active transaction. This could have a critical impact on some of the systems that rely heavily on SQL transactions.

But you may ask: **why Puma is restarting the connections?** Truth be told it is doing exactly the same thing as Karafka, just the operation scope is different. For Puma, we don't spin up a single cross-request transactions as HTTP requests by definition should be stateless. This means that we can easily "recover" from a disconnection event for a brand new request. Exactly the same happens within Sidekiq. Due to the fact, that it encourages you to use **reentrancy**, it will fail for the current job and within the new scope (after retry) it will reconnect. But the reconnection will take care of a new job (despite the fact that it is restarted - it is still new).

### How can I make Karafka restart dead PG connections?

You can easily catch the ```ActiveRecord::StatementInvalid``` error and decide on your own how to handle a dead connection. If you do atomic (per received batch) operations, you can just catch this and run the `::ActiveRecord::Base.clear_active_connections!` method:

```ruby
# We work with an assumption that you process messages one by one here and that you have a root key namespace for your JSON data
def consume
 Example.create!(params.value['example'])
rescue ActiveRecord::StatementInvalid
  ::ActiveRecord::Base.clear_active_connections!
  retry
end
```

Depending on your approach towards building robust applications and providing reusable code, you may:

- **a)** separate this from your business logic and leave it with a retry on the abstract Karafka layer as long as you understand what you are doing;
- **b)** make it part of your business logic (wouldn't recommend).

For the solution **a)** you can easily extend Karafkas ``ApplicationConsumer#call`` method as followed:

```ruby
# frozen_string_literal: true

class ApplicationConsumer < Karafka::BaseConsumer
  def call
    super
  rescue ActiveRecord::StatementInvalid => e
    BugTracker.notify(e)
    ::ActiveRecord::Base.clear_active_connections!
    # You probably want to implement a counter and a custom error not to
    # end up with an endless loop
    retry
  end
end
```

That way, you don't have to worry about the retries within your business logic, but please be aware of the fact, that you will have to design your software to support **reentrancy** especially if you're batch processing within a `#consume` operation.

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
  ApplicationRecord.with_disconnection_retry do
    Example.create!(params.value['example'])
  end
end
```
