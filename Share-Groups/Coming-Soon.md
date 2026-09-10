Share Groups support is coming in a future version of Karafka. This page will be updated with documentation once the feature is available.

As of Karafka 2.6.2, the share-group **routing layer** is already in place: you can declare `share_group` blocks in your routing (validated, introspectable via `Karafka::App.share_groups`, filterable via `--include_share_groups`/`--exclude_share_groups` and visible in `karafka info`), but running them raises `Karafka::Errors::ShareGroupsNotImplementedError` until the consumption runtime lands.
