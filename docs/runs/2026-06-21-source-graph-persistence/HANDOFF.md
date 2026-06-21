# Handoff

Objective:
Persist SourceClaims and source-to-decision edges through the existing
Postgres/Drizzle-backed KRN control plane.

Last verified state:
M22 Slice 07 source decision link CLI is complete. `GOAL.md` defines M22. Slice 00
preflight passed `pnpm typecheck`, `pnpm test`, no-DB `krn doctor`, live
`pnpm db:ready`, live `pnpm db:smoke`, live `pnpm db:smoke:harness-plan`, and
live `pnpm db:smoke:harness-evidence`. Slice 01 recorded the current source
graph surface in `SOURCE_GRAPH_INVENTORY.md`. Slice 02 added M22 schema support
for claim status/run links, typed source decision edges, and first-class source
rejection fields. Slice 03 added Zod input parsers for source artifacts,
claims, decision edges, and rejections. Slice 04 added repository methods and
mappers for source claim lookup/run listing, source decision edges, and source
rejections. Slice 05 added and passed `pnpm db:smoke:source-graph` with cleanup
remaining marker count `0`. Slice 06 added and live-verified
`krn source claim add --persist`. Slice 07 added and live-verified
`krn source decision link --persist`.

Changed files:

- `packages/cli/src/databaseRuntime.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runSourceDecisionLinkCommand.ts`
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
renamed the old domain read model to `SourceDecision`. Slice 03 keeps new
CLI/API-style source inputs on M22 trust/support vocabulary only. Slice 04 emits
outbox events for decision-edge and rejection writes. Slice 05 makes
`pnpm db:smoke:source-graph` the live persistence proof. Slice 06 keeps
`--type project-decision` as metadata when it is not a physical artifact kind.
Slice 07 verifies SourceClaim existence before creating typed source decision
edges.

Blockers/risks:
No Slice 07 blocker. CLI source claim reject, evidence source candidates, and
doctor readiness remain unproven.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, existing source/core/schema types, CLI
`plan`/`doctor`/`evidence capture`, and M22 run ledger files.

Next action:
Slice 08: add CLI `krn source claim reject`.

Do not reread:
`docs/materials/` or broad historical docs.
