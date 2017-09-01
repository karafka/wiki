Karafka is currently being used in production with following deployment methods:

  - Capistrano
  - Docker
  - Heroku

Since the only thing that is long-running is Karafka server, it should't be hard to make it work with other deployment and CD tools.

## Capistrano

For details about integration with Capistrano, please go to [capistrano-karafka](https://github.com/karafka/capistrano-karafka) gem page.

## Docker

Karafka can be dockerized as any other Ruby/Rails app. To execute ```karafka server``` command in your Docker container, just put this into your Dockerfile:

```bash
ENV KARAFKA_ENV production
CMD bundle exec karafka server
```

## Heroku

Karafka may be deployed on [Heroku](https://www.heroku.com/), and works with
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
# the worker needs to run only if you use the :sidekiq processing backend
karafka_worker: bundle exec karafka worker
```