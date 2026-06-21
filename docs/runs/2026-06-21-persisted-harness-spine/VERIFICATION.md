# Verification

Slice 00 preflight:

- `git status --short --branch`: passed; clean `main...origin/main`.
- `git log --oneline -10`: passed. Newest commit:
  `a312afe docs(goal): define persisted harness spine`.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without `KRN_DATABASE_URL`;
  reported Postgres not configured, pgvector/migrations skipped, and brain-store
  readiness as preview only.

Scope checks:

- No raw onboarding materials were read.
- No dashboard, API, MCP server, broad worker runtime, research layer, `.krn`,
  runtime markdown memory, separate store, full MemoryStore, full SourceStore,
  or broad eval suite was added.
- Required repo-local skill gates are now explicit in `GOAL.md`.
- Slice 00 is docs/ledger work only; persisted harness behavior remains
  unimplemented until later slices.

Slice 01 inventory:

- Targeted reads of DB harness/events schema, migration SQL, harness repository
  ports, Drizzle repository adapters, DB mappers, compiler, CLI parser, plan
  command, evidence capture command, and database runtime: passed.
- Targeted search for `--persist`, `run-id`, execution run methods, evidence
  persistence methods, and migration table names: passed.
- `pnpm --filter @krn/db db:check`: passed; Drizzle reported schema and
  migrations are consistent.
- `pnpm typecheck`: passed across workspace projects.

Slice 02 schema decision:

- `git status --short --branch`: passed; clean `main...origin/main` at
  `7b04a6c docs(run): record harness persistence inventory` before docs edits.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `pnpm typecheck`: passed across workspace projects.
- `docker compose ps krn-postgres`: passed; local `krn-postgres` was healthy on
  host port `54329`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected `3`, applied `3`, pgvector available, and
  brain-store readiness ready.
