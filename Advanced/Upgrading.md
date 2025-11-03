This documentation page provides recommended strategies for upgrading Karafka and its dependencies to ensure a smooth and seamless upgrade process. Upgrading Karafka and its dependencies is essential to benefit from the latest features, bug fixes, and security enhancements. It is necessary to follow these strategies to minimize disruptions and avoid compatibility issues during the upgrade.

!!! tip "Pro & Enterprise Upgrade Support"

    If you're gearing up to upgrade to the latest Karafka version and are a Pro or Enterprise user, remember you've got a dedicated lifeline! Reach out via the dedicated Slack channel for direct support to ensure everything has been covered.

## Pre-Upgrade Considerations

1. **Review the Changelogs**: Read the release notes and changelog for each new version of Karafka and its dependencies. This will help you understand the changes, improvements, and potential breaking changes introduced in the latest version.

1. **Check Upgrade Guides and Recommendations**: Refer to the [upgrade guides](https://karafka.io/docs#upgrade-notes) and recommendations provided in the documentation for Karafka and its dependencies. These guides often highlight important considerations, steps, and best practices for the upgrade process. Following the recommended upgrade path can help ensure a smooth transition to the new version.

1. **Check Compatibility**: Verify the compatibility of your existing Karafka application and its dependencies with the new version. Look for deprecated features or breaking changes that might affect your code or configurations.

1. **Test Environment**: Set up a separate test environment that closely mirrors your production environment. Perform the upgrade and necessary tests in this environment before applying it to the production environment. This allows you to identify and resolve any potential issues or conflicts beforehand.

Considering these points, you'll be well-prepared for the upgrade process and can minimize potential disruptions or compatibility issues.

## Upgrade Strategy

1. **Read the upgrade guides**: Karafka provides detailed [upgrade guides](https://karafka.io/docs#upgrade-notes) for each major version release. These guides outline the steps required to upgrade from the previous version to the new version. Before proceeding with the upgrade, carefully read and follow the instructions in the upgrade guide.

1. **Upgrade one version at a time**: Always upgrade by **one** version at a time. Move from `2.1` to `2.2`, `2.2` to `2.3`, `2.3` to `2.4`, etc. Do **not** ever jump versions, as it is not recommended. This approach ensures that you can address any version-specific deprecations, migrations, or changes in a controlled manner, minimizing the risk of introducing breaking changes or bugs.

1. **Upgrade Karafka and its dependencies**: To upgrade the Karafka ecosystem, run the following command:

    ```shell
    bundle update karafka karafka-rdkafka karafka-core waterdrop karafka-web karafka-testing
    ```

    It is **recommended** always to upgrade Karafka with its dependencies together and to always run the most recent resolvable versions of all the libraries creating the Karafka ecosystem.

1. **Update configuration and align the APIs**: Check the release notes and upgrade guide for any changes to the configuration options, defaults, or new configuration options introduced in the new version. Update your configuration files accordingly to ensure compatibility with the new version.

1. **Test and deploy to staging**: Before deploying the upgraded Karafka application to production, it is recommended to run comprehensive tests to ensure functionality and catch any issues or regressions. Additionally, utilizing a staging environment that resembles the production environment allows for extensive testing and validation before deployment. This helps ensure a smoother deployment process by verifying functionality, detecting regressions, and validating performance.

1. **Deploy to production**: When deploying the upgraded Karafka application, it is recommended first to deploy all the consumers and only then deploy the Web UI component. This sequential deployment ensures that the consumers are up and running to process incoming messages from Kafka while the Web UI is being upgraded.

    If you attempt to deploy the updated Web UI before the Karafka consumer processes, you may encounter errors. This could range from 500 Internal Server errors to incorrect or missing offset-related data displays.

    It's critical to ensure the order of operations - Karafka consumers processes first, then the Web UI. This will provide a smoother transition to the new version of the Web UI.

1. **Monitor**: During and after the upgrade, closely monitor the application's performance, logs, and error reports.

Following these upgrade recommendations will help ensure a successful upgrade process for your Karafka application while minimizing disruptions and maintaining compatibility with the latest version.

## Pro Upgrade Support

If you encounter difficulties while upgrading Karafka, particularly when upgrading from unsupported versions, we have a [Pro offering](https://karafka.io/#become-pro) that includes dedicated support. Our [Pro support](Pro-Support) can provide you with the necessary assistance to address any upgrade challenges and ensure a successful upgrade process. Feel free to contact us to learn more about the Pro offering and how it can help you with your Karafka upgrade.

## See also

- [Upgrades Karafka](Upgrades-Karafka) - Version-specific Karafka upgrade guides
- [Upgrades Web UI](Upgrades-Web-UI) - Web UI upgrade instructions
- [Upgrades WaterDrop](Upgrades-WaterDrop) - WaterDrop version upgrade guides
