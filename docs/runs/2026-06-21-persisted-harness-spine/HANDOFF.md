# Handoff

Objective:
Persist the first KRN harness run spine through the existing Postgres/Drizzle
infrastructure.

Last verified state:
Slice 05 persisted plan smoke is complete. `krn plan --task "..." --persist`
persists and prints run IDs, and `pnpm db:smoke:harness-plan` creates a marked
persisted harness run, reads it back through the repository aggregate, verifies
core fields, and cleans up marker rows. Live smoke execution run
`7fc256ef-2868-483c-bd3a-c3283df4b761` read back as matched with three evidence
commands, one run event, and cleanup remaining marker count `0`. `pnpm
typecheck`, `pnpm test`, no-DB `krn doctor`, `pnpm --filter @krn/db db:check`,
and live `pnpm db:ready` passed during M21 so far.

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

Decisions:
M21 starts from the completed M20 local DB proof. The write path must be explicit
through `--persist`; preview/no-store behavior remains valid without DB config.
Repo-local skills are gates for matching work, not decorative references.
The primary harness spine tables already exist. No new migration is needed for
Slice 02; use typed `harness_plans.metadata.evidenceContract` first. Repository
readback is keyed by `executionRunId`. Slice 04 makes writes explicit:
configured DB alone does not make `krn plan` persist state.

Blockers/risks:
No Slice 05 blocker. Persisted evidence/review/feedback CLI behavior is not
implemented yet.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-brain-store-proof/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`, and
harness/core types directly touched by the next slice.

Next action:
Slice 06: implement `krn evidence capture --run-id <id> --persist`, loading the
persisted run and writing evidence bundle, review assessment, and feedback delta
candidates.

Do not reread:
`docs/materials/` or broad historical docs.
