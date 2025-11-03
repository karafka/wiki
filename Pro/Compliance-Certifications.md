# Compliance Certifications (SOC 2, ISO 27001)

Organizations conducting vendor due diligence often request SOC 2 reports or ISO 27001 certificates. This document explains why these certifications do not apply to Karafka and clarifies the compliance responsibilities when using the framework.

## Understanding the Framework Model

Karafka is a self-hosted Ruby framework for building Kafka-based applications. It is distributed as open-core, public-source software that you install, configure, and run entirely within your own infrastructure. This fundamental architecture has important implications for compliance requirements.

Unlike Software-as-a-Service (SaaS) platforms that host applications and process customer data on their infrastructure, Karafka:

- Runs exclusively within your environment
- Processes only data you control
- Stores information only in systems you manage
- Operates under your security policies and access controls

## Why Compliance Certifications Don't Apply

### SOC 2 and ISO 27001 Purpose

SOC 2 (System and Organization Controls 2) and ISO 27001 are compliance frameworks designed for service organizations that handle, process, or store customer data. These certifications demonstrate that a service provider has implemented appropriate controls to protect customer information according to defined security principles.

SOC 2 focuses on five Trust Services Criteria (Security, Availability, Processing Integrity, Confidentiality, and Privacy), while ISO 27001 requires establishing and maintaining an Information Security Management System (ISMS).

Both frameworks are intended for scenarios where:

- A vendor processes data on behalf of customers
- Customer data resides on vendor-controlled infrastructure
- The vendor manages security controls for that data
- Customers need assurance about the vendor's security practices

### The Self-Hosted Software Model

Karafka does **not** operate as a service provider. When you use Karafka, you maintain complete control over:

- **Infrastructure**: You choose where and how to deploy the framework (on-premises, cloud, hybrid)
- **Data**: All data processing occurs within your Kafka clusters and systems
- **Configuration**: You define all security settings, encryption, and access controls
- **Operations**: You manage monitoring, logging, and incident response

Because Karafka operates entirely within your controlled environment, there is no third-party data handling that would require service provider certifications.

### Data Collection and Privacy

The Karafka project adheres to strict principles regarding data collection, as outlined in [this document](Pro-Security).

## Analogous Examples

Consider how compliance works for other infrastructure software:

- **PostgreSQL** (database software) does not have SOC 2 certification, but AWS RDS (which hosts PostgreSQL as a service) does
- **nginx** (web server) does not require these certifications, but managed hosting platforms using nginx do
- **Karafka** (Kafka framework) follows the same model as a tool you deploy and operate

In each case, the software itself does **not** need service provider certifications because it does **not** act as a service provider. Organizations using these tools pursue their own compliance certifications for their overall systems and infrastructure.

## Your Compliance Responsibility

When using Karafka, **your organization** is responsible for compliance, not the Karafka project. Your compliance program should address:

- Infrastructure security where Karafka runs
- Access controls to your Kafka clusters and applications
- Data encryption (in transit and at rest)
- Audit logging and monitoring
- Incident response procedures
- All applicable regulatory requirements (HIPAA, GDPR, SOC 2, ISO 27001, etc.)

Karafka serves as a component within your broader compliance framework, similar to other software tools and libraries you use.

## Karafka's Compliance Support Features

While Karafka does **not** require service provider certifications, Karafka Pro provides features specifically designed to help **you** achieve compliance in regulated environments:

For detailed information about using Karafka in regulated environments, see the [HIPAA, PHI, PII Support](https://karafka.io/docs/Pro-HIPAA-PHI-PII-Support) documentation.

## What Karafka Provides for Due Diligence

While compliance certifications do **not** apply to Karafka, the project offers several resources to support your vendor due diligence process:

### Transparency and Auditability

- **Open Source Code**: All Karafka components are publicly available on GitHub for security review
- **Security Documentation**: Comprehensive guidance on securing your deployment
- **Supply Chain Verification**: License gem integrity verification and checksum support
- **Vulnerability Reporting**: Private vulnerability reporting program through GitHub
- **SBOM (Software Bill of Materials)**: Available for dependency tracking and security scanning

### Enterprise Support

Organizations with strict compliance requirements can benefit from Karafka Enterprise:

- **Offline Operation**: Fully independent of external gem servers
- **Private Registries**: Host all software components within your infrastructure
- **Custom Agreements**: Negotiate specific security and compliance arrangements
- **Extended Warranties**: Contingency support and maintenance commitments
- **Documentation Assistance**: Support for preparing security and compliance documentation

## Summary

SOC 2 and ISO 27001 certifications do **not** apply to Karafka because it is self-hosted software, not a service provider. Your organization maintains responsibility for compliance, and Karafka serves as a tool within your compliance infrastructure—similar to databases, operating systems, and other software you deploy.

---

## See Also

- [Pro HIPAA PHI PII Support](Pro-HIPAA-PHI-PII-Support) - Healthcare compliance support
- [Pro FIPS Support](Pro-FIPS-Support) - FIPS compliance information
- [Pro Security](Pro-Security) - Security best practices
- [Pro Enterprise](Pro-Enterprise) - Enterprise licensing and features
