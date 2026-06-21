# Handoff

Objective:
Persist the first KRN harness run spine through the existing Postgres/Drizzle
infrastructure.

Last verified state:
Slice 03 repository/readback is complete. The harness repository port now has a
persisted run aggregate readback by `executionRunId`, the Drizzle adapter
implements it, and `mapFeedbackDelta` preserves memory/source/eval candidates
from persisted JSONB. `pnpm typecheck`, `pnpm test`, no-DB `krn doctor`,
`pnpm --filter @krn/db db:check`, and live `pnpm db:ready` passed during M21 so
far.

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
- `docs/runs/2026-06-21-persisted-harness-spine/SCHEMA_DECISION.md`
- `packages/harness/src/repositories/harnessRunRepository.ts`
- `packages/harness/src/compiler/index.test.ts`
- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`
- `packages/db/src/repositories/DrizzleHarnessRunRepository.test.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/repositories/mappers.test.ts`
- `packages/db/package.json`
- `packages/db/tsconfig.json`
- `pnpm-lock.yaml`

Decisions:
M21 starts from the completed M20 local DB proof. The write path must be explicit
through `--persist`; preview/no-store behavior remains valid without DB config.
Repo-local skills are gates for matching work, not decorative references.
The primary harness spine tables already exist. No new migration is needed for
Slice 02; use typed `harness_plans.metadata.evidenceContract` first. Repository
readback is keyed by `executionRunId`.

Blockers/risks:
No Slice 03 blocker. Persisted plan/evidence/review/feedback CLI behavior is
not implemented yet. Live run aggregate readback remains unproven until
`krn plan --persist` creates an execution run.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-brain-store-proof/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`, and
harness/core types directly touched by the next slice.

Next action:
Slice 04: implement explicit `krn plan --task "..." --persist`, create an
execution run identity, persist evidence contract metadata, and print persisted
IDs.

Do not reread:
`docs/materials/` or broad historical docs.
