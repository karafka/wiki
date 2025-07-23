!!! Hint "Recommendation: Related Regulatory Documentation"

    If you're working in healthcare or handling sensitive personal information, we recommend also reviewing our [HIPAA, PHI, PII Support](https://karafka.io/docs/Pro-HIPAA-PHI-PII-Support/) documentation. Many organizations need to comply with both FIPS and HIPAA requirements, and the referenced document provides complementary guidance on securing protected health information and personally identifiable information within Karafka deployments.

Karafka aligns with FIPS 140-2 cryptographic module expectations to ensure secure operations in environments that require adherence to Federal Information Processing Standards. This documentation outlines how Karafka supports FIPS requirements.

!!! Info "No Warranty"

    While Karafka strives to maintain compatibility with FIPS 140-2 requirements, this compatibility is not warranted or guaranteed. We do our best to ensure compliance with FIPS regulations but recommend thorough testing in your specific environment. If you encounter any issues or find areas where FIPS support could be improved, please contact us so we can enhance the codebase accordingly.

!!! Warning "OSS Version Limitations"

    The open-source (OSS) version of Karafka lacks several advanced security features. It is **not** recommended for environments requiring FIPS compatibility. Karafka Pro or Enterprise editions should be used for regulatory needs.

## What is FIPS 140-2?

Federal Information Processing Standard Publication 140-2 (FIPS 140-2) is a U.S. government standard that defines security requirements for cryptographic modules. Developed by the National Institute of Standards and Technology (NIST), it is mandatory for federal agencies and contractors working with sensitive but unclassified (SBU) information.

FIPS 140-2 specifies four security levels:

- **Level 1**: Basic security requirements for a cryptographic module
- **Level 2**: Adds requirements for physical tamper-evidence and role-based authentication
- **Level 3**: Adds requirements for physical tamper-resistance and identity-based authentication
- **Level 4**: Adds stringent physical security and environmental protection

Karafka supports FIPS 140-2 Level 3 requirements in specific configurations, as librdkafka supports identity-based authentication through certificates, and Karafka Web UI can be configured with identity-based authentication. Additionally, Karafka's integrity verification mechanisms provide a form of tamper resistance.

## Karafka's FIPS Implementation

Karafka achieves FIPS compatibility through:

- Use of FIPS-validated cryptographic modules: Karafka leverages librdkafka, which can be configured to use OpenSSL in FIPS mode for all - cryptographic operations
- Secure communications: All network traffic can be encrypted using TLS/SSL with FIPS-approved algorithms
- In-flight encryption: Data transmitted between Karafka clients and Kafka brokers uses FIPS-compatible encryption algorithms
- At-rest encryption: Data stored by Karafka can be encrypted using FIPS-approved algorithms (SHA-256 for hashing, AES for encryption)
- Identity-based authentication: Through certificate-based authentication and Karafka Web UI's customizable authentication systems
- Integrity verification: Provides tamper resistance by validating message integrity through fingerprinting

## Cryptographic Standards Used

Karafka exclusively employs FIPS-approved cryptographic algorithms:

- Hash Functions: SHA-256 only (MD5 is explicitly disabled)
- Symmetric Encryption: AES-128, AES-192, and AES-256
- Asymmetric Encryption: RSA with key sizes ≥ 2048 bits
- Random Number Generation: Uses Ruby's OpenSSL FIPS-compatible random number generators when Ruby is running in FIPS mode

These algorithms are implemented through FIPS-validated cryptographic modules, ensuring all cryptographic operations meet federal standards.

## Messages At Rest Encryption

Karafka Pro provides transparent encryption of message payloads, ensuring sensitive data at rest in Kafka cannot be accessed by unauthorized parties. This is crucial for meeting FIPS requirements. You can read more about the at-rest encryption [here](https://karafka.io/docs/Pro-Messages-At-Rest-Encryption/).

### Custom Headers Deserializer and Encryption

When using Karafka's encryption features, be aware that encryption may not work as expected if you use a custom headers deserializer. Custom deserialization of headers can alter how encryption headers are processed, potentially leading to issues in correctly encrypting or decrypting messages. In cases where custom headers deserialization is necessary, it is recommended to consult with Karafka Pro support for guidance.

## Message Fingerprinting for Integrity

Karafka includes a fingerprinting feature that provides tamper resistance for messages to prevent the processing of incorrectly decrypted messages.

!!! Hint "Use SHA-256 for Fingerprinting"
    For FIPS compatibility, use SHA-256 as your fingerprinter algorithm instead of MD5, which is not FIPS-approved.

## Supply Chain Security

All dependencies have been reviewed for FIPS compatibility regarding cryptographic hashing algorithms to ensure they don't use non-approved methods like MD5. For a complete listing of all dependencies and their security status, please refer to our [Software Bill of Materials (SBOM) document](https://karafka.io/docs/SBOM/).

For more comprehensive information about Karafka's security posture, including our approach to dependency management, vulnerability handling, and secure coding practices, please consult our [Security Guidelines documentation](https://karafka.io/docs/Pro-Security/).

## librdkafka FIPS Support

Karafka relies on librdkafka for Kafka communication. For FIPS compatibility, librdkafka must be compiled with the following considerations:

- Uses OpenSSL with FIPS mode enabled
- No MD5 hash functions in the build process
- Proper verification of FIPS-compatible algorithms during runtime

## Limitations and Unsupported Features

When operating in FIPS mode, the following limitations apply:

- Legacy Authentication Methods: Only SASL/SCRAM and SSL certificate authentication are supported
- Custom Compression Codecs: Some compression algorithms may not be FIPS-compatible
- Third-party Extensions: Plugins not specifically designed for FIPS environments may not function correctly
- Custom Headers Deserializer: When using encryption features, custom headers deserializers may interfere with proper encryption/decryption

## Example Use Cases

- **Government Agencies**: Agencies handling sensitive but unclassified information need to ensure all data processing systems meet FIPS requirements.
- **Healthcare Systems**: Medical institutions processing patient data that must adhere to both HIPAA and FIPS (for government contracts) can use Karafka to ensure data security.
- **Financial Services**: Banks and financial institutions working with government entities need FIPS-compatible processing for financial transactions.
- **Defense Contractors**: Companies working with the Department of Defense can use Karafka's FIPS capabilities to process sensitive information securely.
- **Critical Infrastructure**: Systems supporting utilities and critical infrastructure that need to meet federal security standards.

## Summary

Karafka Pro and Enterprise editions provide comprehensive support for FIPS 140-2 requirements through their implementation of validated cryptographic modules, secure communication channels, and robust at-rest encryption. 

While we strive to maintain FIPS compatibility, we encourage users to contact us with any issues or suggestions for improvement to help us continue enhancing Karafka's security features.
