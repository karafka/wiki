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
11. Issues related to usage of outdated ecosystem libraries versions.

We acknowledge that understanding your specific applications and their configuration is essential, but due to the time and resource demands, this goes beyond the scope of our OSS support.

!!! Hint "Enhance Your Karafka Experience with Pro Support"

    For users seeking assistance with application-specific issues, we offer a Pro version of Karafka. This subscription provides comprehensive support, including help with application-specific problems.

    For more information about our Pro offering, please visit [this](https://karafka.io/#become-pro) page.

## Issue Reporting Guide

When reporting an issue within the Karafka ecosystem, providing detailed information is crucial for diagnosing and resolving the problem efficiently. 

!!! Warning "Complete Information Required"

    Failing to provide the below information may result in the issue **being closed** without assessment.

Please include as many of the following details as possible to help me understand and address the issue:

<table>
  <tr>
    <th>Detail</th>
    <th>Description</th>
  </tr>
  <tr>
    <td class="nowrap">Karafka Info</td>
    <td>Full result of running your project's <code>bundle exec karafka info</code> command.</td>
  </tr>
  <tr>
    <td class="nowrap"><code>karafka.rb</code> Content</td>
    <td>Provide your entire <code>karafka.rb</code> file, excluding sensitive details. To properly assess most issues, including all details in the <code>karafka.rb</code> file is essential.</td>
  </tr>
  <tr>
    <td class="nowrap">Karafka Ecosystem Components Details</td>
    <td>Provide versions of any Karafka ecosystem components you are using, such as <code>karafka-core</code>, <code>waterdrop</code>, <code>karafka-rdkafka</code>, and <code>karafka-web</code>.</td>
  </tr>
  <tr>
    <td class="nowrap">Operating System</td>
    <td>Your operating system and its version (e.g., <code>uname -a</code> on Unix-based systems or the Windows version).</td>
  </tr>
  <tr>
    <td class="nowrap">Kafka Version</td>
    <td>The version of Apache Kafka you are connecting to.</td>
  </tr>
  <tr>
    <td class="nowrap">Karafka Configuration</td>
    <td>Relevant configuration details from your <code>karafka.rb</code> and other configuration files.</td>
  </tr>
  <tr>
    <td class="nowrap">Error Messages</td>
    <td>The exact error messages or <strong>full</strong> stack traces you encounter.</td>
  </tr>
  <tr>
    <td class="nowrap">Debug Logs</td>
    <td>All <a href="/docs/Problems%2C-Troubleshooting-and-Debugging/#enabling-extensive-logging">debug logs</a> including debug logs from librdkafka.</td>
  </tr>
  <tr>
    <td class="nowrap">Reproduction Steps</td>
    <td>A clear and concise set of steps to reproduce the issue.</td>
  </tr>
  <tr>
    <td class="nowrap">Application Dependencies</td>
    <td>A list of gems and their versions that might be relevant (e.g., from your <code>Gemfile.lock</code>).</td>
  </tr>
  <tr>
    <td class="nowrap">Description of the Issue</td>
    <td>A detailed description of the problem, including what you expected to happen and what happened.</td>
  </tr>
  <tr>
    <td class="nowrap">Network Configuration (if applicable)</td>
    <td>Details about your network setup if you suspect network-related issues (e.g., firewall rules, proxies).</td>
  </tr>
  <tr>
    <td class="nowrap">Kafka Vendor and Deployment Details</td>
    <td>Specify the Kafka vendor you use (e.g., Confluent, MSK, self-hosted, etc.). Additionally, indicate whether the Karafka processes are running in the same availability zone as your Kafka brokers.</td>
  </tr>
  <tr>
    <td class="nowrap">Karafka Installation Method</td>
    <td>How you installed Karafka (e.g., using Bundler, manually from source).</td>
  </tr>
  <tr>
    <td class="nowrap">Karafka Environment</td>
    <td>The environment in which Karafka runs (e.g., development, production).</td>
  </tr>
  <tr>
    <td class="nowrap">Kafka Cluster Setup</td>
    <td>Information about your Kafka cluster setup (e.g., single-node, multi-node, cloud provider).</td>
  </tr>
  <tr>
    <td class="nowrap">Consumer Group Configuration</td>
    <td>Details about your consumer group configuration (e.g., number of consumers, partition assignments).</td>
  </tr>
  <tr>
    <td class="nowrap">Producer Configuration</td>
    <td>Configuration details for any Kafka producers you use.</td>
  </tr>
  <tr>
    <td class="nowrap">Additional Context</td>
    <td>Any other relevant context or information that might help in diagnosing the issue.</td>
  </tr>
</table>

## Karafka API End-User API Definition

The Karafka framework offers a range of functionalities to streamline building event-driven applications. Understanding what constitutes a Karafka API is essential for developers leveraging its capabilities. While Karafka provides various public methods and interfaces, it's crucial to discern which ones are intended for direct use by end users.

### Public Methods and Internal Usage

Not all public methods within the Karafka codebase are meant for direct user consumption. Some methods are publicly accessible but primarily intended for internal use by various components of the Karafka framework itself. This distinction arises due to the complex nature of building a framework or an ecosystem of gems, where numerous moving parts require public interfaces for framework developers rather than for end users.

### Official End-User API

Karafka delineates its official end-user API in its documentation to provide clarity and stability, available at [karafka.io/docs](https://karafka.io/docs/). This documentation outlines the recommended practices, configurations, and interfaces for developers building applications with Karafka. Any methods or interfaces not explicitly documented as part of this public API should be considered subject to change without prior notice.
