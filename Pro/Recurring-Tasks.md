This feature provides a mechanism for scheduling and managing recurring tasks within Kafka-based applications. It allows you to define tasks that run at specified intervals, using cron-like syntax, ensuring that essential tasks are executed at the right time without manual intervention. This feature uses Kafka as the state store, so no extra database or third-party components are needed.

```ruby
# Example schedule for recurring tasks and events
Karafka::Pro::RecurringTasks.define('1.0.0') do
  schedule(id: 'daily_report', cron: '0 0 * * *') do
    DailyReportJob.perform_async
  end

  schedule(id: 'cleanup', cron: '0 2 * * 7') do
    CleanupJob.perform_async
  end

  # Executed tasks can also be events, they do not have to be jobs per-se
  schedule(id: 'user_activity_summary', cron: '0 8 * * *') do
    Karafka.producer.produce_sync(
      topic: 'user_activities',
      payload: { event: 'daily_summary', date: Date.today.to_s }.to_json,
      key: 'user_activity_summary'
    )
  end
end
```

## How Does It Work?

Recurring Tasks use Kafka to manage scheduled tasks efficiently without needing third-party databases.

Karafka, with its unique approach, stores the state of each recurring task, including the last and next execution times, directly in a Kafka topic. This use of Kafka ensures that even if your application crashes or restarts, the task state is preserved, allowing Karafka to resume tasks accurately. Kafka also handles commands like `enable`, `disable`, or `trigger`, which are sent to and processed by the managing consumer, allowing for dynamic task management at runtime.

One key advantage of Recurring Tasks is its independence from external databases for managing task schedules. All necessary information is stored in Kafka, simplifying deployment and maintenance.

Karafka ensures that only one process executes tasks by using Kafka's partition assignment. Only the process assigned to the relevant topic executes the tasks, guaranteeing that different processes don't run them multiple times. This provides strong execution warranties, ensuring each task runs only once at a scheduled time.

In case of a process crash, Kafka automatically reassigns the partitions to another available consumer. The new process takes over task execution immediately, continuing from where the previous process left off. This automatic failover ensures high availability and seamless task execution continuity, even during unexpected failures.

## Using Recurring Tasks

To start using Recurring Tasks, follow a few essential setup steps. These tasks are not automatically enabled and require specific configurations in your application. Here's what you need to do:

1. **Add `fugit` To Your Gemfile**: First, add the `fugit` gem to your Gemfile. Fugit is a cron parsing library that is not included in Karafka's dependencies by default but is required for defining and managing recurring tasks.

1. **Enable Recurring Tasks in Routing**: Declare the `recurring_tasks` feature in your routing configuration.

1. **Create Required Kafka Topics**: Once the routing is configured, you need to create the necessary Kafka topics that the recurring tasks will use for scheduling, logging, and task management.

1. **Define a Schedule**: Finally, you must define the tasks and their schedules.

### Adding `fugit` To Your Gemfile

Fugit is a cron parsing library not included in Karafka's dependencies by default but is required for defining and managing recurring tasks. Add it to your Gemfile and run `bundle install`:

```ruby
# Other dependencies..
gem 'fugit'
gem 'karafka'
```

### Enabling Recurring Tasks in Routing

To enable the recurring tasks feature in your application, you must declare it in your routing configuration:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    recurring_tasks(true) do |schedules_topic, logs_topic|
      # Optional block allowing for reconfiguration of attributes when needed
      # You can also reconfigure other things when needed
      schedules_topic.config.replication_factor = 3
      logs_topic.config.replication_factor = 2
    end
  end
end
```

This will automatically create a special consumer group dedicated to the consumption of the schedules topic.

### Creating Required Kafka Topics

!!! Tip "Review Replication Factor Configuration"

    Before deploying to production, it is crucial to read the [Replication Factor Configuration for the Production Environment](Pro-Recurring-Tasks#replication-factor-configuration-for-the-production-environment) section. Ensuring the correct replication factor is set is vital for maintaining your Kafka topics' high availability and fault tolerance.

When `recurring_tasks(true)` is invoked, this command will automatically create appropriate entries for Karafka [Declarative Topics](Declarative-Topics). This means that all you need to do is to run the:

```bash
bundle exec karafka topics migrate
```

Two appropriate topics with the needed configuration will be created.

If you do not use Declarative Topics, please make sure to create those topics manually with below settings:

<table>
  <thead>
    <tr>
      <th>Topic name</th>
      <th>Settings</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>karafka_recurring_tasks_schedules</td>
      <td>
        <ul>
          <li>
            partitions: <code>1</code>
          </li>
          <li>
            replication factor: aligned with your company policy
          </li>
          <li>
            <code>'cleanup.policy': 'compact,delete'</code>
          </li>
          <li>
            <code>'retention.ms': 86400000 # 1 day</code>
          </li>
        </ul>
      </td>
    </tr>
    <tr>
      <td>karafka_recurring_tasks_logs</td>
      <td>
        <ul>
          <li>
            partitions: <code>1</code>
          </li>
          <li>
            replication factor: aligned with your company policy
          </li>
          <li>
            <code>'cleanup.policy': 'delete'</code>
          </li>
          <li>
            <code>'retention.ms': 604800000 # 1 week</code>
          </li>
        </ul>
      </td>
    </tr>
  </tbody>
</table>

#### Replication Factor Configuration for the Production Environment

Setting the replication factor for Kafka topics used by the recurring tasks feature to more than 1 in production environments is crucial. The replication factor determines how many copies of the data are stored across different Kafka brokers. Having a replication factor greater than 1 ensures that the data is highly available and fault-tolerant, even in the case of broker failures.

For example, if you set a replication factor of 3, Kafka will store the data on three different brokers. If one broker goes down, the data is still accessible from the other two brokers, ensuring that your recurring tasks continue to operate without interruption.

Here's an example of how to reconfigure the Recurring Tasks topics so they have replication factor of 3:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    recurring_tasks(true) do |schedules_topic, logs_topic|
      schedules_topic.config.replication_factor = 3
      logs_topic.config.replication_factor = 3
    end
  end
end
```

### Defining a Schedule

To define recurring tasks, use the `Karafka::Pro::RecurringTasks.define` method. This method allows you to specify the version of the schedule and define one or more tasks with their cron schedule and corresponding execution block.

!!! Tip "Task ID Naming Convention"

    The `id` field used in defining tasks must comply with the following regular expression: `/\A[a-zA-Z0-9_-]{1,}\z/`. This means that the `id` must consist only of alphanumeric characters, underscores (`_`), or hyphens (`-`). No spaces or special characters are allowed; it must be at least one character long.

```ruby
Karafka::Pro::RecurringTasks.define('1.0.0') do
  schedule(id: 'daily_report', cron: '0 0 * * *') do
    DailyReportJob.perform_async
  end

  schedule(id: 'cleanup', cron: '0 2 * * 7') do
    CleanupJob.perform_async
  end

  # Executed tasks can also be events, they do not have to be jobs per-se
  schedule(id: 'user_activity_summary', cron: '0 8 * * *') do
    Karafka.producer.produce_sync(
      topic: 'user_activities',
      payload: { event: 'daily_summary', date: Date.today.to_s }.to_json,
      key: 'user_activity_summary'
    )
  end
end
```

In this example:

- The `daily_report` task is scheduled to run every day at midnight.
- The `cleanup` task is scheduled to run every Sunday at 2 AM.
- The `user_activity_summary` task publishes a daily summary event to the `user_activities` topic every day at 8 AM.

## Configuration

The configuration for Recurring Tasks in Karafka is designed to be straightforward yet flexible. It allows you to fine-tune the behavior of your scheduled tasks to meet your application's specific needs.

The configuration for Recurring Tasks is done in the Karafka application's setup block. Here's how you might configure some basic settings:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other configurations...
    
    # Configuring Recurring Tasks
    config.recurring_tasks.group_id = 'custom_group_id'
    # Run the scheduler every 10 seconds
    config.recurring_tasks.interval = 10_000
    # Disable logging of task executions
    config.recurring_tasks.logging = false

    # You can also reconfigure used topics names
    config.recurring_tasks.topics.schedules = 'recurring_schedules'
    config.recurring_tasks.topics.logs = 'recurring_logs'
  end
end
```

### Key Configuration Options

- `group_id`: Defines the consumer group ID used for the recurring tasks. This allows you to isolate these tasks within a specific group.

- `producer`: Specifies the Kafka producer used for sending recurring tasks messages, like schedule updates and logs. Defaults to `Karafka.producer`.

- `interval`: Determines the interval (in milliseconds) the scheduler will run to check for tasks that must be executed. The default is 15,000 milliseconds (15 seconds).

- `logging`: Enables or disables the logging of task execution details. If set to true (the default), Karafka will log each task's execution, including both successful and failed attempts.

- `topics.schedules`: Specifies the Kafka topic used for storing and managing the task schedules. By default, this is set to `karafka_recurring_tasks_schedules`, but you can customize it to any topic name that suits your application's needs.

- `topics.logs`: Specifies the Kafka topic used for logging the execution of tasks. By default, this is set to `karafka_recurring_tasks_logs`. This topic stores logs of both successful and failed task executions, allowing you to monitor task performance and troubleshoot issues.

## Recurring Tasks Management

You can manage tasks dynamically using the following`Karafka::Pro::RecurringTasks` methods:

- **Enable a Task**: `Karafka::Pro::RecurringTasks.enable(task_id)` enables a specific task based on its `task_id`, allowing it to resume execution according to its schedule.

- **Disable a Task**: `Karafka::Pro::RecurringTasks.disable(task_id)` disables the task, preventing it from running until re-enabled.

- **Trigger a Task Manually**: `Karafka::Pro::RecurringTasks.trigger(task_id)` immediately triggers the execution of a task, bypassing the schedule.

When you call these methods, a Kafka command event is produced, which is then processed by the consumer responsible for managing the recurring tasks. This mechanism ensures that only the designated consumer executes the commands, maintaining consistency across your application.

If you use `'*'` as the `task_id`, the command will apply to all tasks available in the current schedule. This allows you to enable, disable, or trigger all tasks in one operation, giving you flexible control over task management.

```ruby
Karafka::Pro::RecurringTasks.define('1.0.0') do
  # Start it disabled by default
  schedule(id: 'daily_report', cron: '0 0 * * *', enabled: false) do
    puts "Running daily report task..."
  end

  schedule(id: 'cleanup', cron: '0 2 * * 7') do
    puts "Running cleanup task..."
  end
end

# Enable the daily report task
Karafka::Pro::RecurringTasks.enable('daily_report')

# Disable the cleanup task
Karafka::Pro::RecurringTasks.disable('cleanup')

# Trigger the daily report task immediately
Karafka::Pro::RecurringTasks.trigger('daily_report')

# Trigger all tasks immediately
Karafka::Pro::RecurringTasks.trigger('*')
```

## Schedule Versioning

Versioning is an optional feature that adds a layer of safety and consistency during rolling deployments. It helps ensure that tasks are only executed when the assigned process has an appropriate schedule version, preventing older instances from accidentally running outdated schedules.

When defining your recurring tasks schedule, you can specify a version number. This version is a safeguard during deployments, particularly in scenarios where multiple instances of your application might run simultaneously with both older and newer schedule definitions.

During a rolling deployment, there might be a brief period when some instances of your application are still running an older code version with a different schedule. If an older instance of your application receives recurring task assignments, it will recognize that the schedule is no longer compatible with its in-memory definition. The older instance will halt the execution of the task and will raise an error, preventing any outdated schedules from being run. This ensures that only the new schedule version is executed, maintaining consistency and avoiding potential issues caused by version mismatches.

If you don't specify a version, Karafka will operate without this safeguard. Regardless of its deployment stage, Karafka will attempt to execute the schedule it has in memory if it receives the schedules topic assignment. Versioning is recommended if you want to ensure that only the most up-to-date schedule is used during deployments.

## Tasks Execution Logging

By default, after each task is executed, Karafka produces a log entry in the recurring tasks logs topic. This log entry is created regardless of whether the task execution was successful or failed. 

### Benefits of Task Execution Logging

- **Auditability**: Logging each task execution provides a comprehensive audit trail, allowing you to track when tasks were executed and their outcomes. This is crucial for maintaining transparency and accountability in your system.
  
- **Monitoring and Debugging**: The log entries enable effective monitoring and debugging of task executions. By analyzing these logs, you can identify patterns of failures or performance issues and address them proactively.

- **Operational Insights**: The logs offer valuable insights into the operational efficiency of your recurring tasks, helping you optimize schedules and improve overall system performance.

### Logging Details

- **Successful Executions**: For tasks that are completed successfully, the log will record essential details such as task ID, execution time, and status.

- **Failed Executions**: In the event of a task failure, Karafka will record the failure status in the logs. However, it will not capture detailed error information, such as backtraces, in these logs. Instead, errors are published through Karafka's regular instrumentation pipeline, allowing detailed error tracking and handling through your existing monitoring tools.

Karafka's Web UI error tracking capabilities will automatically record and display failed task error details, similar to any other errors encountered.

### Viewing Execution Logs

Execution logs for your recurring tasks can be accessed in two primary ways:

1. **Web UI Explorer**: The Karafka Web UI provides an intuitive interface for exploring execution logs. The Web UI Explorer lets you easily view and analyze task execution history, identify patterns, and monitor system health. This visual approach is beneficial for quickly assessing the status of your tasks and detecting any anomalies.

2. **Karafka Admin APIs**: You can use the Karafka Admin APIs to read the logs topic directly for more programmatic access. This approach allows you to process the log messages customarily, such as integrating the data into your existing monitoring systems, triggering alerts based on specific log entries, or generating detailed reports on task execution performance.

```ruby
messages = Karafka::Admin.read_topic(
  'karafka_recurring_tasks_logs',
  0,
  100
)

messages.each do |message|
  log_data = message.payload
  puts "Task ID: #{log_data[:task][:id]}, " \
   "Result: #{log_data[:task][:result]}, " \
   "Executed At: #{log_data[:dispatched_at]}"
end
```

## Web UI Management

The Karafka Web UI provides comprehensive tools for managing and monitoring recurring tasks:

- **Inspect and Control Tasks**: You can view, enable, disable, and trigger recurring tasks directly from the Web UI. This allows for real-time management and ensures tasks run as expected.
  
- **Execution Logs**: The Web UI enables you to explore the logs of task executions, offering insights into when tasks were executed, their outcomes, and whether any issues occurred.

![karafka web ui](https://cdn.karafka.io/assets/misc/printscreens/web-ui/recurring-tasks.png)

## Error Handling and Retries

An important aspect of the Recurring Tasks feature is how it handles errors during task execution:

- **No Automatic Retries**: If a task fails (e.g., due to a transient error or an unexpected exception), it will not be automatically retried. The failure will be instrumented, but the scheduler will not attempt to rerun the task.

- **Error Logging**: All errors during task execution are instrumented. This can be used for monitoring and alerting purposes but does not provide any built-in retry mechanism.

It is recommended that tasks that require retry logic, error handling, or dead-letter queue (DLQ) management be queued into a background job.

```ruby
# example using  Karafka ActiveJob adapter
Karafka::Pro::RecurringTasks.define('1.0.0') do
  schedule(id: 'critical_operation', cron: '0 12 * * *') do
    CriticalOperationJob.perform_async
  end
end
```

## Execution Modes

In larger setups, it's advisable to run a dedicated consumer process for executing recurring tasks and managing the Web UI (if used) to prevent potential saturation with other workloads.

By isolating the recurring tasks execution in its own consumer process, you ensure that these tasks do not compete with other consumers for resources, which can be particularly important in high-throughput environments. This dedicated process will handle all scheduling and execution, leaving other consumers free to manage their specific workloads.

Karafka provides CLI flag to facilitate running only dedicated consumer groups:

```ruby
bundle exec karafka server --include-consumer-groups karafka_web,karafka_recurring_tasks
```

## Testing

Karafka provides easy access to the current schedule and the individual tasks within that schedule to facilitate testing of your recurring tasks.

You can access the current schedule via the `Karafka::Pro::RecurringTasks.schedule` method. This allows you to inspect the schedule, verify that tasks are correctly defined, and interact with the tasks programmatically.

Each task within the schedule can be accessed using the `Karafka::Pro::RecurringTasks.schedule.tasks` method. This method returns a hash where the keys are the task IDs, and the values are the corresponding task objects. This structure makes finding and working with specific tasks by their IDs easy.

For testing purposes, each task can be executed manually by invoking the `#execute` method on the task object. This method bypasses the cron schedule and any associated instrumentation, allowing you to directly test the task's functionality to ensure it works as expected without any side effects.

Here's an example of how you might define a schedule and test it:

```ruby
Karafka::Pro::RecurringTasks.define('1.0.0') do
  schedule(id: 'daily_report', cron: '0 0 * * *') do
    puts "Running daily report task..."
  end

  schedule(id: 'cleanup', cron: '0 2 * * 7') do
    puts "Running cleanup task..."
  end
end

# Access the current schedule
schedule = Karafka::Pro::RecurringTasks.schedule

# Access and manually execute the 'daily_report' task for testing
daily_task = schedule.tasks['daily_report']

# RSpec syntax just as a demo
expect { daily_task.execute }.not_to raise_error

# Access and manually execute the 'cleanup' task for testing
cleanup_task = schedule.tasks['cleanup']
# RSpec syntax just as a demo
expect { cleanup_task.execute }.not_to raise_error
```

## Warranties

Recurring Tasks provides strong execution warranties by leveraging Kafka’s robust architecture. With Kafka as the backbone, tasks are guaranteed to execute only once at their scheduled time, managed by the process that holds the partition assignment for the relevant topic.

- **Single Process Execution**: Karafka ensures that only one process can execute the scheduled tasks by assigning Kafka partitions to a single consumer. This prevents multiple processes from executing the same task simultaneously, offering a strong guarantee of task uniqueness and timing precision.

- **Automatic Failover**: In the event of a process crash, Kafka automatically reassigns the partitions to another available consumer. The new process immediately picks up from where the previous one left off, ensuring continuous task execution without losing the state or missing any scheduled runs.

- **Consistency Across Deployments**: With the optional versioning feature, Karafka further ensures that only the appropriate version of the schedule is executed, preventing older instances from running outdated tasks during rolling deployments.

## Limitations

- **Interval Granularity**: The smallest scheduling interval is one minute. Tasks can only be scheduled as frequently as this.

- **Task Complexity**: Tasks should be lightweight, as they run within the context of the consumer process. For heavy tasks, consider offloading the work to a background job processor.

- **Cron Syntax**: The cron syntax must be valid and recognized by the fugit gem, which powers the scheduling mechanism.

- **Task Uniqueness**: Task IDs must be unique within a schedule version to avoid conflicts.

- **Precision and Frequency Drift**: Karafka runs the scheduler every 15 seconds by default, with the next run starting 15 seconds after the previous one finishes. This can cause small timing drifts, especially if tasks take longer to complete. The interval is configurable.

- **Oversaturation Lags**: If the scheduler runs alongside other topic assignments and all workers are occupied, the scheduler may experience lags. By default, the scheduler is not prioritized over other consumers, which can lead to delays in task execution when system resources are constrained.

- **Expected Lag Reporting**: Due to how Recurring Tasks manage their offsets, their assignments always report a lag of at least 1. This is expected and normal but may initially seem surprising when viewed in the Web UI.

## Example Use-Cases

- **Regulatory Compliance and Auditing**: Schedule regular tasks to automatically generate and store compliance reports, ensuring your organization meets audit requirements without manual intervention.

- **Data Pipeline Orchestration**: Coordinate complex data processing pipelines by triggering different stages of ETL (Extract, Transform, Load) processes at scheduled intervals, ensuring that data flows seamlessly from one stage to the next.

- **SLA-Based Monitoring and Alerts**: Monitor service-level agreements (SLAs) by scheduling checks that ensure critical metrics are within acceptable thresholds. Automatically trigger alerts or remediation actions if SLAs are breached.

- **Automated Infrastructure Scaling**: Dynamically adjust cloud resources by scheduling scaling operations based on expected traffic patterns. For example, scale up resources during peak hours and scale down during off-peak hours to optimize costs.

- **End-of-Day Financial Reconciliation**: Automate the end-of-day reconciliation of financial transactions, ensuring that all accounts are balanced and any discrepancies are flagged for manual review.

- **Automated Backup and Disaster Recovery**: Schedule regular backups of critical data and systems and automate disaster recovery drills to ensure that your organization is prepared for unexpected outages.

- **User Engagement Events**: Trigger user engagement events, such as sending personalized notifications or emails based on user behavior or inactivity, at specific times to increase user retention.

- **Inventory Threshold Alerts**: Publish alerts to a messaging system when inventory levels fall below a certain threshold, allowing other systems or teams to react in real time.

- **Scheduled API Data Push**: Automatically push data to external APIs at scheduled intervals, such as sending daily summaries or hourly updates to third-party services.

- **Time-Based Feature Rollouts**: Publish events that trigger the gradual rollout or rollback of features to users based on time, enabling time-sensitive feature management.

- **Content Expiry Notifications**: Trigger notifications or events when certain content (e.g., licenses, subscriptions, or promotions) is nearing its expiration, prompting renewal or other actions.