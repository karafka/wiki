This document outlines the policy and strategy for updating librdkafka in the Karafka ecosystem. The policy emphasizes stability and reliability over immediate adoption of new releases, ensuring that production deployments remain stable while still benefiting from improvements and bug fixes in librdkafka.

The Karafka ecosystem prioritizes **stability over speed** when it comes to librdkafka updates. Historical evidence shows that new librdkafka releases introduced subtle behavioral changes or previously undetected issues that can emerge under specific production conditions. This conservative approach ensures that Karafka users receive only thoroughly tested and validated librdkafka updates.

!!! warning "Flexible Timeline Policy"

    The timelines specified in this document represent **minimum waiting periods** that will not be shortened. However, these periods may be extended when other development priorities take precedence, such as:

    - Active development of new features in the rdkafka gem
    - Major Karafka ecosystem improvements
    - Critical bug fixes in existing functionality
    - Other high-priority maintenance work

    Additionally, new feature releases are intentionally **never bundled with librdkafka updates** to maintain a clear separation between infrastructure updates and functionality changes. This ensures that any issues can be attributed to their specific cause, reducing the complexity of troubleshooting.

## Update Strategy

### 1. Initial Waiting Period (2 Weeks)

**Policy**: All librdkafka releases undergo a mandatory 2-week observation period before any upgrade process begins.

**Rationale**:

- New releases may contain undiscovered issues that surface within the first two weeks of community usage
- This period allows the broader librdkafka community to identify and report critical issues
- Community feedback and initial bug reports provide valuable insight into potential problems

**Exception**: Critical security fixes or high severity bugs may bypass this waiting period at the maintainer's discretion, but such exceptions require explicit justification and accelerated testing procedures.

### 2. Upgrade Process Initiation

After the initial 2-week observation period, the upgrade process begins with the following steps:

#### Phase 1: rdkafka Gem Update (Week 1-2)

- Update the rdkafka gem to incorporate the new librdkafka version
- Run unit and integration tests
- Verify that all existing functionality remains intact
- Address any compilation or immediate compatibility issues

#### Phase 2: Extended Integration Testing (Week 3-4)

- Deploy the updated rdkafka gem in the dedicated integration environment
- Execute the full Karafka end-to-end integration suite continuously for 2 weeks
- Monitor for:
    - Performance regressions
    - Memory usage changes
    - Behavioral deviations from expected patterns
    - Edge case handling differences
    - Consumer/producer stability under various load conditions

## Version Numbering Strategy

### Standard librdkafka Updates

When a librdkafka update is incorporated, the rdkafka gem version follows this pattern:

- **Minor version bump**: The second version number increases (e.g., 0.19.x → 0.20.x)
- This signals to users that the underlying librdkafka version has changed
- The patch version resets to 0 for the new minor version

**Example**:

- Current version: `0.19.5`
- After librdkafka update: `0.20.0`

### Non-librdkafka Updates

The minor version may also be incremented without a librdkafka update when:

- Significant API changes are introduced
- Major feature additions are implemented
- Breaking changes require user attention
- Substantial refactoring affects public interfaces

This ensures that version numbering clearly communicates the scope of changes to users.

## Release Validation Criteria

Before any librdkafka update is considered complete, the following criteria must be met:

### Functional Validation

- All existing test suites pass without modification
- No regression in message processing performance
- Consumer lag handling remains consistent
- Producer acknowledgment behavior is unchanged

### Stability Validation

- No memory leaks detected during extended testing
- No unexpected connection drops or broker communication issues
- Consistent behavior across different partition counts and consumer group sizes
- Proper handling of rebalancing scenarios

### Compatibility Validation

- Backward compatibility with existing Karafka applications
- Compatibility across supported Ruby versions
- Proper interaction with different Kafka broker versions

## Conclusion

This conservative approach to librdkafka updates ensures that Karafka users receive reliable, well-tested releases that maintain the stability expected in production environments. While this process may delay the availability of new features, it prioritizes the stability and reliability that are crucial for mission-critical Kafka deployments.

The minimum 4-week cycle from librdkafka release to Karafka integration (2 weeks observation + 2 weeks testing) represents a balanced approach between staying current with upstream improvements and maintaining production stability.
