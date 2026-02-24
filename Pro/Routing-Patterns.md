Karafka's Routing Patterns is a powerful feature that offers flexibility in routing messages from various topics, including topics created during the runtime of Karafka processes. This feature allows you to use regular expression (regexp) patterns in routes. When a matching Kafka topic is detected, Karafka will automatically expand the routing and start consumption without additional configuration. This feature greatly simplifies the management of dynamically created Kafka topics.

## How It Works

Routing Patterns is not just about using regex patterns. It's about the marriage of regexp and Karafka's topic routing system.

When you define a route using a regexp pattern, Karafka monitors the Kafka topics. As soon as a topic matching the pattern emerges, Karafka takes the initiative. Without waiting for manual interventions or service restarts, it dynamically adds the topic to the routing tree, initiates a consumer for this topic, and starts processing data.

Below, you can find a conceptual diagram of how the discovery process works:

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/routing_patterns/detection_flow.svg" />
</p>
<p align="center">
  <small>*This example illustrates how the detection process works. When Karafka detects new topics in Kafka, it will try to match them, expand routes, and process incoming data.
  </small>
</p>

Upon detecting a new topic, Karafka seamlessly integrates its operations just as with pre-existing ones. Notably, regexp patterns identify topics even during application initialization, ensuring compatibility with topics established prior, provided they haven't been previously defined in the routes.

!!! warning "Regexp Implementation Differences"

    The underlying `librdkafka` library utilizes a regexp engine from a `libc` library. It's crucial to note that this engine supports a POSIX-compatible regular expression format, which is not fully aligned with the regexp engine used by Ruby. Given these differences, it's highly advisable to conduct thorough testing of your regexp patterns to confirm that the dynamic topics you intend to match are not only visible within Karafka and the Karafka Web UI but are also being consumed as expected. The discrepancies between the regexp engines could lead to unexpected behaviors. You can read more about this topic in [this](Pro-Routing-Patterns#differences-in-regexp-evaluation-between-ruby-and-libc) section.

### Representation of Routing Patterns

Defining a pattern within Karafka automatically translates this into an underlying topic representation with a regular expression (regexp) that matches the appropriate Kafka topics.

To support this concept, from the Routing Patterns feature perspective, Karafka has three types of topics:

1. **regular** Represents the standard Kafka topics. These are directly matched based on their name without the need for any patterns. This type is used when a straightforward, one-to-one correlation with an existing topic and patterns are not used.

2. **matcher**: This type signifies the representation of a regular expression used by `librdkafka`. It is the gateway for Karafka's dynamic topic discovery, laying the foundation for the `:discovered` type.

3. **discovered** This type comes into play when there's a real, tangible topic that Karafka begins to listen to after it was matched with a regular expression.

The matcher topic holds a paramount position in the dynamic topic discovery mechanism. It embodies a regular expression subscription, acting as the initial point of discovery. When a new topic aligns with the matcher topic's criteria (whether during boot-up or at runtime), Karafka uses the matcher topic's configuration as the blueprint. This new topic inherits the settings and becomes part of the same consumer group and subscription group as its originating matcher topic.

Subsequently, this newly registered topic is created as the `:discovered` type. To simplify its identification, especially in environments where multiple topics are at play, it's labeled as `:discovered` in the Web UI.

Diagram below represents the relationship between topics of various types and how they operate within Karafka routing:

<p align="center">
  <img src="https://karafka.io/assets/misc/charts/routing_patterns/routes.svg" />
</p>
<p align="center">
  <small>*This example illustrates how a single consumer group and subscription group can incorporate multiple topics of various types. All `:discovered` topics always use the same settings as their base `:matcher` topic.
  </small>
</p>

## Enabling Routing Patterns

Creating patterns for routing in Karafka is done by using the routing `#pattern` method. Think of it as the twin of the `#topic` method but with an added flair of pattern matching:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    pattern(/.*_dlq/) do
      consumer DlqConsumer
    end

    # patterns accept same settings as `#topic`
    # so they can use all the Karafka features
    pattern(/.*_customers/) do
      consumer CustomersDataConsumer
      long_running_job true
      manual_offset_management true
      delay_by(60_000)
    end
  end
end
```

The same usage contexts apply since this method is a twin to the `#topic`. You can define your patterns in the following places:

- **Routing root Level**: Place it directly in your routing.

- **Consumer Group**: Use it within a `#consumer_group` block.

- **Subscription Group**: Insert it inside the `#subscription_group` block.

Regardless of where you use it, it works similarly to the `#topic` method, but searches for topics based on patterns.

Patterns crafted in such a way are called "anonymous patterns". This terminology highlights that these patterns don't have a predefined name. Instead, Karafka generates a name prefixed with "karafka-pattern-" based on the regular expression content. This approach ensures unique and distinguishable matcher topics but, at the same time, makes it much harder to exclude pattern routes from the CLI. Anonymous patterns are easy to start with and great for development. However, we do recommend assigning them names in the later stages before shipping to production.

### Named Patterns

Named and anonymous patterns in Karafka work the same way when setting up routing. The key difference is that named patterns have a specific name you choose, while anonymous patterns don't. This name is handy when picking or skipping certain routes in Karafka using the CLI. It's good to start with anonymous patterns when testing things out. But, as you finalize how you use them, switching to named patterns can make things more transparent and consistent.

You define named patterns similarly to anonymous by using the `#pattern` method but instead of providing only the regular expression, the expectation is that you provide both the name and the regexp:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    pattern(:dlqs_pattern, /.*_dlq/) do
      consumer DlqConsumer
    end

    pattern(:customers_pattern, /.*_customers/) do
      consumer CustomersDataConsumer
      long_running_job true
      manual_offset_management true
      delay_by(60_000)
    end
  end
end
```

### ActiveJob Routing Patterns

In the case of ActiveJob, a new method is available called `#active_job_pattern` that allows you to define pattern matchings for ActiveJob jobs. Its API is similar to the `#pattern` one and works the same way:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    # Anonymous active job pattern
    active_job_pattern(/.*_fast_jobs/)

    # or a named on with some extra options
    active_job_pattern(:active_jobs, /.*_late_jobs/) do
      delay_by(60_000)
    end
  end
end
```

## Negative Matching and Exclusion Patterns

Sometimes, you may need to route messages from topics that match a pattern but with specific exclusions. A common use case is when you want to handle one specific topic differently from others that follow a similar naming pattern.

### Excluding Specific Topic Prefixes

When working with topic naming conventions like `[app_name].data_results`, you might want to process most topics matching this pattern with one consumer while directing a specific topic (e.g., `activities.data_results`) to a different consumer.

Since POSIX regular expressions used by `librdkafka` don't support negative lookahead assertions (`?!`) available in Ruby's regex engine, you'll need to use alternative approaches for exclusion patterns.

One effective method is to use character-by-character negative matching to exclude specific prefixes:

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    # Special consumer for activities.data_results
    topic 'activities.data_results' do
      consumer ActivitiesConsumer
    end

    # It has to be one-line to work with librdkafka
    negative_matching = <<~PATTERN.gsub(/\s+/, '')
      ^(
        [^a]|
        a[^c]|
        ac[^t]|
        act[^i]|
        acti[^v]|
        activ[^i]|
        activi[^t]|
        activit[^i]|
        activiti[^e]|
        activitie[^s]|
        activities[^.]
      )
    PATTERN

    exclusion_regex = Regexp.new(negative_matching + ".*data_results$")

    # All other app_name.data_results topics
    pattern(exclusion_regex) do
      consumer GenericConsumer
    end
  end
end
```

While this pattern looks complex, it works by explicitly matching any string that doesn't start with "activities" followed by a period. The regex checks each character's position and ensures it either doesn't match the expected character in "activities" or, if it does match that far, it diverges afterward.

### Testing Exclusion Patterns

Given the complexity of these patterns and the differences between Ruby and POSIX regex engines, it's crucial to test your exclusion patterns thoroughly:

```ruby
# The regex pattern that excludes "activities.data_results"
negative_matching = <<~PATTERN.gsub(/\s+/, '')
  ^(
    [^a]|
    a[^c]|
    ac[^t]|
    act[^i]|
    acti[^v]|
    activ[^i]|
    activi[^t]|
    activit[^i]|
    activiti[^e]|
    activitie[^s]|
    activities[^.]
  )
PATTERN

exclusion_regex = Regexp.new(negative_matching + ".*data_results$")

# Topics that should match (be processed by GenericConsumer)
should_match = [
  'users.data_results',
  'orders.data_results',
  'metrics.data_results',
  'active.data_results'  # Note: this is not "activities"
]

# Topics that should NOT match (be processed by ActivitiesConsumer)
should_not_match = [
  'activities.data_results'
]

should_match.each do |topic|
  assert ruby_posix_regexp_same?(topic, exclusion_regex),
         "Expected '#{topic}' to match in both Ruby and POSIX"
end

should_not_match.each do |topic|
  assert !ruby_posix_regexp_same?(topic, exclusion_regex),
         "Expected '#{topic}' to NOT match in both Ruby and POSIX"
end
```

### When to Use Exclusion Patterns

While exclusion patterns provide a powerful way to route messages, they should be used carefully:

- They're ideal when you need different Karafka-level configurations (like virtual partitions or specific error handling) for different topics
- They simplify routing logic by keeping it at the configuration level instead of embedding it in consumer code
- They're most maintainable when the exclusion list is small and stable

### Limiting Patterns used per process

Karafka's named and anonymous patterns are associated with a specific matcher topic name. This uniform naming system allows more flexibility when using the Karafka Command Line Interface (CLI). As with standard topics, you can include or exclude matcher topics when running Karafka processes by referencing their name.

Giving the below routing setup:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    pattern(:dlqs_pattern, /.*_dlq/) do
      consumer DlqConsumer
    end

    pattern(:customers_pattern, /.*_customers/) do
      consumer CustomersDataConsumer
    end
  end
end
```

You can limit the process operations to only specific patterns:

```shell
# This code will not run topics and patterns other than `dlqs_pattern`
#
# You can use space to provide more patterns
bundle exec karafka server --include-topics dlqs_pattern
```

as well as you can exclude patterns from being part of the operations:

```shell
# This code will run ony topics and patterns other than `dlqs_pattern`
#
# You can use space to provide more patterns
bundle exec karafka server --exclude-topics dlqs_pattern
```

## Limitations

There are key aspects to consider to ensure efficient and consistent behavior:

1. **Changing Regexp in Anonymous Patterns**: If the regular expression for an anonymous pattern is changed, its name will change too.

1. **Avoid Overlapping Regexps**: It's crucial to avoid defining multiple regular expressions within the same consumer group that might match the same topics. This can lead to unexpected behavior because of possible reassignments and rebalances.

1. **Thoroughly Test Patterns**: Always ensure your patterns don't overlap within a single consumer group. Regular testing can prevent unwanted behavior.

1. **Potential Regexp Differences**: The regular expressions in Ruby and `librdkafka` in C might not work identically. Always test the matching behaviors before deploying to production.

1. **Runtime Topic Detection Isn't Immediate**: When a new topic emerges, its detection isn't real-time. It's influenced by the cache TTL, governed by the `topic.metadata.refresh.interval.ms` setting. The default is 5 seconds in development and 5 minutes in production. For most production scenarios, sticking to the 5-minute default is advised as it strikes a good balance between operational responsiveness and system load.

1. **Internal Regular Expression Requirements of `librdkafka`**: The library requires regular expression strings to start with `^`. Karafka's Routing Patterns adapt Ruby's regular expressions to fit this format internally. Remembering this transformation and thoroughly testing your patterns before deploying is important. You can find the adjusted regular expression in the Web UI under the routing page topic details view if you wish to review the adjusted regular expression.

1. **Too Broad Regular Expressions**: Broad regular expressions may unintentionally match a wide range of topics, leading to the over-consumption of topics that were not intended to be included. This can result in excessive resource utilization, unexpected data processing, and potential bottlenecks in the system.

Please ensure you're familiar with these considerations to harness the full power of Routing Patterns without encountering unexpected issues.

## DLQ Accidental Auto-Consumption

This feature requires careful attention when used alongside [Dead Letter Queues (DLQs)](Dead-Letter-Queue) to avoid unintended behaviors. A common pitfall arises from using regular expressions that are not precise enough, leading to scenarios where the base topic consumer consumes the DLQ topics themselves.

The issue occurs when a regular expression, designed to match topics for consumption, also inadvertently matches the DLQ topics. This mistake can initiate an endless cycle of consuming and failing messages from the DLQ, creating a loop that hampers the error-handling process.

Such a case can lead to situations where messages destined for the DLQ due to processing errors are re-consumed as regular messages, only to fail and be sent back to the DLQ, perpetuating a cycle.

Below, you can see an example routing setup that will cause the DLQ topic to be consumed by the `EventsConsumer` despite it not being explicitly declared.

```ruby
class KarafkaApp < Karafka::App
  routes.draw do
    pattern /.*\.events/ do
      consumer EventsConsumer

      # The above regexp will also match the below DLQ topic
      dead_letter_queue(
        topic: 'global.events.dlq'
      )
    end
  end
end
```

To prevent such loops, it's essential to:

- Craft regular expressions precisely, ensuring they match only the intended topics and not the DLQs unless explicitly desired.

- Adopt clear naming conventions for DLQ topics that can easily be excluded in regex patterns.

- Test regular expressions thoroughly against various topic names as described [here](#testing-regular-expressions).

While routing patterns offer a dynamic and powerful method to manage topic consumption in Karafka, they demand careful consideration and testing, especially when integrating DLQ mechanisms.

## Differences in Regexp Evaluation Between Ruby and libc

When dealing with regular expressions in Karafka, it's important to understand the underlying differences between the regex engines used by Ruby and the one used by `librdkafka`. `librdkafka`, which is a core component of Karafka for interacting with Kafka, defaults to the POSIX regex engine provided by `libc`. On the other hand, Ruby employs a different format for regular expressions, specifically the Oniguruma engine, known for its extensive feature set and flexibility.

### Key Differences

1. **Syntax and Features**: The Oniguruma engine (Ruby) supports a broader range of syntaxes and features than the POSIX regex engine. These include look-ahead and look-behind assertions, non-greedy matching, and named groups, among others.

1. **Character Classes**: Ruby's regex engine supports POSIX bracket expressions but also includes additional character class shorthands (like `\d`, `\w`, `\s`, and their uppercase counterparts), which are not part of the POSIX standard.

1. **Grouping and Capturing**: Ruby supports non-capturing groups with `?:`, named groups with `?<name>`, and atomic groups, which are unavailable in the POSIX regex engine.

### Testing Regular Expressions

Given the differences between Ruby's and libc's regular expression engines, it is recommended to thoroughly test your regular expressions to ensure compatibility, especially when using them with Karafka for dynamic topic routing. Testing becomes crucial because a regular expression in Ruby might behave differently or not work with librdkafka.

To bridge the gap and verify that your regular expressions work as expected in both environments, you can use the POSIX regex engine directly within a Ruby context through command-line tools like `grep`. This approach allows you to test regular expressions against the POSIX standard and ensure they're compatible with librdkafka.

Here's how you can test a POSIX regular expression in a Unix-like terminal:

```shell
echo 'sample_string' | grep -E 'posix_regex'
```

We also recommend creating a test helper class or method to ensure consistency in matching behaviors similar to the one below:

```ruby
def ruby_posix_regexp_same?(test_string, ruby_regex)
  # Prepare POSIX regex from Ruby regex
  posix_regex = ruby_regex.source

  # Evaluate regex in Ruby
  ruby_match = !!(test_string =~ ruby_regex)

  # Prepare command for bash execution
  grep_command = "echo '#{test_string}' | grep -E '#{posix_regex}' > /dev/null"

  # Evaluate regex in bash (POSIX)
  posix_match = system(grep_command)

  # Compare results
  comparison_result = ruby_match == posix_match

  # Remove printing for automated specs
  puts "Ruby match: #{ruby_match}"
  puts "POSIX match: #{posix_match}"
  puts "Comparison: #{comparison_result}"

  comparison_result
end
```

Below, you can see how certain regular expressions differ between Ruby and `libc`:

```ruby
ruby_posix_regexp_same?('test12.production', /\d\d/)
# Ruby match: true
# POSIX match: false
# Comparison: false

ruby_posix_regexp_same?('test12.production', /[0-9]{2}/)
# Ruby match: true
# POSIX match: true
# Comparison: true

ruby_posix_regexp_same?('test12.production', /[0-9]{10}/)
# Ruby match: false
# POSIX match: false
# Comparison: true
```

This comparative testing method offers a straightforward way to ensure your regular expressions behave as expected across different environments, particularly when working with librdkafka in Karafka.

## Example Use Cases

1. **Tenant-specific Topics**: Modern SaaS applications often cater to multiple tenants, each requiring its own data isolation. You can ensure data segregation by having a Kafka topic for each tenant, like `tenantA_events`, `tenantB_logs`. Routing Patterns can simplify the consumption from these dynamically created topics.

1. **Environment-based Topics**: Development environments like staging, production, or QA might generate events. Using routing patterns can streamline the consumption process if these are categorized into topics like `staging_logs` and `prod_errors`.

1. **Versioned Topics**: As systems evolve, data formats and structures change. Regexp patterns can handle these variations smoothly if you've chosen to version your topics, like `data_v1`, `data_v2`.

1. **Date-based Topics**: The feature becomes invaluable for systems that rotate topics based on timeframes, like `logs_202301` and `logs_202302`, ensuring no topic goes unnoticed.

1. **Special-event Topics**: Seasonal events, promotions, or sales like `blackfriday_deals`, `holiday_discounts` often have dedicated topics. This feature ensures that such transient topics are efficiently catered to.

1. **Automated Testing Topics**: In CI/CD pipelines, where automated tests might create on-the-fly topics like `test_run_001`, `test_run_002`, regexp routing can prove to be a boon.

1. **Backup and Archive Topics**: Systems that create backup topics, like `archive_2023Q1`, `backup_2023Q2`, can benefit by dynamically routing these for monitoring or analysis.

1. **Error and Debug Topics**: Special topics created for debugging or error tracking, like `errors_critical`, `debug_minor`, can be consumed automatically using patterns.

1. **Dedicated DLQ (Dead Letter Queue) Topics**: Handling erroneous or unprocessable messages becomes crucial as applications scale. Systems can isolate and address these problematic messages by employing dedicated Kafka topics for DLQ, such as `dlq_orders`, `dlq_notifications`. Karafka's Routing Patterns can be leveraged to automatically detect and route messages to these DLQ topics, ensuring efficient monitoring and subsequent troubleshooting.

## Summary

Karafka's Routing Patterns offers a dynamic solution for message routing, utilizing the power of regular expressions. By defining regexp patterns within routes, this feature allows automatic detection and consumption of Kafka topics that match the specified patterns. This functionality ensures agile integration of new and pre-existing topics that have yet to be defined in routes, simplifying the management process and eliminating the need for manual configuration. Whether handling tenant-specific or dedicated Dead Letter Queue topics, Karafka's Routing Patterns enhance flexibility and efficiency in data flow management.

---

## See Also

- [Routing](Routing) - Standard routing configuration
- [Testing](Testing) - Testing strategies for Karafka applications
- [Deserialization](Deserialization) - Message deserialization configuration
