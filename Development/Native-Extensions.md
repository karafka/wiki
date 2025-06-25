# Native Extensions: Precompiled rdkafka-ruby

Karafka uses the `rdkafka-ruby` gem, which includes a native C extension that wraps the librdkafka library. To provide faster and more reliable installation, we distribute **native extensions** as precompiled gems (also called "native gems") for major platforms.

This eliminates the need to compile C extensions during installation, resulting in significantly faster gem installation and removing build dependency requirements.

## What Are Native Extensions?

Native extensions are platform-specific compiled binaries that contain:

- **Pre-compiled librdkafka libraries** with all dependencies statically linked
- **Self-contained binaries** that don't require system dependencies
- **Cryptographically verified dependencies** with SHA256 checksums for supply chain security
- **Full feature support** including SSL/TLS, SASL, Kerberos/GSSAPI, and compression

## Supported Platforms

rdkafka-ruby ships native extensions for the following platforms:

- **Linux**: `x86_64-linux-gnu`, `aarch64-linux-gnu`, `arm-linux-gnu`
- **macOS**: `x86_64-darwin`, `arm64-darwin` (Apple Silicon)

To check if your platform is supported, run:

```bash
ruby -e 'puts Gem::Platform.local.to_s'
```

## Installation Benefits

**Benefits:**

- **10-100x faster installation** (seconds instead of minutes)
- **More reliable** - no compilation failures
- **No build dependencies required** - works in minimal containers
- **Enhanced security** - all dependencies cryptographically verified
- **Cloud-ready** - perfect for Docker, AWS Lambda, etc.

### Without Native Extensions (Fallback)

```bash
$ gem install rdkafka --platform=ruby
# Downloads source gem and compiles during installation
# Requires: build tools, librdkafka, OpenSSL, SASL, Kerberos, etc.
```

## What's Included in Native Extensions

Each native extension includes a self-contained librdkafka library with:

### Core Dependencies (Statically Linked)

- **librdkafka** - The core Kafka client library
- **OpenSSL** - SSL/TLS encryption support
- **Cyrus SASL** - Authentication mechanisms (PLAIN, SCRAM, GSSAPI)
- **MIT Kerberos** - Kerberos/GSSAPI authentication for enterprise environments
- **zlib** - Standard compression
- **ZStd** - High-performance compression

## Build Process and Security

### Supply Chain Security

All dependencies are verified with SHA256 checksums during the build process:

```bash
# Example from build process
[SECURITY] Verifying checksum for openssl-3.0.16.tar.gz...
[SECURITY] ✅ Checksum verified for openssl-3.0.16.tar.gz
[SECURITY] 🔒 SECURITY VERIFICATION COMPLETE
[SECURITY] All dependencies downloaded and verified with SHA256 checksums
```

### Automated Build Pipeline

Native extensions are built using GitHub Actions with:

1. **Dependency Download**: All dependencies downloaded from official sources
2. **Checksum Verification**: SHA256 verification for supply chain security  
3. **Static Compilation**: All dependencies statically linked
4. **Self-Contained Packaging**: No external dependencies required
5. **Automated Testing**: Comprehensive test suite across Ruby versions
6. **Trusted Publishing**: Cryptographic attestation via RubyGems

## Docker and Container Usage

Native extensions are ideal for containerized applications:

```dockerfile
FROM ruby:3.4-slim

# No build dependencies needed!
RUN gem install karafka

COPY . /app
WORKDIR /app
```

### Before (with compilation)

```dockerfile
FROM ruby:3.4

RUN apt-get update && apt-get install -y \
    build-essential \
    librdkafka-dev \
    libsasl2-dev \
    libssl-dev

RUN gem install karafka  # 2-15 minutes
```

### After (with native extensions)

```dockerfile
FROM ruby:3.4-slim

RUN gem install karafka  # 3-10 seconds
```

## Troubleshooting

### Force Native Extension Installation

```bash
# Explicitly request native extension
gem install rdkafka --platform=x86_64-linux-gnu

# Or in Gemfile
gem 'rdkafka', platforms: [:x86_64_linux_gnu]
```

### Fallback to Source Compilation

If native extensions don't work for your platform:

```bash
# Force source compilation
gem install rdkafka --platform=ruby

# Or in Gemfile
gem 'rdkafka', platforms: [:ruby]
```

## Source Compilation (Fallback)

If you need to use source compilation instead of native extensions (e.g., for custom configurations or unsupported platforms):

### Force Source Compilation

```bash
# Force source compilation
gem install rdkafka --platform=ruby

# Or in Gemfile
gem 'rdkafka', platforms: [:ruby]
```

## Migration from Source Compilation

If you're currently using source compilation:

1. **Remove build dependencies** from your Dockerfile/CI
2. **Update Gemfile** to allow native extensions:
   ```ruby
   # Remove platform restrictions
   gem 'rdkafka'  # Will automatically use native extensions
   ```
3. **Rebuild** your containers - they'll be much faster!
