Karafka's behaviour can be altered with the following environment variables:

| Name                 | Description                                                                                                                       |
|----------------------|-----------------------------------------------------------------------------------------------------------------------------------|
| KARAFKA_ROOT_DIR     | Root dir of the Karafka application. Defaults to the directory in which Bundler was executed (`BUNDLE_GEMFILE`)                   |
| KARAFKA_ENV          | Karafka app expected environment. If not defined, autodetected based on `RAILS_ENV`, `RACK_ENV` with a fallback to `development`. |
| KARAFKA_BOOT_FILE    | Location of Karafka boot file (`karafka.rb`) or `false`. Defaults to `karafka.rb` in the project root directory. May be set to `false` in case you want to fully control Karafka boot process.                             |
