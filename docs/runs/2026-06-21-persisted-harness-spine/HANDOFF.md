# Handoff

Objective:
Persist the first KRN harness run spine through the existing Postgres/Drizzle
infrastructure.

Last verified state:
M21 is complete through Slice 11. `krn plan --task "..." --persist` writes a
persisted harness plan run; `krn evidence capture --run-id <id> --persist`
writes linked evidence/review/feedback candidate records; `pnpm
db:smoke:harness-plan` and `pnpm db:smoke:harness-evidence` prove readback and
cleanup; and `krn doctor` reports harness persistence readiness read-only.

Dogfood execution run `66626e90-0cf5-4803-9bc7-f477b28b47c4` has evidence
bundle `94cf92cf-a826-406f-bcad-9d9ebb7a0a8e`, review assessment
`630d46ec-e323-4974-a90e-4a1a03571499`, feedback delta
`21c93ea7-2f2e-4e0c-8d80-ed07138e57f8`, evidence contract present,
evidence/review/feedback counts `1/1/1`, and run events `2`.

Latest full audit passed `pnpm typecheck`, `pnpm test`, no-env doctor, live
doctor, live `pnpm db:ready`, live `pnpm db:smoke`, live
`pnpm db:smoke:harness-plan`, live `pnpm db:smoke:harness-evidence`,
`pnpm --filter @krn/db db:check`, smoke cleanup count `0,0,0`, forbidden
surface/dependency scans, core library-safe scan, no-`any` scan, and
`git diff --check`.

M21 commits:

- `a312afe docs(goal): define persisted harness spine`
- `cca472d docs(run): add persisted harness spine ledger`
- `7b04a6c docs(run): record harness persistence inventory`
- `20be514 docs(run): record persisted harness schema decision`
- `64c4bbf feat(db): add harness run repository readback`
- `ef8a749 feat(cli): add explicit persisted plan`
- `6394c65 test(db): add persisted harness plan smoke path`
- `2bdd233 feat(cli): persist evidence capture for harness runs`
- `36c6f2d test(db): add persisted evidence capture smoke path`
- `6c84e8f feat(cli): report harness persistence readiness in doctor`
- `9afd147 docs(run): record persisted harness loop dogfood`
- `2984d01 docs(run): record persisted harness anti-rot audit`

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
M21 stayed inside the existing Postgres/Drizzle boundary. Writes are explicit
through `--persist` or explicit smoke commands. Preview/no-store remains the
default. Evidence capture creates feedback candidates only and does not
auto-apply memory/source/eval updates.

Blockers/risks:
No M21 blocker remains. Later scope: SourceClaim persistence, MemoryCandidate
reviewed promotion, activation over durable memory/source corpus, and worker
execution.

Context selectors:
`GOAL.md`, `PLAN.md`, `docs/handoff/handoff.md`,
`docs/handoff/blockers.md`, `docs/handoff/verification.md`,
package manifests, DB schema/migrations/repositories, CLI
`plan`/`doctor`/`evidence capture`/`db smoke`, and harness/core/source types
for M22.

Next action:
M22: implement SourceClaim persistence plus source-to-decision edges.

Do not reread:
`docs/materials/` or broad historical docs.
