## Configuration

To activate your Karafka Pro subscription, you need to do three things:

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

**Note**: You still need to have the standard `gem 'karafka'` definition in your `Gemfile`. License gem is just providing the license. 


## License checksum verification for CI/CD

Using Karafka Pro means we are part of your Open Source Supply Chain. We take this exceptionally seriously, and that is why we encourage you to verify the integrity of the license gem we provide in your CI/CD.

You can do it with the following script:

```bash
#!/usr/bin/env bash

set -e

KARAFKA_PRO_USERNAME='PROVIDE-USERNAME'
KARAFKA_PRO_PASSWORD='PROVIDE-PASSWORD'
KARAFKA_PRO_LICENSE_ID='PROVIDE-LICENSE-ID'
KARAFKA_PRO_LICENSE_CHECKSUM='PROVIDE-CHECKSUM'

curl \
  --fail \
  -u $KARAFKA_PRO_USERNAME:$KARAFKA_PRO_PASSWORD \
  https://gems.karafka.io/gems/karafka-license-$KARAFKA_PRO_LICENSE_ID.gem \
  -o ./karafka-license.gem

detected=`sha256sum ./karafka-license.gem | awk '{ print $1 }'`

echo -n "Karafka Pro license artifact checksum verification result: "

if [ "$detected" = "$KARAFKA_PRO_LICENSE_CHECKSUM" ]; then
  echo "Success"
else
  echo -e "\033[0;31mFailure!\033[0m"
  exit 1
fi
```

To use it:

1. Store above script in your repository preferably under `bin/verify_karafka_license_checksum`.

2. Set the `KARAFKA_PRO_USERNAME`, `KARAFKA_PRO_PASSWORD`, `KARAFKA_PRO_LICENSE_ID` and `KARAFKA_PRO_LICENSE_CHECKSUM` based on data provided to you in the license issuing email.

4. Run `bin/verify_karafka_license_checksum` as part of your CI/CD **before** running `bundle install`.

**Note**: Due to security reasons, license checksum is not available through the license Web UI. It is only sent once via email.
