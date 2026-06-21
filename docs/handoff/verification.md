# Verification

Latest M21 Slice 07 verification:

- RED `pnpm --filter @krn/cli test`: failed as expected before
  `db smoke harness-evidence` parser support.
- GREEN `pnpm --filter @krn/cli test`: passed with 16 tests.
- `pnpm typecheck`: passed across workspace projects.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed. It created execution run
  `8db14bdf-6390-485d-9736-89274c5affff`, evidence bundle
  `1dbe1d1b-e537-4670-a6cb-2b878b44c7f2`, review assessment
  `31fe636d-5d61-402b-82bc-64d225cd0c6d`, feedback delta
  `7bc1b78f-4aeb-48cb-b9e5-2d8b456f1fe9`, verified linked counts `1/1/1`,
  run events `2`, and cleanup remaining marker count `0`.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/db db:check`: passed.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src packages/cli/src`: passed with no matches.
- `git diff --check`: passed.

Current M21 scope checks:

- No dashboard, API, MCP server, broad worker runtime, research layer, `.krn`,
  runtime markdown memory, full MemoryStore/SourceStore, automatic memory
  mutation, or separate vector/graph/search/queue store was added.
- `krn plan --task "..."` remains preview/no-store unless `--persist` is
  explicit.
- Smoke commands are the explicit mutating proof surface.

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
