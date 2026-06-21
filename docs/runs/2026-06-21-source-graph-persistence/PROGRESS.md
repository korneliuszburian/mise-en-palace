# Progress

Goal: M22 - persist SourceClaims and source-to-decision edges.

Current slice: Slice 01 source graph inventory complete.

Completed:

- `GOAL.md` now defines M22 as SourceClaim persistence plus
  source-to-decision edges.
- M21 final state is the baseline: persisted harness plan/evidence/review/
  feedback loop is complete, dogfooded, anti-rot audited, and pushed.
- M22 run ledger was created under
  `docs/runs/2026-06-21-source-graph-persistence/`.
- Slice 01 inventory was recorded in `SOURCE_GRAPH_INVENTORY.md`.

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

Skill gates:

- Used: `source-to-decision` for M22 source/claim/decision framing.
- Used: `brain-store-schema` for upcoming source graph persistence boundaries.
- Used: `evidence-review-loop` for Slice 00 command evidence and ledger shape.
- Used: `handoff-compact` for Slice 00 continuation state.
- Not used yet in M22: `typescript-type-safety`, `codex-adapter-plan`,
  `activation-engine`, `target-infra-adr`.

Next action:

- Slice 02: add or tighten the minimal source graph schema needed for M22.
