# Handoff

Objective:
Persist the first KRN harness run spine through the existing Postgres/Drizzle
infrastructure.

Last verified state:
Slice 04 persisted plan is complete. `krn plan --task "..."` is preview/no-store
by default, even with `KRN_DATABASE_URL`; `krn plan --task "..." --persist`
requires DB config, creates a planned execution run, stores evidence contract
metadata, and prints persisted IDs. Live SQL proof confirmed execution run
`b529e20e-b8ca-4cb5-9342-58578e880945`, evidence contract metadata, three
evidence commands, and one run event. `pnpm typecheck`, `pnpm test`, no-DB
`krn doctor`, `pnpm --filter @krn/db db:check`, and live `pnpm db:ready` passed
during M21 so far.

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

Decisions:
M21 starts from the completed M20 local DB proof. The write path must be explicit
through `--persist`; preview/no-store behavior remains valid without DB config.
Repo-local skills are gates for matching work, not decorative references.
The primary harness spine tables already exist. No new migration is needed for
Slice 02; use typed `harness_plans.metadata.evidenceContract` first. Repository
readback is keyed by `executionRunId`. Slice 04 makes writes explicit:
configured DB alone does not make `krn plan` persist state.

Blockers/risks:
No Slice 04 blocker. Persisted evidence/review/feedback CLI behavior is not
implemented yet. Repository aggregate readback has API and adapter support, but
live readback proof should be captured in the next slice.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
`docs/runs/2026-06-21-brain-store-proof/`, package manifests, DB
schema/migrations/repositories, CLI `plan`/`doctor`/`evidence capture`, and
harness/core types directly touched by the next slice.

Next action:
Slice 05: add persisted plan smoke/readback proof through the repository
aggregate for execution run `b529e20e-b8ca-4cb5-9342-58578e880945` or a fresh
run.

Do not reread:
`docs/materials/` or broad historical docs.
