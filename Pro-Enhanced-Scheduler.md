**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Karafka Pro comes shipped with an Enhanced Scheduler.

The default scheduler schedules work in a FIFO (First-In, First-Out) order.

The Enhanced Scheduler uses a non-preemptive LJF (Longest Job First) algorithm.

This scheduler is designed to optimize execution times, especially on jobs that perform IO operations. When computing the order, it considers the potential time cost of executing jobs based on the in-process p95 time and number of messages.

For IO intense jobs, where the number of jobs exceeds the number of threads, this can provide gains up to **20%**.
