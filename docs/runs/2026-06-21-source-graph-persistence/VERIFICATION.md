# Verification

Slice 00 preflight:

- `git status --short --branch`: passed. Output showed
  `## main...origin/main` and `M GOAL.md`; this is the user-provided M22 goal
  update, not an unrelated dirty file.
- `git log --oneline -12`: passed. Latest commits:
  `a0bb82d`, `2984d01`, `9afd147`, `6c84e8f`, `36c6f2d`, `2bdd233`,
  `6394c65`, `ef8a749`, `64c4bbf`, `20be514`, `7b04a6c`, `cca472d`.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  no forbidden surfaces.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `3/3`, migrations applied, pgvector
  available, and brain store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed with project readback matched and cleanup completed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with readback matched, evidence contract
  commands `3`, run events `1`, and cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with linked evidence/review/feedback
  counts `1/1/1`, run events `2`, and cleanup remaining marker count `0`.

Scope checks:

- No raw onboarding materials were read.
- No external research was performed.
- No dashboard, API, MCP server, crawler, research layer, worker runtime,
  runtime markdown memory, `.krn` runtime truth, separate store, full
  MemoryStore, full SourceStore, or automatic memory mutation was added.

Slice 01 inventory:

- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- Targeted reads of `packages/db/src/schema/sources.ts`: passed.
- Targeted reads of source graph migrations and migration snapshots: passed.
- Targeted reads of `DrizzleSourceRepository`, source mappers, harness source
  repository port, core source types, schema source-claim parser, CLI parser,
  database runtime, and evidence capture behavior: passed.
- Inventory recorded in `SOURCE_GRAPH_INVENTORY.md`.

Slice 02 schema:

- RED: `pnpm --filter @krn/db test -- sources.test.ts` failed because
  `source_trust_tier` exposed only `high`, `medium`, and `low`.
- GREEN: `pnpm --filter @krn/db test -- sources.test.ts`: passed after schema
  updates.
- `pnpm db:generate`: passed and generated
  `packages/db/src/migrations/0003_mushy_shinko_yamashiro.sql`.
- SQL inspection of `0003_mushy_shinko_yamashiro.sql`: passed. It creates M22
  enums, extends source support/trust enums, creates `source_decision_edges`,
  adds claim run/status/falsifier/revisit fields, and adds rejection
  title/attempted-claim/reason fields.
- `pnpm --filter @krn/db test -- sources.test.ts mappers.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm db:check`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `4/4`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed with project readback matched and cleanup completed.
- `git diff --check`: passed.
