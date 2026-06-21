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

Slice 03 repository/readback:

- Initial `pnpm --filter @krn/db test`: failed because the new DB package test
  script needed workspace links after adding `vitest`.
- `pnpm install`: passed and refreshed workspace links.
- RED `pnpm --filter @krn/db test`: failed as expected because
  `mapFeedbackDelta` returned empty `memoryCandidates`.
- RED `pnpm --filter @krn/db test`: failed as expected because
  `DrizzleHarnessRunRepository.prototype.getHarnessRunByExecutionRunId` was
  missing.
- GREEN `pnpm --filter @krn/db test`: passed with 2 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests, now including `@krn/db`.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src`: passed with no matches.

Slice 04 persisted plan:

- RED `pnpm --filter @krn/cli test`: failed as expected because old `plan`
  behavior tried to use DB automatically, `--persist` parsed as invalid usage,
  and persisted IDs were absent.
- GREEN `pnpm --filter @krn/cli test`: passed with 11 tests.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/db db:check`: passed; Drizzle schema and migrations
  remain consistent.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "persist harness run slice 04 proof" --persist`:
  passed and printed persisted IDs:
  `operatorIntent=b03aa0fa-2883-49c2-a73b-21bbb4bdb0be`,
  `taskContract=d6e4c531-2bc6-4a3d-a183-c17f51ae64b7`,
  `harnessPlan=82c8a1de-f4c0-421f-83e5-e44b6bcd9677`,
  `contextAssembly=a203c448-0382-460e-903e-f96d86683760`,
  `executionRun=b529e20e-b8ca-4cb5-9342-58578e880945`.
- SQL proof for execution run `b529e20e-b8ca-4cb5-9342-58578e880945`: status
  `planned`, `harness_plans.metadata ? 'evidenceContract' = true`, evidence
  command count `3`, run event count `1`.
- Live preview with DB configured but without `--persist`: passed; SQL
  `execution_runs` count stayed `1` before and after.
- `rg -n "as unknown as|as any|\bany\b" packages/core packages/harness/src
  packages/db/src packages/cli/src`: passed with no matches.
