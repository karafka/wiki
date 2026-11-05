Open Source software is great. Why should you pay money for Karafka Pro when you can extend it yourself, use it for free, or have an AI assistant generate what you need?

## Pricing

A senior developer is typically $10,000/mo. One with Kafka knowledge even more. The price of Karafka Pro is $1995 a year. Is your business building infrastructure or user functionalities?

- How many days or weeks will it take your team to piece together similar functionalities?
- How long will they spend fixing bugs in production?
- How many weeks will your team spend understanding the complexity of Kafka operations?
- How many weeks will your team spend building a performant and reliable framework for your business?

**Paying money for good infrastructure means you have more time to focus on user-facing features.**

Here are some **extremely** optimistic build-vs-buy cost projections based on the pricing assumptions above; now let the numbers speak for themselves:

<p align="center">
  <img src="https://karafka.io/assets/misc/printscreens/build-vs-buy.png" />
</p>

## Features

Karafka Pro has lots of really valuable, well-documented, well-tested functionalities. You can reproduce some of this functionality with 3rd party open source libraries but:

1. Will they be supported years from now?
2. Will they work with newer Karafka versions?
3. Will they get a steady stream of updates to fix bugs?
4. How many days or weeks will it take you to integrate everything together and test it?

All the Karafka Pro functionalities are designed to integrate and work well together.

You can spend days or weeks integrating various OSS gems, or you can pay me for more features and have it running in minutes.

## Can I Not Just Have AI Build It?

You can, and it will look finished in an afternoon. With AI coding assistants, writing the code is no longer the expensive part. It never really was.

The cost of a stream processing framework is in what happens off the happy path: rebalances, broker errors in the middle of an operation, retries, message ordering, offset commits, and how all of these interact. These cases rarely show up in a demo or in the tests an assistant writes for its own code. They show up under real load, usually in production.

### The Hard Part Is the Combinations

Karafka Pro is not a set of independent features. It is the tested combinations of them. Dead Letter Queue with Virtual Partitions, Long-Running Jobs with Manual Offset Management, Filtering with throttling: each feature changes how the others behave. Karafka Pro ships 48 dedicated processing strategies, one for each supported combination.

When you ask an assistant to "add a dead letter queue", you get one of those 48. You find out about the other 47 when your system needs them.

### Tested Against Real Kafka

Karafka has almost 1,700 integration tests that run against a real Kafka cluster, not against mocks, and more than 950 of them cover Karafka Pro. On top of that, there are more than 4,000 unit test examples. Even so, edge cases are still found and fixed every year: a broker error in the middle of a flush that could produce a message twice, a tombstone reaching the encryption layer, a pause timeout that silently became zero. Each of those passed a test suite before it was found.

Generated code passes the tests it wrote for itself. It does not know about the failure nobody has seen yet.

### The Ground Keeps Moving

Karafka sits on top of librdkafka, which changes behavior between releases, sometimes in ways that affect when a consumer may commit offsets or whether it has lost its assignment. Karafka tracks those changes and adapts to them, and its librdkafka build carries its own patches. Kafka keeps adding protocols, and Ruby keeps evolving.

With Karafka Pro, that upkeep is my job, and upgrading is `bundle update karafka`. With generated code, it is your job, in code that nobody on your team wrote or fully understands.

### When Building It Yourself Makes Sense

If you need one narrow feature on one topic, it does not interact with anything else, and you can tolerate an occasional duplicate or lost message, a small hand-built or generated solution, such as a simple retry-then-park loop, can be reasonable. The case for Karafka Pro is strongest when you need several of its features working together.

AI is a great way to build on top of Karafka Pro. It is an expensive way to rebuild it.

## Support

You can scale your Ruby application with Karafka quickly. At that point, Karafka is a significant piece of your business's infrastructure, so a dedicated support policy becomes insurance: three years from now, after many on your engineering team have moved on, **who will help you if a problem suddenly develops**?  It is very common for issues with OSS projects to linger for weeks or months.

Upgrades months or years from now are as simple as `bundle update karafka`. The upgrade path between major versions is always well documented.  So why pay? Because it is my business to make your life as simple and easy as possible. On top of that, by supporting Karafka Pro, you are also supporting the broader open source ecosystem, as a portion of the income is distributed back to other OSS projects that Karafka relies on under the hood.

Help me build and maintain a high-quality Kafka ecosystem for Ruby and Ruby on Rails.

Buy [Karafka Pro](https://karafka.io/#become-pro).
