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

### Benefits

- **Automatic updates**: Linting tool updates are proposed automatically
- **Grouped updates**: Linting dependencies are updated together for easier review
- **Dependency tracking**: `Gemfile.lint.lock` is maintained and updated
- **Security patches**: Quick notification of security issues in linting tools

### Update Stability Policy

By default, Renovate is configured with a **7-day cooldown period** for dependency updates. This means new versions of linting tools are not automatically proposed until they have been available for at least 7 days. This policy exists for:

- **Security**: Allows time for the community to discover and report critical issues in new releases
- **Stability**: Ensures that newly released versions are stable and don't contain showstopper bugs
- **Quality**: Gives maintainers time to address early-adopter feedback before wider adoption

However, for **critical dependency updates** that have been validated and tested, early updates can be and are performed manually when needed, bypassing the cooldown period. This provides flexibility for urgent security patches or important bug fixes while maintaining conservative defaults for routine updates.

## Local Development Usage

### Running Linting Checks

To run code linting locally:

```shell
BUNDLE_GEMFILE=Gemfile.lint bundle install
BUNDLE_GEMFILE=Gemfile.lint bundle exec rubocop
```

To run documentation linting:

```shell
BUNDLE_GEMFILE=Gemfile.lint bundle install
BUNDLE_GEMFILE=Gemfile.lint bundle exec yard-lint lib/
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
