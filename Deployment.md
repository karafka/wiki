Karafka is currently being used in production with following deployment methods:

  - Capistrano
  - Docker

Since the only thing that is long-running is Karafka server, it should't be hard to make it work with other deployment and CD tools.

### Capistrano

For details about integration with Capistrano, please go to [capistrano-karafka](https://github.com/karafka/capistrano-karafka) gem page.

### Docker

Karafka can be dockerized as any other Ruby/Rails app. To execute **karafka server** command in your Docker container, just put this into your Dockerfile:

```bash
ENV KARAFKA_ENV production
CMD bundle exec karafka server
```