**Source**: [Kafka on Rails: Using Kafka with Ruby on Rails — Part 2 — Getting started with Ruby and Kafka](https://mensfeld.pl/2018/01/kafka-on-rails-using-kafka-with-ruby-on-rails-part-2-getting-started-with-ruby-and-kafka/)


Before we proceed with combining Kafka with Ruby, it would be good to have a workable local Kafka process. The easiest way to do that is by using our docker-compose.yml present in both WaterDrop and Karafka:


```bash
git clone git@github.com:karafka/karafka.git
cd karafka
docker-compose up
```

To check that it works, you can just telnet to it:

```bash
telnet 127.0.0.1 9092
Trying 127.0.0.1...
Connected to 127.0.0.1.
Escape character is '^]'.
```
