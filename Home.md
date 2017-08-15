![karafka logo](http://mensfeld.github.io/karafka-framework-introduction/img/karafka-04.png)

[![Build Status](https://travis-ci.org/karafka/karafka.png)](https://travis-ci.org/karafka/karafka)
[![Backers on Open Collective](https://opencollective.com/karafka/backers/badge.svg)](#backers) [![Sponsors on Open Collective](https://opencollective.com/karafka/sponsors/badge.svg)](#sponsors) [![Join the chat at https://gitter.im/karafka/karafka](https://badges.gitter.im/karafka/karafka.svg)](https://gitter.im/karafka/karafka?utm_source=badge&utm_medium=badge&utm_campaign=pr-badge&utm_content=badge)

Framework used to simplify Apache Kafka based Ruby applications development.

It allows programmers to use approach similar to standard HTTP conventions (```#params``` and ```#params_batch```) when working with asynchronous Kafka messages.

Karafka not only handles incoming messages but also provides tools for building complex data-flow applications that receive and send messages.

## How does it work

Karafka provides a higher-level abstraction that allows you to focus on your business logic development, instead of focusing on  implementing lower level abstration layers. It provides developers with a set of tools that are dedicated for building multi-topic applications similarly to how Rails applications are being built.

Karafka based applications can be easily deployed to any type of infrastructure, including those based on:

* Heroku
* Capistrano
* Docker

## Support

Karafka has a [Wiki pages](https://github.com/karafka/karafka/wiki) for almost everything. It covers the whole installation, setup and deployment along with other useful details on how to run Karafka.

If you have any questions about using Karafka, feel free to join our [Gitter](https://gitter.im/karafka/karafka) chat channel.

Karafka dev team also provides commercial support in following matters:

- Additional programming services for integrating existing Ruby apps with Kafka and Karafka
- Expertise and guidance on using Karafka within new and existing projects
- Trainings on how to design and develop systems based on Apache Kafka and Karafka framework

If you are interested in our commercial services, please contact [Maciej Mensfeld (maciej@coditsu.io)](mailto:maciej@coditsu.io) directly.