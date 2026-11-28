This documentation page provides recommended strategies for upgrading Karafka and its dependencies to ensure a smooth upgrade process. Upgrading Karafka and its dependencies is essential to benefit from the latest features, bug fixes, and security enhancements. It is necessary to follow these strategies to minimize disruptions and avoid compatibility issues during the upgrade.

!!! tip "Pro & Enterprise Upgrade Support"

    If you are gearing up to upgrade to the latest Karafka version and are a Pro or Enterprise user, remember you have a dedicated lifeline! Reach out via the dedicated Slack channel for direct support to ensure everything has been covered.

## Pre-Upgrade Considerations

1. **Review the Changelogs**: Read the release notes and changelog for each new version of Karafka and its dependencies. This will help you understand the changes, improvements, and potential breaking changes introduced in the latest version.

1. **Check Upgrade Guides and Recommendations**: Refer to the [upgrade guides](https://karafka.io/docs#upgrade-notes) and recommendations provided in the documentation for Karafka and its dependencies. These guides often highlight important considerations, steps, and best practices for the upgrade process. Following the recommended upgrade path can help ensure a smooth transition to the new version.

1. **Check Compatibility**: Verify the compatibility of your existing Karafka application and its dependencies with the new version. Look for deprecated features or breaking changes that might affect your code or configurations.

1. **Test Environment**: Set up a separate test environment that closely mirrors your production environment. Perform the upgrade and necessary tests in this environment before applying it to the production environment. This allows you to identify and resolve any potential issues or conflicts beforehand.

Considering these points, you will be well-prepared for the upgrade process and can minimize potential disruptions or compatibility issues.

## Why Staying Current Matters

Karafka ships bug fixes and patch releases at a fast pace. This includes fixes to Karafka itself, its dependencies such as karafka-rdkafka, and the underlying librdkafka C library. Many of these patches address subtle but impactful issues - such as consumer lag spikes triggered by rebalance bugs, offset management edge cases, or stability improvements under broker failures.

Running significantly behind the latest release means you are carrying known bugs that have already been resolved upstream. Patch releases (third-digit bumps) are intentionally low-risk and focused on stability, making them safe to apply promptly. Minor version upgrades always come with a detailed upgrade guide to help you migrate confidently.

The practical recommendation is: **apply patch releases as soon as they are available, and plan minor version upgrades within a few months of their release.** The longer you defer, the more changes accumulate between your version and current, making each upgrade incrementally harder and the window of exposure to known bugs incrementally longer.

## Upgrade Strategy

1. **Read the upgrade guides**: Karafka provides detailed [upgrade guides](https://karafka.io/docs#upgrade-notes) for each major version release. These guides outline the steps required to upgrade from the previous version to the new version. Before proceeding with the upgrade, carefully read and follow the instructions in the upgrade guide.

1. **Upgrade one version at a time**: Always upgrade by **one** version at a time. Move from `2.1` to `2.2`, `2.2` to `2.3`, `2.3` to `2.4`, etc. Do **not** ever jump versions, as it is not recommended. This approach ensures that you can address any version-specific deprecations, migrations, or changes in a controlled manner, minimizing the risk of introducing breaking changes or bugs.

1. **Upgrade Karafka and its dependencies**: To upgrade the Karafka ecosystem, run the following command:

    ```shell
    bundle update karafka karafka-rdkafka karafka-core waterdrop karafka-web karafka-testing
    ```

    It is **recommended** always to upgrade Karafka with its dependencies together and to always run the most recent resolvable versions of all the libraries creating the Karafka ecosystem.

    !!! warning "Rails Apps Can Break When the `json` Gem Resolves to 3.x"

        `karafka-rdkafka` depends on `json` (`> 2.0`). Unless your `Gemfile` keeps `json` below 3, this command can install `json` 3.x, also when `Gemfile.lock` has `json` 2.x. The `json` 3.x gem raises `ArgumentError` for unknown options, and Active Support passes such options on some Rails versions:

        - **Rails 7.1.x, 7.2.0 - 7.2.3.2 and 8.0.x:** every `#to_json` call raises `unknown keyword: quirks_mode`. With the Web UI enabled, `karafka server` exits at boot with `Runner crashed`, because the Web UI reporter calls `#to_json`. Active Job `#perform_later` also raises.
        - **Rails 8.1.0 - 8.1.3.1:** `karafka server` runs, but every Active Job batch fails in the Karafka Active Job deserializer with `wrong number of arguments (given 2, expected 1)` and is retried. No job runs.
        - **Rails 7.2.4 or a newer 7.2 release, and Rails 8.1.4 or newer:** not affected. No Rails 8.0 release is safe.

        To prevent this, do one of these before you run the update:

        - Add `gem 'json', '< 3'` to your `Gemfile`.
        - Upgrade Rails to 7.2.4 or a newer 7.2 release, or to 8.1.4 or newer. On Rails 8.0, upgrade to 8.1.4 or newer.

1. **Update configuration and align the APIs**: Check the release notes and upgrade guide for any changes to the configuration options, defaults, or new configuration options introduced in the new version. Update your configuration files accordingly to ensure compatibility with the new version.

1. **Test and deploy to staging**: Before deploying the upgraded Karafka application to production, it is recommended to run comprehensive tests to ensure functionality and catch any issues or regressions. Additionally, using a staging environment that resembles the production environment allows for extensive testing and validation before deployment. This helps ensure a smoother deployment process by verifying functionality, detecting regressions, and validating performance.

1. **Deploy to production**: When deploying the upgraded Karafka application, it is recommended first to deploy all the consumers and only then deploy the Web UI component. This sequential deployment ensures that the consumers are up and running to process incoming messages from Kafka while the Web UI is being upgraded.

    If you attempt to deploy the updated Web UI before the Karafka consumer processes, you may encounter errors. This could range from 500 Internal Server errors to incorrect or missing offset-related data displays.

    Ensure the order of operations - Karafka consumers processes first, then the Web UI. This will provide a smoother transition to the new version of the Web UI.

1. **Monitor**: During and after the upgrade, closely monitor the application's performance, logs, and error reports.

Following these upgrade recommendations will help ensure a successful upgrade process for your Karafka application while minimizing disruptions and maintaining compatibility with the latest version.

## Pro Upgrade Support

If you encounter difficulties while upgrading Karafka, particularly when upgrading from unsupported versions, we have a [Pro offering](https://karafka.io/#become-pro) that includes dedicated support. Our [Pro support](Pro-Support) can provide you with the necessary assistance to address any upgrade challenges and ensure a successful upgrade process. Feel free to contact us to learn more about the Pro offering and how it can help you with your Karafka upgrade.

## See Also

- [Upgrades Karafka](Upgrades-Karafka) - Version-specific Karafka upgrade guides
- [Upgrades Web UI](Upgrades-Web-UI) - Web UI upgrade instructions
- [Upgrades WaterDrop](Upgrades-WaterDrop) - WaterDrop version upgrade guides
