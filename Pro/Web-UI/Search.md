!!! warning "Feature Under Development"

    Please note that this feature is under development and has yet to be released. Stay tuned for updates.

The Search feature is a tool that enables users to search and filter messages efficiently. This feature allows users to search within one or multiple partitions, start from a specific time or offset, apply custom matchers to payloads, keys, or headers, and use custom deserializers for data.

## Usage

To access the search functionality in Web UI, you need to navigate to the Explorer and look for the loop icon. This icon is available when browsing through the data of a particular topic or partition. Clicking on the loop icon opens the search modal, allowing you to configure your search parameters and perform a detailed search.

The search modal includes several fields and options to refine your search:

- **Matcher**: Select the type of matcher you want to use for your search. Matchers define the criteria for searching within messages, such as searching within payloads, keys, or headers.

- **Phrase**: Enter the phrase you want to search for within the selected messages. This is the string that the search will look for according to the matcher criteria.

-  **Partitions**: Choose which partitions to include in the search. You can select all partitions or specify individual ones. This allows you to narrow down your search to specific parts of your Kafka topic.

-  **Offset**: Define the starting point for the search. You have three options:
    - **Latest**: Start searching from the most recent messages.
    - **Offset**: Specify an exact offset to start from.
    - **Timestamp**: Provide a timestamp (in milliseconds) to start the search from a specific point in time.

-  **Messages**: Select the limit on the number of messages to scan. The available options ensure the search operation remains efficient and does not overload the system.

Once you have configured your search parameters, click the "Search" button to initiate the search. The search results and detailed metadata will be displayed, helping you analyze and understand the data based on your specified criteria.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-search1.png)

## Reconfiguration

Search functionality can be reconfigured to better fit your specific needs and requirements. This is particularly useful if you need to adjust the search parameters to optimize performance or customize the behavior of the search operation.

Below are the key settings you can modify.

### Matchers

The `matchers` determine the criteria used for searching within messages. By default, the following matchers are available:

- `Matchers::RawPayloadIncludes`: This matcher searches for the specified phrase within the raw payload of the message. It is case-sensitive and ignores encoding issues.

- `Matchers::RawKeyIncludes`: This matcher checks if the specified phrase exists within the raw key of the message. It is also case-sensitive and ignores encoding issues.

- `Matchers::RawHeaderIncludes`: This matcher searches the message's raw headers. It is case-sensitive and checks if any header key or value contains the specified phrase.

You can customize this list to include your own matchers or remove existing ones.

```ruby
# Use only raw payload and a custom matcher
Karafka::Web.setup do |config|
  config.ui.search.matchers = [
    MyCustomMatcher,
    Matchers::RawPayloadIncludes
  ]
end
```

### Timeout

The `timeout` setting defines the maximum duration (in milliseconds) a search operation can run before it is automatically stopped. This prevents long-running searches that could hang the browser or degrade performance.

```ruby
Karafka::Web.setup do |config|
  config.ui.search.timeout = 60_000 # 60 seconds
end
```

### Limits

The `limits` setting specifies the maximum number of messages that can be scanned in a search operation. You can adjust these limits based on your data size and performance considerations. The default values are `1,000`, `10,000`, and `100,000`.

```ruby
Karafka::Web.setup do |config|
  config.ui.search.limits = [
    500,
    5_000,
    50_000,
    200_000
  ]
end
```

## Limitations

Below, you can find a detailed list of search capabilities' limitations from an end-user perspective. Understanding these limitations is important for effectively using the search functionality and managing expectations regarding its performance and scope.

!!! Hint "Possibility Of Reconfiguration"

    Certain limitations of the search capabilities can be changed by reconfiguring the search defaults during the Web UI configuration. This includes adjusting the search timeout, modifying the limits on the number of messages, and customizing matchers to better fit specific use cases.

1. **Search Timeout**: The search operation has a maximum duration (timeout) of 30,000 milliseconds (30 seconds). If a search takes longer, it will be stopped automatically, potentially leaving some messages unchecked.

1. **Limit on Number of Messages**: The search can only handle a certain number of messages (limits). This constraint ensures performance but may not be sufficient for huge data sets.

1. **Case Sensitivity**: The default search matchers (`RawPayloadIncludes`, `RawKeyIncludes`, `RawHeaderIncludes`) are case-sensitive, which might not meet the needs of users who require case-insensitive searches.

1. **Partition Scanning**: The search distributes the scanning limit evenly across partitions. If you specify a limit of 100,000 messages for a topic with five partitions, each partition will scan up to 20,000 messages. If messages are unevenly distributed, this might result in some partitions not being fully searched.

1. **Real-Time Message Influx Handling**: When searching from the latest messages, if new messages continue to come in, the search stops at the time it started to avoid endless searching. This can prevent capturing the most recent messages.

1. **Matcher Limitations**: Matchers must be predefined and active. Users cannot create ad-hoc matchers during the search operation.

1. **Complex Data Types and Encodings**: The search matchers ignore encoding issues. This could be problematic when dealing with complex data types or non-standard encodings.

These limitations highlight the trade-offs made to balance performance, simplicity, and functionality within the Karafka Web UI search capabilities.

## Metadata Details

The Search Metadata Details section provides detailed insights into the performance and outcomes of your search query. This type of information may be crucial for understanding the efficiency and effectiveness of your search and can help diagnose potential issues.

When you initiate a search, the results page contains a hidden detailed summary and partition-specific information, offering valuable insights into the search process. You can display it by clicking the stats icon above the search results.

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-search2.png)

The summary table at the top of the Search Metadata Details section highlights three key metrics:

1. **Total Messages Checked**: This figure represents the total number of messages that the search operation scanned. Understanding how many messages were checked can help you gauge the scope and thoroughness of the search. For instance, if you specified a limit for the search, this metric will show how close the operation came to reaching that limit.

1. **Matches**: This count shows the number of messages that matched the search criteria. By looking at the number of matches, you can quickly determine how relevant their search query was. A higher number of matches indicates that the search criteria were effective, while fewer matches might suggest that the criteria need adjustment.

1. **Search Time**: The duration of the search operation is also displayed and measured in seconds. This metric is crucial for evaluating the performance of the search. If the search time is too long, you might consider refining their search criteria or limiting the partitions you search in to improve efficiency.

Beneath the summary table, the partition details table provides more granular insights into how the search performed across different partitions:

1. **Partition**: Each partition involved in the search is listed here. This helps users see which parts of their data were included in the search operation.

1. **Messages Checked**: This number indicates how many messages were scanned for each partition. This detail helps users understand how the search workload was distributed across the partitions. If some partitions have significantly fewer messages checked, it might be due to the specified search limits or partition-specific data distribution.

1. **Offsets**: This column shows the range of message offsets checked in each partition, from the first to the last message. The offsets provide a sense of where in the data stream the search operation focused its efforts.

1. **Lookup Range**: The time range for the messages checked in each partition is displayed here. This indicates the temporal scope of the search, showing how far back the search looked in terms of message timestamps. This is useful for understanding whether the search covered recent data, historical data, or a mix of both.

1. **Matches**: This column displays the number of matches found in each partition. Seeing the distribution of matches across partitions can help users identify which partitions contain the most relevant data according to the search criteria.

The Search Metadata Details are highly useful for several reasons:

1. **Performance Monitoring**: By reviewing the search time and the number of messages checked, users can gauge the performance of their search queries and make adjustments to improve efficiency.

1. **Debugging and Optimization**: Detailed partition statistics can help identify any partitions requiring further investigation or optimization.

1. **Relevance Assessment**: By examining the number of matches, you can quickly assess the relevance of their search criteria and refine them if necessary.

1. **Temporal Analysis**: The lookup range provides insights into the temporal scope of the search, which helps analyze data trends over time.

## Custom Matchers
Creating custom matchers allows you to tailor the search functionality to meet your needs. Matchers define how messages are searched and can be customized to handle different data types or search criteria. Additionally, matchers can be configured to be available only for the topics that are relevant to them, ensuring that they are applied appropriately and efficiently.

### Why Create Custom Matchers?

- **Specific Search Requirements**: Custom matchers enable you to implement search logic that fits unique requirements, such as searching within nested JSON fields or applying custom deserialization logic.

- **Enhanced Search Precision**: By creating matchers that understand your specific data structure, you can improve the precision and relevance of search results.

- **Flexibility**: Custom matchers provide the flexibility to extend the default search capabilities of Karafka Web UI, making it adaptable to a wide range of use cases.

- **Security**: Custom matchers allow you to limit or expand search capabilities based on specific topics. This ensures that sensitive data is only accessible through appropriate matchers, enhancing overall security by restricting search operations to relevant topics.

### How to Build Custom Matchers

To create a custom matcher, you need to define a class that inherits from the `Karafka::Web::Pro::Ui::Lib::Search::Matchers::Base` class provided by Karafka. Your custom matcher must implement the call method, which takes a phrase and a message as arguments and returns a boolean indicating whether the phrase is found in the message.

Here's an example of a custom matcher that searches within a specific JSON field:

```ruby
class JsonFieldIncludes < Karafka::Web::Pro::Ui::Lib::Search::Matchers::Base
  def call(phrase, message)
    # Referencing `#payload` will deserialize it using the routing deserializer
    json_payload = message.payload
    json_payload['specific_field'].to_s.include?(phrase)
  rescue Encoding::CompatibilityError
    false
  end

  class << self
    def name
      'JSON Field Includes'
    end

    # Make it work for all the topics
    def active?(_topic_name)
      true
    end
  end
end
```

Once you have defined your custom matcher, you must configure Karafka Web UI to use it. Add your custom matcher to the list of matchers in the configuration:

```ruby
Karafka::Web.setup do |config|
  config.ui.search.matchers = [
    JsonFieldIncludes,
    Karafka::Web::Pro::Ui::Lib::Search::Matchers::RawPayloadIncludes,
    Karafka::Web::Pro::Ui::Lib::Search::Matchers::RawKeyIncludes,
    Karafka::Web::Pro::Ui::Lib::Search::Matchers::RawHeaderIncludes
  ]
end
```

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/pro-search2.png)

The `.active?`` method enables or disables matchers for specific topics. This can be useful if certain matchers are only relevant to particular types of data or topics. By default, matchers are always active.

Here’s an example of how to implement the `.active?` method to activate a matcher conditionally:

```ruby
class ConditionalMatcher < Karafka::Web::Pro::Ui::Lib::Search::Matchers::Base
  def call(phrase, message)
    # Custom search logic
    message.raw_payload.include?(phrase)
  rescue Encoding::CompatibilityError
    false
  end

  class << self
    def name
      'Conditional Matcher'
    end

    def active?(topic_name)
      # Only activate this matcher for a specific topic
      topic_name == 'important_topic'
    end
  end
end
```

### Important Considerations

- **Performance**: If your custom matcher involves deserialization or complex processing, be mindful of the impact of the performance. Deserialization can be resource-intensive, so ensure your matcher is optimized for performance.

- **Error Handling**: Ensure any errors within your custom matcher are properly handled. Unhandled exceptions will bubble up and cause a 500 error in the Web UI. To prevent this, it’s crucial to catch and manage potential errors within the matcher.

## Summary

By creating and configuring custom matchers, you can extend the functionality of Karafka Web UI to suit your needs better, providing more precise and relevant search capabilities. The `.active?` method allows you to conditionally activate matchers, ensuring that only the necessary matchers are applied to each topic, optimizing performance and relevance.
