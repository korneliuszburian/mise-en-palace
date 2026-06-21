# Handoff

Objective:
Finish `GOAL.md` by completing M19 final handoff and verification.

Last verified state:
M19 final verification passed after these handoff docs were added:
`pnpm typecheck`, `pnpm test`, `krn plan`, `krn doctor`,
`krn evidence capture`, directory scan, `requiredSkills` search, and targeted
forbidden-surface checks.

Changed files:
`docs/handoff/progress.md`, `docs/handoff/handoff.md`,
`docs/handoff/decisions.md`, `docs/handoff/blockers.md`,
`docs/handoff/verification.md`, `GOAL.md`, and `PLAN.md`.

Decisions:
Keep this handoff set short. `PLAN.md` remains the living execution map.

Blockers/risks:
No hard blocker. Live Postgres persistence is not proven because
`KRN_DATABASE_URL` is absent in this local runtime.

Context selectors:
`PLAN.md` M19, `GOAL.md`, `docs/KRN_KERNEL.md`,
`docs/runs/2026-06-21-first-postgres-backed-harness-dogfood.md`.

Next action:
Commit `docs(run): add final KRN infra handoff`, push, then mark the active
goal complete if the completion audit still passes.

Do not reread:
`docs/materials/` unless a future task asks for raw source/audit material.
