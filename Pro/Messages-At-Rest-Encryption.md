Specific industries have strong regulations around the storage of personal data. Private medical data, financial data, social security numbers, and credit card numbers are all sensitive. Karafka Pro supports transparent encryption of the message's payload, so sensitive data at rest in Kafka cannot be seen.

Karafka uses RSA asymmetric encryption, so your producers do not have to have the capability to decrypt data.

!!! warning "Custom Headers Deserializer and Encryption"

    When using Karafka's encryption features, it's important to note that encryption may not work as expected if you use a custom headers deserializer. Custom deserialization of headers can alter how encryption headers are processed, potentially leading to issues in correctly encrypting or decrypting messages. In cases where custom headers deserialization is necessary, it is recommended to consult with Karafka Pro support for guidance to ensure that encryption functionalities are properly integrated and maintained within your application.

## Enabling Encryption

Encryption has its dedicated section in the configuration called `encryption`. To enable encryption, you need to:

1. Set the `encryption.active` key to `true`.
2. Set the `encryption.version` to a uniquely identifiable string, and it will be used in produced messages headers to match against the private key.
3. Set the `encryption.public_key` with a public PEM key value.
4. Set the `encryption.private_keys` using a hash, where the key is the version name matching the encryption version, and the value is the PEM private key that should be used to decrypt messages.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other config options...

    config.encryption.active = true
    config.encryption.version = '1'
    config.encryption.public_key = ENV['PUBLIC_PEM_KEY']
    config.encryption.private_keys = { '1' => ENV['PRIVATE_PEM_KEY'] }
  end
end
```

Once everything is configured, Karafka will automatically produce encrypted messages and decrypt them before their usage.

Karafka keeps messages encrypted until their deserialization.

!!! note

    Karafka encrypts **only** the message payload. All other things are cleartext to aid with debugging. Do not store any sensitive information in message keys or headers.

## Handling of Unencrypted Messages with Encryption Enabled

Karafka automatically recognizes unencrypted messages and does not attempt to decrypt them. This means you can gradually enable and roll out encryption without worrying about previously unencrypted data.

## Producing Encrypted Messages without Private Key Configuration

If you do not plan to consume messages from some of your applications, you may skip the `private_keys` definition:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other config options...

    config.encryption.active = true
    config.encryption.version = '1'
    config.encryption.public_key = ENV['PUBLIC_PEM_KEY']
  end
end
```

That way, the given application can produce messages but not decrypt them. This is especially useful when you are building bigger systems where you want to provide limited granular permissions.

## Rotating Public and Private Keys

When you upgrade your keys, please remember to update the `config. encryption.version`, so Karafka can recognize the correct key pair.

If you have yet to consume messages using an old public key, do **not** remove the old private key.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other config options...

    config.encryption.active = true
    config.encryption.version = '2'
    config.encryption.public_key = ENV['PUBLIC_PEM_KEY_V2']
    config.encryption.private_keys = {
      '1' => ENV['PRIVATE_PEM_KEY_V1'],
      '2' => ENV['PRIVATE_PEM_KEY_V2']
    }
  end
end
```

Karafka will automatically detect and use the correct private key to decrypt messages encrypted with the old public key.

## Using Multiple Public and Private Keys to Support Multiple Customers

There are scenarios where you may want your customers to publish messages directly to your Kafka cluster. You can ensure that this communication is also private and, At-Rest encrypted.

All you need to do for this to happen is:

1. Generate a key pair and give the public key to your customer.
2. Use a unique identifier as a version in `private_keys` so Karafka knows which private key to use.
3. Ask the customer to include an `encryption` header in each message containing the identifier.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other config options...

    config.encryption.active = true
    config.encryption.version = 'internal_1'
    config.encryption.public_key = ENV['PUBLIC_PEM_KEY_INTERNAL_1']
    config.encryption.private_keys = {
      'internal_1' => ENV['PRIVATE_PEM_KEY_INTERNAL_1'],
      'customer_1' => ENV['PRIVATE_PEM_KEY_CUSTOMER_1'],
      'customer_2' => ENV['PRIVATE_PEM_KEY_CUSTOMER_2']
    }
  end
end
```

!!! note

    Such a pattern should only be used when working with trusted entities.

## Messages Fingerprinting

In Ruby, decrypting a message with an incorrect but semantically valid key may complete the decryption process successfully but result in nonsensical data. This behavior poses a significant risk in systems lacking stringent consistency checks, as they might inadvertently persist corrupted data to a database, assuming the decryption was successful.

This situation can arise during key rotation processes or when encryption keys are changed. Karafka introduces a feature for enhancing message integrity through fingerprinting to mitigate such risks. By setting the `fingerprinter` option to an object that responds to the `#hexdigest` method, Karafka appends an additional `encryption_fingerprint` header to each message before sending. This fingerprint is then used after decrypting the message to verify its integrity. If the integrity check fails, indicating that the message was not decrypted with the correct key or was tampered with, Karafka will raise an error, preventing corrupted data from being processed further.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # Other config options...

    config.encryption.active = true
    config.encryption.version = '1'
    config.encryption.public_key = ENV['PUBLIC_PEM_KEY']
    config.encryption.private_keys = { '1' => ENV['PRIVATE_PEM_KEY'] }

    # Set this to any system or custom digest engine that responds to `#hexdigest`
    config.encryption.fingerprinter = Digest::MD5
  end
end
```

This mechanism of ensuring message integrity is distinct from the CRC (Cyclic Redundancy Check) integrity check provided by Kafka. While Kafka's CRC check ensures that a message has not been corrupted in transit, providing a form of transport-level integrity, it does not protect against decryption with the wrong key. Karafka's fingerprinting feature addresses this gap by offering an additional layer of security that ensures the decrypted message is the exact message that was encrypted initially, thereby safeguarding against processing corrupted data due to key mismanagement or other errors.

This feature is especially critical in industries subject to stringent regulations around handling sensitive data, such as healthcare, finance, and government. By ensuring the integrity of decrypted messages, Karafka helps organizations maintain compliance with regulations like HIPAA and GDPR, which mandate strict controls over the confidentiality and integrity of sensitive information.

!!! warning "Selection of Fingerprinting Algorithm"

    The choice of fingerprinting algorithm is critical and should be made with care. Each message processed by Karafka will have a fingerprint header attached based on the selected algorithm. This inclusion can significantly increase the size of each message, especially for smaller messages, potentially impacting overall throughput and storage efficiency. Additionally, the process of computing these fingerprints is CPU-intensive. This could lead to increased processing times and higher CPU usage, affecting the performance of your system. It's essential to weigh these considerations when selecting a fingerprinting algorithm to ensure it aligns with your application's performance and resource utilization requirements.

## Example Use Cases

- Healthcare: In the healthcare industry, patient data like medical history, diagnoses, and prescriptions are stored in Kafka. At-rest encryption can help ensure the confidentiality and integrity of this sensitive information, helping to meet regulatory requirements like HIPAA and GDPR.

- E-commerce: E-commerce companies may store sensitive customer data like login credentials, shipping addresses, and credit card details in Kafka. At-rest encryption can help prevent data breaches and protect the privacy of customers, which can improve their trust in the company and increase sales.

- Government: Government agencies often store sensitive information like personally identifiable information (PII) and classified data in Kafka. At-rest encryption can help protect this data from unauthorized access or theft, ensuring national security and compliance with regulations.

- IoT: Internet of Things (IoT) devices often send and receive sensitive data like sensor readings, user locations, and device configurations via Kafka. At-rest encryption can help prevent unauthorized access to this data, ensuring the privacy and security of users and devices.

- Human Resources: Human resources departments may store sensitive employee data such as social security numbers, payroll information, and performance reviews in Kafka. At-rest encryption can help protect this data from unauthorized access or theft, ensuring regulatory compliance and maintaining employee trust.

Karafka Pro's at-rest encryption is worth using because it provides a layer of security to sensitive data stored in Kafka, ensuring that even if the data is compromised, it cannot be viewed by unauthorized users. The encryption is transparent, meaning that it doesn't require any changes to the application code or Kafka configuration, making it easy to implement. Moreover, it supports key rotation and management, enabling the organization to have complete control over the encryption keys and ensuring data is always secure. This makes it an essential feature for businesses that deal with sensitive data and want to protect their customers' privacy and maintain regulatory compliance.

## See also

- [Pro Security](Pro-Security) - Security best practices
- [Pro HIPAA PHI PII Support](Pro-HIPAA-PHI-PII-Support) - Healthcare compliance support
- [Deserialization](Deserialization) - Message deserialization configuration
