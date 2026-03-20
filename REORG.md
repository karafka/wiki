# Karafka Wiki Reorganization Plan

## Context

Reorganize the Karafka documentation wiki to introduce Share Groups (KIP-932) as a first-class consumption model alongside Consumer Groups. Directory structure maps to nav sections. User journey pages come first.

## Preliminary Findings

- **This/ directory**: Does not exist. No action needed.
- **Advanced/Shared-Kafka-Cluster-for-Multiple-Applications.md**: TBA stub, zero inbound links. → Move to `Infrastructure/`.
- **Why-Kafka-and-Karafka.md**: Root file, in current nav. → Move to `Basics/`.
- **Pro/Enterprise-License-Setup.md**: Does not exist in wiki; added during website build. No action needed.
- **Development/Code-Quality-Linting-Setup.md**: Exists on disk, not in any nav. Flag during orphan check.
- **Upgrades/Karafka.md, Upgrades/WaterDrop.md, Upgrades/Web-UI.md**: Index pages. Kept as-is.

## Link Format

Flat GitHub wiki-style names without `.md` extension. Kept as-is — URL changes handled in website repo.

- Root files: `(Configuration)`, `(Getting-Started)`
- Advanced/ files: `(Routing)`, `(CLI)` — NO prefix (special-cased in align_structure)
- All other namespaced dirs: `(Operations-Deployment)`, `(Admin-API)`, `(Pro-Virtual-Partitions)`

Also check full URLs: `karafka.io/docs/PageName`, `karafka/wiki/PageName`.

## Scripts Requiring Updates

- **`bin/align_structure`** — Add new namespaces to prefixed list. Remove old namespaces when empty.
- **`bin/sync_gh`** — Same namespace changes.
- **`.markdownlint-cli2.jsonc`** — Update `!Operations/Instrumentation-Events.md` path when that file moves.

## Navigation

Defined in Home.md (GitHub Wiki sidebar). Update Home.md only — no mkdocs.yml created.

---

## Directory Structure

### Directories to create
- `Basics/`
- `Consumer-Groups/`
- `Share-Groups/`
- `Infrastructure/`
- `Infrastructure/Admin/`
- `Pro/Consumer-Groups/`
- `Pro/Share-Groups/`

### Directories to keep as-is
- `WaterDrop/` — independent gem, name stays (+ receives `WaterDrop-reconfiguration.md`)
- `Web-UI/`
- `Kafka/` — receives 1 new file
- `Librdkafka/`
- `Upgrades/` — receives 1 new file
- `Changelog/`
- `Development/` — KIP-932 files stay here

### Directories to empty and remove
- `Advanced/` — files split across `Consumer-Groups/`, `Infrastructure/`, `WaterDrop/`
- `Operations/` — files split across `Consumer-Groups/`, `Infrastructure/`
- `Admin/` — files move to `Infrastructure/Admin/`

---

## File Assignments

### Root → Basics/ (13 files)

| File | New link prefix |
|------|----------------|
| ~~`Home.md`~~ | stays at root (MkDocs requirement) |
| `Why-Kafka-and-Karafka.md` | `Basics-Why-Kafka-and-Karafka` |
| `Getting-Started.md` | `Basics-Getting-Started` |
| `Configuration.md` | `Basics-Configuration` |
| `Consuming-Messages.md` | `Basics-Consuming-Messages` |
| `Producing-Messages.md` | `Basics-Producing-Messages` |
| `Testing.md` | `Basics-Testing` |
| ~~`Components.md`~~ | ~~`Basics-Components`~~ ✅ DONE |
| ~~`Code-Editors-and-LLM-Setup.md`~~ | ~~`Basics-Code-Editors-and-LLM-Setup`~~ ✅ DONE |
| `FAQ.md` | `Basics-FAQ` |
| `Support.md` | `Basics-Support` |
| ~~`Status.md`~~ | stays at root |
| Consumer-Groups-vs-Share-Groups.md | `Basics-Consumer-Groups-vs-Share-Groups` (NEW) |

### Root → Pro/ (2 files)

| File | New link |
|------|----------|
| `Build-vs-Buy.md` | `Pro-Build-vs-Buy` |
| `Purchase-Karafka-Pro.md` | `Pro-Purchase-Karafka-Pro` |

### Advanced/ → Consumer-Groups/ (9 files)

| File | Old link | New link |
|------|----------|----------|
| `Routing.md` | `Routing` | `Consumer-Groups-Routing` |
| `Concurrency-and-Multithreading.md` | `Concurrency-and-Multithreading` | `Consumer-Groups-Concurrency-and-Multithreading` |
| `Offset-management.md` | `Offset-management` | `Consumer-Groups-Offset-management` |
| `Pausing-Seeking-and-Rate-Limiting.md` | `Pausing-Seeking-and-Rate-Limiting` | `Consumer-Groups-Pausing-Seeking-and-Rate-Limiting` |
| `Deserialization.md` | `Deserialization` | `Consumer-Groups-Deserialization` |
| `Dead-Letter-Queue.md` | `Dead-Letter-Queue` | `Consumer-Groups-Dead-Letter-Queue` |
| `Active-Job.md` | `Active-Job` | `Consumer-Groups-Active-Job` |
| `Inline-Insights.md` | `Inline-Insights` | `Consumer-Groups-Inline-Insights` |
| `Assignments-Tracking.md` | `Assignments-Tracking` | `Consumer-Groups-Assignments-Tracking` |

### Advanced/ → Infrastructure/ (21 files)

| File | Old link | New link |
|------|----------|----------|
| `Integrating-with-Ruby-on-Rails-and-other-frameworks.md` | `Integrating-with-Ruby-on-Rails-and-other-frameworks` | `Infrastructure-Integrating-with-Ruby-on-Rails-and-other-frameworks` |
| `Auto-reload-of-code-changes-in-development.md` | `Auto-reload-of-code-changes-in-development` | `Infrastructure-Auto-reload-of-code-changes-in-development` |
| `Env-Variables.md` | `Env-Variables` | `Infrastructure-Env-Variables` |
| `Topic-Auto-Creation.md` | `Topic-Auto-Creation` | `Infrastructure-Topic-Auto-Creation` |
| `Declarative-Topics.md` | `Declarative-Topics` | `Infrastructure-Declarative-Topics` |
| `CLI.md` | `CLI` | `Infrastructure-CLI` |
| `Multi-Cluster-Setup.md` | `Multi-Cluster-Setup` | `Infrastructure-Multi-Cluster-Setup` |
| `Active-Record-Connections-Management.md` | `Active-Record-Connections-Management` | `Infrastructure-Active-Record-Connections-Management` |
| `Swarm-Multi-Process.md` | `Swarm-Multi-Process` | `Infrastructure-Swarm-Multi-Process` |
| `Embedding.md` | `Embedding` | `Infrastructure-Embedding` |
| `Forking.md` | `Forking` | `Infrastructure-Forking` |
| `Resources-Management.md` | `Resources-Management` | `Infrastructure-Resources-Management` |
| `Exit-codes.md` | `Exit-codes` | `Infrastructure-Exit-codes` |
| `Broker-Failures-and-Fault-Tolerance.md` | `Broker-Failures-and-Fault-Tolerance` | `Infrastructure-Broker-Failures-and-Fault-Tolerance` |
| `Latency-and-Throughput.md` | `Latency-and-Throughput` | `Infrastructure-Latency-and-Throughput` |
| `Debugging.md` | `Debugging` | `Infrastructure-Debugging` |
| `Problems-and-Troubleshooting.md` | `Problems-and-Troubleshooting` | `Infrastructure-Problems-and-Troubleshooting` |
| `Upgrading.md` | `Upgrading` | `Infrastructure-Upgrading` |
| ~~`Articles-and-other-references.md`~~ | ~~moved to `Basics/Articles-and-Other-References.md`~~ | ✅ DONE (wiki#486, website#102) |
| `Versions-Lifecycle-and-EOL.md` | `Versions-Lifecycle-and-EOL` | `Infrastructure-Versions-Lifecycle-and-EOL` |
| `SBOM.md` | `SBOM` | `Infrastructure-SBOM` |

~~`Shared-Kafka-Cluster-for-Multiple-Applications.md`~~ — ✅ REMOVED (wiki#485, zero refs TBA stub)

### Advanced/ → WaterDrop/ (1 file)

| File | Old link | New link |
|------|----------|----------|
| `WaterDrop-reconfiguration.md` → **renamed** `Reconfiguration.md` | `WaterDrop-reconfiguration` | `WaterDrop-Reconfiguration` |

### Operations/ → Consumer-Groups/ (2 files)

| File | Old link | New link |
|------|----------|----------|
| `Error-Handling-and-Back-Off-Policy.md` | `Operations-Error-Handling-and-Back-Off-Policy` | `Consumer-Groups-Error-Handling-and-Back-Off-Policy` |
| `Persistent-Pausing.md` | `Operations-Persistent-Pausing` | `Consumer-Groups-Persistent-Pausing` |

### Operations/ → Infrastructure/ (6 files, 1 rename)

| File | Old link | New link |
|------|----------|----------|
| `Instrumentation-Events.md` | `Operations-Instrumentation-Events` | `Infrastructure-Instrumentation-Events` |
| `Signals-and-States.md` | `Operations-Signals-and-States` | `Infrastructure-Signals-and-States` |
| `AWS-MSK-Guide.md` | `Operations-AWS-MSK-Guide` | `Infrastructure-AWS-MSK-Guide` |
| `Development-vs-Production.md` → **renamed** `Application-Development-vs-Production.md` | `Operations-Development-vs-Production` | `Infrastructure-Application-Development-vs-Production` |
| `Monitoring-and-Logging.md` | `Operations-Monitoring-and-Logging` | `Infrastructure-Monitoring-and-Logging` |
| `Deployment.md` | `Operations-Deployment` | `Infrastructure-Deployment` |

### Admin/ → Infrastructure/Admin/ (4 files)

| File | Old link | New link |
|------|----------|----------|
| `API.md` | `Admin-API` | `Infrastructure-Admin-API` |
| `Acls-API.md` | `Admin-Acls-API` | `Infrastructure-Admin-Acls-API` |
| `Configs-API.md` | `Admin-Configs-API` | `Infrastructure-Admin-Configs-API` |
| `Replication-API.md` | `Admin-Replication-API` | `Infrastructure-Admin-Replication-API` |

### Pro/ internal moves (17 files → Pro/Consumer-Groups/)

| File | Old link | New link |
|------|----------|----------|
| `Transactions.md` | `Pro-Transactions` | `Pro-Consumer-Groups-Transactions` |
| `Offset-Metadata-Storage.md` | `Pro-Offset-Metadata-Storage` | `Pro-Consumer-Groups-Offset-Metadata-Storage` |
| `Virtual-Partitions.md` | `Pro-Virtual-Partitions` | `Pro-Consumer-Groups-Virtual-Partitions` |
| `Parallel-Segments.md` | `Pro-Parallel-Segments` | `Pro-Consumer-Groups-Parallel-Segments` |
| `Delayed-Topics.md` | `Pro-Delayed-Topics` | `Pro-Consumer-Groups-Delayed-Topics` |
| `Long-Running-Jobs.md` | `Pro-Long-Running-Jobs` | `Pro-Consumer-Groups-Long-Running-Jobs` |
| `Non-Blocking-Jobs.md` | `Pro-Non-Blocking-Jobs` | `Pro-Consumer-Groups-Non-Blocking-Jobs` |
| `Adaptive-Iterator.md` | `Pro-Adaptive-Iterator` | `Pro-Consumer-Groups-Adaptive-Iterator` |
| `Iterator-API.md` | `Pro-Iterator-API` | `Pro-Consumer-Groups-Iterator-API` |
| `Scheduling-API.md` | `Pro-Scheduling-API` | `Pro-Consumer-Groups-Scheduling-API` |
| `Granular-Backoffs.md` | `Pro-Granular-Backoffs` | `Pro-Consumer-Groups-Granular-Backoffs` |
| `Direct-Assignments.md` | `Pro-Direct-Assignments` | `Pro-Consumer-Groups-Direct-Assignments` |
| `Multiplexing.md` | `Pro-Multiplexing` | `Pro-Consumer-Groups-Multiplexing` |
| `Enhanced-Dead-Letter-Queue.md` | `Pro-Enhanced-Dead-Letter-Queue` | `Pro-Consumer-Groups-Enhanced-Dead-Letter-Queue` |
| `Enhanced-Active-Job.md` | `Pro-Enhanced-Active-Job` | `Pro-Consumer-Groups-Enhanced-Active-Job` |
| `Enhanced-Reliability.md` | `Pro-Enhanced-Reliability` | `Pro-Consumer-Groups-Enhanced-Reliability` |
| `Enhanced-Inline-Insights.md` | `Pro-Enhanced-Inline-Insights` | `Pro-Consumer-Groups-Enhanced-Inline-Insights` |

### Pro/ features that stay at Pro/ root (11 shared files)

These appear in both CG and SG nav sections. No move needed:
- `Periodic-Jobs.md`, `Expiring-Messages.md`, `Routing-Patterns.md`, `Rate-Limiting.md`
- `Filtering-API.md`, `Cleaner-API.md`, `Piping.md`, `Recurring-Tasks.md`
- `Scheduled-Messages.md`, `Messages-At-Rest-Encryption.md`, `Enhanced-Swarm-Multi-Process.md`

### New files to create (5)

| File | Content |
|------|---------|
| `Share-Groups/Coming-Soon.md` | Holding page (all SG nav entries point here) |
| `Pro/Share-Groups/Coming-Soon.md` | Holding page (all SG Pro feature nav entries point here) |
| `Basics/Consumer-Groups-vs-Share-Groups.md` | Real content: CG vs SG decision guide |
| `Kafka/Share-Groups-KIP-932.md` | Real content: Kafka-level SG concepts |
| `Upgrades/Karafka/3.0.md` | Placeholder |

---

## Incremental Migration Plan

### Link Update Pattern (every step)

1. `git mv` the file
2. Global find-and-replace in ALL `.md` files (excluding `.git/`, `node_modules/`, `.lint/`, `.gh/`, `REORG.md`):
   - `(OldLink)` → `(NewLink)`
   - `(OldLink#` → `(NewLink#`
   - `karafka.io/docs/OldLink` → `karafka.io/docs/NewLink`
   - `karafka/wiki/OldLink` → `karafka/wiki/NewLink`
3. Verify: grep for old link returns zero results
4. Run `./bin/mklint`
5. Commit

---

### Phase 0: Preparation

**Step 0.1** — Create directories: `Basics/`, `Consumer-Groups/`, `Share-Groups/`, `Infrastructure/`, `Infrastructure/Admin/`, `Pro/Consumer-Groups/`, `Pro/Share-Groups/`

**Step 0.2** — Update `bin/align_structure`: Add `Getting-Started`, `Consumer-Groups`, `Infrastructure`, `Share-Groups` to prefixed namespace list.

**Step 0.3** — Update `bin/sync_gh`: Add same namespaces to prefixed list.

---

### Phase 1: Admin/ → Infrastructure/Admin/ (4 files)

| Step | File(s) | Old link → New link |
|------|---------|---------------------|
| 1.1 | `Admin/Acls-API.md` | `Admin-Acls-API` → `Infrastructure-Admin-Acls-API` |
| 1.2 | `Admin/Configs-API.md`, `Admin/Replication-API.md` | `Admin-Configs-API` → `Infrastructure-Admin-Configs-API`, `Admin-Replication-API` → `Infrastructure-Admin-Replication-API` |
| 1.3 | `Admin/API.md` (~34 refs) | `Admin-API` → `Infrastructure-Admin-API` |
| 1.4 | Remove empty `Admin/`, clean up scripts |

---

### Phase 2: Operations/ → Consumer-Groups/ (2 files)

| Step | File(s) | Old link → New link |
|------|---------|---------------------|
| 2.1 | `Operations/Persistent-Pausing.md` (~15 refs) | `Operations-Persistent-Pausing` → `Consumer-Groups-Persistent-Pausing` |
| 2.2 | `Operations/Error-Handling-and-Back-Off-Policy.md` (~46 refs) | `Operations-Error-Handling-and-Back-Off-Policy` → `Consumer-Groups-Error-Handling-and-Back-Off-Policy` |

---

### Phase 3: Operations/ → Infrastructure/ (6 files + 1 rename)

| Step | File(s) | Old link → New link |
|------|---------|---------------------|
| 3.1 | `Operations/Instrumentation-Events.md` | `Operations-Instrumentation-Events` → `Infrastructure-Instrumentation-Events`. Update `.markdownlint-cli2.jsonc` |
| 3.2 | `Operations/Signals-and-States.md` | `Operations-Signals-and-States` → `Infrastructure-Signals-and-States` |
| 3.3 | `Operations/AWS-MSK-Guide.md` | `Operations-AWS-MSK-Guide` → `Infrastructure-AWS-MSK-Guide` |
| 3.4 | `Operations/Development-vs-Production.md` → **renamed** `Infrastructure/Application-Development-vs-Production.md`. Update H1. | `Operations-Development-vs-Production` → `Infrastructure-Application-Development-vs-Production` |
| 3.5 | `Operations/Monitoring-and-Logging.md` (~45 refs) | `Operations-Monitoring-and-Logging` → `Infrastructure-Monitoring-and-Logging` |
| 3.6 | `Operations/Deployment.md` (~53 refs) | `Operations-Deployment` → `Infrastructure-Deployment` |
| 3.7 | Remove empty `Operations/`, clean up scripts |

---

### Phase 4: Advanced/ → Consumer-Groups/ (9 files)

| Step | File(s) | Old link → New link | Refs |
|------|---------|---------------------|------|
| 4.1 | `Assignments-Tracking.md` | → `Consumer-Groups-Assignments-Tracking` | ~3 |
| 4.2 | `Inline-Insights.md` | → `Consumer-Groups-Inline-Insights` | ~9 |
| 4.3 | `Active-Job.md` | → `Consumer-Groups-Active-Job` | ~13 |
| 4.4 | `Offset-management.md`, `Pausing-Seeking-and-Rate-Limiting.md` | → `Consumer-Groups-` prefix | ~18 ea |
| 4.5 | `Deserialization.md` | → `Consumer-Groups-Deserialization` | ~21 |
| 4.6 | `Routing.md` | → `Consumer-Groups-Routing` | ~30 |
| 4.7 | `Concurrency-and-Multithreading.md` | → `Consumer-Groups-Concurrency-and-Multithreading` | ~34 |
| 4.8 | `Dead-Letter-Queue.md` | → `Consumer-Groups-Dead-Letter-Queue` | ~46 |

---

### Phase 5: Advanced/ → Infrastructure/ + WaterDrop/ (22 files)

| Step | File(s) | Old link → New link | Refs |
|------|---------|---------------------|------|
| 5.1 | ~~`Articles-and-other-references.md`~~ (moved to Basics/), `Auto-reload-of-code-changes-in-development.md` | → `Infrastructure-` prefix | ✅/~3 |
| 5.2 | `Versions-Lifecycle-and-EOL.md`, `Topic-Auto-Creation.md` | → `Infrastructure-` prefix | ~6 ea |
| 5.3 | `Debugging.md`, `Exit-codes.md` | → `Infrastructure-` prefix | ~6 ea |
| 5.4 | `Active-Record-Connections-Management.md` | → `Infrastructure-` prefix | ~9 |
| 5.5 | `Integrating-with-Ruby-on-Rails-and-other-frameworks.md`, `Problems-and-Troubleshooting.md` | → `Infrastructure-` prefix | ~9 ea |
| 5.6 | `Broker-Failures-and-Fault-Tolerance.md`, `Forking.md` | → `Infrastructure-` prefix | ~11 ea |
| 5.7 | `Latency-and-Throughput.md` | → `Infrastructure-` prefix | ~13 |
| 5.8 | `Env-Variables.md`, `SBOM.md` | → `Infrastructure-` prefix | ~15-16 |
| 5.9 | `CLI.md` | → `Infrastructure-CLI` | ~16 |
| 5.10 | `Upgrading.md`, `Embedding.md` | → `Infrastructure-` prefix | ~18 ea |
| 5.11 | `Resources-Management.md` | → `Infrastructure-` prefix | ~21 |
| 5.12 | `Multi-Cluster-Setup.md` | → `Infrastructure-` prefix | ~25 |
| 5.13 | `Swarm-Multi-Process.md` | → `Infrastructure-Swarm-Multi-Process` | ~27 |
| 5.14 | `Declarative-Topics.md` | → `Infrastructure-Declarative-Topics` | ~51 |
| 5.15 | ~~`Shared-Kafka-Cluster-for-Multiple-Applications.md`~~ | ~~removed (TBA stub)~~ | ✅ DONE (wiki#485) |
| 5.16 | ~~`WaterDrop-reconfiguration.md` → **renamed** `WaterDrop/Reconfiguration.md`~~ | ~~`WaterDrop-reconfiguration` → `WaterDrop-Reconfiguration`~~ | ✅ DONE (wiki#483, website#100) |
| 5.17 | Remove empty `Advanced/`, clean up scripts |

---

### Phase 6: Root → Basics/ (11 files)

| Step | File(s) | Old link → New link | Refs |
|------|---------|---------------------|------|
| 6.1 | ~~`Home.md`~~ | stays at root (MkDocs requirement) | N/A |
| 6.2 | ~~`Components.md`~~, ~~`Code-Editors-and-LLM-Setup.md`~~ | ~~→ `Basics-` prefix~~ | ✅ DONE (wiki#488, website#103) |
| 6.3 | ~~`Why-Kafka-and-Karafka.md`~~ | ~~→ `Basics-` prefix~~ | ✅ DONE (wiki#489, website#104) |
| 6.4 | ~~`Support.md`~~, ~~`FAQ.md`~~ | ~~→ `Basics-` prefix~~ | ✅ DONE (wiki#490, website#105) |
| 6.5 | `Testing.md` | → `Basics-Testing` | ~21 |
| 6.6 | `Consuming-Messages.md`, `Producing-Messages.md` | → `Basics-` prefix | ~21+33 |
| 6.7 | `Configuration.md` | → `Basics-Configuration` | ~24 |
| 6.8 | `Getting-Started.md` | `Getting-Started` → `Basics-Getting-Started` | ~25 |

---

### Phase 7: Root → Pro/ (2 files)

| Step | File(s) | Old link → New link |
|------|---------|---------------------|
| 7.1 | ~~`Build-vs-Buy.md`~~ | ~~`Build-vs-Buy` → `Pro-Build-vs-Buy`~~ | ✅ DONE (wiki#484, website#101) |
| 7.2 | ~~`Purchase-Karafka-Pro.md`~~ | ~~`Purchase-Karafka-Pro` → `Pro-Purchase-Karafka-Pro`~~ | ✅ DONE (wiki#484, website#101) |

---

### Phase 8: Pro/ internal → Pro/Consumer-Groups/ (17 files)

| Step | File(s) | Old link → New link | Refs |
|------|---------|---------------------|------|
| 8.1 | `Offset-Metadata-Storage.md`, `Scheduling-API.md` | → `Pro-Consumer-Groups-` prefix | low |
| 8.2 | `Iterator-API.md`, `Granular-Backoffs.md` | → `Pro-Consumer-Groups-` prefix | low |
| 8.3 | `Direct-Assignments.md`, `Adaptive-Iterator.md` | → `Pro-Consumer-Groups-` prefix | low-med |
| 8.4 | `Non-Blocking-Jobs.md`, `Delayed-Topics.md` | → `Pro-Consumer-Groups-` prefix | med |
| 8.5 | `Long-Running-Jobs.md`, `Parallel-Segments.md` | → `Pro-Consumer-Groups-` prefix | med |
| 8.6 | `Enhanced-Reliability.md`, `Enhanced-Inline-Insights.md` | → `Pro-Consumer-Groups-` prefix | med |
| 8.7 | `Enhanced-Active-Job.md`, `Enhanced-Dead-Letter-Queue.md` | → `Pro-Consumer-Groups-` prefix | med |
| 8.8 | `Multiplexing.md`, `Transactions.md` | → `Pro-Consumer-Groups-` prefix | high |
| 8.9 | `Virtual-Partitions.md` | → `Pro-Consumer-Groups-Virtual-Partitions` | high |

---

### Phase 9: Create New Files (5 files)

| Step | File | Content |
|------|------|---------|
| 9.1 | `Share-Groups/Coming-Soon.md` | Holding page |
| 9.2 | `Pro/Share-Groups/Coming-Soon.md` | Holding page for Pro SG features |
| 9.3 | `Basics/Consumer-Groups-vs-Share-Groups.md` | Real content |
| 9.4 | `Kafka/Share-Groups-KIP-932.md` | Real content |
| 9.5 | `Upgrades/Karafka/3.0.md` | Placeholder |

---

### Phase 10: Finalization

**Step 10.1** — Restructure `Basics/Home.md` nav to match new structure.

**Step 10.2** — Add "This feature is available for both Consumer Groups and Share Groups" to 11 shared Pro pages.

**Step 10.3** — Update H1 headings:
- `Infrastructure/Application-Development-vs-Production.md` → "Application Development vs Production"
- `Basics/Configuration.md` → "Karafka Configuration"
- `WaterDrop/Reconfiguration.md` → "WaterDrop Reconfiguration"

**Step 10.4** — Update `LLMs.md` and `CLAUDE.md` if they reference old paths.

**Step 10.5** — Final orphan check.

**Step 10.6** — Final broken link check: `./bin/mklint` + grep for stale patterns.

**Step 10.7** — Run `./bin/sync_gh`.

---

## Summary

| Phase | What | Files |
|-------|------|-------|
| 0 | Preparation (dirs + scripts) | 0 |
| 1 | Admin/ → Infrastructure/Admin/ | 4 |
| 2 | Operations/ → Consumer-Groups/ | 2 |
| 3 | Operations/ → Infrastructure/ | 6 (+1 rename) |
| 4 | Advanced/ → Consumer-Groups/ | 9 |
| 5 | Advanced/ → Infrastructure/ + WaterDrop/ | 22 |
| 6 | Root → Basics/ | 11 |
| 7 | Root → Pro/ | 2 |
| 8 | Pro/ → Pro/Consumer-Groups/ | 17 |
| 9 | Create new files | 5 new |
| 10 | Finalization | nav + cleanup |
| **Total** | | **73 moved + 5 new** |
