[![CI](https://github.com/karafka/wiki/workflows/CI/badge.svg)](https://github.com/karafka/wiki/actions/workflows/ci.yml)

The documentation repository for the [Karafka](https://karafka.io) ecosystem - a Ruby and Rails efficient Kafka processing framework.

## What is This Repository?

This repository contains all the documentation for Karafka and its related components, organized as a collection of Markdown files that are automatically processed and deployed to [karafka.io/docs](https://karafka.io/docs/).

## Automated Content Management

This repository includes several automated processes to keep documentation current and consistent.

### Automatic Content Refresh

The repository automatically fetches and updates dynamic content daily at 6:00 AM UTC and on-demand through repository dispatch events:

- **Component Changelogs**: Pulls the latest CHANGELOG.md files from all Karafka ecosystem repositories
- **librdkafka Releases**: Fetches and formats librdkafka release information from GitHub
- **librdkafka Documentation**: Generates error reference, statistics, and configuration documentation

### GitHub Wiki Sync

The documentation is automatically mirrored to the [GitHub Wiki](https://github.com/karafka/karafka/wiki) on every merge to master. The sync process:

- Copies and flattens the directory structure for GitHub Wiki compatibility
- Adds a header to each page directing users to the main documentation site
- Removes stale pages that no longer exist in the source
- Preserves wiki-specific files like `_Footer.md` and `_Sidebar.md`

The header template is located in `.gh-templates/_GH_Header.md`.

### Content Processing Scripts

Located in the `bin/` directory:

| Script | Description |
| ------ | ----------- |
| `refresh_remote_content` | Downloads changelogs and commercial license from component repositories |
| `refresh_librdkafka_errors` | Generates librdkafka error documentation using the rdkafka gem |
| `refresh_librdkafka_releases` | Generates librdkafka releases documentation from GitHub |
| `refresh_librdkafka_statistics` | Generates librdkafka statistics documentation |
| `refresh_librdkafka_configuration` | Generates librdkafka configuration documentation |
| `refresh_karafka_integrations_catalog` | Generates integration tests catalog |
| `refresh_instrumentation_events` | Generates instrumentation events documentation |
| `align_structure` | Flattens nested documentation structure for MkDocs compatibility |
| `mklint` | Validates documentation structure, references, and builds with MkDocs |
| `sync_gh` | Synchronizes content with the GitHub Wiki |

### Continuous Integration

The CI pipeline ensures documentation quality through:

- **Markdown Linting**: Uses `markdownlint-cli2` to enforce consistent formatting
- **Structure Validation**: Validates cross-references, anchor links, and documentation structure
- **MkDocs Build**: Builds documentation in strict mode to catch errors
- **Security**: Verifies all GitHub Actions use SHA-pinned versions

### Pull Request Automation

When automatic content updates are available, the system:

1. Fetches the latest content from all sources
2. Regenerates dynamic documentation
3. Creates a pull request with the changes
4. Maintains a clean commit history

## Auto-Generated Content

Several files in this repository are automatically generated and should not be edited manually:

- `Changelog/*.md` - Component changelogs
- `Librdkafka/Changelog.md` - librdkafka release notes
- `Librdkafka/Errors.md` - librdkafka error reference
- `Librdkafka/Statistics.md` - librdkafka statistics documentation
- `Librdkafka/Configuration.md` - librdkafka configuration documentation
- `Development/Karafka-Integration-Tests-Catalog.md` - Integration tests catalog
- `Operations/Instrumentation-Events.md` - Instrumentation events
- `WaterDrop/Instrumentation-Events.md` - WaterDrop instrumentation events

These files include header comments indicating their auto-generated status.

## License

See [LICENSE](LICENSE.md) for details.
