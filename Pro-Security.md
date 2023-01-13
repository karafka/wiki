Using Karafka Pro means we are part of your Open Source Supply Chain. We take this exceptionally seriously.

Each Pro customer is encouraged to implement our [license gem integrity verification](Pro-Getting-Started#license-gem-integrity-verification) flow that ensures license consistency provided via our Gem server.

On top of that, to ensure the stability and security of the system:

- Karafka gem server is monitored with uptime tools.
- We monitor server logs for suspicious activities and requests.
- Every single SSH connection is logged.
- Karafka gem server allows for [credentials rotation](Pro-Rotating-Credentials) in case of an external leak.
- We monitor the integrity of all the licenses using automated tools to ensure they are not compromised.
- Our license packages **do not** include any code beyond the code needed to read the version and the license files.
- **All** Karafka components released to RubyGems are digitally signed and published from an account with 2FA enabled.
- Karafka Pro provides [script](Pro-Getting-Started#license-gem-integrity-verification) you can include in your CI/CD pipeline to ensure license integrity.

**Note**: If your organization policy prevents using **any** external dependency sources, a Karafka Pro license can be bundled into your application. This, however, requires a separate agreement with us. Please [contact us](Pro-FAQ#contact-info) for more details.
