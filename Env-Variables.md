**Info**: Github Wiki is just a mirror of our [online](https://karafka.io/docs) documentation.

We highly recommend using our website [docs](https://karafka.io/docs) due to Github Wiki limitations. Only some illustrations, links, screencasts, and code examples will work here.

Please use [https://karafka.io/docs](https://karafka.io/docs).

---


Karafka's behaviour can be altered with the following environment variables:

| Name                 | Description                                                                                                                       |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| KARAFKA_ROOT_DIR     | Root dir of the Karafka application. Defaults to the directory in which Bundler was executed (`BUNDLE_GEMFILE`)                   |
| KARAFKA_ENV          | Karafka app expected environment. If not defined, autodetected based on `RAILS_ENV`, `RACK_ENV` with a fallback to `development`. |
| KARAFKA_BOOT_FILE    | Location of Karafka boot file (`karafka.rb`). Defaults to `karafka.rb` in the project root directory.                             |
