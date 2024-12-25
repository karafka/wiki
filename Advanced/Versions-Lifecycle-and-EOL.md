This page lists the current maintenance status of the various Karafka versions.

## Versioning Strategy

Karafka and its components utilize a versioning strategy that does not strictly adhere to semantic versioning. Instead, it employs an approach to better accommodate the nature and needs of our software's development and maintenance. Here's how we structure our versioning:

- **Major Version Upgrades**: The first digit in our version number represents significant rewrites or major changes in the architecture of Karafka gems. For example, transitioning from `0.x` to `1.0` or from `1.x` to `2.0` signifies transformative changes that introduce new concepts or substantially modify the system's design.

- **Minor Version Updates**: The second digit signifies significant yet not always backward-incompatible changes. Upgrading from `2.3` to `2.4`, for instance, may include changes that demand attention, such as adjusting default settings, aligning configuration, or introducing new features that enhance functionality without breaking existing implementations. Such updates always have an extensive upgrade guide.

- **Patch Releases**: The third digit is reserved for patch releases, focusing on bug fixes and minor, risk-free enhancements. These updates are intended to improve the stability and performance of the software without impacting the existing user base's operations.

This versioning system is designed to provide clarity and predictability, ensuring developers can understand the impact of upgrading Karafka and its components. By informing you about the nature of each release, we aim to help you make informed decisions regarding when and how to update your versions.

## Karafka Components Support

Karafka and its components versions or release series are categorized below into the following phases:

- **Active**: Branch receives general bug fixes, security fixes, and improvements.
- **Maintenance**: Only security and critical bug fixes are backported to this branch.
- **EOL** (end-of-life): Branch is no longer supported and receives no fixes. No further patch release will be released.
- **Preview**: Only previews or release candidates have been released for this branch so far.

### Karafka Framework

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 2.4     | Active      | N/A        |
| 2.3     | Maintenance | 2025-03-01 |
| 2.2     | EOL         | 2024-09-31 |
| 2.1     | EOL         | 2024-05-01 |
| 2.0     | EOL         | 2024-02-01 |
| 1.x     | EOL         | 2023-02-01 |

### Karafka Web UI

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 0.10    | Active      | N/A        |
| 0.9     | Maintenance | 2024-12-31 |
| 0.8     | EOL         | 2024-08-31 |
| 0.7     | EOL         | 2024-05-01 |
| 0.6     | EOL         | 2023-12-01 |
| 0.5     | EOL         | 2023-10-01 |
| 0.4     | EOL         | 2023-08-01 |
| 0.3     | EOL         | 2023-07-01 |
| 0.2     | EOL         | 2023-05-01 |
| 0.1     | EOL         | 2023-04-01 |

### WaterDrop

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 2.8     | Active      | N/A        |
| 2.7     | Maintenance | 2025-02-01 |
| 2.6     | EOL         | 2024-09-31 |
| 2.x     | EOL         | 2024-05-01 |
| 1.x     | EOL         | 2023-02-01 |

## Ruby Versions Support

We officially provide support for all the versions of Ruby that are not EOL, and we align with their EOL schedule.

!!! note ""

    If you are using an older Ruby version, Karafka may still work. The EOL table indicates versions we officially test and support.

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 3.4     | Active      | 2028-09-31 |
| 3.3     | Active      | 2027-09-31 |
| 3.2     | Active      | 2026-09-31 |
| 3.1     | Active      | 2025-09-31 |
| 3.0     | EOL         | 2024-09-31 |
| 2.7     | EOL         | 2024-05-30 |
| 2.6     | EOL         | 2022-04-12 |

## Ruby on Rails Versions Support

Karafka will support two major versions of Ruby on Rails. Any previous versions may or may not be supported depending on the effort and ability to provide features.

| Version | Status      | EOL date   |
|---------|-------------|------------|
| 8.0     | Active      | N/A        |
| 7.2     | Active      | 2026-09-30 |
| 7.1     | Active      | 2025-11-31 |
| 7.0     | Active      | 2025-05-31 |
| 6.1     | Maintenance | 2024-12-31 |
| 5.2     | EOL         | 2023-12-31 |
| 4.2     | EOL         | 2021-05-01 |

## Kafka Versions Support

Karafka and its components are designed to maintain compatibility with all Kafka versions that meet the following conditions:

- **Kafka Versions**: Karafka supports all Kafka versions that have yet to reach their End of Life (EOL). This ensures that users can confidently use Karafka with Kafka versions that are actively maintained and receive necessary security and bug fixes.

- **librdkafka Compatibility**: The underlying broker support for Karafka is anchored by the librdkafka library. As of now, librdkafka supports Kafka brokers in versions `1.0` or higher.

- **Message Format**: Karafka mandates the use of Message Format v2 or later. This ensures efficient message handling and leverages the capabilities introduced in this format.

By adhering to these compatibility conditions, Karafka ensures its users receive a stable, reliable, and up-to-date experience when integrating with Kafka ecosystems.

### Kafka Ecosystem Coverage

The following table outlines Kafka-compatible platforms that have been reported to work with Karafka:

<table>
  <thead>
    <tr>
      <th>Platform</th>
      <th>Compatibility</th>
      <th>Integration Tests</th>
      <th>Production Usage</th>
      <th>Verified</th>
      <th>Notes</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>Apache Kafka</td>
      <td>Complete</td>
      <td>Yes</td>
      <td>High</td>
      <td>Yes</td>
      <td>Primary development platform with comprehensive testing across all features including transactions.</td>
    </tr>
    <tr>
      <td>Redpanda</td>
      <td>High</td>
      <td>No</td>
      <td>Medium</td>
      <td>Yes</td>
      <td>Most features work as expected; verified through manual testing and users usage.</td>
    </tr>
    <tr>
      <td>WarpStream</td>
      <td>Basic</td>
      <td>No</td>
      <td>Low</td>
      <td>No</td>
      <td>Basic operations reported to work but not extensively tested</td>
    </tr>
  </tbody>
</table>

!!! Info "Compatibility Status Explanation"
    This table reflects our current knowledge about compatibility with different Kafka-compatible platforms. "Verified" indicates whether the Karafka users have independently confirmed compatibility. "Production Usage" reflects reported usage by the community.

#### Compatibility Levels

- **Complete:** All features work as expected
- **High:** Most features work with minor limitations
- **Basic:** Core features work but advanced features may not be tested

#### Production Usage

- **High:** Widely reported usage in production environments
- **Medium:** Several known production deployments
- **Low:** Limited or no known production deployments
