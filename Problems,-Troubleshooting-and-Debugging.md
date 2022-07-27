# Help!

Read below for tips.  If you still need help, you can:

* Ask your question in [The Karafka official Slack channel](https://slack.karafka.io)
* [Open a GitHub issue](../issues/new).  (Don't be afraid to open an issue, even if it's not a Karafka bug.  An issue is just a conversation, not an accusation!)
* Check our [FAQ](FAQ) and the [Pro FAQ](Pro-FAQ)

You **should not** email any Karafka committer privately.

Please respect our time and efforts by sticking to one of the options above.

Please consider buying the Pro subscription for additional priority Pro support and extra features.

## Reporting problems

When you encounter issues with Karafka, there are several things you can do:

- Feel free to open a [Github issue](https://github.com/karafka/karafka/issues)
- Feel free to ask on our [Slack channel](https://slack.karafka.io)
- Use our [integration specs](https://github.com/karafka/karafka/tree/master/spec/integrations) and [example apps](https://github.com/karafka/example-apps) to create a reproduction code that you can then share with us.

## Debugging

Remember that Karafka uses the `info` log level by default. If you assign it a logger with `debug,` debug will be used.

Here are a few guidelines that you should follow when trying to create a reproduction script:

1. Use as few non-default gems as possible - this will eliminate issues emerging from other libraries.
2. Try setting the `concurrency` value to `1` - this will simplify the processing flow.
3. Use a single topic with a single partition (so Karafka does not create extensive concurrent jobs).
4. If the issue is related to Active Job or Ruby on Rails in general, try using the latest stable release.
5. Check the [Versions Lifecycle and EOL](Versions-Lifecycle-and-EOL) page to make sure that your Ruby and Ruby on Rails (if used) combination is supported.
6. Try disabling all Karafka components that may be irrelevant to the issue, like extensive listeners and other hooks.
