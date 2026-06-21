# Handoff

Objective:
M21 persists the first KRN harness run spine through the existing
Postgres/Drizzle infrastructure.

Last verified state:
M21 Slices 00-07 are complete through the current working tree. `krn plan
--task "..." --persist` writes a persisted harness plan run; `pnpm
db:smoke:harness-plan` proves plan readback and cleanup; `krn evidence capture
--run-id <id> --persist` writes linked evidence/review/feedback candidates; and
`pnpm db:smoke:harness-evidence` proves the marked plan/evidence/readback
cleanup path. Latest verification passed `pnpm --filter @krn/cli test`, `pnpm
typecheck`, live `pnpm db:smoke:harness-evidence`, full `pnpm test`, `pnpm
--filter @krn/db db:check`, no-`any` scan, and `git diff --check`.

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
No Slice 07 blocker. `krn doctor` does not yet report harness persistence
readiness; Slice 08 owns that read-only status surface. Persisted loop dogfood
and anti-rot audit remain later M21 slices.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/verification.md`,
`docs/handoff/blockers.md`,
`docs/runs/2026-06-21-persisted-harness-spine/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`/`db
smoke`, and harness/core types touched by M21.

Next action:
Slice 08: update read-only `krn doctor` to report harness persistence
readiness, including plan/evidence smoke capability status.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
