Karafka is currently being used in production with the following deployment methods:

  - [systemd (+ Capistrano)](Deployment-systemd)
  - [Docker](Deployment-Docker)
  - [AWS + MSK (Fully Managed Apache Kafka)](Deployment-AWS-MSK)
  - Heroku

Since the only thing that is long-running is the Karafka server, it shouldn't be hard to make it work with other deployment and CD tools.

