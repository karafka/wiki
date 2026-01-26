# Code Quality and Linting Setup

This document describes the code quality and linting infrastructure used across all components in the Karafka ecosystem. The setup standardizes Ruby code style, documentation quality, and automated enforcement through continuous integration.

## Overview

The Karafka ecosystem uses a unified approach to code quality with the following key components:

| Component | Purpose | Coverage |
| --------- | ------- | -------- |
| **StandardRB** | Ruby code style and linting | All Ruby code, specs, gemspecs |
| **yard-lint** | Documentation quality checks | YARD documentation comments |
| **Separate Gemfile.lint** | Isolation of linting dependencies | CI and development linting tasks |
| **CI Integration** | Automated enforcement | All pull requests and scheduled runs |
| **Renovate** | Dependency updates | Automatic updates for linting tools |

## StandardRB Adoption

### Background

In January 2026, the Karafka ecosystem migrated from custom Coditsu linting standards to StandardRB. This decision was driven by:

- **Reduced maintenance burden**: Delegating style decisions to the community-maintained Standard
- **Self-contained tooling**: Minimal custom configuration requirements
- **Community alignment**: Following established Ruby community practices
- **Consistency**: Unified style across all Karafka components

### What is StandardRB?

StandardRB is a Ruby code style guide, linter, and formatter built on RuboCop. It provides:

- Opinionated defaults with minimal configuration
- Automatic code formatting capabilities
- Integration with popular Ruby tooling
- Regular updates aligned with Ruby community practices

### Migration Status

All major components in the Karafka ecosystem have been migrated to StandardRB:

| Repository | Status | Notes |
| ---------- | ------ | ----- |
| waterdrop | ✓ Migrated | Reference implementation |
| karafka-core | ✓ Migrated | |
| karafka-testing | ✓ Migrated | |
| karafka | ✓ Migrated | |
| wiki | ✓ Migrated | Documentation repository |
| website | ✓ Migrated | Marketing site |
| rdkafka | ✓ Migrated | Ruby bindings |
| karafka-web | ✓ Migrated | Web UI |
| karafka-rdkafka | Pending | In progress |

## Gemfile.lint Pattern

### Rationale

The Karafka ecosystem uses a dedicated `Gemfile.lint` file to separate linting and quality tools from runtime dependencies. This approach provides:

- **Lean production dependencies**: Main Gemfile only contains gems needed for execution
- **Isolated linting environment**: Clear separation of concerns
- **Independent versioning**: Linting tools can be updated without affecting application dependencies
- **CI optimization**: Linting jobs can use different Ruby versions and dependency sets

### Structure

A typical `Gemfile.lint` in the Karafka ecosystem contains:

```ruby
# frozen_string_literal: true

source "https://rubygems.org"

# Documentation linting
gem "yard-lint"

# Code style (StandardRB via RuboCop)
gem "standard"
gem "standard-performance"
gem "rubocop-performance"
gem "rubocop-rspec"
gem "standard-rspec"
gem "rubocop-thread_safety"
```

### Key Components

| Gem | Purpose |
| --- | ------- |
| **yard-lint** | Validates YARD documentation comments for quality and completeness |
| **standard** | Core StandardRB linting and formatting |
| **standard-performance** | Performance-focused RuboCop rules integrated with Standard |
| **standard-rspec** | RSpec-specific rules aligned with Standard style |
| **rubocop-performance** | Performance optimization cops |
| **rubocop-rspec** | RSpec best practices enforcement |
| **rubocop-thread_safety** | Thread safety checks for concurrent code |

## RuboCop Configuration

### Base Configuration

The `.rubocop.yml` file inherits from Standard gem configurations with minimal project-specific overrides:

```yaml
# frozen_string_literal: true

plugins:
  - rubocop-capybara
  - rubocop-factory_bot
  - rubocop-performance
  - rubocop-rspec
  - rubocop-rspec_rails
  - rubocop-thread_safety

inherit_gem:
  standard: config/base.yml
  standard-performance: config/base.yml
  standard-rspec: config/base.yml

AllCops:
  NewCops: enable
  TargetRubyVersion: 3.2
  Include:
    - "**/*.rb"
    - "**/*.gemspec"
    - "**/Gemfile"
    - "**/Rakefile"
    - Gemfile.lint
```

### Critical Configuration Elements

#### Include Gemfile.lint

The `Gemfile.lint` file must be explicitly included in `AllCops` to ensure it receives linting checks:

```yaml
AllCops:
  Include:
    - Gemfile.lint
```

This ensures that linting dependencies themselves follow the same code style standards.

#### NewCops Setting

```yaml
AllCops:
  NewCops: enable
```

This setting automatically enables new RuboCop cops as they are released, ensuring the codebase benefits from new quality checks without manual configuration updates.

#### Project-Specific Overrides

While StandardRB provides opinionated defaults, Karafka components may include minimal overrides for specific use cases:

```yaml
# Layout
Layout/LineLength:
  Max: 100

# Disable checks for non-applicable features
Capybara:
  Enabled: false

FactoryBot:
  Enabled: false

RSpecRails:
  Enabled: false

# RSpec customizations
RSpec/ExampleLength:
  Enabled: false

RSpec/MultipleExpectations:
  Enabled: false

RSpec/MultipleMemoizedHelpers:
  Max: 20

RSpec/NestedGroups:
  Max: 4

# Thread safety customizations
ThreadSafety/ClassAndModuleAttributes:
  Enabled: false

ThreadSafety/ClassInstanceVariable:
  Enabled: false
```

## CI Integration

### Workflow Structure

Linting is enforced through separate CI jobs that use the `Gemfile.lint` file:

```yaml
rubocop:
  timeout-minutes: 5
  runs-on: ubuntu-latest
  env:
    BUNDLE_GEMFILE: Gemfile.lint
  steps:
    - uses: actions/checkout@latest
      with:
        fetch-depth: 0
    - name: Set up Ruby
      uses: ruby/setup-ruby@latest
      with:
        ruby-version: '4.0.1'
        bundler-cache: true
    - name: Run rubocop
      run: bundle exec rubocop

yard-lint:
  timeout-minutes: 5
  runs-on: ubuntu-latest
  env:
    BUNDLE_GEMFILE: Gemfile.lint
  steps:
    - uses: actions/checkout@latest
      with:
        fetch-depth: 0
    - name: Set up Ruby
      uses: ruby/setup-ruby@latest
      with:
        ruby-version: '4.0.1'
        bundler-cache: true
    - name: Run yard-lint
      run: bundle exec yard-lint lib/
```

### Key Patterns

| Pattern | Purpose |
| ------- | ------- |
| **BUNDLE_GEMFILE environment variable** | Directs Bundler to use `Gemfile.lint` instead of main `Gemfile` |
| **Latest Ruby version** | Linting jobs use the latest stable Ruby for best tool support |
| **bundler-cache: true** | Caches Gemfile.lint dependencies for faster CI runs |
| **Separate timeout** | 5-minute timeout for linting jobs (faster than test suites) |
| **fetch-depth: 0** | Full git history for accurate linting context |

### CI Success Gate

All linting jobs must pass before CI is considered successful:

```yaml
ci-success:
  name: CI Success
  runs-on: ubuntu-latest
  if: always()
  needs:
    - rubocop
    - specs
    - yard-lint
  steps:
    - name: Check all jobs passed
      if: |
        contains(needs.*.result, 'failure') ||
        contains(needs.*.result, 'cancelled') ||
        contains(needs.*.result, 'skipped')
      run: exit 1
    - run: echo "All CI checks passed!"
```

This ensures that code quality issues block pull request merges.

## Renovate Integration

### Configuration

The `renovate.json` file includes `Gemfile.lint` in its tracked paths:

```json
{
  "extends": ["config:base"],
  "includePaths": ["Gemfile", "Gemfile.lint", "*.gemspec"],
  "packageRules": [
    {
      "matchFiles": ["Gemfile.lint"],
      "groupName": "linting dependencies"
    }
  ]
}
```

### Benefits

- **Automatic updates**: Linting tool updates are proposed automatically
- **Grouped updates**: Linting dependencies are updated together for easier review
- **Dependency tracking**: `Gemfile.lint.lock` is maintained and updated
- **Security patches**: Quick notification of security issues in linting tools

## Local Development Usage

### Running Linting Checks

To run code linting locally:

```shell
bundle exec rubocop
```

To run documentation linting:

```shell
BUNDLE_GEMFILE=Gemfile.lint bundle install
BUNDLE_GEMFILE=Gemfile.lint bundle exec yard-lint lib/
```

### Auto-fixing Issues

StandardRB can automatically fix many style issues:

```shell
bundle exec rubocop -a
```

For more aggressive auto-correction (including unsafe fixes):

```shell
bundle exec rubocop -A
```

### Checking Specific Files

To lint specific files or directories:

```shell
bundle exec rubocop lib/specific_file.rb
bundle exec rubocop spec/
```

### Listing Target Files

To verify which files are being checked:

```shell
bundle exec rubocop --list-target-files
```

This is particularly useful to confirm that `Gemfile.lint` is included in the linting scope.

## Best Practices

### Adding New Components

When adding new Karafka ecosystem components, follow this setup:

1. **Create Gemfile.lint**: Include all standard linting dependencies
1. **Configure .rubocop.yml**: Inherit from Standard with minimal overrides
1. **Update .rubocop.yml AllCops**: Explicitly include `Gemfile.lint`
1. **Set up CI jobs**: Create separate `rubocop` and `yard-lint` jobs
1. **Configure Renovate**: Add `Gemfile.lint` to `includePaths`
1. **Run initial checks**: Execute `bundle exec rubocop -A` to align existing code

### Maintaining Consistency

To ensure consistency across the ecosystem:

- **Minimize custom rules**: Only override StandardRB when absolutely necessary
- **Document exceptions**: Comment why specific cops are disabled
- **Share configurations**: Keep RuboCop configs similar across components
- **Review updates together**: Coordinate StandardRB version updates across repos
- **Use same Ruby version**: Align linting Ruby version across components (currently 4.0.1)

### Handling Exceptions

When you need to disable cops:

```ruby
# Good: Inline disable with explanation
def legacy_method
  # rubocop:disable Style/GlobalVars - Required for backward compatibility
  $global_config = Config.new
  # rubocop:enable Style/GlobalVars
end

# Good: File-level exception with justification
# rubocop:disable Lint/RescueException
# This file intentionally catches Exception for transaction rollback
def transaction_wrapper
  yield
rescue Exception => e
  rollback!
  raise
end
# rubocop:enable Lint/RescueException
```

### Documentation Standards

For YARD documentation to pass yard-lint:

```ruby
# Good: Complete documentation
# Processes messages from Kafka topic
#
# @param messages [Array<Message>] messages to process
# @param options [Hash] processing options
# @option options [Boolean] :async (false) process asynchronously
# @return [Array<Result>] processing results
# @raise [ProcessingError] if messages cannot be processed
def process_messages(messages, options = {})
  # implementation
end
```

## Migration Guide

### For Existing Projects

If you're migrating an existing Karafka component to this setup:

1. **Create Gemfile.lint**:

    ```shell
    cat > Gemfile.lint <<'EOF'
    # frozen_string_literal: true

    source "https://rubygems.org"

    gem "yard-lint"
    gem "standard"
    gem "standard-performance"
    gem "rubocop-performance"
    gem "rubocop-rspec"
    gem "standard-rspec"
    gem "rubocop-thread_safety"
    EOF
    ```

1. **Update .rubocop.yml**:

    ```yaml
    inherit_gem:
      standard: config/base.yml
      standard-performance: config/base.yml
      standard-rspec: config/base.yml

    AllCops:
      NewCops: enable
      Include:
        - Gemfile.lint
    ```

1. **Update CI workflow**:

    Add the `BUNDLE_GEMFILE` environment variable to linting jobs and create separate `rubocop` and `yard-lint` jobs.

1. **Update Renovate config**:

    ```json
    {
      "includePaths": ["Gemfile", "Gemfile.lint", "*.gemspec"]
    }
    ```

1. **Install and run**:

    ```shell
    BUNDLE_GEMFILE=Gemfile.lint bundle install
    bundle exec rubocop -A  # Auto-fix what can be fixed
    ```

1. **Review and commit**:

    Review auto-fixes, manually fix remaining issues, and commit the changes.

## Troubleshooting

### Common Issues

#### Gemfile.lint not being checked

**Problem**: Running `bundle exec rubocop` doesn't check `Gemfile.lint`.

**Solution**: Ensure `Gemfile.lint` is listed in `.rubocop.yml`:

```yaml
AllCops:
  Include:
    - Gemfile.lint
```

Verify with:

```shell
bundle exec rubocop --list-target-files | grep Gemfile.lint
```

#### CI job fails with "bundle: command not found"

**Problem**: CI job using `Gemfile.lint` can't find bundler.

**Solution**: Ensure `bundler-cache: true` is set in the Ruby setup action:

```yaml
- name: Set up Ruby
  uses: ruby/setup-ruby@latest
  with:
    ruby-version: '4.0.1'
    bundler-cache: true
```

#### Conflicting versions between Gemfile and Gemfile.lint

**Problem**: Different Ruby versions or dependencies cause conflicts.

**Solution**: Keep linting jobs isolated with explicit `BUNDLE_GEMFILE`:

```yaml
env:
  BUNDLE_GEMFILE: Gemfile.lint
```

#### Too many style violations after migration

**Problem**: Hundreds of RuboCop violations after migrating to StandardRB.

**Solution**: Use auto-fix and then review:

```shell
bundle exec rubocop -A  # Auto-fix everything possible
bundle exec rubocop     # Review remaining issues
```

## Additional Resources

| Resource | Description |
| -------- | ----------- |
| [StandardRB Official Site](https://github.com/standardrb/standard) | StandardRB documentation and philosophy |
| [RuboCop Documentation](https://docs.rubocop.org/) | Comprehensive RuboCop cop reference |
| [YARD Documentation](https://yardoc.org/) | YARD documentation syntax guide |
| [yard-lint GitHub](https://github.com/troessner/yard-lint) | yard-lint usage and configuration |
| [Karafka Issue #2991](https://github.com/karafka/karafka/issues/2991) | Original migration tracking issue |

## See Also

- [Technical Writing](Development-Technical-Writing.md) - Documentation style guidelines
- [Naming Conventions](Development-Naming-Conventions.md) - Naming patterns across Karafka
- [Gems Publishing](Development-Gems-Publishing.md) - Release process for Karafka gems
