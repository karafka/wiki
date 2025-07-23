# Getting Started with Karafka Pro

## Configuration

To activate Karafka Pro, you need to do three things:

1. Follow the standard Karafka [installation](Getting-Started) procedure.

2. Obtain credentials to a registry hosting a custom `karafka-license` gem. This gem contains all the code for Karafka to detect the Pro components. You can get them [here](https://gems.karafka.io/pro).

3. Add this to your Gemfile and `bundle install`:

```ruby
source 'https://USERNAME:PASSWORD@gems.karafka.io' do
  gem 'karafka-license', 'LICENSE_ID'
end

gem 'karafka'
# other gems...
```

4. (Optionally) Enable Bundler native checksum verification by running: `bundle lock --add-checksums` or enabling it for all your projects via `bundle config lockfile_checksums true`.

!!! Tip "Crucial Gemfile Tip for Karafka Pro Users"

    You still need to have the standard `gem 'karafka'` definition in your `Gemfile`. License gem is just providing the license. 

!!! Warning "Enterprise License Required for Offline or Private Registry Setup"

    An Enterprise license is required if you are looking into hosting the license key offline within the app or via a private registry. This mode of operation allows you to use Karafka Pro without relying on our gem server. An Enterprise Agreement will grant you access to the license gem sources and installation instructions, ensuring you can proceed smoothly with your preferred setup.

## License Gem Integrity Verification

!!! Info "Checksum Verification in Enterprise Mode Not Needed"

    When using Karafka with an offline [Enterprise](Pro-Enterprise) license, license gem checksum verification is not required. The Enterprise license is fully offline and not subject to change. It is also not being fetched from the Karafka gem server, thus making the checksum verification pointless.

!!! Warning " Checksum Not Available on Web UI"

    Due to security reasons, license checksum is not available through the license Web UI. It is only sent once via email.

### With Bundler 2.6+

From Bundler 2.6, gem checksum verification is natively supported and built directly into the `Gemfile.lock` file. This eliminates the need for external scripts or manual verification processes, as Bundler will automatically ensure the integrity of all gems during installation as long as checksum verification is active. By enabling checksum verification, you enhance the security of the `karafka-license` gem and protect all other dependencies in your project.

To enable checksum verification with Bundler 2.6 or newer, follow these steps:

1. **Activate checksum management in your lockfile**:

Run the following command to add a `CHECKSUMS` section to your `Gemfile.lock`:

```bash
bundle lock --add-checksums
```

2. (First-time setup only) **Verify the karafka-license gem checksum**:

After running `bundle lock --add-checksums`, locate the checksum of the karafka-license gem in the Gemfile.lock file and ensure it matches the checksum provided in the email you received. This ensures that the correct gem version is being used and matches the one issued with your license.

Use the following command to extract the checksum of the karafka-license gem from the Gemfile.lock:

```bash
grep -A 1 "karafka-license" Gemfile.lock | grep sha256
```

3. (Optionally) **Enable checksum verification globally**:

If you want all new lockfiles to include checksum verification by default, run:

```bash
bundle config lockfile_checksums true
```

This will ensure that every new project or lockfile you create will have checksums included.

#### Protecting All Gems, Not Just `karafka-license`

One of the biggest advantages of Bundler 2.6+ is that checksum verification applies to all gems listed in your `Gemfile.lock`, not just `karafka-license`. This means your entire dependency chain is protected from tampering, enhancing the overall security of your application.

When Bundler downloads a gem (or installs it from a local cache), it verifies that the checksum matches the value stored in the `Gemfile.lock`. If there is a mismatch, Bundler halts the installation process and raises an error, ensuring no compromised or altered gems are installed.

### With Bundler 2.5 or Older (Deprecated)

!!! Tip "Upgrade to Bundler 2.6+ for Hassle-Free Checksum Protection"

    We **highly recommend upgrading to Bundler 2.6 or higher** rather than implementing the manual checksum verification flow. Bundler 2.6 introduces native support for [gem checksum verification](https://bundler.io/blog/2024/12/19/bundler-v2-6.html) directly in the `Gemfile.lock`, making manual verification unnecessary.

    This feature protects all your dependencies from tampering by verifying that the `.gem` file's checksum matches the one recorded in the lockfile before installation. Consider this upgrade as a vital step to enhance the integrity of your Open Source Supply Chain.

Using Karafka Pro means we are part of your Open Source Supply Chain. We take this exceptionally seriously, and that is why we encourage you to verify the integrity of the license gem we provide in your CI/CD.

You can do it with the following script:

```bash
#!/usr/bin/env bash

set -e

KARAFKA_PRO_USERNAME='PROVIDE-USERNAME'
KARAFKA_PRO_PASSWORD='PROVIDE-PASSWORD'
KARAFKA_PRO_LICENSE_ID='PROVIDE-LICENSE-ID'
KARAFKA_PRO_LICENSE_CHECKSUM='PROVIDE-CHECKSUM'

if [ "$MODE" != "after" ]; then
  # Check the remote license prior to bundle installing
  curl \
    --fail \
    --retry 5 \
    --retry-delay 1 \
    -u $KARAFKA_PRO_USERNAME:$KARAFKA_PRO_PASSWORD \
    https://gems.karafka.io/gems/karafka-license-$KARAFKA_PRO_LICENSE_ID.gem \
    -o ./karafka-license.gem
else
  # Check the local cached one after bundle install
  cache_path=`ruby -e 'puts "#{Gem.dir}/cache/"'`
  cp "$cache_path/karafka-license-$KARAFKA_PRO_LICENSE_ID.gem" ./karafka-license.gem
fi

detected=`sha256sum ./karafka-license.gem | awk '{ print $1 }'`

rm ./karafka-license.gem

echo -n "Karafka Pro license artifact checksum verification result: "

if [ "$detected" = "$KARAFKA_PRO_LICENSE_CHECKSUM" ]; then
  echo "Success"
else
  echo -e "\033[0;31mFailure!\033[0m"
  exit 1
fi
```

Due to the nature of how Bundler works, it is **recommended** to run this script twice in the CI/CD:

1. First, before `bundle install` is executed, to ensure that the gem server is serving the correct data.
2. Second time after `bundle install` to ensure consistency of the fetched package.

To use it:

1. Store above script in your repository preferably under `bin/verify_karafka_license_checksum`.

2. Set the `KARAFKA_PRO_USERNAME`, `KARAFKA_PRO_PASSWORD`, `KARAFKA_PRO_LICENSE_ID` and `KARAFKA_PRO_LICENSE_CHECKSUM` based on data provided to you in the license issuing email or set those values as your CI/CD ENV variables.

3. Run `MODE=before bin/verify_karafka_license_checksum` as part of your CI/CD **before** running `bundle install`.

4. Run `bundle install`

5. Run `MODE=after bin/verify_karafka_license_checksum` to ensure that the stored artefact was not compromised.

In case the verification fails, script will exit with the exit code `1`.
