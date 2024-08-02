Karafka's Web UI includes a comprehensive policies engine that provides granular control over user actions across all UI components.

This engine allows administrators to define and enforce policies on what specific users can view and do within the Web UI, ensuring compliance with data protection and privacy standards.

Data sanitization and filtering are integral to this engine, enabling the sanitization or exclusion of sensitive portions of payloads to prevent accidental exposure of sensitive information. When encryption is enabled, no data is displayed by default as a safeguard. However, partial sanitization can be applied to display non-sensitive parts of the payload, ensuring that only secure information is presented while sensitive elements remain protected.

## Usage

Karafka's Web UI was designed to keep data privacy and security at its core. Ensuring selective visibility becomes paramount as we navigate the vast expanse of information stored in Kafka topics. Karafka achieves this via a three-tiered approach:

- **Requests Policies**: The first level of control involves the ability to open particular pages within the Web UI. Configured via `ui.policies.requests`, a per-request policy engine can be used to both track and control access to specific URLs. This ensures that only authorized users can access certain parts of the interface, thereby providing a foundational layer of security and access management.

- **Messages Policies**: At its basic level, the decision to display or mask fundamental components of a message is made. By using the `ui.policies.messages` setting, users can dictate whether they want the entire payload, all headers, and the key (if provided) to be visible or hidden. This form of filtering provides an overarching control, allowing users, for instance, to completely obscure the payload while continuing to show headers and message key.

- **Partial Payload Sanitization**: For those seeking a more nuanced approach, Karafka's partial payload sanitization is the answer. This method enables granular control over the data's visibility. Instead of blanketing an entire message, it allows specific attributes within a deserialized message, such as an address or other sensitive information, to be masked. While ensuring a higher level of data security, this process necessitates additional effort and precision in its implementation.

In essence, Karafka offers both a broad-stroke and a fine-tuned approach to data visibility, ensuring that while essential information remains accessible, sensitive data is securely tucked away.

### Requests Policies

The Requests Policies feature in Karafka's Web UI provides a mechanism for controlling access to specific pages and functionalities within the Web UI on a per-request basis. Configured via `ui.policies.requests`, this policy engine allows the definition and enforcement of rules that determine which users can access particular URLs, ensuring a foundational layer of security and access management.

To utilize the Requests Policies, you must create a custom policy class that defines the logic for allowing or denying access to specific requests. This custom policy must implement the `allow?` method, which evaluates the request details and returns a boolean indicating whether the request should be permitted.


Below is an example of how to define and configure a custom Requests Policy:

```ruby
class MyCustomRequestsPolicy
  # @param env [Hash] rack env object that we can use to get request details
  # @return [Boolean] should this request be allowed or not
  def allow?(env)
    # Example logic: Allow access only if the user is an admin
    user = env['rack.session'][:user]
    user && user.admin?
  end
end
```

Once your policy is ready, you need to replace the default one in the configuration as follows:

```ruby
Karafka::Web.setup do |config|
  config.ui.policies.requests = MyCustomRequestsPolicy.new
end
```

### Messages Policies

Two steps are needed to use your custom messages policies:

1. A custom messages policy needs to be created
2. The defined messages policy must replace the default one via the reconfiguration.

Each messages policy requires six methods to be present:

1. `#key?` - should the message key be presented
1. `#headers?` - should the headers be visible
1. `#payload?` - should the payload be visible
1. `#download?` - should it be allowed to download this message raw payload
1. `#export?` - should it be allowed to download the deserialized and sanitized payload as JSON
1. `#republish?` - should it be allowed to repuliblish the message back to Kafka

Each method receives a message (of type `::Karafka::Messages::Message`) as a parameter and returns a boolean indicating whether the corresponding part of the message (key, headers, or payload) should be visible.

Below, you can see an example of a custom messages policy that hides all the information:

```ruby
class MyCustomMessagesPolicy
  def key?(_message)
    false
  end

  def headers?(_message)
    false
  end

  def payload?(_message)
    false
  end

  def download?(message)
    false
  end

  def export?(message)
    false
  end

  def republish?(message)
    false
  end
end
```

Once your policy is ready, you need to replace the default one in the configuration as follows:

```ruby
Karafka::Web.setup do |config|
  config.ui.policies.messages = MyCustomMessagesPolicy.new
end
```

### Partial Payload Sanitization

To filter or sanitize part of the data to be presented in the Karafka Web-UI, it is necessary to accomplish three key things:

1. **Wrapping Deserializers with a Sanitizer Layer**: The deserializers, which are responsible for converting the raw Kafka payloads into a format your application understands, need to be wrapped with a sanitizer layer. However, this sanitization should only occur in the context of the Web server. In other words, the raw data is being transformed twice: first, when it's deserialized, and again when the sanitizer filters out sensitive information before it is displayed on the Web UI.

2. **Context-Aware Wrapper**: The wrapper used to sanitize the data should be able to understand its operating context. It should be aware of whether it is operating in a Web server context (in which case it should sanitize the data) or in a Karafka server context (in which case it should leave the data untouched). This ensures that sensitive information is only filtered when data is being presented on the Web UI and not during backend processing or other non-UI-related tasks.

3. **Routing Wrapper Injection**: The final step for sanitizing data displayed in the Karafka Web UI is Wrapper Routing Injection, where the sanitizing wrapper is incorporated into the Karafka routing. This ensures the data is filtered for sensitive content after deserialization but before being displayed on the UI.

It is crucial to ensure that the deserializer wrappers are only used in the context of a Web server displaying the Web UI. The reason for this is that Karafka may otherwise accidentally use sanitized data when it is performing business logic operations. This could lead to unintended side effects, such as inaccurate data processing or potentially even data loss. The sanitization process is specifically intended to prevent sensitive data from being displayed on the Web UI. It is not meant to impact the data used by the backend system for processing or decision-making tasks.

Remember that the sanitization process should be implemented carefully to ensure that it doesn't interfere with the regular operation of your Karafka application. Always test your sanitization process thoroughly to ensure it behaves as expected and does not inadvertently impact your application's functionality.

Below you can find an example implementation of a wrapper that removes the replaces the `:address` key from the deserializers hash with a `[FILTERED]` string.

```ruby
# Define your sanitizer that will wrap the payload deserializer
class AddressSanitizer
  def initialize(deserializer)
    @deserializer = deserializer
  end

  def call(message)
    payload = @deserializer.call(message)

    # You need to set it yourself, it is NOT set by Karafka
    # return full payload unless we're in Puma (indicating Web-UI)
    return payload unless ENV.key?('PUMA')

    # Replace the address field with indicator, that it was filtered
    payload[:address] = '[FILTERED]' if payload.key?(:address)

    # Return the result payload
    payload
  end
end

# And mount it inside the karafka.rb routing
class KarafkaApp < Karafka::App
  setup do |config|
    # ...
  end

  routes.draw do
    topic :orders do
      consumer ExampleConsumer
      # Make sure, that the OrdersDeserializer is wrapped with an address sanitizer
      # so the address is not visible in the Web-UI
      deserializers(
        payload: AddressSanitizer.new(OrdersDeserializer.new)
      )
    end
  end
end
```

Below you can find an example of the effect of the usage of a similar sanitizer that removes the `visitor_id` from the displayed data:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/explorer_sanitization.png" alt="karafka web displayed data sanitization" />
</p>

## Example Use Cases

The filtering and sanitization feature can be handy in various scenarios, such as:

- **Privacy Compliance**: If your application processes personal data covered by regulations such as GDPR or CCPA, you can use filtering to prevent this data from being displayed, thus helping you stay compliant with data privacy laws.

- **Secure Debugging**: During debugging, developers may need to inspect data flows without being exposed to sensitive information. In this case, filtering can allow them to see necessary data while hiding sensitive details.

- **Customer Support**: In a customer support scenario, agents might need access to specific non-sensitive data to help diagnose or resolve issues. Filtering can show only the data required to address the customer's concern without exposing sensitive customer information.

- **Audit and Compliance**: In industries like finance or healthcare, compliance officers or auditors may need to inspect data flow while ensuring sensitive data like financial transactions or patient health data remains secure. Filtering can help present the necessary information while maintaining data security and regulatory compliance.

- **Data Analysis**: For data analysis or machine learning purposes, often raw data is used that may contain sensitive elements. A data analyst can utilize the filtering feature to see the data they need while still preserving the privacy of sensitive information.

## Summary

This ability to filter and sanitize data provides a powerful tool to ensure data privacy and security while still giving the necessary visibility into the data flow within your Kafka topics.
