# Karafka Ecosystem Status

!!! info "About This Page"
    This page tracks external incidents and ecosystem-level disruptions that may affect Karafka, WaterDrop, and Web UI users. This is **not** a Karafka uptime status page, but a curated log of upstream issues, dependency problems, and third-party service disruptions relevant to the Karafka ecosystem.

!!! success "Current Status - All Clear"
    No active advisories at this time.

## Incident History

!!! success "[RESOLVED] April 2026 - Karafka Statistics Memory Bloat on Large Clusters"

    - **Status:** Resolved
    - **Impact:** Medium
    - **Affected:** Karafka users running against clusters with high partition counts (thousands of partitions per topic)

    On large Kafka clusters, the statistics pipeline produced extensive payloads that caused excessive memory allocations on every statistics interval, along with noticeable RSS growth and GC pressure in long-running consumer and producer processes.

    **Symptoms:**

    - Steadily growing RSS memory in consumer and producer processes on large clusters
    - High CPU usage tied to statistics decoration and deserialization
    - Frequent GC collections correlated with the `statistics.interval.ms` cadence
    - Stats payloads in the megabytes range on long-running processes

    **Resolution:** Karafka Pro now ships with [Optimized Statistics Processing](https://karafka.io/docs/Pro-Optimized-Statistics-Processing) that automatically reduces the size and processing cost of statistics so they scale with the actual workload of a given process rather than the size of the cluster. The optimization is transparent and requires no configuration changes.

!!! success "[RESOLVED] March 2026 - Kafka Coordinator Recovery API"

    - **Status:** Resolved
    - **Impact:** Medium
    - **Affected:** Karafka users experiencing Kafka group coordinator `FAILED` state (`not_coordinator` errors)

    This is **not** a Karafka or librdkafka issue - it originates from bugs in Apache Kafka itself. Kafka group coordinator failures caused by broker-side conditions (log compaction races, OOM, unclean restarts, network partitions, and rolling maintenance windows) can leave consumer groups permanently stuck in `initializing` state. When the coordinator enters a `FAILED` state, all group operations (`JoinGroup`, `SyncGroup`, `OffsetCommit`, `DeleteGroup`) return `not_coordinator`, and restarting consumer pods does not resolve the issue.

    **Symptoms:**

    - Consumers stay in `initializing` state and never receive partition assignments
    - Karafka Web UI shows the consumer group as empty with no members
    - `rdkafka` logs report repeating `not_coordinator` errors
    - Other consumer groups on the same cluster work normally
    - Restarting consumer pods does not resolve the issue

    **Current Workarounds:**

    - Switch to [Direct Assignments](https://karafka.io/docs/Pro-Direct-Assignments) to bypass the coordinator entirely
    - Use Kafka CLI tools (`kafka-reassign-partitions`, `kafka-leader-election`, `kafka-consumer-groups`) to force a coordinator reload on a healthy broker
    - File a support ticket with your managed Kafka provider (MSK, Confluent Cloud) to apply upstream Kafka patches

    **Resolution:** The [`Karafka::Admin::Recovery` API](https://karafka.io/docs/Infrastructure-Admin-Recovery-API) has been shipped. It allows users to read committed offsets directly from the `__consumer_offsets` log (bypassing the broken coordinator), assess the blast radius across consumer groups, and migrate offsets to a new healthy consumer group - all without broker-level intervention.

!!! success "[RESOLVED] February 11, 2026 - Pro License Server Hardware Failure"

    - **Status:** Fully Resolved
    - **Impact:** Moderate
    - **Affected:** Karafka Pro users attempting to access the license server during the incident window

    A hardware failure on a network switch at Hetzner's infrastructure caused a temporary outage of the Karafka Pro license server. The incident began at approximately 2:47 PM CET and was fully resolved by 3:12 PM CET, resulting in approximately 25 minutes of downtime.

    **Incident Timeline (CET):**

    - 2:47 PM - Initial detection of Hetzner infrastructure issues
    - 2:51 PM - Migration process initiated
    - 3:09 PM - Backup server deployment started
    - 3:12 PM - Service fully restored

    **Response:** The automated disaster recovery system successfully performed server rotation, though the 15-minute threshold before activation meant some users experienced service interruption. Users requiring immediate access during the incident were offered offline (embedded) license setup as a workaround.

    **Improvements Implemented:**

    - Reduced failover activation threshold from 15 minutes to approximately 60 seconds
    - Relocated the standby server to a fully independent provider and datacenter, ensuring infrastructure-level isolation from the primary
    - Upgraded health checks from periodic to continuous 60-second interval monitoring with automatic traffic rerouting
    - Improved data synchronization frequency between primary and standby servers

    **Resolution:** These changes mean that a similar infrastructure failure would now result in under 1 minute of automatic failover, transparent to end users, compared to the ~25 minutes experienced during this incident.

!!! success "[RESOLVED] August 4, 2025 - OpenSSL 3.0.17 Segmentation Faults"

    - **Status:** Resolved
    - **Impact:** High
    - **Affected:** All Karafka and rdkafka-ruby applications with OpenSSL 3.0.17

    OpenSSL 3.0.17 introduced a critical regression in X509_LOOKUP methods that caused widespread segmentation faults in applications using native SSL connections, including rdkafka-ruby and all Karafka applications.

    **Symptoms:**
    Segmentation faults during SSL/TLS operations, application crashes on startup or during Kafka connections, intermittent crashes in containerized environments, and producer/consumer initialization failures with SSL.

    **Workaround:** Pin OpenSSL to version 3.0.16 or 3.0.17 revision 2 or higher

    **Resolution:** Fixed in OpenSSL 3.0.17-1~deb12u2 (released August 10, 2025) which reverted the problematic X509_LOOKUP changes

    **References:**
    - [OpenSSL Issue #28171](https://github.com/openssl/openssl/issues/28171)
    - [Debian Bug #1110254](https://bugs.debian.org/1110254)
    - [rdkafka-ruby Issue #667](https://github.com/karafka/rdkafka-ruby/issues/667)
