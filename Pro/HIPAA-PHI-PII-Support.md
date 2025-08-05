# HIPAA, PHI, PII Support

!!! Info "OSS Version Limitations for Regulated Environments"

    This document references several Pro features not available in the open-source (OSS) version of Karafka. Due to the lack of these advanced security and compliance features in the OSS version, its use is **not recommended** in environments governed by HIPAA, PHI, or PII regulations.

## Overview

Organizations that handle sensitive information, such as Protected Health Information (PHI) and Personally Identifiable Information (PII), must comply with stringent regulatory frameworks like the Health Insurance Portability and Accountability Act (HIPAA). These regulations require rigorous data security, privacy practices, and access controls to protect sensitive information from unauthorized access and misuse. Ensuring compliance in software environments that handle PHI and PII involves safeguarding data and managing how software systems interact with processes and present that data.

Karafka and Karafka Web UI can be adapted for use in HIPAA, PHI, and PII-compliant environments. This document outlines how Karafka and Karafka Web UI can meet the stringent requirements of such regulatory frameworks and what features make them particularly suited for these high-compliance environments.

## Regulatory Context: HIPAA, PHI, and PII

### Understanding HIPAA Compliance

HIPAA requires organizations handling PHI to implement administrative, physical, and technical safeguards to ensure sensitive information's confidentiality, integrity, and availability. These safeguards include controlling access to data, encrypting sensitive information both in transit and at rest, auditing access, and providing data masking or anonymization mechanisms.

While HIPAA does not prescribe specific software configurations, it demands that all systems and processes that handle PHI meet particular privacy and security standards. This means any tool used in a HIPAA-compliant environment must support robust data encryption, fine-grained access controls, audit logging, and data minimization.

### PHI and PII Management

PHI is a specific subset of PII, which encompasses a broader range of sensitive personal information, including identifiers such as names, addresses, social security numbers, and health records. Managing this data securely requires strict controls on who can access, view, or process such information. Auditing data access, anonymizing information, and limiting exposure to sensitive fields is essential for compliance with healthcare-specific (HIPAA) and general privacy regulations (e.g., GDPR, CCPA).

## Karafka and HIPAA/PHI/PII Compliance: Core Capabilities

Karafka and Karafka Web UI come equipped with a set of features designed to facilitate compliance with the privacy and security requirements of HIPAA, PHI, and PII regulations. These capabilities ensure that sensitive information is adequately protected at every stage of its lifecycle, from ingestion and processing to presentation and logging.

### 1. Data Encryption

#### At-Rest Data Encryption

Karafka supports [data encryption at rest](Pro-Messages-At-Rest-Encryption), ensuring that any stored information, including sensitive data, is protected against unauthorized access. This aligns with HIPAA's requirement for securing PHI, as encryption is one of the key safeguards for preventing data breaches. When data is written to storage by Karafka, it is encrypted using strong encryption algorithms (e.g., AES-256), providing a vital layer of security in environments where data privacy is paramount.

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

#### In-Transit Encryption

Data in transit must be protected as it moves between components in a distributed system. Karafka supports secure communication using Transport Layer Security (TLS/SSL), which encrypts data while it is transmitted between clients, brokers, and the Web UI. This protection is essential to meet HIPAA's technical safeguard requirements, ensuring that PHI or PII is not exposed to unauthorized interception during network communication.

### 2. Access Control and Authentication

Karafka Web UI does not include a built-in access control or authentication system. Instead, it provides abstract code APIs that allow developers to implement custom access control mechanisms tailored to their specific requirements.

#### Role-Based Access Control (RBAC)

Karafka Web UI features a policies engine that enables administrators to enforce granular control over user actions, supporting a robust Role-Based Access Control (RBAC) system. This RBAC implementation allows for precise management of what specific users can view and interact with within the Web UI, thereby adhering to the principle of least privilege.

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

You can learn more about the Polices [here](Pro-Web-UI-Policies).

#### Integration with Authentication Providers

Since Karafka Web UI is fundamentally a Rack application, it can be mounted directly into Rails routes. By leveraging this capability, you can integrate Karafka Web UI with Rails' existing authentication mechanisms, whether they are standard username/password systems, Single Sign-On (SSO) providers, or multi-factor authentication (2FA).

Additionally, the provided code APIs enable you to define custom access policies, ensuring that only authorized users can interact with specific components of the Web UI.

### 3. Granular Data Presentation

One of the core privacy principles under HIPAA and other privacy regulations is to minimize the exposure of sensitive information. Karafka Web UI enables administrators to define which data fields are displayed and how they are presented. To protect their content, sensitive fields, such as patient identifiers or personal data, can be masked or redacted. This granular control over data presentation prevents unauthorized viewing of sensitive information and aligns with the requirements for data minimization.

You can learn more about the Partial Payload Sanitization [here](Pro-Web-UI-Policies#partial-payload-sanitization).

<p align="center">
  <img src="https://cdn.karafka.io/assets/misc/printscreens/web-ui/explorer_sanitization.png" alt="karafka web displayed data sanitization" />
</p>

### 4. Logging and Auditing

Since Karafka Web UI is built as a Rack application, it can leverage Rack's middleware capabilities to log every action taken within the interface accurately. Additionally, using its Request Policies, Karafka Web UI can implement granular logging for each request, capturing detailed information about system interactions. These interactions include:

- Access to specific pages and data views
- Administrative changes, such as configuration updates or modifications to access controls
- Error occurrences and exceptions within the application

By logging these activities, Karafka Web UI provides comprehensive audit trails crucial for compliance with HIPAA's auditing requirements.

### 5. Offline Operation with Karafka Enterprise

Full control over software components and data processing is imperative for organizations operating in environments with the strictest data governance requirements, such as healthcare systems subject to HIPAA. In such cases, **Karafka Enterprise** is the recommended solution.

Karafka Enterprise operates fully offline, independently of the public Karafka gem server. This means that all software components can be sourced, managed, and deployed within the organization's private infrastructure without relying on external servers. This offline operation reduces the risk of unauthorized data exposure or dependency on third-party services, enhancing overall security.

#### Private Registries and Dependency Management

Although HIPAA, PHI, and PII regulations do not explicitly require the use of private registries, controlling software sources is a best practice to minimize risks related to supply chain vulnerabilities. With Karafka Enterprise, you can manage your software dependencies using private registries, ensuring only verified and trusted components are used in their environments. This control helps maintain compliance by preventing the introduction of unvetted software that could compromise sensitive information.

## Summary

Karafka and Karafka Web UI offer a secure and adaptable platform that can be configured to meet the stringent requirements of environments governed by HIPAA, PHI, and PII regulations. Key features such as at-rest and in-transit data encryption, role-based access control, granular data presentation, comprehensive logging, and configurable data access policies make Karafka a robust solution for managing sensitive data streams in compliance with privacy laws.
