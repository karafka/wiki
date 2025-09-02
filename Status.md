# Karafka Ecosystem Status

!!! info "About This Page"
    This page tracks external incidents and ecosystem-level disruptions that may affect Karafka, WaterDrop, and Web UI users. This is **not** a Karafka uptime status page, but a curated log of upstream issues, dependency problems, and third-party service disruptions relevant to the Karafka ecosystem.

!!! success "Current Status - All Systems Operational"
    No active incidents affecting the Karafka ecosystem at this time.

---

## Incident History

!!! success "[RESOLVED] August 4, 2025 - OpenSSL 3.0.17 Segmentation Faults"

    **Status:** Resolved  
    **Impact:** High  
    **Affected:** All Karafka and rdkafka-ruby applications with OpenSSL 3.0.17

    OpenSSL 3.0.17 introduced a critical regression in X509_LOOKUP methods that caused widespread segmentation faults in applications using native SSL connections, including rdkafka-ruby and all Karafka applications.

    **Symptoms:**
    Segmentation faults during SSL/TLS operations, application crashes on startup or during Kafka connections, intermittent crashes in containerized environments, and producer/consumer initialization failures with SSL.

    **Workaround:** Pin OpenSSL to version 3.0.16 or 3.0.17 revision 2 or higher

    **Resolution:** Fixed in OpenSSL 3.0.17-1~deb12u2 (released August 10, 2025) which reverted the problematic X509_LOOKUP changes

    **References:**
    - [OpenSSL Issue #28171](https://github.com/openssl/openssl/issues/28171)
    - [Debian Bug #1110254](https://bugs.debian.org/1110254)
    - [rdkafka-ruby Issue #667](https://github.com/karafka/rdkafka-ruby/issues/667)
