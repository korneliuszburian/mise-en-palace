# Progress

Goal: M22 - persist SourceClaims and source-to-decision edges.

Current slice: Slice 05 source graph persistence smoke complete.

Completed:

- `GOAL.md` now defines M22 as SourceClaim persistence plus
  source-to-decision edges.
- M21 final state is the baseline: persisted harness plan/evidence/review/
  feedback loop is complete, dogfooded, anti-rot audited, and pushed.
- M22 run ledger was created under
  `docs/runs/2026-06-21-source-graph-persistence/`.
- Slice 01 inventory was recorded in `SOURCE_GRAPH_INVENTORY.md`.
- Slice 02 added/tightened Drizzle source graph schema for M22:
  M22 trust/support enum values, claim status/run linkage, typed
  `source_decision_edges`, and first-class rejection reason/title fields.
- Slice 03 added source graph Zod input parsers for artifacts, claims,
  decision edges, and rejections.
- Slice 04 added SourceRepository methods for claim lookup/run listing,
  source decision edge creation/run listing, and source rejection creation.
- Slice 05 added `pnpm db:smoke:source-graph` and proved live source artifact,
  claim, decision edge, rejection, outbox, readback, and cleanup behavior.

Verification:

- `git status --short --branch`: passed with only `GOAL.md` dirty for the new
  M22 goal text before ledger creation.
- `git log --oneline -12`: passed; newest commit was
  `a0bb82d docs(handoff): update persisted harness spine status`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  preview-only persistence readiness.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `3/3`, pgvector available, and brain
  store readiness ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- Slice 01 targeted source graph reads: schema, migrations, repository port,
  Drizzle adapter, mappers, core source types, IO schema, CLI parser, database
  runtime, and evidence capture source-decision behavior.
- Slice 02 RED: `pnpm --filter @krn/db test -- sources.test.ts` failed on the
  missing M22 source vocabulary.
- `pnpm db:generate`: passed and generated
  `packages/db/src/migrations/0003_mushy_shinko_yamashiro.sql`.
- `pnpm --filter @krn/db test -- sources.test.ts mappers.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm db:check`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `4/4`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- `git diff --check`: passed.
- Slice 03 RED: `pnpm --filter @krn/schema test -- index.test.ts` failed on
  old `high/supports` source claim input vocabulary.
- Slice 03 RED: `pnpm --filter @krn/schema test -- index.test.ts` failed on
  missing source artifact, decision edge, and rejection parser exports.
- `pnpm --filter @krn/schema test -- index.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 05 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  `krn db smoke source-graph` was parsed as usage error.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed with claim readback matched, run claims `1`,
  run decision edges `1`, source rejections `1`, outbox events `2`, and cleanup
  remaining marker count `0`.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 04 RED: `pnpm --filter @krn/db test -- mappers.test.ts` failed on
  missing `mapSourceDecisionEdge` and `mapSourceRejection`.
- `pnpm --filter @krn/db test -- mappers.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.

Skill gates:

- Used: `source-to-decision` for M22 source/claim/decision framing.
- Used: `brain-store-schema` for upcoming source graph persistence boundaries.
- Used: `evidence-review-loop` for Slice 00 command evidence and ledger shape.
- Used: `handoff-compact` for Slice 00 continuation state.
- Used: `typescript-type-safety` for SourceClaim/SourceDecisionEdge/domain
  boundary updates.
- Used: `superpowers:test-driven-development` for the RED/GREEN schema test.
- Used: `superpowers:systematic-debugging` after the expected typecheck
  failure exposed stale domain/repository assumptions.
- Not used yet in M22: `codex-adapter-plan`, `activation-engine`,
  `target-infra-adr`.

Next action:

- Slice 06: add CLI `krn source claim add`.
