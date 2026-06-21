# Handoff

Objective:
M20 proves the local KRN brain-store runtime path: config, local pgvector
Postgres, migrations, doctor readiness, and minimal persistence smoke.

Last verified state:
M20 Slices 00-06 are committed and pushed. Final audit passed with `pnpm
typecheck`, `pnpm test`, no-env doctor, live-DB doctor, `pnpm db:ready`,
`pnpm db:smoke`, and direct smoke cleanup count `0`.

Changed files:
M20 changed the local DB setup, DB readiness/smoke commands, doctor readiness,
runbook, `PLAN.md`, handoff docs, and the run ledger under
`docs/runs/2026-06-21-brain-store-proof/`.

Decisions:
`KRN_DATABASE_URL` is canonical. `pnpm db:ready` is the mutating migration
readiness proof. `pnpm db:smoke` is the minimal persistence proof. `krn doctor`
stays read-only and reports exact readiness from inspection only.

Blockers/risks:
No M20 local DB runtime proof blocker remains. Full evidence/memory/source/eval
persistence and worker execution are later scope, not M20 blockers.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/verification.md`,
`docs/handoff/blockers.md`, `docs/runbooks/local-brain-store.md`, and
`docs/runs/2026-06-21-brain-store-proof/`.

Next action:
No M20 action remains. Wait for the next explicit product goal.

Do not reread:
`docs/materials/` or broad historical docs unless a future task explicitly asks
for raw source/audit material.
