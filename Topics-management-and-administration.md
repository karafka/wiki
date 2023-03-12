Karafka allows you to manage your topics in two ways:

- Using the built-in [Topics management](Topics-management) routing + CLI functionality (recommended)
- Directly via the [Admin API](Admin-API)


Karafka considers your topics setup (retention, partitions, etc.) as part of your business logic. You can describe them in the routing and make Karafka ensure their consistency across all the environments using the appropriate CLI commands. Thanks to that, you can make sure that everything is described as code.

**Note**: Admin actions will always be applied to the **default** cluster defined in the configuration.
