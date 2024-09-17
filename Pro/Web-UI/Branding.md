The Karafka Web UI branding feature allows you to customize the UI to reflect its running environment (e.g., development, staging, production). This configuration helps prevent mistakes by clarifying which environment you are working in. The branding options include setting a label, displaying a notice, and defining the branding style.

The branding configuration is done through the `config.ui.branding`. You can adjust the following settings:

- `type`: Defines the styling for the branding notice. It aligns with our UI styling options and can be set to one of the following: `:info`, `:error`, `:warning`, `:success`, `:primary`. The default value is `:info`.

- `label`: A string that serves as the environment label (e.g., "Production" or "Staging"). This label is displayed below the logo in the Web UI. To disable the label, set this to `false`. The default value is `false`.

- `notice`: An additional wide alert notice highlighting extra environmental details. This is a string that can be used for a custom message or set to `false` to disable it. The default value is `false`.

```ruby
Karafka::Web.setup do |config|
  config.ui.branding.type = :warning
  config.ui.branding.notice = 'You are working in the production environment – proceed with caution!'
  config.ui.branding.label = 'Production'
end
```

![karafka web ui](https://raw.githubusercontent.com/karafka/misc/master/printscreens/web-ui/branding1.png)

## Best Practices

- Always set a unique label for each environment (e.g., "Production", "Development") to avoid any accidental confusion.
- Use the notice field to display critical environment-specific information, especially in production environments.
- Choose an appropriate type to convey the importance or caution level of the environment visually.
