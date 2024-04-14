Karafka under the hood relies on `librdkafka` to manage Kafka connections. It is crucial to understand that `librdkafka` is **not** fork-safe, which means special care must be taken when managing Ruby processes interacting with Kafka. This document provides guidelines for handling forking in Karafka, especially under macOS and in environments using Rails' Spring loader.

!!! Tip "Ecosystem-Wide Recommendations"

    This guidance applies to all components of the Karafka ecosystem interacting with Kafka, including `rdkafka`, `karafka-rdkafka`, `WaterDrop`, and `Karafka`. Ensure these recommendations are followed to maintain system stability and prevent resource leaks.

## Fork Safety with `librdkafka`

When forking Ruby processes, ensuring there are no active connections to Kafka is required. Active connections include consumer, producer, and admin connections. Failing to close these connections before forking can leak file descriptors and other resources, potentially destabilizing your application.

## Karafka's Swarm Forking Strategy

Karafka uses forking in its [Swarm Mode](https://karafka.io/docs/Swarm-Multi-Process/). This process is carefully designed to ensure that forks occur only when no Kafka connections are active. After forking, new connections are established in the child processes, thus maintaining clean and safe operations.

## Forking Issues on macOS

Forking on macOS, particularly from macOS High Sierra (10.13) onwards, introduces additional challenges due to changes in how macOS handles system calls in forked processes. These issues can manifest as errors like:

- `[NSCharacterSet initialize] may have been in progress in another thread when fork()`
- Segmentation faults such as `/Users/dev_machine/.rvm/gems/ruby-3.3.0/gems/rdkafka-0.15.0/lib/rdkafka/config.rb:291: [BUG] Segmentation fault at 0x0000000000000110`

These errors indicate processes in the middle of certain operations during a fork, which macOS now handles differently.

For developers using macOS and Rails' Spring loader, managing forking can be particularly complex. This complexity arises because parts of `librdkafka` may not load correctly when Spring forks the Ruby process. To mitigate these issues, we recommend to establish a short-lived connection to a local development Kafka instance when Spring boots. This can be done using `Karafka::Admin.cluster_info` to ensure all necessary libraries are loaded and initialized correctly before Spring forks the process.

For more detailed information on macOS forking issues and solutions, see [Phusion's blog on Ruby app servers and macOS High Sierra](https://blog.phusion.nl/2017/10/13/why-ruby-app-servers-break-on-macos-high-sierra-and-what-can-be-done-about-it/).

## Conclusion

Forking in Ruby applications that use Karafka and `librdkafka` requires careful planning and implementation to prevent resource leakage and ensure stable operation. This is especially true on macOS, where changes to the system's handling of forks can lead to critical issues. By following the outlined best practices, developers can effectively manage these challenges in a multi-process environment.
