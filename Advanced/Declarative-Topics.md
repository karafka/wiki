Karafka allows you to manage your topics in three ways:

- Using the built-in [Declarative Topics](Declarative-Topics) routing + CLI functionality (recommended)
- Directly via the [Admin API](Admin-API)
- From the Pro Web UI via the [Topics Management feature](https://karafka.io/docs/Pro-Web-UI-Topics-Management/)

Karafka considers your topics setup (retention, partitions, etc.) as part of your business logic. You can describe them in the routing and make Karafka ensure their consistency across all the environments using the appropriate CLI commands. Thanks to that, you can make sure that everything is described as code.

!!! Hint "Default Cluster Limitation"

    All admin operations in Karafka always run on the default cluster. To run admin operations on multiple clusters, you need separate Karafka boot files for each cluster. For more details, visit the [Admin Multi-Cluster Setup](https://karafka.io/docs/Admin-API/#multi-cluster-setup) section.

Keeping Kafka topics configuration as code has several benefits:

- Version Control: By keeping the topic settings as code, you can track changes over time and easily understand historical changes related to the topics. This is particularly important in a production environment where changes need to be carefully managed.

- Reproducibility: When you define Kafka topics settings as code, you can easily recreate the same topic with the same settings in multiple environments. This ensures that your development, staging, and production environments are consistent, which can help prevent unexpected issues and bugs.

- Automation: If you use code to define Kafka topics settings, you can automate the process of creating and updating topics. This can save time and reduce the risk of human error.

- Collaboration: When you keep Kafka topics settings as code, you can collaborate with other developers on the configuration. You can use tools like Git to manage changes and merge different configurations.

- Documentation: Code is self-documenting, meaning anyone can look at the configuration and understand what is happening. This can make it easier for new team members to get up to speed and help troubleshoot issues.

Overall, keeping Kafka topics settings as code can make it easier to manage, automate, and collaborate on Kafka topics, saving time and reducing the risk of errors.

Karafka [routing](Routing) allows you to do that via per topic `#config` method that you can use to describe your Kafka topic configuration.

This configuration is used by a set of Karafka [CLI](CLI) commands you can invoke to operate on your application's topics.

There are the following commands supported:

<table>
  <tr>
    <th>Command</th>
    <th>Description</th>
  </tr>
  <tr>
    <td><code>karafka topics create</code></td>
    <td>creates topics with appropriate settings.</td>
  </tr>
  <tr>
    <td><code>karafka topics delete</code></td>
    <td>deletes all the topics defined in the routes.</td>
  </tr>
  <tr>
    <td><code>karafka topics repartition</code></td>
    <td>adds additional partitions to topics with fewer partitions than expected.</td>
  </tr>
  <tr>
    <td><code>karafka topics reset</code></td>
    <td>deletes and re-creates all the topics.</td>
  </tr>
  <tr>
    <td><code>karafka topics plan</code></td>
    <td>plans the migration process and prints what changes are going to be applied if migration runs.</td>
  </tr>
  <tr>
    <td><code>karafka topics align</code></td>
    <td>aligns configuration of all the declarative topics that exist based on the declarative topics definitions.</td>
  </tr>
  <tr>
    <td><code>karafka topics migrate</code></td>
    <td>creates missing topics, repartitions existing to match expected partitions count and aligns the configuration.</td>
  </tr>
</table>

The below example illustrates the usage of the `migrate` command to align the number of partitions and to add one additional topic:

<div class="asciinema" data-cols="100" data-rows="16" data-cast="topics-migrate">
  <span style="display: none;">
    Note: Asciinema videos are not visible when viewing this wiki on GitHub. Please use our
    <a href="https://karafka.io/docs">online</a>
    documentation instead.
  </span>
</div>

## Defining Topic Configuration

All the configuration for a given topic needs to be defined using the topic scope `#config` method.

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(
        partitions: 6,
        replication_factor: 3,
        'retention.ms': 86_400_000, # 1 day in ms
        'cleanup.policy': 'delete'
      )

      consumer ConsumerA
    end

    topic :b do
      config(
        partitions: 2,
        replication_factor: 3
        # The rest will be according to the cluster defaults
      )

      consumer ConsumerB
    end
  end
end
```

If not invoked, the default config looks as followed:

```ruby
config(
  partitions: 1,
  replication_factor: 1
)
```

## Excluding Topics from the Topics Management

If you want to manage only part of your topics using Karafka, you can set the `active` flag for a given topic configuration to false.

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(active: false)
    end
  end
end
```

This will effectively ignore this topic from being altered in any way by Karafka. Karafka will ignore this topic together in all the CLI topics related operations.

!!! note ""

    Keep in mind that setting `active` to false inside the `#config` is **not** equivalent to disabling the topic consumption using the `active` method.

You can use Karafka to manage topics that you do not consume from as well by defining their config and making them inactive at the same time:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(
        partitions: 2,
        replication_factor: 3
      )

      active false
    end
  end
end
```

Setting such as above will allow Karafka to manage the topic while instructing Karafka not to try to consume it. A configuration like this is helpful in a multi-app environment where you want Karafka to manage topics, but their consumption belongs to other applications.

## Production Usage

The topics management CLI **never** performs any destructive actions except the `delete` and `reset` commands. This means you can safely include the `karafka topics migrate` in your deployment pipelines if you wish to delegate topics management to Karafka.

Please keep in mind that topics management API does **not** provide any means of concurrency locking when CLI commands are being executed.

## Strict Declarative Topics Validation

Karafka provides an optional configuration flag, `config.strict_declarative_topics`, that ensures all topics, including Dead Letter Queue (DLQ), are declared via the definitions of the declarative topics. When set to `true`, this flag enforces validation during routing to confirm that all topics are properly defined as declarative topics, even if they are inactive.

This setting is particularly useful if you want to ensure that all topics in the routing are managed and controlled through declarative definitions, enhancing consistency and preventing unintentional topic omissions. By using this flag, you can be confident that your entire topics setup is defined and managed as part of your configuration, reducing the chances of configuration drift across different environments.

You can enable this validation by adding the following to your `karafka.rb`:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.strict_declarative_topics = true
  end
end
```

With this setting enabled, Karafka will fail to start if any topics in the routing, including DLQ topics, are missing declarative definitions, ensuring strict adherence to the declarative topics management strategy.

## Detailed Exit Codes

When managing Kafka topics via Karafka's CLI commands, the `--detailed-exitcode` option can be configured. This option alters the exit codes based on the operation's result. This option provides more granular information, making integrating Karafka's topic management into automated systems like CI/CD pipelines easier. 

When the `--detailed-exitcode` flag is enabled, the `topic` related commands exit codes will work as follows:

- `0`: No changes were made. This means that all topics are already aligned with the desired state, and no operations were required.
- `1`: An error occurred during the operation. This indicates a failure or issue that needs to be addressed before continuing.
- `2`: Changes were either present or successfully applied. This code is returned when topics were created, updated, or deleted as part of the operation.

This behavior allows you to differentiate between successful operations with no changes, successful operations with changes, and errors, providing more control over how you handle Karafka's CLI topic management results.

You can enable this functionality by passing the `--detailed-exitcode` flag when invoking any topic-related command:

```bash
karafka topics plan --detailed-exitcode
```

This will ensure the correct exit code is returned based on the operation's outcome, enabling better automation and monitoring of topic changes.

## Limitations and Other Info

- Topics management is enabled by default but will not be used unless any CLI commands are invoked.
- `migrate` does not wait for a confirmation. Use `plan` command to check the changes that would be applied.
- If a topic is used by several consumer groups defined in one application, only the first `config` defined will be used.
- Topics management API does **not** support the management of multiple independent Kafka clusters. Only the primary one will be managed.
- Topics management API does **not** provide any means of concurrency locking when CLI commands are being executed. This means it is up to you to ensure that two topic CLI commands are not running in parallel during the deployments.
- Topics commands are **not** transactional. It means that the state application may be partial in case of errors.
- Topics commands **are** idempotent. Broken set of operations can be retried after fixes without worry.
- Karafka will **never** alter any topics that are not defined in the routing.
- `replication_factor` can be set **only** during the topic creation. It will not be altered for existing topics.
- `repartition` will **not** downscale the number of topic partitions and will ignore such configuration.
