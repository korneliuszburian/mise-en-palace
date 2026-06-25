# Migration And Backup Policy Report

Status: G-01 completion report.

Date: 2026-06-25

## Executive Verdict

G-01 is complete for local/internal-alpha operation. KRN now has an accepted
brain-store migration, backup, restore, and rollback policy grounded in
PostgreSQL logical backups, scratch restore verification, Drizzle readiness, and
DB smoke.

This is not production disaster recovery. It does not prove hosted backup
retention, encryption, point-in-time recovery, restore time objectives, or
multi-environment operations.

## Scope

Changed:

- `docs/decisions/ADR-0026-brain-store-migration-backup-policy.md`;
- `docs/runbooks/local-brain-store.md`;
- `docs/reviews/controlled-dogfood/2026-06-25-migration-backup-policy/REPORT.md`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- package source;
- DB schema;
- Drizzle migrations;
- Docker compose service definition;
- Memory Core;
- activation scoring;
- dashboard/API/MCP surfaces;
- worker runtime.

## Decision

```txt
adopt_now:
  PostgreSQL custom-format logical backup via pg_dump -Fc.

adopt_now:
  scratch-database restore verification via pg_restore.

adopt_now:
  readiness and replay verification via pnpm db:ready and pnpm db:smoke.

defer:
  hosted production backup automation, retention, encryption, PITR, restore SLOs.
```

## KRN Plan Summary

Persisted planning run:

```txt
executionRun: 153fce39-97ba-4dcf-95e8-af80b2b61f7f
taskContract: 55c9c351-c2d9-4a12-94ea-104fd9ccc904
harnessPlan: ea5f1c54-173a-4b54-a048-df788973aeeb
contextAssembly: 437ae83e-b173-478c-8aa9-a956058db40a
```

Activation selected useful broad guardrails around source decisions, weak
evidence, AGENTS guidance, and Memory Core write authority. It did not select
the direct owner files `docs/runbooks/local-brain-store.md`, ADR-0010, or DB
migration readiness source. Source inspection filled that gap.

## Backup / Restore Smoke

Smoke target:

```txt
source database: krn
scratch database: krn_restore_smoke
backup path: .local-lab/db-backups/krn-g01-2026-06-25.dump
backup size: 399K
```

Smoke sequence:

```sh
mkdir -p .local-lab/db-backups
docker compose exec -T krn-postgres pg_dump -U krn -d krn -Fc > .local-lab/db-backups/krn-g01-2026-06-25.dump
docker compose exec -T krn-postgres dropdb -U krn --if-exists krn_restore_smoke
docker compose exec -T krn-postgres createdb -U krn krn_restore_smoke
docker compose exec -T krn-postgres pg_restore -U krn -d krn_restore_smoke --clean --if-exists < .local-lab/db-backups/krn-g01-2026-06-25.dump
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn_restore_smoke pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn_restore_smoke pnpm db:smoke
docker compose exec -T krn-postgres psql -U krn -d krn_restore_smoke -Atc "select count(*) from drizzle.__drizzle_migrations;"
docker compose exec -T krn-postgres dropdb -U krn --if-exists krn_restore_smoke
```

Result:

```txt
pg_dump custom-format backup: passed
scratch DB create: passed
pg_restore into scratch DB: passed
pnpm db:ready against scratch DB: passed
migrations expected/applied: 14/14
pgvector: available
pnpm db:smoke against scratch DB: passed
migration count readback: 14
scratch DB cleanup: passed
post-cleanup exists check: false
```

## Command Evidence

Persisted IDs:

```txt
executionRun: 153fce39-97ba-4dcf-95e8-af80b2b61f7f
taskContract: 55c9c351-c2d9-4a12-94ea-104fd9ccc904
harnessPlan: ea5f1c54-173a-4b54-a048-df788973aeeb
contextAssembly: 437ae83e-b173-478c-8aa9-a956058db40a
evidenceBundle: 6941f7a7-94f2-41fc-98cd-60eeee8ca926
reviewAssessment: 22ee05d6-45a5-4cb1-b450-c7caebe03beb
feedbackDelta: 929ba53b-5ba2-44ad-a44d-743b4eccc9ec
observationGroup: 32638e89-9e3a-4847-b4ba-2acdeba346b6
reflectionRecord: 1bf72051-b9dc-4990-8d8a-c911305a1946
Memory mutation: none
MemoryRecord created: no
```

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `docker compose ps krn-postgres` | passed | Local Postgres/pgvector service is running and healthy. | Does not prove hosted production DB health. |
| `pg_dump -Fc` | passed | A custom-format logical dump can be created from the local `krn` DB. | Does not prove restore or retention. |
| `pg_restore` into `krn_restore_smoke` | passed | The dump can be replayed into a scratch DB. | Does not prove point-in-time recovery. |
| `pnpm db:ready` against scratch DB | passed | Restored DB is reachable, has 14/14 migrations applied, and pgvector available. | Does not prove app-level correctness beyond readiness. |
| `pnpm db:smoke` against scratch DB | passed | Minimal repository insert/read/cleanup path works on restored DB. | Does not prove every repository path. |
| `select count(*) from drizzle.__drizzle_migrations` | passed, `14` | Restored migration table contains expected migration count. | Does not prove every table row was semantically valid. |
| scratch DB cleanup check | passed, `false` | Scratch DB was removed after smoke. | Does not prove active DB was untouched beyond command scope. |
| `pnpm --filter @krn/db db:check` | passed | Drizzle generated migrations are consistent with current schema. | Does not prove runtime DB readiness. |
| `pnpm db:ready` against active DB | passed | Active local DB is reachable with 14/14 migrations and pgvector available. | Does not prove hosted production DB readiness. |
| `pnpm typecheck` | passed | Current TypeScript workspace compiles. | Does not prove backup policy correctness. |
| `pnpm test` | passed | Current test suite passes. | Does not prove production DR readiness. |
| `git diff --check` | passed | Current diff has no whitespace errors. | Does not prove semantic correctness. |
| `krn evidence capture --run-id 153fce39... --persist` | passed | G-01 evidence, review assessment, feedback delta, command provenance, and changed-file classification were persisted. | Does not prove production release readiness. |
| `krn observe --run 153fce39... --persist` | passed | G-01 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --scope run:153fce39... --persist` | passed | G-01 reflection selected 5 observations without MemoryRecord creation or candidate row writes. | Does not prove reflection quality at scale. |

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN helped keep G-01 within the existing Postgres/Drizzle boundary and avoid
  turning backup policy into a new service, dashboard, or markdown memory
  surface.

What this run proves:
- The local brain store can be logically backed up.
- The backup can be restored into a scratch database.
- The restored database passes current readiness and persistence smoke.
- The local runbook now names the migration/rollback evidence required before
  risky DB work.

What this run does not prove:
- production disaster recovery;
- encryption or retention policy;
- hosted Postgres permissions;
- restore time objective;
- point-in-time recovery;
- internal-alpha user ergonomics.

DB used in current shell:
- yes.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| Memory Core write authority memory | memory | yes | helped | Kept backup/restore policy from mutating Memory Core or adding write surfaces. |
| Weak evidence source claim | source | yes | helped | Kept command proof boundaries explicit. |
| AGENTS guidance source claim | source | yes | helped | Reinforced compact durable guidance rather than bloated AGENTS edits. |
| Direct owner files | source inspection | yes | helped | `docs/runbooks/local-brain-store.md`, ADR-0010, compose config, and migration readiness code owned the actual policy. |
| KRN activation owner-file recall | activation | no | weak | Plan did not surface direct DB/runbook owner files; manual source inspection filled the gap. |

### Evidence And Review Burden

| Evidence item | Strength | What it proves | Review burden impact |
| --- | --- | --- | --- |
| Scratch restore smoke | strong for local replay | Backup can restore into a fresh local DB and pass readiness/smoke. | Reduces migration-risk uncertainty. |
| ADR-0026 | medium | Backup/restore boundary is explicit and falsifiable. | Reduces future policy drift. |
| Local runbook update | medium | Operator steps are documented in one existing runbook. | Reduces rereads before migration work. |

### Candidate Quality

No candidate was promoted.

Potential candidate:

```txt
MemoryCandidate:
  Before risky DB migrations, create a pg_dump custom-format backup and prove
  it by restoring into a scratch DB that passes db:ready and db:smoke.
evidence:
  ADR-0026 and G-01 restore smoke.
doesNotProve:
  Does not prove hosted production DR/PITR.
reviewability:
  ready
decision:
  defer until reused by a future migration slice.
```

## Product Readiness Signal

Verdict:

```txt
local/internal-alpha DB rollback foundation exists; production DR remains open.
```

## Next Recommended Action

Continue to:

```txt
G-02 — Packaging And Versioning
```

G-02 should not claim internal-alpha distribution until it can point back to
G-00 CI and G-01 backup/restore policy.
