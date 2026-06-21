# DB Runtime Inventory

Date: 2026-06-21

Scope: M20 Slice 01. This inventory used the `brain-store-schema` and
`target-infra-adr` repo-local skills because it touches DB schema, migrations,
runtime persistence, and local storage boundaries.

## Package and Script Surface

- Root `package.json` exposes `db:check`, `db:generate`, `typecheck`, and
  `test`.
- Root `db:check` delegates to `pnpm --filter @krn/db db:check`.
- Root `db:generate` delegates to `pnpm --filter @krn/db db:generate`.
- `@krn/db` exposes Drizzle-only scripts: `db:check` and `db:generate`.
- There is no current `db:migrate`, migration readiness, or persistence smoke
  script.
- `@krn/cli` depends on `@krn/db` and `postgres`, and exposes `krn` through
  `tsx src/index.ts`.

## Runtime Configuration

- `KRN_DATABASE_URL` is the active canonical runtime variable.
- `krn plan` uses no-store preview repositories when `KRN_DATABASE_URL` is
  absent.
- `krn plan` uses `createDatabaseRuntime()` when `KRN_DATABASE_URL` is present.
- `krn doctor` reads only `KRN_DATABASE_URL` for DB readiness.
- `krn evidence capture` treats persistence as disabled when
  `KRN_DATABASE_URL` is absent.
- No `.env.example` file exists.
- No Docker Compose file for local Postgres/pgvector exists.

## Drizzle and Schema

- Drizzle config lives at `packages/db/drizzle.config.ts`.
- Drizzle dialect is `postgresql`.
- Drizzle schema entrypoint is `packages/db/src/schema/index.ts`.
- Migration output directory is `packages/db/src/migrations`.
- Config is strict and verbose.
- `packages/db/src/database.ts` creates a typed Drizzle database from a
  `postgres` client and exports `KrnDatabase`.

## Migration Inventory

- `0000_optimal_wrecker.sql`: harness, run/event, outbox, worker-job, project,
  task, evidence, and review tables/enums.
- `0001_superb_jetstream.sql`: memory, anti-memory, source artifact, source
  claim, source decision, and related lineage tables/enums.
- `0002_shocking_post.sql`: retrieval, activation, context item/exclusion,
  embedding, search document, and pgvector-related tables/enums.
- `_journal.json` records exactly three migration entries with indexes 0, 1,
  and 2.

## pgvector Representation

- `packages/db/src/sql/pgvector.ts` defines
  `CREATE EXTENSION IF NOT EXISTS vector;`.
- `packages/db/src/schema/retrieval.ts` defines an `embedding` column with
  `vector(1536)`.
- `packages/db/src/schema/retrieval.ts` defines an HNSW index using
  `vector_cosine_ops`.
- `0002_shocking_post.sql` starts with `CREATE EXTENSION IF NOT EXISTS vector`.
- `0002_shocking_post.sql` creates `embedding vector(1536)` and the HNSW
  `vector_cosine_ops` index.

## Current Doctor Behavior

- Without `KRN_DATABASE_URL`, doctor reports:
  - Postgres config not configured.
  - pgvector skipped.
  - migrations skipped.
  - brain-store readiness as preview only.
- With `KRN_DATABASE_URL`, doctor:
  - opens a `postgres` client;
  - runs `select 1`;
  - checks `pg_extension` for `vector`;
  - checks whether information schema contains `__drizzle_migrations`;
  - reports ready only when pgvector is available and the migration table is
    present.
- Doctor does not yet verify migration count, migration tags, or applied
  migration order against `packages/db/src/migrations/meta/_journal.json`.

## Existing Tests

- CLI tests cover the no-store `krn plan` path.
- CLI tests cover `krn doctor` without DB config.
- CLI tests cover printed evidence capture without memory mutation.
- Harness and schema tests cover pure domain/compiler/schema behavior.
- No integration test or smoke command currently connects to a real local DB.

## Unproven Runtime Areas

- Local DB configuration is not documented in a checked-in env example.
- Local pgvector Postgres is not defined by repo-local Compose config.
- Migrations are generated but not applied or verified against a local DB.
- pgvector is represented in schema/migrations but not proven available in a
  local DB.
- Runtime persistence through Drizzle repositories is implemented but not proven
  by an insert/read/cleanup smoke path.
- Doctor can detect coarse readiness, but migration readiness is weaker than
  M20 requires because it only checks for the migration table.

## Next Slice Implication

Slice 02 should add the smallest local setup path for `KRN_DATABASE_URL` and
Postgres with pgvector, without adding dashboard, API, MCP, Redis/Kafka,
separate vector stores, or runtime markdown memory.
