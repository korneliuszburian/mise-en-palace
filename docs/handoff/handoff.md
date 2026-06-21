# Handoff

Objective:
M21 persists the first KRN harness run spine through the existing
Postgres/Drizzle infrastructure.

Last verified state:
M21 is complete. `krn plan --task "..." --persist` writes a persisted harness
plan run; `krn evidence capture --run-id <id> --persist` writes linked
evidence/review/feedback candidate records; `pnpm db:smoke:harness-plan` and
`pnpm db:smoke:harness-evidence` prove readback and cleanup; and `krn doctor`
reports harness persistence readiness read-only.

Dogfood execution run `66626e90-0cf5-4803-9bc7-f477b28b47c4` has evidence
bundle `94cf92cf-a826-406f-bcad-9d9ebb7a0a8e`, review assessment
`630d46ec-e323-4974-a90e-4a1a03571499`, feedback delta
`21c93ea7-2f2e-4e0c-8d80-ed07138e57f8`, linked counts `1/1/1`, and run events
`2`. Slice 10 anti-rot passed typecheck, tests, no-env/live doctor, live
`db:ready`, live `db:smoke`, both harness smoke paths, cleanup count `0,0,0`,
forbidden-surface/dependency checks, core library-safe scan, no-`any` scan, and
`git diff --check`.

Changed files:
M21 changed `GOAL.md`, `PLAN.md`, root handoff docs, the run ledger under
`docs/runs/2026-06-21-persisted-harness-spine/`, harness repository/readback
interfaces, DB repository adapters/mappers/smoke helpers, CLI plan/evidence/db
smoke commands, package scripts, and related tests.

Decisions:
`--persist` is the write boundary for user-facing plan/evidence commands. Smoke
commands are explicit operator-invoked write proofs. M21 stays inside the
existing Postgres/Drizzle boundary and does not add dashboards, APIs, MCP,
runtime markdown memory, full MemoryStore/SourceStore, workers, or separate
stores.

Blockers/risks:
No M21 blocker remains. Later scope: SourceClaim persistence,
MemoryCandidate reviewed promotion, durable activation, and worker execution.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/verification.md`,
`docs/handoff/blockers.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`/`db
smoke`, and harness/core types touched by M21.

Next action:
M22: implement SourceClaim persistence plus source-to-decision edges.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
