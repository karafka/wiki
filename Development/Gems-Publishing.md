# Karafka Ecosystem Gems Release Process

This document outlines the process for releasing gems in the Karafka ecosystem using GitHub's trusted publishing workflow.

## Overview

Our release process uses GitHub Actions with RubyGems trusted publishing for secure, automated gem releases. This eliminates the need for long-lived API keys and provides better security through short-lived OIDC tokens.

## Prerequisites

Before you can make releases, ensure you have:

- **Repository access**: Push access to the Karafka repository
- **Release permissions**: Ability to create GitHub releases
- **Workflow approval rights**: Permission to approve GitHub Actions workflows

## Trusted Publishing Setup

### How Trusted Publishing Works

Trusted publishing uses OpenID Connect (OIDC) to establish trust between GitHub Actions and RubyGems without storing long-lived credentials. Here's the flow:

1. GitHub Actions generates a short-lived OIDC token during workflow execution
2. RubyGems validates the token against the configured trusted publisher settings
3. If validation passes, RubyGems allows the gem to be published
4. The token expires automatically after the workflow completes

### Configuration

The trusted publishing configuration is already set up in the Karafka GitHub environments and RubyGems settings. Each gem has:

- **GitHub Environment**: Named `deployment` with RubyGems trusted publisher configured
- **RubyGems Trusted Publisher**: Configured with repository details, workflow path, and environment name
- **Workflow**: `.github/workflows/push.yml` that triggers on version tags

## Release Process

### Step 1: Prepare the Release

1. **Create version branch**: Create a new branch with the naming pattern `v"VERSION"` (e.g., `v1.2.3`, `v2.0.0.beta.1`)

2. **Update version files**: Update the gem version in the appropriate files (usually `lib/*/version.rb`)

3. **Update changelog**: Document changes in `CHANGELOG.md` and **update the release date** to the current date

4. **Update README**: If needed, update README.md with any new features, changes, or version-specific information

5. **Test locally**: Run the full test suite and ensure everything works as expected

6. **Create PR**: Submit changes via pull request with the version branch (`v"VERSION"`) and get it reviewed/merged
   - PR title should be clear (e.g., "Release v1.2.3")
   - Include a summary of changes in the PR description

### Step 2: Create GitHub Release

**Important**: Only proceed after the version PR has been merged to the master/main branch.

1. **Navigate to Releases**: Go to the repository's "Releases" section

<p align="center">
  <img
    src="https://cdn.karafka.io/assets/misc/printscreens/development/gems-publishing/releases.png"
    style="border: 1px solid #ddd; border-radius: 2px; padding: 10px;"
  />
</p>

2. **Create New Release**: Click "Draft a new release"

3. **Set Tag**: Create a new tag that **exactly matches** your version branch name (e.g., `v1.2.3`, `v2.0.0.beta.1`)

   - **Critical**: The tag must start with `v` to trigger the workflow
   - The tag should match the version you just merged

4. **Fill Release Details**:

- **Release title**: Usually the same as the tag (e.g., "v1.2.3")
- **Description**: Copy relevant sections from the updated changelog
- **Pre-release**: Check if this is a pre-release version

<p align="center">
  <img
    src="https://cdn.karafka.io/assets/misc/printscreens/development/gems-publishing/releasing.png"
    style="border: 1px solid #ddd; border-radius: 2px; padding: 10px;"
  />
</p>

5. **Publish Release**: Click "Publish release" - this will trigger the push workflow

### Step 3: Approve and Monitor Workflow

After publishing the GitHub release, the push workflow will be triggered and require approval:

1. **Check Actions Tab**: Immediately navigate to the "Actions" tab in the repository

<p align="center">
  <img
    src="https://cdn.karafka.io/assets/misc/printscreens/development/gems-publishing/workflows.png"
    style="border: 1px solid #ddd; border-radius: 2px; padding: 10px;"
  />
</p>

2. **Find Workflow Run**: Look for the newly triggered "Push Gem" workflow run that corresponds to your release tag

3. **Approve the Workflow**: The workflow will be waiting for approval
   - Click on the workflow run
   - Click "Review deployments" 
   - Select the "deployment" environment
   - Click "Approve and deploy"

<p align="center">
  <img
    src="https://cdn.karafka.io/assets/misc/printscreens/development/gems-publishing/approval.png"
    style="border: 1px solid #ddd; border-radius: 2px; padding: 10px;"
  />
</p>

4. **Monitor Execution**: Watch the workflow execution in real-time
   - Monitor each step for successful completion
   - Check logs if any step fails
   - The entire process should take a few minutes

<p align="center">
  <img
    src="https://cdn.karafka.io/assets/misc/printscreens/development/gems-publishing/logs.png"
    style="border: 1px solid #ddd; border-radius: 2px; padding: 10px;"
  />
</p>

### Step 4: Verify Release

1. **Check RubyGems**: Visit the gem's page on [RubyGems](https://rubygems.org) to confirm the new version is published
2. **Test Installation**: Try installing the gem locally: `gem install gem_name -v new_version`
3. **Automatic Dependencies Update**: There is no need for manual dependency updating since Renovate will do it automatically within 24 hours.

## Troubleshooting

### Common Issues

**Workflow doesn't trigger**:

- Ensure tag starts with `v`
- Check that the tag was created properly
- Verify you have push access to the repository
- Check if the run was approved

**Trusted publisher error**:

- Verify the GitHub environment name matches RubyGems configuration
- Check that the workflow path is correct in RubyGems settings
- Ensure the repository name matches exactly

**Permission denied**:

- Confirm you have release permissions for the repository
- Verify the `github.repository_owner == 'karafka'` condition

**Gem already exists**:

- Check if the version was already released
- Ensure the version was properly bumped before creating the release
- Consider using a patch version if needed

## Security Notes

- **No API keys needed**: Trusted publishing eliminates the need for long-lived RubyGems API keys
- **Scoped access**: OIDC tokens are automatically scoped to the specific repository and workflow
- **Audit trail**: All releases are tracked through GitHub Actions with full logs
