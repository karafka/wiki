Karafka's behavior can be altered with the following environment variables:

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
      <td>Root dir of the Karafka application. Defaults to the directory of the outermost <code>Gemfile</code> as resolved by Bundler (<code>Bundler.default_gemfile</code>), not the <code>BUNDLE_GEMFILE</code> env variable directly, since that can be altered by tools like ruby-lsp</td>
    </tr>
    <tr>
      <td>KARAFKA_ENV</td>
      <td>Karafka app expected environment. If not defined, autodetected based on <code>RACK_ENV</code>, <code>RAILS_ENV</code> (in that priority order) with a fallback to <code>development</code>.</td>
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

## See Also

- [Configuration](Basics-Configuration) - Complete configuration reference
- [Deployment](Infrastructure-Deployment) - Using environment variables in deployment
- [Development vs Production](Infrastructure-Application-Development-vs-Production) - Environment-specific settings
