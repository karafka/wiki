Karafka Pro provides an advanced scheduling API that improves how consumption jobs are managed within a process. This introduction provides an overview of Karafka's advanced scheduling capabilities, emphasizing its control and flexibility in job execution and resource distribution.

The Scheduling API was designed to control when specific consumption jobs are placed on the processing queue. This API is not just a simple timer-based mechanism but a sophisticated controller that allows for precise and intelligent scheduling of tasks. The scheduling API provides:

1. **Granular Control Over Job Execution**: With this API, developers can dictate when a job enters the processing queue, enabling previously unattainable precision. This control is essential for scenarios where the timing of job execution is critical to the overall system performance.

2. **Efficient Resource Distribution**: By controlling when jobs are queued, the scheduling API facilitates granular resource allocation. This feature is handy in environments where resources are limited or must be distributed effectively among multiple tasks.

3. **Strategic Job Sequencing**: The API allows for the sequencing of jobs so that some can be withheld until others are completed. This capability is crucial for maintaining dependencies between tasks and ensuring that high-priority jobs are processed promptly.

4. **Adaptive Scheduling Based on System State**: Beyond static scheduling, the API can adapt job queuing based on the current system state. This means the scheduling decisions can respond to real-time conditions, such as workload changes, resource availability, or custom-defined metrics.

## Execution Model

Understanding the job execution model in Karafka is crucial for effectively utilizing the advanced scheduling API. This section explains how Karafka manages and executes jobs, focusing on the relationship between subscription groups, the scheduler, workers, and the jobs queue.

Karafka's interaction with Kafka and subsequent job processing are fundamentally based on two types of threads: the Listener and Worker thread(s). These threads serve distinct yet complementary data consumption and processing roles. Understanding the functions and interplay of these threads is critical to grasping how Karafka operates efficiently and effectively.

### Listener Threads

The Listener thread serves two critical functions:

1. **Fetching Data from Kafka**: The Listener thread constantly polls Kafka to retrieve messages. This continuous polling is essential to ensure that new data is fetched as it becomes available.

2. **Triggering Work Scheduling**: Once the Listener thread has successfully fetched messages from Kafka, its next responsibility is to trigger the scheduling of this work. This step is crucial as it involves handing the fetched messages to the scheduler. The scheduler then determines the appropriate time and order for these jobs to be processed based on the current system state and any custom logic defined within the scheduler.

The Listener thread, therefore, acts as the bridge between Kafka and Karafka's internal processing mechanisms, ensuring a steady flow of data into the system.

It is important to note that the Listener thread in Karafka is designed to recognize when not to poll more data from Kafka. This mechanism ensures that it refrains from fetching additional messages if the system is currently processing a workload or if certain conditions necessitating a data ingestion pause are met. Essentially, the Listener thread only polls for more data when the system is ready, thereby maintaining a balanced and efficient processing environment.

### Worker Threads

The Worker threads are where the actual processing of messages occurs. These threads are responsible for:

1. **Picking Up Jobs**: Worker threads monitor the job queue, where messages scheduled for processing are placed by the scheduler. When a job is available in the queue, a Worker thread picks it up for execution.

2. **Executing Jobs**: The primary function of a Worker thread is to process the jobs it picks from the queue.

In environments with high volumes of data or complex processing requirements, multiple Worker threads may be employed to handle the workload efficiently. This multi-threaded approach allows Karafka to process many messages concurrently, significantly enhancing throughput and reducing latency.

### Conclusion

The Listener and Worker threads in Karafka are central to its architecture, working in tandem to ensure efficient data flow and processing. The Listener thread's role in fetching data and triggering scheduling, combined with the Worker thread's job execution responsibilities, creates a robust and scalable system capable of handling the demands of real-time data processing with Kafka.

Below, you can find a simplified illustration of the cooperation of Listener and Worker threads and their connection via the jobs queue.

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/charts/scheduling_api/listeners_and_workers.svg" />
</p>
<p align="center">
  <small>*This example illustrates how Listener and Worker threads cooperate via the jobs queue.
  </small>
</p>

## Job Locking and Polling Synchronization

To effectively use Scheduling API, it is recommended to understand the Karafka polling mechanism and its relationship with the jobs execution layer. Understanding the interplay between them is crucial when writing custom schedulers.

- **Blocking Standard Non-Long Running Jobs**: Karafka's handling of standard, non-long-running jobs is inherently blocking in nature. This means that while a job from a particular subscription group is running, Karafka will not poll more data from Kafka. The rationale behind this design is rooted in Kafka's `max.poll.interval.ms` setting, which functions as a heartbeat for the polling process.

- **Automatic Blocking with Job Queues**: Jobs enqueued in Karafka's job queue automatically trigger a block on polling. This feature simplifies the management of job execution, as there is no need for explicit locking mechanisms for these jobs. By automatically blocking polling when a job is queued, Karafka reduces the complexity of job management. Developers don't have to implement lock mechanisms for standard job queueing operations manually.

- **Explicit Locking for Delayed Jobs**: Your scheduler may wait to place jobs on the jobs queue. In cases where a job needs to be delayed or withheld from immediate queuing, explicit locking is required. This is achieved using the jobs queue's `#lock` method. A locked job must be explicitly unlocked before it can be enqueued using the `#unlock` method. This lock-unlock mechanism allows developers to control the timing of job enqueuing while still adhering to Kafka's polling expectations.

- **Ensuring All Jobs are Enqueued**: A fundamental principle in Karafka's job management is that every job, regardless of its perceived importance or urgency, must eventually be enqueued unless given subscription group is in a recovery state. Discarding jobs, even if they appear unnecessary, can disrupt the delicate balance of the polling mechanism and lead to data consistency or lost messages. Ensure that all jobs are eventually enqueued. This applies to scenarios that seem irrelevant, for example, for topics revoked after a rebalance. Karafka's internal logic will detect if the job is no longer needed. In such cases, the worker will bypass the user-defined logic, preventing unnecessary processing and saving system resources. However, the scheduler still needs to schedule the work.

## Implementing a Scheduler

This section provides a guide on implementing and using a custom scheduler. It will cover the initialization of a scheduler, choosing the appropriate type (stateful or stateless), and using non-blocking methods.

!!! warning "Make Sure All Jobs Are Scheduled"

    Please ensure that every job provided to the scheduler gets scheduled except for the subscription group recovery case. It's okay if job scheduling is delayed, but all jobs must end up in the jobs queue. Not doing this can cause problems with how the system works.

### Types of Schedulers

You can build two primary types of schedulers: stateful and stateless. Each scheduling method in this API has a non-blocking counterpart, which is vital for specific use cases.

#### Stateful Schedulers

A stateful scheduler maintains state information across its scheduling runs. This means that the scheduler can retain the knowledge you want, including buffers for jobs, which can influence the execution of current or future tasks. Stateful schedulers are particularly useful in scenarios where the order and outcome of jobs are interdependent. Since the default API for building schedulers is fundamentally thread-safe, you do not have to use any locking mechanisms.

#### Stateless Schedulers

In contrast, a stateless scheduler does not retain state information from one task to the next. Each scheduling task is treated as an independent event without knowledge of past or future tasks. Stateless schedulers are more straightforward and may be preferable in scenarios where tasks are entirely separate.

### API Methods

!!! note

    Please note that each method described in the following section has a non-blocking counterpart. These are easily identifiable by their `on_` prefix. For instance, for the method named `manage`, its non-blocking equivalent is `on_manage`.

The custom scheduler should inherit from the `Karafka::Pro::Processing::Schedulers::Base` class and, depending on needs, should define following methods:

<table border="1">
    <thead>
        <tr>
            <th>Method</th>
            <th>Parameters</th>
            <th>Required</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>#schedule_consumption</code></td>
            <td>Array with consumption jobs</td>
            <td>Yes</td>
            <td>Executed when new consumption jobs are available that should be handled.</td>
        </tr>
        <tr>
            <td><code>#schedule_revocation</code></td>
            <td>Array with revocation jobs</td>
            <td>No</td>
            <td>Executed when new revocation jobs are available that should be handled. Implementation of this method is optional, as there is a default FIFO implementation done.</td>
        </tr>
        <tr>
            <td><code>#schedule_shutdown</code></td>
            <td>Array with shutdown jobs</td>
            <td>No</td>
            <td>Executed when new shutdown jobs are available that should be handled. Implementation of this method is optional, as there is a default FIFO implementation done.</td>
        </tr>
        <tr>
            <td><code>#schedule_idle</code></td>
            <td>Array with idle jobs</td>
            <td>No</td>
            <td>Executed when new idle jobs are available that should be handled. Implementation of this method is optional, as a default FIFO implementation is done. Idle jobs are internal and should only be played with if understood well.</td>
        </tr>
        <tr>
            <td><code>#schedule_periodic</code></td>
            <td>Array with periodic jobs</td>
            <td>No</td>
            <td>Executed when new periodic jobs are available that should be handled. Implementation of this method is optional, as a default FIFO implementation is done.</td>
        </tr>
        <tr>
            <td><code>#schedule_eofed</code></td>
            <td>Array with eofed jobs</td>
            <td>No</td>
            <td>Executed when new eofed jobs are available that should be handled. Implementation of this method is optional, as a default FIFO implementation is done.</td>
        </tr>
        <tr>
            <td><code>#manage</code></td>
            <td>None</td>
            <td>No</td>
            <td>Executed each time any job is finished and on each tick, which by default is every 5 seconds. This method allows for dynamic, state change-based scheduling. The default implementation of this method assumes a stateless scheduler and does nothing.</td>
        </tr>
        <tr>
            <td><code>#clear</code></td>
            <td>Id of the subscription group for which the underlying client is being reset.</td>
            <td>No</td>
            <td>Executed on critical crashes when Karafka needs to reset the underlying client connecting with Kafka. It should be used for the removal of jobs that are no longer associated with a client. The default implementation of this method assumes a stateless scheduler and does nothing.</td>
        </tr>
    </tbody>
</table>

Alongside the scheduler methods, you can find the job queue scheduler-related API methods below:

<table border="1">
    <thead>
        <tr>
            <th>Method</th>
            <th>Parameters</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>#&lt;&lt;</code></td>
            <td>Job</td>
            <td>Adds the job to the jobs queue from which workers pick jobs for execution.</td>
        </tr>
        <tr>
            <td><code>#lock</code></td>
            <td>Job</td>
            <td>Locks the polling process for a subscription group associated with this job. If this job is a regular blocking job and is not unlocked, the related group polling will not happen. Always use this method to withhold jobs from processing based on the scheduler's internal logic. Jobs should always be added to the jobs queue or locked to block the polling.</td>
        </tr>
        <tr>
            <td><code>#unlock</code></td>
            <td>Job</td>
            <td>Unlocks previously locked job so polling can resume once scheduling is done and there are no other subscription group locks.</td>
        </tr>
    </tbody>
</table>

Additionally, jobs themselves provide the following methods that can be useful when creating schedulers:

<table border="1">
    <thead>
        <tr>
            <th>Method</th>
            <th>Parameters</th>
            <th>Description</th>
        </tr>
    </thead>
    <tbody>
        <tr>
            <td><code>#group_id</code></td>
            <td>None</td>
            <td>Returns a given job subscription ID. Useful with <code>#clear</code> for obsolete jobs eviction upon recovery client resets.</td>
        </tr>
        <tr>
            <td><code>#finished?</code></td>
            <td>None</td>
            <td>Returns information if the given job has been finished. Useful when jobs are dependent on each other.</td>
        </tr>
    </tbody>
</table>

### Using a Custom Scheduler

The only thing you need to do to use a custom scheduler is to assign it during your Karafka setup process:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Make sure to assign the class and not the instance as it is dynamically built
    config.internal.processing.scheduler_class = MyCustomScheduler
  end
end
```

### Example Custom Scheduler

!!! note

    Besides viewing the example scheduler below, we encourage you to check Karafka's default schedulers in the Karafka sources for more real-life examples.

Below is an example scheduler that locks all jobs and ensures that only one job can run at a time. While this particular scheduler is probably not what you aim for, it illustrates healthy usage of locking, scheduling jobs, and storing jobs in an intermediate buffer before they are scheduled for execution.

```ruby
# This scheduler withholds processing of jobs all except one.
# It makes sure only one job can run, despite of the concurrency level
# Such scheduler instance operates on all subscription groups but this API is thread-safe so each
# of the methods is automatically wrapped with a mutex.
# This means, that no concurrency-safe primitives are needed here
class OneThreadScheduler < ::Karafka::Pro::Processing::Schedulers::Base
  def initialize(queue)
    super
    # Intermediate buffer to hold jobs that we do not want to immediately schedule
    @jobs_buffer = []
  end

  # Locks each job, so polling won't run and runs the manager that will schedule
  # one job for execution if no jobs running
  #
  # @param jobs_array [Array] array with jobs to schedule
  def schedule_consumption(jobs_array)
    jobs_array.each do |job|
      @jobs_buffer << job
      @queue.lock(job)
    end

    internal_manage
  end

  # This method runs each time any job is finished and every 5 seconds if no
  # jobs are being finished. This allows to create schedulers that can operate
  # based on changing external conditions
  def manage
    internal_manage
  end

  # Removes jobs that should not run due to a recovery reset.
  #
  # @param group_id [String] subscription group id needed to remove jobs that would be in the
  #   scheduler in case of a recovery reset
  def clear(group_id)
    @jobs_buffer.delete_if { |job| job.group_id == group_id }
  end

  private

  # Checks if there is at least one job running and if so, will do nothing.
  # If no work is being done and there is anything in the buffer, we take it, unlock and schedule
  # for execution
  def internal_manage
    @jobs_buffer.delete_if do |job|
      next unless @queue.statistics[:busy].zero?

      @queue << job
      @queue.unlock(job)

      true
    end
  end
end
```

## Concurrency And Ticking Frequency Management

Karafka's scheduling system is designed for efficient concurrency and ticking frequency management. A single scheduler operates in a multi-threaded environment across all subscription groups. This centralized approach helps manage tasks coherently. The system employs a mutex under the hood to prevent race conditions during scheduling, ensuring that multiple threads can operate without conflicting. Significantly, this scheduling lock does not block the worker threads from polling data, allowing for parallel processing of jobs.

The scheduler's ticking frequency, set by default to five seconds, can be adjusted in the settings to meet specific application needs. This ticking, crucial for job initiation, occurs independently in each subscription group listener thread. However, the frequency of these ticks is consistent with the configured value, ensuring a uniform approach to job processing.

Finally, Karafka emphasizes the need for the scheduler to be fast and efficient. Since the scheduler can block data polling, its performance is vital for maintaining the system's efficiency.

Below is an example of how to change the ticking interval to 2.5 seconds.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.internal.tick_interval = 2_500
  end
end
```

## Revocation and Shutdown Jobs Scheduling

In Karafka, revocation and shutdown jobs, much like consumption jobs, can technically be scheduled using custom logic. However, it is generally recommended to stick with the default scheduling behavior provided by the `Base` scheduler for these jobs. The primary reason for this recommendation lies in the nature of these jobs as lifecycle events.

Revocation and shutdown jobs are not frequent occurrences in the lifecycle of a Kafka application. They represent specific moments in the application's operation, such as when a consumer leaves a group (revocation), or the application shuts down (shutdown). Given their infrequent nature, these events rarely require the kind of complex scheduling logic that might be necessary for regular consumption jobs.
Another essential aspect is the interaction between these lifecycle jobs and the ongoing consumption jobs. When a consumption job for the same topic partition is withheld, one might wonder if it's appropriate to proceed with revocation or shutdown jobs. The answer is yes; running these jobs is reasonable and recommended. Karafka's design allows it to detect when a scheduled consumption job is no longer necessary – for instance if the consumer has already been revoked or shut down. In such cases, Karafka will not execute the redundant consumption job but will run the required housekeeping internal logic.

This approach ensures that the system remains efficient and responsive to its operational state without the need for complex custom scheduling logic for revocation and shutdown events. By default, the `Base` scheduler is well-equipped to handle these events effectively, making it advisable to rely on these built-in mechanisms for most use cases.

## Expired Jobs Scheduling

!!! note

    In Karafka, all jobs given to the scheduler must be scheduled, even if they seem redundant. This is essential for maintaining system integrity and efficiency. The only exception is for accumulated jobs of a subscription group under recovery.

In the event of a lost assignment in Karafka, it is crucial to understand the handling of all jobs, including those that may seem expired or no longer valid. Despite their apparent irrelevance, there is a necessity to schedule these jobs. This approach is not just about executing user-defined tasks; it also encompasses the execution of essential housekeeping and management routines within Karafka.

When a partition assignment is lost, it seems logical to discard any related jobs. However, Karafka places a significant emphasis on scheduling these jobs for several reasons:

1. **Running Housekeeping and Management Code**: Beyond user-defined tasks, Karafka performs various internal operations critical for the system's stability and efficiency. These operations include cleanup tasks, state updates, and other management activities vital for maintaining the integrity and performance of the system.

1. **Recognition of Lost Partitions**: Karafka is designed with the intelligence to recognize when a partition has been lost. In such cases, even though a job related to that partition is scheduled, the system can determine whether the execution of user code is still relevant or necessary.

1. **Selective Execution**: Upon scheduling, Karafka evaluates the context of each job. If the system identifies a specific job associated with a lost partition, it will refrain from executing the user code linked to that job. This selective execution ensures that resources are well-spent on tasks that are no longer applicable or necessary due to the changed state of the assignment.

1. **Maintaining System Coherence**: This scheduling process and then selectively executing or skipping jobs ensures that Karafka maintains a coherent state. It avoids scenarios where ignoring the scheduling of these jobs might lead to inconsistencies or missed execution of critical housekeeping tasks.

In summary, scheduling all jobs, including those that may initially appear expired or invalid due to a lost assignment, is a fundamental aspect of Karafka's design. This approach ensures that all necessary housekeeping and management routines are executed, maintaining the system's stability and integrity. Karafka's intelligent job evaluation mechanism is crucial in this process, ensuring that resources are used efficiently and that user code is only executed when relevant.

## Rejecting Jobs of a Subscription Group Under Recovery

In Karafka, during recovery scenarios, there's a specific exception to the usual job scheduling process:

1. **Recovery Process**: When Karafka encounters a critical error, it may need to reset the given subscription group connection to Kafka. This is part of its recovery mechanism.

1. **Clearing Jobs with `#clear` Method**: Karafka invokes the `#clear` scheduler method to facilitate this recovery, providing the ID of the subscription group being reset.

1. **Matching Jobs with `#group_id`**: Jobs in the scheduler that haven't been scheduled yet should be matched against this group ID using their `#group_id` method.

1. **Rejecting Specific Jobs**: Any unscheduled job associated with the group under-recovery should be removed instead of scheduled. This is done to prevent conflicts and ensure a smooth recovery process.

In essence, during recovery, your scheduler should selectively reject and remove unscheduled jobs related to the group in recovery, rather than scheduling them. This is the only exception to the general rule of scheduling all jobs.

## Assignments Aware Scheduling

Karafka includes a feature known as the "assignments tracker." Its primary function is to keep track of active assignments, materializing them by returning the routing topics and the appropriate partitions assigned at any given moment. This feature is automatically subscribed as part of Karafka, and it's designed to be lightweight from a computational standpoint, mainly operating during rebalances.

To understand the significance of the assignments tracker, let's draw a comparison with tools like Sidekiq. In Sidekiq, assignments are typically fixed, meaning that once a worker is assigned a particular queue, it remains static. However, Kafka's approach to work distribution is inherently dynamic due to its rebalancing protocol. This dynamism implies that the assignments for a given process, including topics and partitions, can change over time.

Adhering to a fixed workload distribution in a Kafka environment can be inefficient and lead to resource wastage. For instance, consider a scenario where a custom scheduler allocates 50% of workers to one topic and 50% to another. If the Kafka assignment only assigns one of these topics to a particular consumer group, 50% of the workers will remain idle, not performing any work. This example highlights the potential inefficiencies in a static workload distribution model within a Karafka setup.

Karafka addresses this issue by recommending the use of its assignments monitoring API when building complex schedulers. Through `Karafka::App.assignments`, users can access current assignments, allowing the scheduler to base its decisions on the actual assigned topics and partitions. This approach ensures the system can dynamically react to assignment changes, optimizing overall resource utilization. By constantly monitoring and adapting to the current state of topic and partition assignments, your scheduler can ensure that all workers are engaged efficiently, contributing to a more balanced and effective processing environment.

Below is an example of a custom scheduler dedicating an even number of workers based on the assigned topic count.

```ruby
class FairScheduler < ::Karafka::Pro::Processing::Schedulers::Base
  def initialize(queue)
    super
    @buffer = []
    @scheduled = []
  end

  def schedule_consumption(jobs_array)
    # Always lock for the sake of code simplicity
    jobs_array.each do |job|
      @buffer << job
      queue.lock(job)
    end

    manage
  end

  def manage
    # Clear previously scheduled job that have finished
    # We use it to track topics work that is already running
    @scheduled.delete_if(&:finished?)

    # If all threads are already running there is no point in more assignments
    # This could be skipped ofc as more would just go to the queue but it demonstrates that
    # we can also use queue statistics in schedulers
    return if queue.statistics[:busy] >= concurrency

    @buffer.delete_if do |job|
      # If we already have enough work of this topic, we do nothing
      next if active_per_topic(job) >= workers_per_topic

      # If we have space for it, we allow it to operate
      @scheduled << job
      queue.unlock(job)
      queue << job

      true
    end
  end

  def clear(group_id)
    @buffer.delete_if { |job| job.group_id == group_id }
  end

  private

  def concurrency
    Karafka::App.config.concurrency
  end

  # Count already scheduled and running jobs for topic of the job we may schedule
  def active_per_topic(job)
    @scheduled.count { |s_job| s_job.executor.topic == job.executor.topic }
  end

  # Get number of topics assigned
  # If there are more topics than workers, we assume 1
  def workers_per_topic
    (concurrency / Karafka::App.assignments.size.to_f).ceil
  end
end
```

## Example Use Cases

Here is a list of use cases where the Scheduling API can be useful:

- **Long-Running Jobs Management**: Scheduling API can effectively manage long-running jobs to prevent them from monopolizing resources. This ensures these jobs don't disrupt regular tasks or cause system imbalances, maintaining overall system efficiency and reliability.

- **Dynamic Resource Allocation Based on Traffic Volume**: Automatically adjust resource allocation in real-time based on the volume of incoming messages from Kafka. This helps in scaling up resources during peak times and scaling down during low-traffic periods.

- **Prioritization of Critical Jobs**: Implement prioritization within the job queue to ensure that critical or time-sensitive messages from Kafka are processed first, optimizing response times for high-priority tasks.

- **Resource Allocation Based on Job Complexity**: Schedule jobs to the queue based on their complexity, allocating more resources to complex jobs and fewer to simpler tasks, thus optimizing processing times and resource usage.

- **Resource Intensive Job Throttling**: Implement throttling for resource-intensive jobs. Schedule these jobs to balance the load on the system, preventing any single job type from monopolizing CPU, memory, or network bandwidth and ensuring stable system performance.

- **Job Prioritization Based on Data Urgency**: Prioritize and schedule jobs based on the urgency of the data they process. For instance, real-time analytics jobs can be given higher priority over batch processing jobs.

- **Adaptive Job Scheduling Based on Pattern Recognition**: Implement adaptive scheduling where the system learns from job execution patterns. For instance, if certain jobs take longer at specific times, the scheduler can adapt and allocate more time or resources accordingly.

## Summary

The Karafka Scheduling API provides advanced capabilities for managing consumption jobs within a process, emphasizing precise control and efficient resource distribution. It enables granular scheduling of tasks, sequencing of jobs, and adaptive scheduling based on the system's current state.

It supports custom scheduler implementation, with stateful and stateless options, and includes a variety of methods for job management. The API's design ensures concurrency and frequency management. Its flexibility and efficiency make it ideal for diverse scenarios, including long-running job management, dynamic resource allocation, and adaptive scheduling based on traffic patterns or job complexity.

## See also

- [Pro Scheduled Messages](Pro-Scheduled-Messages) - Message scheduling capabilities
- [Pro Recurring Tasks](Pro-Recurring-Tasks) - Recurring task execution
- [Pro Periodic Jobs](Pro-Periodic-Jobs) - Periodic job processing
