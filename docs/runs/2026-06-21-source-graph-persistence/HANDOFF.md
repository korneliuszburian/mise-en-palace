# Handoff

Objective:
Persist SourceClaims and source-to-decision edges through the existing
Postgres/Drizzle-backed KRN control plane.

Last verified state:
M22 Slice 11 source graph dogfood is complete. `GOAL.md` defines M22. Slice 00
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
`krn source decision link --persist`. Slice 08 added and live-verified
`krn source claim reject --persist`. Slice 09 updated `krn evidence capture` to
surface proposal-only source decision candidates and persist them in
`FeedbackDelta.sourceDecisions` when evidence capture itself is persisted.
Slice 10 updated `krn doctor` to report source graph readiness and live-verified
both no-DB preview-only and DB-backed ready states. Slice 11 dogfooded M22 on
itself and recorded the run in `DOGFOOD.md`.

Changed files:

- `docs/runs/2026-06-21-source-graph-persistence/DOGFOOD.md`
- `packages/cli/src/databaseRuntime.ts`
- `packages/cli/src/index.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runSourceClaimRejectCommand.ts`
- `packages/cli/src/runSourceDecisionLinkCommand.ts`
- `packages/cli/src/runDoctorCommand.ts`
- `packages/db/src/index.ts`
- `packages/db/src/sourceGraphReadiness.ts`
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
edges. Slice 08 keeps rejected/decorative material as SourceRejection only and
does not create a SourceClaim. Slice 09 keeps evidence-derived source decisions
as FeedbackDelta candidates and does not create SourceClaims from changed files.
Slice 10 keeps doctor read-only and derives source graph readiness from schema,
SourceRepository read reachability, smoke command availability, forbidden-infra
absence, and durable runtime proof markers. Slice 11 dogfood is audit evidence
only; `DOGFOOD.md` is not runtime memory.

Blockers/risks:
No Slice 11 blocker. M22 final anti-rot and handoff update remain.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, existing source/core/schema types, CLI
`plan`/`doctor`/`evidence capture`, and M22 run ledger files.

Next action:
Slice 12: M22 anti-rot and final handoff update.

Do not reread:
`docs/materials/` or broad historical docs.
