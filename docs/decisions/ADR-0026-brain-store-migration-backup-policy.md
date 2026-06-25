# ADR-0026: Brain Store Migration And Backup Policy

Status: accepted.

## Decision

Adopt PostgreSQL logical backups with `pg_dump -Fc`, scratch-database restore
verification with `pg_restore`, and existing Drizzle readiness/smoke commands
as the first KRN brain-store migration, backup, restore, and replay policy.

This policy is for local and internal-alpha operation. It does not claim a
production hosting, retention, encryption, or disaster-recovery program.

## Source To Decision

```yaml
source_id: adr-0010-postgres-brain-store
title: ADR-0010 PostgreSQL Pgvector Brain Store
trust_tier: high
mechanism: PostgreSQL plus pgvector is the canonical KRN brain store and
  Drizzle owns schema/migrations.
krn_implication: Backup and restore should use PostgreSQL-native logical backup
  first, then prove replay with current Drizzle readiness and DB smoke.
decision: adopt pg_dump custom-format backup plus scratch restore verification.
does_not_prove: hosted production backup, point-in-time recovery, encryption,
  or retention are solved.
consumer: local brain-store runbook, G-01 report, internal-alpha release gate.
falsifier: a logical dump cannot restore the current KRN schema/data into a
  scratch Postgres/pgvector database that passes readiness and smoke.
```

```yaml
source_id: local-brain-store-runbook
title: docs/runbooks/local-brain-store.md
trust_tier: high
mechanism: Local KRN uses one compose Postgres service with pgvector and
  existing commands for migration readiness and persistence smoke.
krn_implication: The first backup policy can stay inside the existing local DB
  boundary without adding another service, scheduler, dashboard, API, or memory
  export surface.
decision: extend the local runbook with backup, restore, migration, and rollback
  policy.
does_not_prove: multi-environment deployment policy exists.
consumer: G-01 operators.
falsifier: operators cannot run the documented backup/restore smoke from a
  clean current shell.
```

```yaml
source_id: g-01-smoke
title: G-01 local backup/restore smoke
trust_tier: high
mechanism: A custom-format dump restored into scratch database
  `krn_restore_smoke`, passed `pnpm db:ready`, passed `pnpm db:smoke`, reported
  14 applied migrations, then the scratch database was dropped.
krn_implication: The documented policy is executable in the current local
  environment and is not only prose.
decision: accept the policy for local/internal-alpha operation.
does_not_prove: production restore time, hosted DB permissions, encrypted
  offsite storage, or PITR readiness.
consumer: G-01 completion report and internal-alpha release gate.
falsifier: future restore smoke fails against the current migration set.
```

## Accepted Boundary

- Canonical store remains PostgreSQL plus pgvector.
- Drizzle migrations remain the schema authority.
- `pnpm db:ready` remains the migration application/readiness command.
- `pnpm --filter @krn/db db:check` remains the generated migration consistency
  check.
- `pnpm db:smoke` remains the minimal persistence replay smoke.
- Backups use PostgreSQL custom-format logical dumps:

```sh
docker compose exec -T krn-postgres pg_dump -U krn -d krn -Fc > .local-lab/db-backups/krn-<timestamp>.dump
```

- Restore verification must target a scratch database first, not the active
  `krn` database.

## Rejected Or Deferred

| Option | Decision | Reason |
| --- | --- | --- |
| File-backed runtime memory backup | rejected | Runtime memory is store-backed; markdown/files may be export only. |
| New backup service or scheduler | deferred | G-01 needs local/internal-alpha policy, not production operations automation. |
| Dashboard or API for backups | rejected now | No read/write product surface is needed to prove backup/restore. |
| Separate vector/graph/search store backup policy | rejected now | ADR-0010 keeps the first spine in Postgres/pgvector. |
| Restoring over the active local database during smoke | rejected | Scratch restore proves replay without risking current operator data. |
| Claiming production DR/PITR | rejected now | No hosted environment, retention policy, encryption policy, or PITR test exists. |

## Migration Policy

Before applying a migration to a brain store that contains useful state:

1. Run `pnpm --filter @krn/db db:check`.
2. Run `pnpm db:ready` against the current database.
3. Create a timestamped logical backup.
4. Restore the backup into a scratch database.
5. Run `pnpm db:ready` against the scratch database.
6. Run `pnpm db:smoke` against the scratch database.
7. Apply or generate migrations only after the backup/restore smoke passes.

Destructive migrations require a specific ADR or report section naming:

- data affected;
- export/backup path;
- restore path;
- rollback path;
- what command evidence proves;
- what command evidence does not prove.

## Rollback

Rollback for local/internal-alpha operation is:

1. stop writers/operators;
2. create a final emergency dump if the DB is reachable;
3. create or recreate a target database;
4. restore the last known-good custom-format dump;
5. run `pnpm db:ready`;
6. run `pnpm db:smoke`;
7. record the restored dump path, migration count, smoke result, and residual
   data-loss window.

Rollback does not mean automatic migration down scripts. Drizzle migration
history plus restore-from-backup is the accepted first rollback path.

## Verification

G-01 verified the policy in the current shell with:

```txt
pg_dump -Fc from local krn database: passed
restore into krn_restore_smoke: passed
pnpm db:ready against scratch DB: passed, 14/14 migrations, pgvector available
pnpm db:smoke against scratch DB: passed
drizzle migration count readback: 14
scratch DB cleanup: passed
```

## Falsifier

Revisit this ADR if any of these become true:

- logical dump/restore cannot round-trip KRN state;
- restore smoke cannot pass with pgvector;
- migration count/readiness no longer proves enough for internal-alpha;
- hosted/internal-alpha deployment requires PITR, encryption, offsite retention,
  or automated restore drills;
- DB write concurrency requires a stricter maintenance-window protocol.
