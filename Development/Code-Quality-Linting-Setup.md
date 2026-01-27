# Code Quality and Linting Setup

This document describes the code quality and linting infrastructure used across all components in the Karafka ecosystem. The setup standardizes Ruby code style, documentation quality, and automated enforcement through continuous integration.

## Overview

The Karafka ecosystem uses a unified approach to code quality with the following key components:

| Component | Purpose | Coverage |
| --------- | ------- | -------- |
| **RuboCop** | Ruby code style enforcement and linting | All Ruby code, specs, gemspecs |
| **StandardRB** | Base configuration for RuboCop | Provides opinionated defaults |
| **yard-lint** | Documentation quality checks | YARD documentation comments |
| **Separate Gemfile.lint** | Isolation of linting dependencies | CI and development linting tasks |
| **CI Integration** | Automated enforcement | All pull requests and scheduled runs |
| **Renovate** | Dependency updates | Automatic updates for linting tools |

## StandardRB Adoption

### Background

In January 2026, the Karafka ecosystem migrated to StandardRB as the foundation for code quality standards. This decision was driven by:

- **Reduced maintenance burden**: Delegating style decisions to the community-maintained Standard
- **Self-contained tooling**: Minimal custom configuration requirements
- **Community alignment**: Following established Ruby community practices
- **Consistency**: Unified style across all Karafka components

### Why RuboCop with StandardRB?

The Karafka ecosystem uses **RuboCop directly** with StandardRB as the base configuration, rather than using StandardRB's command-line tool exclusively. This approach is necessary because:

- **Customized style preferences**: Karafka has slightly different style preferences than fully enforced StandardRB defaults
- **Project-specific requirements**: Some RuboCop cops need to be configured differently for Karafka's architecture (e.g., thread safety, performance optimizations)
- **Additional cop families**: Integration of specialized RuboCop extensions like `rubocop-thread_safety` and `rubocop-performance` with custom settings
- **Fine-grained control**: Ability to selectively enable/disable specific cops while maintaining StandardRB as the foundation

By using `bundle exec rubocop` with StandardRB configurations inherited via `inherit_gem`, Karafka maintains:

- StandardRB's solid defaults as the baseline
- Flexibility to override specific rules when needed
- Full access to RuboCop's extensive cop ecosystem
- Consistent style across the ecosystem with minimal deviation from Standard

## Gemfile.lint Pattern

### Rationale

The Karafka ecosystem uses a dedicated `Gemfile.lint` file to separate linting and quality tools from runtime dependencies. This approach provides:

- **Lean production dependencies**: Main Gemfile only contains gems needed for execution
- **Isolated linting environment**: Clear separation of concerns
- **Independent versioning**: Linting tools can be updated without affecting application dependencies
- **CI optimization**: Linting jobs can use different Ruby versions and dependency sets

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

## CI Integration

All linting checks are enforced through GitHub Actions CI workflows. Separate jobs run RuboCop and yard-lint using the `Gemfile.lint` dependencies, and all linting jobs must pass before pull requests can be merged.

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
