# Handoff

Objective:
Persist the first KRN harness run spine through the existing Postgres/Drizzle
infrastructure.

Last verified state:
Slice 07 persisted evidence smoke is complete. `krn plan --task "..."
--persist` persists and prints run IDs; `pnpm db:smoke:harness-plan` proves plan
readback/cleanup; `krn evidence capture --run-id <id> --persist` loads a
persisted run and writes an evidence bundle, review assessment, and feedback
delta candidates; `pnpm db:smoke:harness-evidence` now proves the full marked
plan/evidence/readback/cleanup path. Live evidence smoke created execution run
`8db14bdf-6390-485d-9736-89274c5affff`, evidence bundle
`1dbe1d1b-e537-4670-a6cb-2b878b44c7f2`, review assessment
`31fe636d-5d61-402b-82bc-64d225cd0c6d`, feedback delta
`7bc1b78f-4aeb-48cb-b9e5-2d8b456f1fe9`, verified linked counts `1/1/1`, run
events `2`, and cleanup remaining marker count `0`. `pnpm typecheck`, `pnpm
test`, no-DB `krn doctor`, `pnpm --filter @krn/db db:check`, live `pnpm
db:ready`, live `pnpm db:smoke:harness-plan`, and live `pnpm
db:smoke:harness-evidence` passed during M21 so far.

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
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runCli.test.ts`
- `packages/cli/src/runPlanCommand.ts`
- `packages/cli/src/databaseRuntime.ts`
- `packages/harness/src/compiler/compileHarnessPlan.ts`
- `package.json`
- `packages/db/src/harnessPlanSmoke.ts`
- `packages/db/src/index.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`
- `packages/db/src/harnessEvidenceSmoke.ts`

Decisions:
M21 starts from the completed M20 local DB proof. The write path must be explicit
through `--persist`; preview/no-store behavior remains valid without DB config.
Repo-local skills are gates for matching work, not decorative references.
The primary harness spine tables already exist. No new migration is needed for
Slice 02; use typed `harness_plans.metadata.evidenceContract` first. Repository
readback is keyed by `executionRunId`. Slice 04 makes writes explicit:
configured DB alone does not make `krn plan` persist state.

Blockers/risks:
No Slice 07 blocker. `krn doctor` does not yet report harness persistence
readiness; Slice 08 owns that read-only status surface.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-brain-store-proof/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`, and
harness/core types directly touched by the next slice.

Next action:
Slice 08: update `krn doctor` to report harness persistence readiness, including
the persisted plan and evidence smoke capabilities, without writing to the
database.

Do not reread:
`docs/materials/` or broad historical docs.
