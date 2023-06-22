## Enhanced Execution Stability

Karafka Pro comes with Enhanced Execution Stability improvements that significantly reduce the risks associated with involuntary revocations, which occur when partition ownership is transferred among consumers.

This mechanism minimizes the number of jobs in flight during such reassignments, thereby preventing potential race conditions and ensuring a stable, predictable execution environment, even during high-volume data processing and dynamic consumer scenarios.

## Enhanced Scheduler

Karafka Pro comes shipped with an Enhanced Scheduler.

The default scheduler schedules work in a FIFO (First-In, First-Out) order.

The Enhanced Scheduler uses a non-preemptive LJF (Longest Job First) algorithm.

This scheduler is designed to optimize execution times, especially on jobs that perform IO operations. When computing the order, it considers the potential time cost of executing jobs based on the in-process p95 time and number of messages.

For IO intense jobs, where the number of jobs exceeds the number of threads, this can provide gains up to **20%**.
