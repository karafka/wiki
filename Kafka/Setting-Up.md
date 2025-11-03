# Setting Up Kafka

Before we combine Kafka with Ruby, it would be good to have a workable local Kafka process. The easiest way to do that is by using our `docker-compose.yml` present in Karafka:

```shell
git clone git@github.com:karafka/karafka.git
cd karafka
docker-compose up
```

To check that it works, you can just telnet to it:

```shell
telnet 127.0.0.1 9092
Trying 127.0.0.1...
Connected to 127.0.0.1.
Escape character is '^]'.
```

## Connecting to Kafka from other Docker containers

The `docker-compose.yml` we provide with Karafka has a setting called `KAFKA_ADVERTISED_HOST_NAME`, and it is by default set to `localhost`.

Modify the `KAFKA_ADVERTISED_HOST_NAME` to match your docker host IP if you want to connect to Kafka from other docker containers:

```yaml
# KAFKA_ADVERTISED_HOST_NAME: localhost
KAFKA_ADVERTISED_HOST_NAME: 192.168.0.5
```

Once you've changed that, you should be able to connect from other docker containers to your Kafka by using the host IP address:

```shell
# Run an example docker container to check it via telnet
docker run -it --rm --entrypoint=bash python:3.8-slim-buster

# And then from within
apt update && apt install telnet

telnet 192.168.0.5 9092
Trying 192.168.0.5...
Connected to 192.168.0.5.
Escape character is '^]'.
```

---

## See Also

- [Getting Started](Getting-Started) - For setting up Karafka with your Kafka cluster
- [Kafka Topic Configuration](Kafka-Topic-Configuration) - For configuring Kafka topics
- [Kafka Cluster Configuration](Kafka-Cluster-Configuration) - For cluster-level configuration options
