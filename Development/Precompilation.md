# Precompilation of Rdkafka

## Overview

One of the most frequently requested features for the rdkafka gem is the availability of precompiled binary gems for various platforms. This page explains why this seemingly simple request is one of the most complex challenges in the Karafka ecosystem, the current status, and our roadmap for addressing it.

## The Problem

The `rdkafka` and `karafka-rdkafka` gems currently require compilation during installation, which can take 60-90 seconds depending on your system. This significantly impacts:

- Docker build times in CI/CD pipelines
- Local development environment setup
- Deployment processes
- Developer productivity

## Why Precompiled Gems Are Complex

### ABI Compatibility Hell

Unlike simpler gems, rdkafka has a complex dependency web that creates ABI (Application Binary Interface) compatibility challenges:

**System Library Dependencies:**
- Different glibc/musl versions across Linux distributions
- OpenSSL versions (1.1.x vs 3.0+) with breaking changes
- Compression libraries (zlib, lz4, zstd, snappy) with varying versions
- SASL libraries for authentication mechanisms
- Different regex engines

**Platform-Specific Variations:**
- Package manager differences (`apt`, `yum`, `apk`, `brew`, `nix`)
- Custom library installations in non-standard locations
- FIPS compliance requirements in enterprise environments

### Environment Variable Customization

Many users rely on build-time customization through environment variables:

```bash
export RDKAFKA_ROOT=/custom/path
export CPPFLAGS="-I/opt/special/include"
export LDFLAGS="-L/opt/custom/lib"
```

Precompiled gems would either:
1. Ignore these variables (breaking existing workflows)
2. Require complex fallback logic to detect and handle custom configurationsr

### Platform Matrix Explosion

Supporting precompiled gems properly requires:

- **Ruby versions**: 3.0, 3.1, 3.2, 3.3, 3.4+ 
- **Primary platforms**: 
  - x86_64-linux-gnu (Ubuntu/Debian/RHEL)
  - x86_64-linux-musl (Alpine Linux)
  - aarch64-linux-gnu (ARM64 Linux)
  - aarch64-linux-musl (ARM64 Alpine)
  - x86_64-darwin (Intel Mac)
  - arm64-darwin (Apple Silicon Mac)
- **Additional platforms**: Windows, FreeBSD, etc.

This creates many gem variants per release, each requiring:
- Separate CI/CD pipeline configuration
- Individual testing and validation
- Ongoing maintenance for platform-specific issues

### Security Considerations

Precompiled native extensions present legitimate security concerns:

**Supply Chain Security:**
- Users cannot easily inspect compiled binaries
- Trust must be placed in the build process
- Potential for malicious code injection during compilation
- FIPS compliance requirements in regulated industries

**Build Provenance:**
- Need for cryptographic attestation
- Verifiable links between source code and binaries
- Transparent build processes

## Why Nokogiri Can Do This (And We're Getting There)

**Nokogiri's Advantages:**
- Google sponsorship with dedicated full-time maintainers
- Simpler dependency tree (primarily libxml2)
- Years of investment solving platform-specific issues
- Willingness to break edge cases for the common good
- Mature tooling and infrastructure

**Our Progress:**
- Migrated to RubyGems Trusted Publishing (December 2024)
- Automated releases with cryptographic attestation
- Verifiable build provenance
- Dedicated build infrastructure (including Mac Mini for macOS builds)

## Current Status & Roadmap

### Phase 1: Foundation (Completed ✅)
- [x] Migrate to RubyGems Trusted Publishing
- [x] Implement automated releases from GitHub Actions
- [x] Add cryptographic attestation for releases
- [x] Set up dedicated build infrastructure

### Phase 2: Core Platform Support (In Progress 🔄)
- [ ] Implement precompiled gems for most popular platforms:
  - x86_64-linux-gnu
  - x86_64-linux-musl
  - x86_64-darwin
  - arm64-darwin
- [ ] Ruby platform fallback mechanism
- [ ] Auto-detection and fallback for custom environment variables
- [ ] Comprehensive testing suite for binary compatibility

### Phase 3: Extended Platform Support (Planned 📋)
- [ ] ARM64 Linux variants
- [ ] Additional Ruby versions
- [ ] Specialized builds (FIPS, custom configurations)

## Summary

Remember: this is one of the most challenging tasks in the Karafka ecosystem in 2025, but I'm committed to solving it properly rather than quickly.
