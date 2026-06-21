# Handoff

Objective:
Persist SourceClaims and source-to-decision edges through the existing
Postgres/Drizzle-backed KRN control plane.

Last verified state:
M22 Slice 04 SourceRepository methods are complete. `GOAL.md` defines M22. Slice 00
preflight passed `pnpm typecheck`, `pnpm test`, no-DB `krn doctor`, live
`pnpm db:ready`, live `pnpm db:smoke`, live `pnpm db:smoke:harness-plan`, and
live `pnpm db:smoke:harness-evidence`. Slice 01 recorded the current source
graph surface in `SOURCE_GRAPH_INVENTORY.md`. Slice 02 added M22 schema support
for claim status/run links, typed source decision edges, and first-class source
rejection fields. Slice 03 added Zod input parsers for source artifacts,
claims, decision edges, and rejections. Slice 04 added repository methods and
mappers for source claim lookup/run listing, source decision edges, and source
rejections.

Changed files:

- `packages/harness/src/repositories/sourceRepository.ts`
- `packages/db/src/repositories/DrizzleSourceRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/repositories/mappers.test.ts`
- `docs/runs/2026-06-21-source-graph-persistence/PROGRESS.md`
- `docs/runs/2026-06-21-source-graph-persistence/HANDOFF.md`
- `docs/runs/2026-06-21-source-graph-persistence/DECISIONS.md`
- `docs/runs/2026-06-21-source-graph-persistence/VERIFICATION.md`

Decisions:
M22 should reuse the existing Postgres/Drizzle boundary and existing source
tables. Decorative sources must become SourceRejections, not trusted
SourceClaims. Current `source_decisions` is not enough for M22 typed
source-to-harness-artifact edges, so Slice 02 added `source_decision_edges` and
renamed the old domain read model to `SourceDecision`. Slice 03 keeps new
CLI/API-style source inputs on M22 trust/support vocabulary only. Slice 04 emits
outbox events for decision-edge and rejection writes.

Blockers/risks:
No Slice 04 blocker. Live source graph write/read/cleanup smoke, CLI commands,
evidence source candidates, and doctor readiness remain unproven.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, existing source/core/schema types, CLI
`plan`/`doctor`/`evidence capture`, and M22 run ledger files.

Next action:
Slice 05: add source graph persistence smoke path.

Do not reread:
`docs/materials/` or broad historical docs.
