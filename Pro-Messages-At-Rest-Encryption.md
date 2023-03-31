**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Specific industries have strong regulations around the storage of personal data. Private medical data, financial data, social security numbers, and credit card numbers are all sensitive. Karafka Pro supports transparent encryption of the message's payload, so sensitive data at rest in Kafka cannot be seen.

Karafka uses RSA asymmetric encryption, so your producers do not have to have the capability to decrypt data.

## Enabling encryption

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

**Note**: Karafka encrypts **only** the message payload. All other things are cleartext to aid with debugging. Do not store any sensitive information in message keys or headers.

## Handling of unencrypted messages with encryption enabled

Karafka automatically recognizes unencrypted messages and does not attempt to decrypt them. This means you can gradually enable and roll out encryption without worrying about previously unencrypted data.

## Producing encrypted messages without private key configuration

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

## Rotating public and private keys

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

## Using multiple public and private keys to support multiple customers

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

**Note**: Such a pattern should only be used when working with trusted entities.
