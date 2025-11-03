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
      <td>Root dir of the Karafka application. Defaults to the directory in which Bundler was executed (<code>BUNDLE_GEMFILE</code>)</td>
    </tr>
    <tr>
      <td>KARAFKA_ENV</td>
      <td>Karafka app expected environment. If not defined, autodetected based on <code>RAILS_ENV</code>, <code>RACK_ENV</code> with a fallback to <code>development</code>.</td>
    </tr>
    <tr>
      <td>KARAFKA_BOOT_FILE</td>
      <td>Location of Karafka boot file (<code>karafka.rb</code>) or <code>false</code>. Defaults to <code>karafka.rb</code> in the project root directory. May be set to <code>false</code> in case you want to fully control Karafka boot process.</td>
    </tr>
    <tr>
      <td>KARAFKA_REQUIRE_RAILS</td>
      <td>Determines if Rails should be required when present in the Gemfile. If set to <code>false</code>, Karafka can run without Rails even if both are in the same Gemfile.</td>
    </tr>
  </tbody>
</table>

## See also

- [Configuration](Configuration) - Complete configuration reference
- [Deployment](Deployment) - Using environment variables in deployment
- [Development vs Production](Development-vs-Production) - Environment-specific settings
