# Handoff

Objective:
M21 persists the first KRN harness run spine through the existing
Postgres/Drizzle infrastructure.

Last verified state:
M21 Slices 00-10 are complete through the current working tree. `krn plan
--task "..." --persist` writes a persisted harness plan run; `pnpm
db:smoke:harness-plan` proves plan readback and cleanup; `krn evidence capture
--run-id <id> --persist` writes linked evidence/review/feedback candidates; and
`pnpm db:smoke:harness-evidence` proves the marked plan/evidence/readback
cleanup path. `krn doctor` now reports harness persistence readiness read-only:
live DB reported schema `ready (10/10 tables present)` and readiness
`ready (schema present; smoke commands available)`. Dogfood execution run
`66626e90-0cf5-4803-9bc7-f477b28b47c4` has linked evidence bundle
`94cf92cf-a826-406f-bcad-9d9ebb7a0a8e`, review assessment
`630d46ec-e323-4974-a90e-4a1a03571499`, and feedback delta
`21c93ea7-2f2e-4e0c-8d80-ed07138e57f8`; SQL readback shows evidence/review/
feedback counts `1/1/1` and run events `2`. Latest verification passed `pnpm
typecheck`, `pnpm test`, live doctor, both harness smoke scripts, SQL dogfood
readback, smoke cleanup count `0,0`, and forbidden surface checks.
Slice 10 anti-rot also re-verified no-env/live doctor, DB readiness, project
smoke, both harness smoke scripts, cleanup count `0,0,0`, no forbidden
directories, no direct forbidden store dependency, core library safety, and
no-`any` scans.

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
No Slice 10 blocker. Final handoff remains.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/verification.md`,
`docs/handoff/blockers.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`/`db
smoke`, and harness/core types touched by M21.

Next action:
Slice 11: update final M21 handoff and completion status.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
