If your credentials leak due to internal or external incidents, you should rotate them.

## Rotating the Primary Credential

To rotate your primary (main) credential:

1. Go to your license credentials page.

    <p align="center">
      <img src="https://karafka.io/assets/misc/printscreens/gems_license_page.png" />
    </p>

1. Press the "Rotate" button next to the main credential.

1. Read the disclaimers.

    <p align="center">
      <img src="https://karafka.io/assets/misc/printscreens/gems_rotate_page.png" />
    </p>

1. Press the "I understand. Send me an email with the rotation link." button.

1. Open the link received in the email. It opens a confirmation page. Your credentials are **not** rotated yet.

1. Press the "Rotate my credentials" button. Your old credentials stop working, and you cannot restore them.

1. View your new credentials and replace them in your Gemfile and any other place where you use them.

## Rotating Additional Credentials

If you use [additional credentials](Pro-Getting-Started#additional-credentials) (e.g. for CI or development environments), you can rotate each one independently from the license credentials page. Press the "Rotate" button next to the credential you want to rotate. Then press the "I understand. Send me an email with the rotation link." button and open the link received in the email. The link opens a confirmation page. Press the "Rotate this credential" button on it to rotate the credential. Other credentials do not change.

## See Also

- [Pro Security](Pro-Security) - Security best practices
- [Deployment](Infrastructure-Deployment) - Deployment strategies and best practices
- [AWS MSK Guide](Infrastructure-AWS-MSK-Guide) - AWS MSK integration guide
