**Source**: [Kafka on Rails: Using Kafka with Ruby on Rails — Part 2 — Getting started with Ruby and Kafka](https://medium.com/@maciejmensfeld/kafka-on-rails-using-kafka-with-ruby-on-rails-part-2-getting-started-with-ruby-and-kafka-44535c6edb26)

Kafka requires Zookeeper and to be honest, a local setup can be a bit tricky. The easiest way to do that is by running a docker container for that. Here’s an example script that should be enough for the basic local work. It will spin up a single node cluster of Kafka that you can use out of the box:

```bash
KAFKA_ADVERTISED_HOST_NAME=127.0.0.1

docker stop zookeeper
docker stop kafka
docker rm zookeeper
docker rm kafka

# You can disable those two once initially pulled
docker pull jplock/zookeeper
docker pull ches/kafka

docker run \
  -d \
  --name zookeeper \
  jplock/zookeeper:3.4.6

docker run \
  -d \
  --name kafka \
  -e KAFKA_ADVERTISED_HOST_NAME=$KAFKA_ADVERTISED_HOST_NAME \
  --link zookeeper:zookeeper \
  -p $KAFKA_ADVERTISED_HOST_NAME:9092:9092 \
  ches/kafka

ZK_IP=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' zookeeper)
KAFKA_IP=$(docker inspect --format '{{ .NetworkSettings.IPAddress }}' kafka)

echo "Zookeeper: $ZK_IP"
echo "Kafka: $KAFKA_IP"
```

To check that it works, you can just telnet to it:

```bash
telnet 127.0.0.1 9092
Trying 127.0.0.1...
Connected to 127.0.0.1.
Escape character is '^]'.
```

**Note**: If you need anything fancy, you can find a more complex Dockerfile setup for running Kafka [here](https://github.com/wurstmeister/kafka-docker).