Karafka is currently being used in production with the following deployment methods:

  - [systemd (+ Capistrano)](#systemd-capistrano)
  - [Docker](#docker)
  - [AWS with MSK (Fully Managed Apache Kafka)](#aws-msk-fully-managed-apache-kafka)
  - [Heroku](#heroku)

Since the only thing that is long-running is the Karafka server, it shouldn't be hard to make it work with other deployment and CD tools.

## systemd (+ Capistrano)

You can easily manage Karafka applications with `systemd`. Here's an example `.service` file that you can use.

```bash
# Move to /lib/systemd/system/karafka.service
# Run: systemctl enable karafka

[Unit]
Description=karafka
After=syslog.target network.target

[Service]
Type=simple

WorkingDirectory=/opt/current
ExecStart=/bin/bash -lc 'bundle exec karafka server'
User=deploy
Group=deploy
UMask=0002

RestartSec=1
Restart=on-failure

# output goes to /var/log/syslog
StandardOutput=syslog
StandardError=syslog

# This will default to "bundler" if we don't specify it
SyslogIdentifier=karafka

[Install]
WantedBy=multi-user.target
```

If you want to use `systemd` based solution together with Capistrano, you don't need the `capistrano-karafka` gem. Instead, you can use this simple Capistrano `.cap` file:

```ruby
# frozen_string_literal: true

after 'deploy:starting', 'karafka:stop'
after 'deploy:published', 'karafka:start'
after 'deploy:failed', 'karafka:restart'

namespace :karafka do
  task :start do
    on roles(:app) do
      execute :sudo, :systemctl, :start, 'karafka'
    end
  end

  task :stop do
    on roles(:app) do
      execute :sudo, :systemctl, :stop, 'karafka'
    end
  end

  task :restart do
    on roles(:app) do
      execute :sudo, :systemctl, :restart, 'karafka'
    end
  end

  task :status do
    on roles(:app) do
      execute :sudo, :systemctl, :status, 'karafka'
    end
  end
end
```

If you need to run several processes of a given type, please refer to `template unit files`.

## Docker

Karafka can be dockerized as any other Ruby/Rails app. To execute ```karafka server``` command in your Docker container, just put this into your Dockerfile:

```bash
ENV KARAFKA_ENV production
CMD bundle exec karafka server
```

## AWS + MSK (Fully Managed Apache Kafka)

First of all, it is worth pointing out that Karafka, similar to librdkafka does **not** support SASL mechanism for AWS MSK IAM that allows Kafka clients to handle authentication and authorization with MSK clusters through [AWS IAM](https://aws.amazon.com/iam/). This mechanism is a proprietary idea that is not part of Kafka.

Karafka **does**, however, support standard SASL + SSL mechanisms. Please follow the below instructions for both cluster initialization and Karafka configuration.

### AWS MSK cluster setup

1. Navigate to the AWS MSK page and press the `Create cluster` button.
2. Select `Custom create` and `Provisioned` settings.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/creation_method.png" />
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/provisioned2.png" />
</p>

3. Use custom config and set `auto.create.topics.enable` to `true` unless you want to create topics using Kafka API. You can change it later, and in general, it is recommended to disallow auto-topic creation (typos, etc.), but this can be useful for debugging.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/broker-settings.png" />
</p>

4. Setup your VPC and networking details.
5. Make sure that you **disable** the `Unauthenticated access` option. With it enabled, there won't be any authentication beyond those imposed by your security groups and VPC.
6. **Disable** `IAM role-based authentication`.
7. **Enable** `SASL/SCRAM authentication`

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/access-methods.png" />
</p>

8. Provision your cluster.
9. Make sure your cluster is accessible from your machines. You can test it by using the AWS VPC Reachability Analyzer.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/reachability.png" />
</p>

10. Visit your cluster `Properties` page and copy the `Endpoints` addresses.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/brokers-list.png" />
</p>

11. Log in to any of your machines and run a `telnet` session to any of the brokers:
```bash
telnet your-broker.kafka.us-east-1.amazonaws.com 9096

Trying 172.31.22.230...
Connected to your-broker.kafka.us-east-1.amazonaws.com.
Escape character is '^]'.
^Connection closed by foreign host.
```

If you can connect, your settings are correct, and your cluster is visible from your instance.

12. Go to the AWS Secret Manager and create a key starting with `AmazonMSK_` prefix. Select `Other type of secret` and `Plaintext` and provide the following value inside of the text field:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/secret_type2.png" />
</p>

13. In the `Encryption key` section, press the `Add new key`.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/add_new_key.png" />
</p>

14. Create a `Symmetric` key with `Encrypt and decrypt` as a usage pattern.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/keys.png" />
</p>

15. Select your key in the `Encryption key` section and press `Next`.
16. Provide a secret name and description and press `Next` until you reach the `Store` button.
17. Store your secret.
18. Go back to the AWS MSK and select your cluster.
19. Navigate to the `Associated secrets from AWS Secrets Manager` section and press `Associate secrets`

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/associate_secrets.png" />
</p>

20. Press the `Choose secrets` and select the previously created secret.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/associate_secrets2.png" />
</p>

21. Press `Associate secrets`. It will take AWS a while to do it.
22. Congratulations, you just configured everything needed to make it work with Karafka.

### Karafka configuration for AWS MSK SASL + SSL

Provide the following details to the `kafka` section:

```ruby
config.kafka = {
  'bootstrap.servers': 'yourcluster-broker1.amazonaws.com:9096,yourcluster-broker2.amazonaws.com:9096',
  'security.protocol': 'SASL_SSL',
  'sasl.username': 'username',
  'sasl.password': 'password',
  'sasl.mechanisms': 'SCRAM-SHA-512'
}
```

After that, you should be good to go.

### Troubleshooting AWS MSK

#### Local: Authentication failure

```
ERROR -- : rdkafka: [thrd:sasl_ssl://broker1.kafka.us-east-1.amazonaws.]:
sasl_ssl://broker1.us-east-1.amazonaws.com:9096/bootstrap: SASL authentication error:
Authentication failed during authentication due to invalid credentials with SASL mechanism SCRAM-SHA-512
(after 312ms in state AUTH_REQ, 1 identical error(s) suppressed)

ERROR -- : librdkafka internal error occurred: Local: Authentication failure (authentication)

```

It may mean two things:

- Your credentials are wrong
- AWS MSK did not yet refresh its allowed keys, and you need to wait. Despite AWS reporting cluster as `Active` with no pending changes, it may take a few minutes for the credentials to start working.

#### Connection setup timed out in state CONNECT

```
rdkafka: [thrd:sasl_ssl://broker1.kafka.us-east-1.amazonaws.]:
sasl_ssl://broker1.us-east-1.amazonaws.com:9092/bootstrap:
Connection setup timed out in state CONNECT (after 30037ms in state CONNECT)
```

This means Kafka is unreachable. Check your brokers' addresses and ensure you use a proper port: `9096` with SSL or `9092` when plaintext. Also, make sure your instance can access AWS MSK at all.

### Connection failures and timeouts

Please make sure that your instances can reach Kafka. Keep in mind that security group updates can have a certain lag in propagation.

### Rdkafka::RdkafkaError (Broker: Invalid replication factor (invalid_replication_factor))

Please make sure your custom setting `default.replication.factor` value matches what you have declared as `Number of zones` in the `Brokers` section:

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/msk/brokers_count.png" />
</p>

### Rdkafka::RdkafkaError: Broker: Topic authorization failed (topic_authorization_failed)

This error occurs in case you enabled Kafka ACL but did not grant proper ACL permissions to your users. It often happens when you make your [AWS MSK public](https://docs.aws.amazon.com/msk/latest/developerguide/public-access.html).

Please note that `allow.everyone.if.no.acl.found` `false` superseeds `auto.create.topics.enable`. This means that despite `auto.create.topics.enable` being set to `true`, you will not be able to auto-create topics as the ACL will block this.

We recommend creating all the needed topics before making the cluster public and assigning proper permissions via Kafka ACL.

If you want to verify that this is indeed an ACL issue, try running `::Karafka::Admin.cluster_info`. If you get cluster info and no errors, you can connect to the cluster, but ACL blocks any usage.

```ruby
::Karafka::Admin.cluster_info =>
#<Rdkafka::Metadata:0x00007fea8e3a43c0                                           
 @brokers=[{:broker_id=>1001, :broker_name=>"your-kafka-host", :broker_port=>9092}],   
 @topics=[]
>
```

You can also use this ACL command to give all operations access for the brokers on all the topics to a given user:

```shell
./bin/kafka-acls.sh \
  --authorizer-properties zookeeper.connect=<ZOOKEEPER_CONNECTION_STRING> \
  --add \
  --allow-principal User:<USER_NAME> \
  --allow-host=* \
  --operation All \
  --topic=* \
  --group=*
```

**Note**: The above command must be run from a client machine with Java + Kafka installation, and the machine should also be able to communicate with the zookeeper nodes.

## Heroku

Karafka works with the Heroku Kafka add-on, but it requires some extra configuration and understanding of how the Heroku Kafka add-on works.

<p align="center">
  <img src="https://raw.githubusercontent.com/karafka/misc/master/instructions/heroku/dyno.png" />
</p>

Details about how Kafka for Heroku works can also be found here:

- [https://devcenter.heroku.com/articles/kafka-on-heroku](https://devcenter.heroku.com/articles/kafka-on-heroku)
- [https://devcenter.heroku.com/articles/multi-tenant-kafka-on-heroku](https://devcenter.heroku.com/articles/multi-tenant-kafka-on-heroku)
- [https://devcenter.heroku.com/articles/kafka-addon-migration](https://devcenter.heroku.com/articles/kafka-addon-migration)

### Heroku Kafka prefix convention

**Note**: This section **only** applies to the Multi-Tenant add-on mode.

All Kafka Basic topics and consumer groups begin with a unique prefix associated with your add-on. This prefix is accessible via the `KAFKA_PREFIX` environment variable.

That means that in the multi-tenant mode, you must remember **always** to prefix all the topic names and all the consumer group names with the `KAFKA_PREFIX` environment variable value.

To make it work you need to follow few steps:

1. Use a consumer mapper that will inject the Heroku Kafka prefix into each consumer group id automatically.

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    # other config options...

    # Inject the prefix automatically to every consumer group
    config.consumer_mapper = ->(raw_group_name) { "#{ENV['KAFKA_PREFIX']}#{raw_group_name}" }
  end
end
```

2. Create all the consumer groups before using them via the Heroku CLI.


```bash
heroku kafka:consumer-groups:create CONSUMER_GROUP_NAME
```

**Note**: The value of `KAFKA_PREFIX` typically is like `smoothboulder-1234.` which would make the default consumer group in Karafka `smoothboulder-1234.app` when used with the mapper defined above. Kafka itself does not need to know the prefix when creating the consumer group.

This means that the Heroku CLI command needs to look as follows:

```bash
heroku kafka:consumer-groups:create app
```

This allows Heroku's multi-tenant setup to route `smoothboulder-1234.app` to your cluster correctly.


3. When consuming, you **always** need to use the prefixed topic name:

```ruby
class KarafkaApp < Karafka::App
  # ...
  routes.draw do
    topic "#{ENV['KAFKA_PREFIX']}users_events" do
      consumer UsersEventsConsumer
    end
  end
end
```

4. When producing, you **always** need to use the prefixed topic name:

```ruby
Karafka.producer.produce_async(
  topic: "#{ENV['KAFKA_PREFIX']}users_events",
  payload: {
    user_id: user.id,
    event: 'user.deleted'
  }.to_json
)
```

**Note**: You will need to configure your topics in Kafka before they can be used. This can be done in the Heroku UI or via the [CLI](https://devcenter.heroku.com/articles/kafka-on-heroku#managing-kafka) provided by Heroku. Be sure to name your topics _without_ the KAFKA_PREFIX, e.g. `heroku kafka:topics:create users_events --partitions 3`.

### Configuring Karafka to work with Heroku SSL

When you turn on the add-on, Heroku exposes a few environment variables within which important details are stored. You need to use them to configure Karafka as follows:

```ruby
class KarafkaApp < Karafka::App
  setup do |config|
    config.kafka = {
      # ...
      'security.protocol': 'ssl',
      # KAFKA_URL has the protocol that we do not need as we define the protocol separately
      'bootstrap.servers': ENV['KAFKA_URL'].gsub('kafka+ssl://', ''),
      'ssl.certificate.pem': ENV['KAFKA_CLIENT_CERT'],
      'ssl.key.pem': ENV['KAFKA_CLIENT_CERT_KEY'],
      'ssl.ca.pem': ENV['KAFKA_TRUSTED_CERT']
    }

    # ... other config options
  end
end
```

### Troubleshooting

There are few problems you may encounter when configuring things for Heroku:

#### Unsupported protocol "KAFKA+SSL"

```
parse error: unsupported protocol "KAFKA+SSL"
```

**Solution**: Make sure you strip off the `kafka+ssl://` component from the `KAFKA_URL` env variable content.

#### Disconnected while requesting ApiVersion

```
Disconnected while requesting ApiVersion: might be caused by incorrect security.protocol configuration
(connecting to a SSL listener?)
```

**Solution**: Make sure all the settings are configured **exactly** as presented in the configuration section.

#### Topic authorization failed

```
Broker: Topic authorization failed (topic_authorization_failed) (Rdkafka::RdkafkaError)
```

**Solution**: Make sure to namespace all the topics and consumer groups with the `KAFKA_PREFIX` environment value.

#### Messages are not being consumed

```
DEBUG -- : [3732873c8a74] Polled 0 messages in 1000ms
DEBUG -- : [3732873c8a74] Polling messages...
DEBUG -- : [3732873c8a74] Polled 0 messages in 1000ms
DEBUG -- : [3732873c8a74] Polling messages...
DEBUG -- : [3732873c8a74] Polled 0 messages in 1000ms
```

**Solution 1**: Basic multi-tenant Kafka plans require a prefix on topics and consumer groups. Make sure that both your topics and consumer groups are prefixed.

**Solution 2**: Make sure you've created appropriate consumer groups **prior** to them being used via the Heroku CLI.
