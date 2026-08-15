# Filtering

Karafka Pro adds a keyword filter (search) box to nearly every data-heavy listing in the Web UI: consumers, controls, jobs (including per-consumer job lists), routing, cluster (brokers, broker/topic configs, replication), recurring tasks, all health views, and the Explorer, DLQ, Scheduled Messages, and Topics Management topic lists.

!!! info "Filtering Is a Karafka Pro Feature"

    The keyword filter box is part of [Karafka Pro](https://karafka.io/#become-pro). It is not rendered at all in the OSS version.

!!! note "Not the Same as Explorer Search"

    This is a different feature from [Search](Pro-Web-UI-Search), which searches inside Explorer message payloads, keys, and headers. Filtering narrows down a *listing* of rows (processes, jobs, topics, and so on); Search looks inside individual message content.

## How It Works

The filter box renders a text field with a "Search" button and an always-present "Reset" button. It submits via `GET` to the current page, preserving every other query parameter (including the current sort) as hidden fields, and resets pagination so filtering always starts from the first page. Filtering is applied in-memory against the current listing.

## Field Selector on Flat Listings

"Flat" listings (consumers, controls, jobs, cluster, configs, recurring tasks) additionally get a Pro-only field selector next to the search box, letting you scope the search to one specific attribute instead of matching across all of them. For example:

- **Consumers**: filter by Process ID, Subscriptions, or Tags
- **Cluster**: filter by Node ID/name or by broker/topic config name and value

The field selector always accompanies the input on listings that support it, so every search looks consistent, even on single-field listings.

## See Also

- [Search](Pro-Web-UI-Search) - Searching inside Explorer message payloads, keys, and headers
- [Features](Web-UI-Features) - Overview of all Web UI dashboard views
