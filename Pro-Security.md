**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Using Karafka Pro means we are part of your Open Source Supply Chain. We take this exceptionally seriously.

Each Pro customer is encouraged to implement our [license gem integrity verification](Pro-Getting-Started#license-gem-integrity-verification) flow that ensures license consistency provided via our Gem server.

On top of that, to ensure the stability and security of the system:

- Karafka Github organization participates in the private vulnerability reporting program.
- **No** Karafka ecosystem components collect and send out any data from your systems.
- We do not hold your credit card information. All subscription management is done via Stripe.
- We do not collect **any** PII when a gem license is fetched. The only things logged are IP and the last request time.
- **All** of Karafka ecosystem code is available publically in our [Github organization](https://github.com/karafka/).
- Karafka gem server is monitored with uptime tools.
- We monitor server logs for suspicious activities and requests.
- Every single SSH connection is logged.
- Karafka gem server allows for [credentials rotation](Pro-Rotating-Credentials) in case of an external leak.
- We monitor the integrity of all the licenses using automated tools to ensure they are not compromised.
- Our license packages **do not** include any code beyond the code needed to read the version and the license files.
- Unless explicitly contacted by us, your license id should **never** change and should be locked in the Gemfile.
- **All** Karafka components released to RubyGems are digitally signed and published from an account with 2FA enabled.
- Karafka Pro provides [script](Pro-Getting-Started#license-gem-integrity-verification) you can include in your CI/CD pipeline to ensure license integrity.
- Every release of every Karafka component is announced on our [Slack](https://slack.karafka.io).

**Note**: If your organization policy prevents using **any** external dependency sources, a Karafka Pro license can be bundled into your application. This, however, requires a separate agreement with us. Please [contact us](https://karafka.io#support) for more details.
