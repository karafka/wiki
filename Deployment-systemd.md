You can easily manage Karafka applications with `systemd`. Here's an example `.service` file that you can use.

```bash
# Move to /lib/systemd/system/karafka.service
# Run: systemctl enable karafka

[Unit]
Description=karafka
After=syslog.target network.target

[Service]
Type=simple

WorkingDirectory=/opt/current
ExecStart=/bin/bash -lc 'bundle exec karafka server'
User=deploy
Group=deploy
UMask=0002

RestartSec=1
Restart=on-failure

# output goes to /var/log/syslog
StandardOutput=syslog
StandardError=syslog

# This will default to "bundler" if we don't specify it
SyslogIdentifier=karafka

[Install]
WantedBy=multi-user.target
```

If you want to use `systemd` based solution together with Capistrano, you don't need the `capistrano-karafka` gem. Instead, you can use this simple Capistrano `.cap` file:

```ruby
# frozen_string_literal: true

after 'deploy:starting', 'karafka:stop'
after 'deploy:published', 'karafka:start'
after 'deploy:failed', 'karafka:restart'

namespace :karafka do
  task :start do
    on roles(:app) do
      execute :sudo, :systemctl, :start, 'karafka'
    end
  end

  task :stop do
    on roles(:app) do
      execute :sudo, :systemctl, :stop, 'karafka'
    end
  end

  task :restart do
    on roles(:app) do
      execute :sudo, :systemctl, :restart, 'karafka'
    end
  end

  task :status do
    on roles(:app) do
      execute :sudo, :systemctl, :status, 'karafka'
    end
  end
end
```

If you need to run several processes of a given type, please refer to `template unit files`.
