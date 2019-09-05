Karafka is currently being used in production with following deployment methods:

  - Capistrano
  - systemd (+ Capistrano)
  - Docker
  - Heroku

Since the only thing that is long-running is Karafka server, it shouldn't be hard to make it work with other deployment and CD tools.

## Capistrano

For details about integration with Capistrano, please go to [capistrano-karafka](https://github.com/karafka/capistrano-karafka) gem page.

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

WorkingDirectory=/opt//current
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

In case you want to use `systemd` based solution together with Capistrano, you don't need the `capistrano-karafka` gem. Instead you can use this simple Capistrano `.cap` file:

```ruby
# frozen_string_literal: true

after 'deploy:starting', 'karafka:stop'
after 'deploy:published', 'karafka:start'
after 'deploy:failed', 'karafka:restart'

namespace :karafka do
  task :start do
    on roles(:app) do
      execute :sudo, :systemctl, :start, "#{fetch(:application)}-karafka"
    end
  end

  task :stop do
    on roles(:app) do
      execute :sudo, :systemctl, :stop, "#{fetch(:application)}-karafka"
    end
  end

  task :restart do
    on roles(:app) do
      execute :sudo, :systemctl, :restart, "#{fetch(:application)}-karafka"
    end
  end

  task :status do
    on roles(:app) do
      execute :sudo, :systemctl, :status, "#{fetch(:application)}-karafka"
    end
  end
end
```

## Docker

Karafka can be dockerized as any other Ruby/Rails app. To execute ```karafka server``` command in your Docker container, just put this into your Dockerfile:

```bash
ENV KARAFKA_ENV production
CMD bundle exec karafka server
```

## Heroku

Karafka may be deployed on [Heroku](https://www.heroku.com/) and works with
[Heroku Kafka](https://www.heroku.com/kafka) and [Heroku Redis](https://www.heroku.com/redis).

Set `KARAFKA_ENV`:
```bash
heroku config:set KARAFKA_ENV=production
```

Configure Karafka to use the Kafka and Redis configuration provided by Heroku:
* Due to [Heroku CA Cert rotation](https://devcenter.heroku.com/articles/ca-cert-rotation-kafka) it is required to load the Heroku Kafka CA certs from a file to ensure proper handling of multiple certs by ruby-kafka
```ruby
# app_root/karafka.rb
class App < Karafka::App
  setup do |config|
    config.kafka.seed_brokers = ENV['KAFKA_URL'].split(',') # Convert CSV list of broker urls to an array
    if ENV['KAFKA_TRUSTED_CERT']
      tmp_ca_file = Tempfile.new('kafka_ca_certs')
      tmp_ca_file.write(ENV.fetch("KAFKA_TRUSTED_CERT"))
      tmp_ca_file.close
      config.kafka.ssl_ca_cert_file_path = tmp_ca_file.path
    end
    config.kafka.ssl_client_cert = ENV['KAFKA_CLIENT_CERT'] if ENV['KAFKA_CLIENT_CERT']
    config.kafka.ssl_client_cert_key = ENV['KAFKA_CLIENT_CERT_KEY'] if ENV['KAFKA_CLIENT_CERT_KEY']
    # ...other configuration options...
  end
end
```

Create your Procfile:
```text
karafka_server: bundle exec karafka server
# the worker needs to run only if you use the :sidekiq consuming backend
karafka_worker: bundle exec karafka worker
```
