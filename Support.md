# OSS Support Policy

## Terms And Conditions

Karafka's Open Source Software (OSS) support primarily revolves around assisting users with issues related to the Karafka and librdkafka ecosystems. This involves troubleshooting and providing solutions for problems originating from Karafka or its related subcomponents.

However, it is crucial to understand that the OSS support does **not** extend to application-specific issues that do not originate from Karafka or its related parts. This includes but is not limited to:

1. Incorrect application configurations unrelated to Karafka.
2. Conflicts with other libraries or frameworks within your application.
3. Deployment issues on specific infrastructure or platforms.
4. Application-specific runtime errors.
5. Problems caused by third-party plugins or extensions.
6. Data issues within your application.
7. Issues related to application performance optimization.
8. Integration problems with other services or databases.
9. Design and architecture questions about your specific application.
10. Language-specific issues are unrelated to Karafka or librdkafka.

We acknowledge that understanding your specific applications and their configuration is essential, but due to the time and resource demands, this goes beyond the scope of our OSS support.

!!! Hint "Enhance Your Karafka Experience with Pro Support"

    For users seeking assistance with application-specific issues, we offer a Pro version of Karafka. This subscription provides comprehensive support, including help with application-specific problems.

    For more information about our Pro offering, please visit [this](https://karafka.io/#become-pro) page.

## Karafka API End-User API Definition

The Karafka framework offers a range of functionalities to streamline building event-driven applications. Understanding what constitutes a Karafka API is essential for developers leveraging its capabilities. While Karafka provides various public methods and interfaces, it's crucial to discern which ones are intended for direct use by end users.

### Public Methods and Internal Usage

Not all public methods within the Karafka codebase are meant for direct user consumption. Some methods are publicly accessible but primarily intended for internal use by various components of the Karafka framework itself. This distinction arises due to the complex nature of building a framework or an ecosystem of gems, where numerous moving parts require public interfaces for framework developers rather than for end users.

### Official End-User API

Karafka delineates its official end-user API in its documentation to provide clarity and stability, available at [karafka.io/docs](https://karafka.io/docs/). This documentation outlines the recommended practices, configurations, and interfaces for developers building applications with Karafka. Any methods or interfaces not explicitly documented as part of this public API should be considered subject to change without prior notice.
