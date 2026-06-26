# Local Brain Store

This runbook starts the local KRN brain store with Postgres and pgvector.

Boundary:

- local development only;
- one Postgres service with pgvector;
- no Redis, Kafka, Qdrant, LanceDB, Neo4j, Elastic, dashboard, API, MCP, or
  runtime markdown memory.

## Configuration

Use the checked-in example value:

```sh
export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn
```

Or create a local `.env` from `.env.example`. Keep `.env` uncommitted.

## Start Postgres

```sh
docker compose up -d krn-postgres
docker compose ps krn-postgres
```

The service uses `pgvector/pgvector:pg16`, database `krn`, user `krn`, and host
port `54329`.

## Validate Generated Migrations

```sh
pnpm --filter @krn/db db:check
```

This confirms generated Drizzle migration files are consistent with the current
schema. It does not prove the migrations were applied to a live DB.

## Apply and Verify Migrations

With `KRN_DATABASE_URL` exported:

```sh
pnpm db:ready
```

This command fails clearly without `KRN_DATABASE_URL`, checks DB reachability,
applies Drizzle migrations, verifies the applied migration count, checks
pgvector, and reports brain-store readiness.

Read the `DB mode` line first:

| DB mode | Meaning | Next action |
| --- | --- | --- |
| `preview/no-DB` | `KRN_DATABASE_URL` is missing. DB-backed truth is unavailable. | Export `KRN_DATABASE_URL`, start `krn-postgres`, then run `pnpm db:ready`. |
| `configured but unreachable` | `KRN_DATABASE_URL` is set, but local Postgres is not reachable. | Run `docker compose up -d krn-postgres`, `docker compose ps krn-postgres`, then `pnpm db:ready`. |
| `connected but not ready` | Postgres is reachable, but migrations or pgvector are not ready. | Run `pnpm db:ready`, then `pnpm db:smoke`; inspect migration/pgvector output if it still fails. |
| `ready` | Postgres is reachable, migrations are applied, and pgvector is available. | Run `pnpm db:smoke` for persistence proof. |

Starting Docker/Postgres alone does not prove DB readiness. Claim DB-backed
truth only after `pnpm db:ready` and relevant smoke commands pass in the current
shell.

## Run Persistence Smoke

With `KRN_DATABASE_URL` exported:

```sh
pnpm db:smoke
```

This command ensures migration readiness, inserts a smoke workspace/project
through the Drizzle project repository, reads the project back, and deletes the
smoke workspace so cascade cleanup removes the smoke project.

## Backup Policy

Before any destructive migration, risky schema change, or internal-alpha
handoff, create a PostgreSQL custom-format logical backup.

Create a local backup directory:

```sh
mkdir -p .local-lab/db-backups
```

Create a timestamped backup:

```sh
docker compose exec -T krn-postgres pg_dump -U krn -d krn -Fc > .local-lab/db-backups/krn-$(date -u +%Y%m%dT%H%M%SZ).dump
```

Backup files under `.local-lab/` are local operator artifacts and must not be
committed.

This proves only that a logical dump was created from the local database. It
does not prove restore, production retention, encryption, hosted DB snapshots,
or point-in-time recovery.

## Restore Smoke

Verify backups by restoring into a scratch database first. Do not restore over
the active `krn` database as a smoke test.

Use a chosen backup path:

```sh
BACKUP=.local-lab/db-backups/krn-YYYYMMDDTHHMMSSZ.dump
```

Create and restore a scratch database:

```sh
docker compose exec -T krn-postgres dropdb -U krn --if-exists krn_restore_smoke
docker compose exec -T krn-postgres createdb -U krn krn_restore_smoke
docker compose exec -T krn-postgres pg_restore -U krn -d krn_restore_smoke --clean --if-exists < "$BACKUP"
```

Verify the restored database:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn_restore_smoke pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn_restore_smoke pnpm db:smoke
docker compose exec -T krn-postgres psql -U krn -d krn_restore_smoke -Atc "select count(*) from drizzle.__drizzle_migrations;"
```

Clean up the scratch database:

```sh
docker compose exec -T krn-postgres dropdb -U krn --if-exists krn_restore_smoke
```

The restore smoke proves that the backup can be replayed into a fresh local
Postgres/pgvector database that passes current migration readiness and minimal
persistence smoke. It does not prove hosted production restore, operator access
controls, encrypted retention, or point-in-time recovery.

## Migration And Rollback Policy

Before applying migrations to any brain store that contains useful state:

1. Run `pnpm --filter @krn/db db:check`.
2. Run `pnpm db:ready` against the active database.
3. Create a timestamped backup.
4. Restore that backup into `krn_restore_smoke`.
5. Run `pnpm db:ready` and `pnpm db:smoke` against the scratch database.
6. Record the backup path, migration count, pgvector status, smoke result, and
   cleanup status in the slice report.

For destructive migrations, also record:

- affected tables or columns;
- whether data is exported, retained, or intentionally dropped;
- rollback path;
- what the command evidence proves;
- what the command evidence does not prove.

Rollback for local/internal-alpha operation is restore-from-backup:

1. stop writers/operators;
2. create an emergency dump if the current DB is reachable;
3. create or recreate the target database;
4. restore the last known-good dump;
5. run `pnpm db:ready`;
6. run `pnpm db:smoke`;
7. record the restored dump path and residual data-loss window.

Drizzle migration history plus restore-from-backup is the accepted first
rollback path. This runbook does not define automatic down migrations or hosted
production disaster recovery.

## Current Proof Boundary

After G-01, this runbook proves local DB configuration, migration
application/verification, pgvector availability, a minimal runtime persistence
insert/read/cleanup path, and a scratch restore smoke for a local logical
backup.
