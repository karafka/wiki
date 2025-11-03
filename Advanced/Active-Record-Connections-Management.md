Karafka interacts with ActiveRecord in the context of database connection management. This integration is designed to ensure efficient resource use and stability during message processing.

## Rails and ActiveRecord Connection Management

Rails, with ActiveRecord, employs a connection pooling mechanism to manage database connections. Connection pooling aims to reuse existing connections, avoiding the overhead of establishing new connections for every database interaction. This mechanism is particularly beneficial in web applications and background job processing, where efficient database connections can significantly impact performance and scalability.

In a typical Rails application, ActiveRecord automatically manages database connections. It checks out connections from the pool when needed and returns them after the request or job is completed. However, in the context of background processing frameworks like Karafka, especially when dealing with database replicas, additional steps, as mentioned above, might be necessary to ensure connections are properly managed.

## Automatic Connection Management

When no database replication is involved, Karafka automatically manages ActiveRecord database connections. This means that after processing messages, Karafka releases the connections back to the ActiveRecord connection pool, preventing potential connection leakage and ensuring connections are available for other processes or threads that might need them.

## Dealing with Database Replicas

In database replication scenarios, Karafka requires manual intervention to ensure connections are appropriately handled. Specifically, for each database replica, connections need to be manually released back to the pool. This is achieved by subscribing to the `worker.completed` event, which signals the completion of a worker's messages processing task. Implementing a handler for this event allows for explicit connection management, ensuring that resources are correctly managed and reducing the risk of connection saturation.

```ruby
::Karafka::App.monitor.subscribe('worker.completed') do
  rails7plus = Rails.gem_version >= Gem::Version.new('7.0.0')

  # Replace this with the proper reference to the replica connections
  if rails7plus
    ActiveRecord::ReplicaBase.connection_handler.clear_active_connections!
  else
    ActiveRecord::ReplicaBase.clear_active_connections!
  end
end
```

## Dealing with Dead Database Connections

In production environments, database connections can sometimes become  "dead" or unusable due to various issues like network disruptions,  database restarts, or other unexpected problems. Rails, through ActiveRecord, provides mechanisms to handle such situations, ensuring your application can recover and continue functioning smoothly.

ActiveRecord includes a feature known as the connection "reaper." The reaper periodically checks connections in the pool and removes any dead or idle for too long. This helps maintain a pool of valid connections, but immediate action might be needed when a connection is found dead during a database operation.

ActiveRecord provides the `#verify!` method to handle dead connections dynamically. This method can be called to check if the current connection is still valid. If it is found invalid, `#verify!` will automatically attempt to re-establish it. This method is essential for ensuring that your application can recover from connection issues on the fly.

### Implementing Immediate Dead Connection Handling

The process of managing dead database connections in Karafka is straightforward. You should subscribe to the `error.occurred` event. This event is triggered for many errors, including when an error indicating a dead connection is detected. To handle this, you can simply call 'ActiveRecord::Base.connection.verify! ', which checks the connection and re-establishes it if needed.

```ruby
Karafka::App.monitor.subscribe('error.occurred') do |event|
  # Check if the error is a known dead connection error for your database
  case event[:error]
  when PG::ConnectionBad
    # For PostgreSQL
    ActiveRecord::Base.connection.verify!
  when Mysql2::Error::ConnectionError
    # For MySQL
    ActiveRecord::Base.connection.verify!
  # Add more cases here for other database-specific dead connection errors
  else
    # Handle other types of errors or log them
  end
end
```

!!! tip "Rails Reaper and Connection Verification Intervals"

    Rails reaper checks and verifies connections at fixed intervals (`reaping_frequency`). If many connections become dead, more than verifying the used one may be needed, as retries might pick another dead connection before the reaper runs. Implementing [granular backoffs](Pro-Granular-Backoffs), which wait longer than the reaping frequency, can help ensure successful retries.

## Conclusion

Karafka provides automatic database connection management for standard setups. However, when using database replicas, it's crucial to manage those connections to maintain system performance and stability manually. This process involves subscribing to Karafka's `worker.completed` event and explicitly releasing connections, ensuring they are available for subsequent use.

---

## See Also

- [Integrating with Ruby on Rails and other frameworks](Integrating-with-Ruby-on-Rails-and-other-frameworks) - Set up Karafka with Rails and ActiveRecord
- [Forking](Forking) - Understand connection handling when using forking and Swarm mode
- [Concurrency and Multithreading](Concurrency-and-Multithreading) - Manage database connections across threads
- [Resources Management](Resources-Management) - Optimize overall resource usage including database connections
- [Error Handling and Back Off Policy](Operations-Error-Handling-and-Back-Off-Policy) - Handle database connection errors and implement retry strategies
