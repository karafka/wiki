Karafka allows you to manage your topics in three ways:

- Using the built-in [Declarative Topics](Infrastructure-Declarative-Topics) standalone DSL + CLI functionality (recommended)
- Directly via the [Admin API](Infrastructure-Admin-API)
- From the Pro Web UI via the [Topics Management feature](Pro-Web-UI-Topics-Management)

Karafka considers your topics setup (retention, partitions, etc.) as part of your business logic. You can describe them using the standalone declarative DSL and make Karafka ensure their consistency across all the environments using the appropriate CLI commands. Thanks to that, you can make sure that everything is described as code.

!!! tip "Multi-Cluster Support"

    Declarative Topics CLI commands operate on the default cluster. For CLI-based multi-cluster management, use the `KARAFKA_BOOT_FILE` environment variable to point to different cluster configurations. For programmatic admin operations, you can use `Karafka::Admin.new(kafka: {...})` to target different clusters directly. For more details, visit the [Admin Multi-Cluster Setup](Infrastructure-Admin-API#multi-cluster-setup) section.

Keeping Kafka topics configuration as code has several benefits:

- Version Control: By keeping the topic settings as code, you can track changes over time and easily understand historical changes related to the topics. This is particularly important in a production environment where changes need to be carefully managed.

- Reproducibility: When you define Kafka topics settings as code, you can easily recreate the same topic with the same settings in multiple environments. This ensures that your development, staging, and production environments are consistent, which can help prevent unexpected issues and bugs.

- Automation: If you use code to define Kafka topics settings, you can automate the process of creating and updating topics. This can save time and reduce the risk of human error.

- Collaboration: When you keep Kafka topics settings as code, you can collaborate with other developers on the configuration. You can use tools like Git to manage changes and merge different configurations.

- Documentation: Code is self-documenting, meaning anyone can look at the configuration and understand what is happening. This can make it easier for new team members to get up to speed and help troubleshoot issues.

Overall, keeping Kafka topics settings as code can make it easier to manage, automate, and collaborate on Kafka topics, saving time and reducing the risk of errors.

This configuration is used by a set of Karafka [CLI](Infrastructure-CLI) commands you can invoke to operate on your application's topics.

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
  <tr>
    <td><code>karafka topics health</code></td>
    <td>checks topics for replication and durability issues, detecting no redundancy, zero fault tolerance, and low durability configurations with actionable recommendations (Pro).</td>
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

Topic declarations are defined using the standalone `declaratives.draw` DSL, which is independent of routing. This means you can declare and manage any Kafka topic, including topics that your application does not consume from. This separation makes Karafka a powerful tool for managing your entire Kafka topic infrastructure as code, not just the topics tied to your consumers.

```ruby
class KarafkaApp < Karafka::App
  declaratives.draw do
    topic :a do
      partitions 6
      replication_factor 3
      config(
        'retention.ms': 86_400_000, # 1 day in ms
        'cleanup.policy': 'delete'
      )
    end

    topic :b do
      partitions 2
      replication_factor 3
      # The rest will be according to the cluster defaults
    end
  end
end
```

If not defined, the default configuration for a topic is:

- `partitions`: `1`
- `replication_factor`: `1`

### Managing Topics You Do Not Consume

Because declarative topics are independent from routing, you can use them to manage topics that belong to other applications or services. This is useful in organizations where a single team or application is responsible for Kafka topic infrastructure across multiple services:

```ruby
class KarafkaApp < Karafka::App
  declaratives.draw do
    # Topic consumed by this application
    topic :orders do
      partitions 6
      replication_factor 3
    end

    # Topic consumed by a different service entirely
    topic :external_events do
      partitions 10
      replication_factor 3
      config('retention.ms': 604_800_000)
    end

    # Topic used only for producing, not consumed by anyone here
    topic :audit_log do
      partitions 3
      replication_factor 3
      config('cleanup.policy': 'compact')
    end
  end

  routes.draw do
    topic :orders do
      consumer OrdersConsumer
    end
    # No routing entry needed for :external_events or :audit_log
  end
end
```

### Setting Defaults

You can define default settings that apply to all topics declared within the block. Topic-specific values override the defaults:

```ruby
class KarafkaApp < Karafka::App
  declaratives.draw do
    defaults do
      partitions 5
      replication_factor 3
      config('retention.ms': 604_800_000)
    end

    topic :orders do
      partitions 10 # Overrides default of 5
    end

    topic :events
    # Gets all defaults: 5 partitions, 3 replication_factor, retention 604_800_000
  end
end
```

### Multiple Draw Blocks

You can call `declaratives.draw` multiple times. Each call is additive, accumulating topic declarations:

```ruby
class KarafkaApp < Karafka::App
  declaratives.draw do
    topic :orders do
      partitions 6
    end
  end

  # Later, perhaps in an initializer or plugin
  declaratives.draw do
    topic :events do
      partitions 10
    end
  end
end
```

## Excluding Topics from the Topics Management

If you want to manage only part of your topics using Karafka, you can set the `active` flag for a given topic to `false`:

```ruby
class KarafkaApp < Karafka::App
  declaratives.draw do
    topic :a do
      active false
    end
  end
end
```

This will effectively ignore this topic from being altered in any way by Karafka. Karafka will ignore this topic together in all the CLI topics related operations.

!!! note

    Keep in mind that setting `active` to `false` in declarative topics is **not** equivalent to disabling the topic consumption using the routing `active` method.

## Coexistence with Routing

Declarative topics and routing are independent but share a single underlying repository. When a topic is declared in both places, the standalone `declaratives.draw` declaration takes precedence:

```ruby
class KarafkaApp < Karafka::App
  # Standalone declaration wins
  declaratives.draw do
    topic :orders do
      partitions 20
      replication_factor 3
    end
  end

  routes.draw do
    topic :orders do
      consumer OrdersConsumer
      # This config is ignored because :orders was already declared above
      config(partitions: 99)
    end
  end
end

# Karafka::App.declaratives.find_topic(:orders).partitions => 20
```

This means you can gradually migrate from the routing-based `config()` approach to the standalone DSL without breaking anything.

## Legacy Routing-Based Configuration

!!! warning "Deprecated"

    Defining topic configuration via the routing `#config` method is deprecated. While still functional for backwards compatibility, all new topic declarations should use the standalone `declaratives.draw` DSL described above. The routing-based approach will be removed in a future major release.

Previously, topic configuration was defined inline within routing blocks using the `#config` method:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    topic :a do
      config(
        partitions: 6,
        replication_factor: 3,
        'retention.ms': 86_400_000,
        'cleanup.policy': 'delete'
      )

      consumer ConsumerA
    end

    topic :b do
      config(
        partitions: 2,
        replication_factor: 3
      )

      consumer ConsumerB
    end
  end
end
```

This approach still works and populates the same shared repository as the standalone DSL. However, the standalone DSL is preferred because it cleanly separates infrastructure concerns (topic configuration) from application concerns (consumer routing), and it allows managing topics that are not consumed by your application.

To migrate, move your `config()` calls from routing into a `declaratives.draw` block and remove them from routing:

```ruby
# Before (legacy)
routes.draw do
  topic :orders do
    config(partitions: 6, replication_factor: 3)
    consumer OrdersConsumer
  end
end

# After (recommended)
declaratives.draw do
  topic :orders do
    partitions 6
    replication_factor 3
  end
end

routes.draw do
  topic :orders do
    consumer OrdersConsumer
  end
end
```

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

```shell
karafka topics plan --detailed-exitcode
```

This will ensure the correct exit code is returned based on the operation's outcome, enabling better automation and monitoring of topic changes.

## Limitations and Other Info

- Topics management is enabled by default but will not be used unless any CLI commands are invoked.
- `migrate` does not wait for a confirmation. Use `plan` command to check the changes that would be applied.
- If a topic is declared in both `declaratives.draw` and routing `config()`, the standalone declaration takes precedence.
- Topics management API does **not** support the management of multiple independent Kafka clusters. Only the primary one will be managed.
- Topics management API does **not** provide any means of concurrency locking when CLI commands are being executed. This means it is up to you to ensure that two topic CLI commands are not running in parallel during the deployments.
- Topics commands are **not** transactional. It means that the state application may be partial in case of errors.
- Topics commands **are** idempotent. Broken set of operations can be retried after fixes without worry.
- Karafka will **never** alter any topics that are not defined in the declarations.
- `replication_factor` can be set **only** during the topic creation. It will not be altered for existing topics.
- `repartition` will **not** downscale the number of topic partitions and will ignore such configuration.

---

## See Also

- [Routing](Consumer-Groups-Routing) - Define routing and topic configurations together
- [Admin API](Infrastructure-Admin-API) - Programmatically manage topics beyond declarative definitions
- [Topic Configuration](Kafka-Topic-Configuration) - Understanding Kafka topic-level configuration options
- [Topic Auto Creation](Infrastructure-Topic-Auto-Creation) - Understand automatic topic creation behavior
- [CLI](Infrastructure-CLI) - Complete reference of Karafka CLI commands for topic management
