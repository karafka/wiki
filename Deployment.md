Karafka is currently being used in production with the following deployment methods:

  - systemd (+ Capistrano)
  - Docker
  - Heroku
  - AWS with MSK ([Fully Managed Apache Kafka](https://aws.amazon.com/msk/))

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
1. Select `Custom create` and `Provisioned` settings.
1. Use custom config and set `auto.create.topics.enable` to `true` unless you want to create topics using Kafka API. You can change it later, and in general, it is recommended to disallow auto-topic creation (typos, etc.), but this can be useful for debugging.
1. Setup your VPC and networking details.
1. Make sure that you **disable** the `Unauthenticated access` option. With it enabled, there won't be any authentication beyond those imposed by your security groups and VPC.
1. **Disable** `IAM role-based authentication`.
1. **Enable** `SASL/SCRAM authentication`
1. Provision your cluster.
1. Make sure your cluster is accessible from your machines. You can test it by using the AWS VPC Reachability Analyzer.
1. Visit your cluster `Properties` page and copy the `Endpoints` addresses.
1. Log in to any of your machines and run a `telnet` session to any of the brokers:
```bash
telnet your-broker.kafka.us-east-1.amazonaws.com 9096

Trying 172.31.22.230...
Connected to your-broker.kafka.us-east-1.amazonaws.com.
Escape character is '^]'.
^CConnection closed by foreign host.
```

If you can connect, your settings are correct, and your cluster is visible from your instance.

1. Go to the AWS Secret Manager and create a key starting with `AmazonMSK_` prefix. Select `Other type of secret` and `Plaintext` and provide the following value inside of the text field:
```json
{
  "username":"username",
  "password": "password"
}
```
1. In the `Encryption key` section, press the `Add new key` and create a `Symmetric` key with `Encrypt and decrypt` as a usage pattern.
1. Select your key in the `Encryption key` section and press `Next`.
1. Provide a secret name and description and press `Next` until you get to the `Store` button.
1. Store your secret.
1. Go back to the AWS MSK and select your cluster.
1. Navigate to the `Associated secrets from AWS Secrets Manager` section and press `Associate secrets`
1. Press the `Choose secrets` and select the previously created secret.
1. Press `Associate secrets`. It will take AWS a while to do it.
1. Congratulations, you just configured everything needed to make it work with Karafka.

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