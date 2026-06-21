# Handoff

Objective:
Persist the first KRN harness run spine through the existing Postgres/Drizzle
infrastructure.

Last verified state:
Slice 01 inventory is complete. Slice 00 preflight passed from clean
`main...origin/main` at `a312afe docs(goal): define persisted harness spine`.
Slice 01 confirmed existing tables/repository writes and current CLI/readback
gaps. `pnpm typecheck`, `pnpm test`, no-DB `krn doctor`, and `pnpm --filter
@krn/db db:check` passed during M21 so far.

Changed files:

- `GOAL.md`
- `docs/handoff/verification.md`
- `docs/runs/2026-06-21-brain-store-proof/VERIFICATION.md`
- `docs/runs/2026-06-21-persisted-harness-spine/PROGRESS.md`
- `docs/runs/2026-06-21-persisted-harness-spine/HANDOFF.md`
- `docs/runs/2026-06-21-persisted-harness-spine/DECISIONS.md`
- `docs/runs/2026-06-21-persisted-harness-spine/BLOCKERS.md`
- `docs/runs/2026-06-21-persisted-harness-spine/VERIFICATION.md`
- `docs/runs/2026-06-21-persisted-harness-spine/HARNESS_PERSISTENCE_INVENTORY.md`

Decisions:
M21 starts from the completed M20 local DB proof. The write path must be explicit
through `--persist`; preview/no-store behavior remains valid without DB config.
Repo-local skills are gates for matching work, not decorative references.
The primary harness spine tables already exist; the remaining schema question is
where to persist the evidence contract.

Blockers/risks:
No Slice 01 blocker. Persisted plan/evidence/review/feedback behavior is not
implemented yet. Readback by run ID and persisted feedback delta mapper behavior
are known gaps.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-brain-store-proof/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`, and
harness/core types directly touched by the next slice.

Next action:
Slice 02: decide the minimal evidence contract persistence path and add only the
missing schema/migration if the typed metadata path is not sufficient.

Do not reread:
`docs/materials/` or broad historical docs.
