**Source**: [Kafka on Rails: Using Kafka with Ruby on Rails — Part 2 — Getting started with Ruby and Kafka](https://medium.com/@maciejmensfeld/kafka-on-rails-using-kafka-with-ruby-on-rails-part-2-getting-started-with-ruby-and-kafka-44535c6edb26)

Kafka requires Zookeeper and to be honest, a local setup can be a bit tricky. The easiest way to do that is by running a Docker container for that. Here’s an example script that should be enough for the basic local work. It will spin up a single node cluster of Kafka that you can use out of the box:

```bash
git clone https://github.com/wurstmeister/kafka-docker.git
cd kafka-docker
git checkout 1.0.1
vim docker-compose-single-broker.yml
# Replace as followed:
# KAFKA_ADVERTISED_HOST_NAME: 192.168.99.100
# set to:
# KAFKA_ADVERTISED_HOST_NAME: 127.0.0.01
docker-compose -f docker-compose-single-broker.yml up
```

To check that it works, you can just telnet to it:

```bash
telnet 127.0.0.1 9092
Trying 127.0.0.1...
Connected to 127.0.0.1.
Escape character is '^]'.
```

**Note**: If you need anything fancy, you can find a more complex Dockerfile setup for running Kafka [here](https://github.com/wurstmeister/kafka-docker).