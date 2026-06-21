# Verification

Slice 00 commands:

- `git status --short --branch`: passed; showed `main...origin/main` with
  dirty `GOAL.md` before ledger creation.
- `git log --oneline -8`: passed; latest commit was
  `4b86738 docs(run): add final KRN infra handoff`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.

Scope checks:

- No raw onboarding materials were read.
- No dashboard, API, MCP, broad worker, research, `.krn`, separate store, or
  runtime markdown memory surface was added.
- `GOAL.md` now forces the M20-relevant repo-local operational skills instead
  of relying on implicit operator memory.

Slice 01 inventory checks:

- `rg --files` over package manifests, Drizzle, migrations, DB/schema, doctor,
  env, and tests: passed.
- Targeted `rg` for `KRN_DATABASE_URL`, pgvector, Drizzle, migrations, doctor,
  and env usage: passed.
- Targeted reads of package manifests, Drizzle config, DB runtime, CLI doctor,
  schema files, migration journal, pgvector SQL helper, and CLI tests: passed.
- `.env*` and Compose file lookup: none found.
- `pnpm --filter @krn/db db:check`: passed; Drizzle reported migrations are
  consistent with config.
- `pnpm typecheck`: passed across workspace projects.

Slice 02 local setup checks:

- `pnpm --filter @krn/db exec drizzle-kit migrate --help`: passed; migrate
  accepts `--config` and needs DB credentials through config.
- `pnpm --filter @krn/db exec drizzle-kit --help`: passed; command surface
  includes `generate`, `migrate`, `check`, and `up`.
- `docker compose config`: passed for `compose.yaml`.
- `pnpm --filter @krn/db db:check`: passed without `KRN_DATABASE_URL`.
- `pnpm typecheck`: passed across workspace projects.
- TypeScript boundary classification: config/env boundary in
  `packages/db/drizzle.config.ts`; no public types changed, no `any`, no double
  assertions, no weakened compiler settings.

Slice 03 migration readiness checks:

- RED `pnpm --filter @krn/cli test`: failed as expected because
  `krn db readiness` returned parser exit `2` before implementation.
- GREEN `pnpm --filter @krn/cli test`: passed with 6 tests.
- `pnpm typecheck`: passed after DB/CLI implementation.
- `pnpm db:ready` without `KRN_DATABASE_URL`: exited `1` with missing-config
  report and mechanical next action.
- `docker compose up -d krn-postgres`: passed and started local pgvector
  Postgres.
- `docker compose ps krn-postgres`: passed; service was healthy on host port
  `54329`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed. Output reported Postgres reachable, migrations expected `3`,
  migrations applied `3`, pgvector available, and brain-store readiness ready.
- `pnpm test`: passed across workspace tests.
- `pnpm typecheck`: passed across workspace projects.

Slice 04 doctor readiness checks:

- RED `pnpm --filter @krn/cli test`: failed as expected because
  `deriveBrainStoreReadiness` was not exported yet.
- GREEN `pnpm --filter @krn/cli test`: passed with 7 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm --filter @krn/cli krn doctor` without `KRN_DATABASE_URL`: passed with
  preview-only brain-store readiness and exit `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed with Postgres reachable, pgvector available,
  migrations `verified (3/3 applied)`, and brain-store readiness ready.
- `pnpm test`: passed across workspace tests.

Slice 05 persistence smoke checks:

- RED `pnpm --filter @krn/cli test`: failed as expected because `krn db smoke`
  returned parser exit `2` before implementation.
- GREEN `pnpm --filter @krn/cli test`: passed with 8 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm db:smoke` without `KRN_DATABASE_URL`: exited `1` with skipped
  missing-config report and mechanical next action.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed. Output reported configured DB, smoke workspace row, smoke project row,
  project readback matched, cleanup completed, and persistence smoke passed.
- `docker compose exec -T krn-postgres psql -U krn -d krn -tAc "select count(*)
  from workspaces where slug like 'krn-smoke-%';"`: passed and returned `0`.
- `pnpm test`: passed across workspace tests.

Slice 06 final audit:

- `git status --short --branch`: passed; clean `main...origin/main` before
  final handoff edits.
- `git log --oneline -8`: passed; latest commits covered M20 Slices 00-05.
- `docker compose ps krn-postgres`: passed; local pgvector Postgres was
  healthy on host port `54329`.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  preview-only persisted brain-store readiness.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed with Postgres reachable, pgvector available,
  migrations `verified (3/3 applied)`, and brain-store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected `3`, applied `3`, pgvector available, and
  brain-store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed with project readback matched, cleanup completed, and persistence
  smoke passed.
- `docker compose exec -T krn-postgres psql -U krn -d krn -tAc "select count(*)
  from workspaces where slug like 'krn-smoke-%';"`: passed and returned `0`.
- `git diff --check`: passed after final handoff docs were updated.
