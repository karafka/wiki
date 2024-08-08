Karafka's behaviour can be altered with the following environment variables:

<table>
  <thead>
    <tr>
      <th>Name</th>
      <th>Description</th>
    </tr>
  </thead>
  <tbody>
    <tr>
      <td>KARAFKA_ROOT_DIR</td>
      <td>Root dir of the Karafka application. Defaults to the directory in which Bundler was executed (`BUNDLE_GEMFILE`)</td>
    </tr>
    <tr>
      <td>KARAFKA_ENV</td>
      <td>Karafka app expected environment. If not defined, autodetected based on `RAILS_ENV`, `RACK_ENV` with a fallback to `development`.</td>
    </tr>
    <tr>
      <td>KARAFKA_BOOT_FILE</td>
      <td>Location of Karafka boot file (`karafka.rb`) or `false`. Defaults to `karafka.rb` in the project root directory. May be set to `false` in case you want to fully control Karafka boot process.</td>
    </tr>
    <tr>
      <td>KARAFKA_REQUIRE_RAILS</td>
      <td>Determines if Rails should be required when present in the Gemfile. If set to `false`, Karafka can run without Rails even if both are in the same Gemfile.</td>
    </tr>
  </tbody>
</table>
