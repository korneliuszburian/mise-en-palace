# Handoff

Objective:
Persist SourceClaims and source-to-decision edges through the existing
Postgres/Drizzle-backed KRN control plane.

Last verified state:
M22 Slice 02 source graph schema is complete. `GOAL.md` defines M22. Slice 00
preflight passed `pnpm typecheck`, `pnpm test`, no-DB `krn doctor`, live
`pnpm db:ready`, live `pnpm db:smoke`, live `pnpm db:smoke:harness-plan`, and
live `pnpm db:smoke:harness-evidence`. Slice 01 recorded the current source
graph surface in `SOURCE_GRAPH_INVENTORY.md`. Slice 02 added M22 schema support
for claim status/run links, typed source decision edges, and first-class source
rejection fields.

Changed files:

- `packages/core/src/source.ts`
- `packages/core/src/feedbackDelta.ts`
- `packages/core/src/contextAssembly.ts`
- `packages/core/src/ids.ts`
- `packages/harness/src/repositories/sourceRepository.ts`
- `packages/harness/src/repositories/retrievalRepository.ts`
- `packages/harness/src/repositories/types.ts`
- `packages/harness/src/activation/types.ts`
- `packages/harness/src/activation/index.test.ts`
- `packages/harness/src/compiler/index.test.ts`
- `packages/db/src/schema/sources.ts`
- `packages/db/src/schema/sources.test.ts`
- `packages/db/src/migrations/0003_mushy_shinko_yamashiro.sql`
- `packages/db/src/migrations/meta/0003_snapshot.json`
- `packages/db/src/migrations/meta/_journal.json`
- `packages/db/src/repositories/DrizzleSourceRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/repositories/mappers.test.ts`
- `docs/runs/2026-06-21-source-graph-persistence/PROGRESS.md`
- `docs/runs/2026-06-21-source-graph-persistence/HANDOFF.md`
- `docs/runs/2026-06-21-source-graph-persistence/DECISIONS.md`
- `docs/runs/2026-06-21-source-graph-persistence/BLOCKERS.md`
- `docs/runs/2026-06-21-source-graph-persistence/VERIFICATION.md`

Decisions:
M22 should reuse the existing Postgres/Drizzle boundary and existing source
tables. Decorative sources must become SourceRejections, not trusted
SourceClaims. Current `source_decisions` is not enough for M22 typed
source-to-harness-artifact edges, so Slice 02 added `source_decision_edges` and
renamed the old domain read model to `SourceDecision`.

Blockers/risks:
No Slice 02 blocker. Source graph repository methods, source graph smoke, CLI
commands, evidence source candidates, and doctor readiness remain unproven.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, existing source/core/schema types, CLI
`plan`/`doctor`/`evidence capture`, and M22 run ledger files.

Next action:
Slice 03: add source graph IO schemas.

Do not reread:
`docs/materials/` or broad historical docs.
