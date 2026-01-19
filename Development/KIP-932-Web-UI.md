# KIP-932 for Karafka Web UI

!!! warning "Work in Progress"

    This document is a work in progress used for development purposes. It is subject to constant changes as it tracks research and development work related to KIP-932. It should not be used for any assumptions about future APIs, features, or implementation details.

KIP-932 introduces **Share Groups** to Apache Kafka, a new consumption pattern that enables queue-like semantics where multiple consumers can process messages from the same partition concurrently. This document analyzes the changes needed in karafka-web to support share groups once librdkafka implements KIP-932.

This feature requires schema changes, new UI views, and modifications to data collection and presentation layers.

## What is KIP-932?

Share groups introduce "cooperative consumption" where:

- Multiple consumers can share access to the same partitions (unlike traditional consumer groups with exclusive partition assignments)
- Records use **per-message acknowledgment** instead of offset-based commits
- Consumers can exceed partition count without "over-partitioning"
- Queue-like processing patterns are supported natively in Kafka

### Key Differences from Consumer Groups

| Aspect | Consumer Groups | Share Groups |
| ------ | --------------- | ------------ |
| **Partition Access** | Exclusive per consumer | Shared among multiple consumers |
| **Acknowledgment** | Offset-based commits | Per-record (ACCEPT/RELEASE/REJECT) |
| **Assignment** | Client or server-side | Server-side only (SimpleAssignor) |
| **Fencing** | Yes | No (cooperative model) |
| **Rebalance** | ASSIGNING/RECONCILING states | Only EMPTY/STABLE/DEAD states |
| **Lag Concept** | Offset-based | Different semantics (SPSO/SPEO) |

### New Concepts Introduced

- **Share-Partition Start Offset (SPSO)**: Earliest eligible record for consumption
- **Share-Partition End Offset (SPEO)**: Boundary of in-flight records window
- **Delivery Count**: Tracks redelivery attempts per record
- **Record States**: Available, Acquired, Acknowledged, Archived
- **Acquisition Lock Duration**: Configurable timeout (default 30s)

### Group States

Share groups have simpler states than consumer groups:

- **EMPTY**: No active members
- **STABLE**: Active members consuming records
- **DEAD**: Group marked for deletion

## Current Karafka-Web Architecture

### Consumer Group Data Structure

```text
Process
└── Consumer Groups (Hash)
    └── Subscription Groups (Hash)
        ├── id: String
        ├── instance_id: String|false (static membership)
        ├── state: Hash
        │   ├── state: String ("up")
        │   ├── join_state: String ("steady")
        │   ├── stateage: Integer
        │   ├── rebalance_age: Integer
        │   ├── rebalance_cnt: Integer
        │   ├── rebalance_reason: String
        │   └── poll_age: Numeric
        └── topics: Hash
            └── partitions: Hash
                ├── id: Integer
                ├── lag: Integer
                ├── lag_stored: Integer
                ├── committed_offset: Integer
                ├── stored_offset: Integer
                ├── fetch_state: String
                ├── poll_state: String
                ├── hi_offset: Integer
                ├── lo_offset: Integer
                ├── ls_offset: Integer (Last Stable Offset)
                └── transactional: Boolean
```

### Key Files

**Contracts (Data Validation):**

- `lib/karafka/web/tracking/consumers/contracts/consumer_group.rb`
- `lib/karafka/web/tracking/consumers/contracts/subscription_group.rb`
- `lib/karafka/web/tracking/consumers/contracts/partition.rb`

**Models (UI Representation):**

- `lib/karafka/web/ui/models/consumer_group.rb`
- `lib/karafka/web/ui/models/subscription_group.rb`
- `lib/karafka/web/ui/models/partition.rb`
- `lib/karafka/web/ui/models/health.rb`

**Data Collection:**

- `lib/karafka/web/tracking/consumers/sampler.rb`
- `lib/karafka/web/tracking/consumers/listeners/statistics.rb`
- `lib/karafka/web/tracking/consumers/listeners/connections.rb`

**Views (Pro):**

- `lib/karafka/web/pro/ui/views/routing/_consumer_group.erb`
- `lib/karafka/web/pro/ui/views/consumers/consumers/consumer/_subscription_group.erb`
- `lib/karafka/web/pro/ui/views/consumers/consumers/consumer/_partition.erb`

**Helpers:**

- `lib/karafka/web/ui/helpers/application_helper.rb` - Badge colors, state formatting

## Required Changes

### Schema Changes

#### Consumer Group Contract

**File**: `lib/karafka/web/tracking/consumers/contracts/consumer_group.rb`

Add a `type` field to distinguish group types:

```ruby
# Current
required(:id) { |val| val.is_a?(String) && !val.empty? }
required(:subscription_groups) { |val| val.is_a?(Hash) }

# Proposed addition
required(:type) { |val| %w[consumer share].include?(val) }
```

**Migration needed**: Add `type` field with default value `"consumer"` for backward compatibility.

#### Subscription Group Contract

**File**: `lib/karafka/web/tracking/consumers/contracts/subscription_group.rb`

The `state` nested structure needs to handle different states for share groups:

```ruby
# Current state fields (consumer groups):
# - state, join_state, stateage, rebalance_age, rebalance_cnt, rebalance_reason, poll_age

# Share groups will have different states:
# - state: "empty" | "stable" | "dead" (no join_state, no rebalancing)
# - No rebalance_age, rebalance_cnt, rebalance_reason for share groups
```

**Options**:

1. Make rebalance fields optional (validate based on group type)
2. Create separate contract for share groups
3. Use polymorphic validation

#### Partition Contract (Share Groups)

**File**: `lib/karafka/web/tracking/consumers/contracts/partition.rb`

Share groups have fundamentally different partition metrics:

```ruby
# Current (consumer groups - offset-based):
required(:lag)
required(:committed_offset)
required(:stored_offset)
# etc.

# Share groups need (per-record acknowledgment):
# - spso (Share-Partition Start Offset)
# - speo (Share-Partition End Offset)
# - in_flight_records
# - acquired_records
# - acknowledged_records
# - delivery_count metrics
# - No traditional lag (different semantics)
```

**This is a significant change** - share group partitions track different metrics entirely.

### Data Collection Changes

#### Statistics Listener

**File**: `lib/karafka/web/tracking/consumers/listeners/statistics.rb`

**Dependency**: librdkafka must expose share group statistics. Currently, the listener extracts:

- `cgrp` (consumer group) statistics from librdkafka
- Partition metrics like `consumer_lag`, `committed_offset`, etc.

**Required changes**:

1. Detect group type from librdkafka statistics (once available)
2. Extract share group-specific metrics (SPSO, SPEO, in-flight records)
3. Handle different partition metric structure for share groups

```ruby
def extract_sg_details(sg_id, sg_stats)
  # Need to add group type detection
  {
    id: sg_id,
    type: sg_stats['group_type'] || 'consumer', # Hypothetical field
    state: extract_state_by_type(sg_stats),
    topics: {}
  }
end
```

#### Sampler Enrichers

**File**: `lib/karafka/web/tracking/consumers/sampler/enrichers/consumer_groups.rb`

May need separate enrichment logic for share groups, particularly:

- Different lag calculation (or no traditional lag)
- Different handling of "progress" metrics
- No transactional consumer special handling needed for share groups

### UI Changes

#### Group Type Indicator

**All consumer group views need visual distinction**:

| Location | Change |
| -------- | ------ |
| Routing index | Add group type badge/icon |
| Consumer subscriptions | Show type in header |
| Health overview | Group by type or show type |
| Cluster lags | Different columns for share groups |

**Helper addition** (`application_helper.rb`):

```ruby
def group_type_badge(type)
  case type
  when 'consumer' then 'badge-primary'
  when 'share' then 'badge-accent'
  else 'badge-secondary'
  end
end
```

#### Subscription Group View Changes

**File**: `lib/karafka/web/pro/ui/views/consumers/consumers/consumer/_subscription_group.erb`

**Current display**:

- State, Join state, State change, Last Poll, Last rebalance, Rebalance count

**For share groups**:

- State (EMPTY/STABLE/DEAD only)
- NO join_state (doesn't exist)
- NO rebalance metrics (cooperative model)
- Possibly: acquisition lock duration, delivery attempt limit

**Solution**: Conditional rendering based on group type:

```erb
<% if consumer_group.type == 'share' %>
  <%# Share group specific metrics %>
<% else %>
  <%# Current consumer group metrics %>
<% end %>
```

#### Partition Table Changes

**File**: `lib/karafka/web/pro/ui/views/consumers/consumers/consumer/_partition.erb`

**Consumer Group Partitions** (current):

| Partition | Lag | Trend | Committed | Stored | Fetch | Poll | LSO |

**Share Group Partitions** (proposed):

| Partition | SPSO | SPEO | In-Flight | Acquired | Delivery Count | State |

**This requires a completely different table structure for share groups.**

#### Health View Changes

**File**: `lib/karafka/web/ui/models/health.rb`

- `fetch_rebalance_ages` method doesn't apply to share groups
- Lag aggregation semantics differ for share groups
- May need separate health calculations per group type

#### State Badge Colors

**File**: `lib/karafka/web/ui/helpers/application_helper.rb`

Add share group state support:

```ruby
def kafka_state_badge(state)
  case state
  # Existing consumer group states
  when 'up' then 'badge-success'
  when 'active' then 'badge-success'
  when 'steady' then 'badge-success'
  # Share group states
  when 'stable' then 'badge-success'
  when 'empty' then 'badge-warning'
  when 'dead' then 'badge-error'
  else
    'badge-warning'
  end
end
```

### Admin Operations

#### New Share Group Admin Features

KIP-932 introduces new admin operations that could be exposed in the UI:

1. **Reset SPSO** - Similar to offset reset for consumer groups
2. **Delete Share Group Offsets** - Cleanup operations
3. **List/Describe Share Groups** - Already have similar for consumer groups

**These would require new routes and controllers in Pro UI.**

### Migration Strategy

#### Schema Migration

Create migration: `TIMESTAMP_add_group_type_to_consumer_groups.rb`

```ruby
module Karafka
  module Web
    module Management
      module Migrations
        module ConsumersReports
          class AddGroupTypeToConsumerGroups < Base
            self.versions = '1.6.0'
            self.type = :consumers_reports

            def migrate(state)
              # Add type field with default 'consumer' to all existing groups
              state[:consumer_groups]&.each do |_cg_id, cg_data|
                cg_data[:type] ||= 'consumer'
              end
            end
          end
        end
      end
    end
  end
end
```

## Open Questions

1. Will librdkafka expose share group stats in the same `cgrp` structure?

   - This determines how much listener code changes

2. What metrics will librdkafka provide for share groups?

   - Affects partition contract and UI design

3. Should share groups have completely separate views or conditional rendering?

   - UX decision - separate views are cleaner but more maintenance

4. How should health/lag dashboards handle mixed group types?

   - Aggregation semantics differ significantly

5. Will there be a `KafkaShareConsumer` class or modified `KafkaConsumer`?

   - Affects how karafka core integrates, which affects web
