Karafka can be dockerized as any other Ruby/Rails app. To execute ```karafka server``` command in your Docker container, just put this into your Dockerfile:

```bash
ENV KARAFKA_ENV production
CMD bundle exec karafka server
```
