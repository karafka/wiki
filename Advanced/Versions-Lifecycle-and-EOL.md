This page lists the current maintenance status of the various Karafka versions.

## Versioning Strategy

Karafka and its components utilize a versioning strategy that does not strictly adhere to semantic versioning. Instead, it employs an approach to better accommodate the nature and needs of our software's development and maintenance. Here's how we structure our versioning:

- **Major Version Upgrades**: The first digit in our version number represents significant rewrites or major changes in the architecture of Karafka gems. For example, transitioning from `0.x` to `1.0` or from `1.x` to `2.0` signifies transformative changes that introduce new concepts or substantially modify the system's design.

- **Minor Version Updates**: The second digit signifies significant yet not always backward-incompatible changes. Upgrading from `2.3` to `2.4`, for instance, may include changes that demand attention, such as adjusting default settings, aligning configuration, or introducing new features that enhance functionality without breaking existing implementations. Such updates always have an extensive upgrade guide.

- **Patch Releases**: The third digit is reserved for patch releases, focusing on bug fixes and minor, risk-free enhancements. These updates are intended to improve the stability and performance of the software without impacting the existing user base's operations.

This versioning system is designed to provide clarity and predictability, ensuring developers can understand the impact of upgrading Karafka and its components. By informing you about the nature of each release, we aim to help you make informed decisions regarding when and how to update your versions.

## Karafka Versions Support

Karafka versions or release series are categorized below into the following phases:

- **Active**: Branch receives general bug fixes, security fixes, and improvements.
- **Maintenance**: Only security and critical bug fixes are backported to this branch.
- **EOL** (end-of-life): Branch is no longer supported and receives no fixes. No further patch release will be released.
- **Preview**: Only previews or release candidates have been released for this branch so far.

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 2.4     | Active      | N/A        |
| 2.3     | Active      | N/A        |
| 2.2     | Maintenance | N/A        |
| 2.1     | Maintenance | 2024-05-01 |
| 2.0     | EOL         | 2024-02-01 |
| 1.4     | EOL         | 2023-02-01 |
| 1.3     | EOL         | 2021-08-01 |
| 1.2     | EOL         | 2020-08-01 |
| 1.1     | EOL         | 2019-03-01 |
| 1.0     | EOL         | 2018-11-07 |

## Ruby Versions Support

We officially provide support for all the versions of Ruby that are not EOL, and we align with their EOL schedule.

!!! note ""

    If you are using an older Ruby version, Karafka may still work. The EOL table indicates versions we officially test and support.

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 3.3     | Active      | N/A        |
| 3.2     | Active      | 2026-09-31 |
| 3.1     | Active      | 2025-09-31 |
| 3.0     | Active      | 2024-09-31 |
| 2.7     | Maintenance | 2024-06-30 |
| 2.6     | EOL         | 2022-04-12 |

## Ruby on Rails Versions Support

Karafka will support two major versions of Ruby on Rails. Any previous versions may or may not be supported depending on the effort and ability to provide features.

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 7.1     | Active      | N/A        |
| 7.0     | Active      | N/A        |
| 6.1     | Active      | N/A        |
| 5.2     | EOL         | 2023-12-31 |
| 4.2     | EOL         | 2021-05-01 |

## Kafka Versions Support

Karafka and its components are designed to maintain compatibility with all Kafka versions that meet the following conditions:

- **Kafka Versions**: Karafka supports all Kafka versions that have yet to reach their End of Life (EOL). This ensures that users can confidently use Karafka with Kafka versions that are actively maintained and receive necessary security and bug fixes.

- **librdkafka Compatibility**: The underlying broker support for Karafka is anchored by the librdkafka library. As of now, librdkafka supports Kafka brokers in versions `1.0` or higher.

- **Message Format**: Karafka mandates the use of Message Format v2 or later. This ensures efficient message handling and leverages the capabilities introduced in this format.

By adhering to these compatibility conditions, Karafka ensures its users receive a stable, reliable, and up-to-date experience when integrating with Kafka ecosystems.
