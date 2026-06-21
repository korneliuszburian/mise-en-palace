# Handoff

Objective:
Persist SourceClaims and source-to-decision edges through the existing
Postgres/Drizzle-backed KRN control plane.

Last verified state:
M22 Slice 01 source graph inventory is complete. `GOAL.md` defines M22. Slice 00
preflight passed `pnpm typecheck`, `pnpm test`, no-DB `krn doctor`, live
`pnpm db:ready`, live `pnpm db:smoke`, live `pnpm db:smoke:harness-plan`, and
live `pnpm db:smoke:harness-evidence`. Slice 01 recorded the current source
graph surface in `SOURCE_GRAPH_INVENTORY.md`.

Changed files:

- `GOAL.md`
- `docs/runs/2026-06-21-source-graph-persistence/PROGRESS.md`
- `docs/runs/2026-06-21-source-graph-persistence/HANDOFF.md`
- `docs/runs/2026-06-21-source-graph-persistence/DECISIONS.md`
- `docs/runs/2026-06-21-source-graph-persistence/BLOCKERS.md`
- `docs/runs/2026-06-21-source-graph-persistence/VERIFICATION.md`
- `docs/runs/2026-06-21-source-graph-persistence/SOURCE_GRAPH_INVENTORY.md`

Decisions:
M22 should reuse the existing Postgres/Drizzle boundary and existing source
tables. Decorative sources must become SourceRejections, not trusted
SourceClaims. Current `source_decisions` is not enough for M22 typed
source-to-harness-artifact edges.

Blockers/risks:
No Slice 01 blocker. Slice 02 must add or tighten only the minimal schema needed
for M22 source claims, decision edges, and rejections.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, existing source/core/schema types, CLI
`plan`/`doctor`/`evidence capture`, and M22 run ledger files.

Next action:
Slice 02: add or tighten source graph schema for M22 semantics.

Do not reread:
`docs/materials/` or broad historical docs.
