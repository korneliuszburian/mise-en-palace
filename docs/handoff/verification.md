# Verification

Latest M20 final verification:

- `git status --short --branch`: passed; clean `main...origin/main` before
  final handoff edits.
- `git log --oneline -8`: passed; latest commits covered M20 Slices 00-05.
- `docker compose ps krn-postgres`: passed; local pgvector Postgres was
  healthy on host port `54329`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config; reported
  preview-only persisted brain-store readiness.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed; reported Postgres reachable, pgvector
  available, migrations `verified (3/3 applied)`, and brain-store readiness
  ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed; reported migrations expected `3`, applied `3`, pgvector available,
  and brain-store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed; inserted and read back a smoke project, then cleaned it up.
- `docker compose exec -T krn-postgres psql -U krn -d krn -tAc "select
  count(*) from workspaces where slug like 'krn-smoke-%';"`: passed and
  returned `0`.

Scope checks:

- No dashboard, API, MCP, broad worker runtime, research layer, `.krn`, runtime
  markdown memory, or separate vector/graph/search/queue store was added.
- The local DB proof uses PostgreSQL plus pgvector only.
- `krn doctor` remains read-only; `pnpm db:ready` and `pnpm db:smoke` are the
  mutating proof commands.
- `git diff --check`: passed after final M20 handoff docs were updated.

Completion audit refresh after stale-next-action cleanup:

- `git status --short --branch`: passed; only docs handoff/progress cleanup was
  dirty before this final docs-only commit.
- `git log --oneline -8`: passed; newest commit at refresh start was
  `17c2853 docs(handoff): update brain-store proof status`.
- `docker compose ps krn-postgres`: passed; local pgvector Postgres was
  healthy.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  preview-only persisted brain-store readiness.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed with Postgres reachable, pgvector available,
  migrations `verified (3/3 applied)`, and brain-store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- Direct smoke cleanup count returned `0`.
- No forbidden directories exist: `apps`, `packages/dashboard`, `packages/api`,
  and `.krn` are absent.
- No forbidden store dependency or runtime use exists in package manifests or
  package source. The only `@upstash/redis` match is an optional Drizzle peer
  dependency declaration in `pnpm-lock.yaml`, not a KRN dependency or runtime
  store.
- `git diff --check`: passed after the stale-next-action cleanup.
