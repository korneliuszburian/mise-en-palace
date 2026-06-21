# Handoff

Objective:
Persist the first KRN harness run spine through the existing Postgres/Drizzle
infrastructure.

Last verified state:
Slice 10 anti-rot audit is complete. `krn plan --task "..."
--persist` persists and prints run IDs; `pnpm db:smoke:harness-plan` proves plan
readback/cleanup; `krn evidence capture --run-id <id> --persist` loads a
persisted run and writes an evidence bundle, review assessment, and feedback
delta candidates; `pnpm db:smoke:harness-evidence` now proves the full marked
plan/evidence/readback/cleanup path; and `krn doctor` now reports harness
persistence readiness read-only. Dogfood execution run
`66626e90-0cf5-4803-9bc7-f477b28b47c4` has linked evidence bundle
`94cf92cf-a826-406f-bcad-9d9ebb7a0a8e`, review assessment
`630d46ec-e323-4974-a90e-4a1a03571499`, and feedback delta
`21c93ea7-2f2e-4e0c-8d80-ed07138e57f8`; SQL readback shows evidence contract
present, evidence/review/feedback counts `1/1/1`, and run events `2`. `pnpm
typecheck`, `pnpm test`, no-DB `krn doctor`, live `krn doctor`, `pnpm --filter
@krn/db db:check`, live `pnpm db:ready`, live `pnpm db:smoke:harness-plan`, and
live `pnpm db:smoke:harness-evidence` passed during M21 so far.
Slice 10 also re-ran the full anti-rot command set, live DB smoke paths,
cleanup proof, forbidden surface scans, direct forbidden dependency scan, core
library-safe scan, no-`any` scan, and `git diff --check`; see `ANTI_ROT.md`.

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
- `packages/db/src/harnessPersistenceReadiness.ts`
- `docs/runs/2026-06-21-persisted-harness-spine/DOGFOOD.md`
- `docs/runs/2026-06-21-persisted-harness-spine/ANTI_ROT.md`

Decisions:
M21 starts from the completed M20 local DB proof. The write path must be explicit
through `--persist`; preview/no-store behavior remains valid without DB config.
Repo-local skills are gates for matching work, not decorative references.
The primary harness spine tables already exist. No new migration is needed for
Slice 02; use typed `harness_plans.metadata.evidenceContract` first. Repository
readback is keyed by `executionRunId`. Slice 04 makes writes explicit:
configured DB alone does not make `krn plan` persist state.

Blockers/risks:
No Slice 10 blocker. Final handoff remains.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-brain-store-proof/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`, and
harness/core types directly touched by the next slice.

Next action:
Slice 11: update final handoff and completion status.

Do not reread:
`docs/materials/` or broad historical docs.
