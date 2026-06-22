# Handoff

Objective:
Continue M26 Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton. M26.01 Codex adapter contracts are complete; next implementation
slice is M26.02 execution brief renderer.

Last verified state:
M25 activation engine is complete and pushed. M26.00 found an existing
`packages/codex-adapter` renderer that already powers inline `krn plan` brief
output. Live preview `krn plan --task "render Codex execution brief for
activated harness run"` passed without DB writes and rendered a bounded
`KRN Codex Execution Brief`. DB-backed doctor passed and reports readiness
through activation, but has no Codex adapter or worker readiness section yet.
`packages/workers` has typed maintenance job definitions and enqueue ports, and
the DB schema already has `worker_jobs` and `outbox_events`, but worker job
types/statuses and repository/smoke behavior are not yet aligned with `GOAL.md`
M26. `pnpm typecheck` passed across 7 workspace packages and
`git diff --check` passed after adding the M26.00 ledger. M26.01 added public
Codex adapter contracts in `packages/codex-adapter/src/contracts.ts` and
exported them from `@krn/codex-adapter`. RED adapter test failed on missing
`./contracts.js`; GREEN adapter test passed with 2 test files and 2 tests.
Full `pnpm typecheck` passed across 7 workspace packages and full `pnpm test`
passed with 19 test files and 101 tests. Core boundary scan found no adapter
import and no new full Codex contracts in `packages/core`; adapter TS hygiene
scan found no `any`, double assertions, or TS suppressions.

Changed files:
`packages/codex-adapter/src/contracts.ts`,
`packages/codex-adapter/src/contracts.test.ts`,
`packages/codex-adapter/src/index.ts`, and
`docs/runs/2026-06-22-codex-adapter-worker/*`.

Decisions:
Use the existing Codex adapter renderer as the seed, but add typed adapter
contracts before broadening CLI/DB smoke behavior. Keep full Codex adapter
types in `packages/codex-adapter`; keep core Codex-agnostic except for
`CodexAdapterPlanRef`. M26.02 should render from the new typed
`ExecutionBrief`/`CodexAdapterPlan` artifact instead of widening formatter
arguments or reimplementing policy in CLI. Use existing Postgres `worker_jobs`
and `outbox_events` for worker skeleton proof; do not add Redis/Kafka or a
daemon. Treat `embed_memory_record`, `skipped`, and `availableAt` versus
`runAfter` as explicit M26.06/M26.07 alignment work.

Blockers/risks:
No hard blocker. M26 is incomplete until adapter contracts, persisted brief
readback, Codex adapter smoke, worker repository/smoke, doctor readiness,
dogfood, and final anti-rot are complete.

Context selectors:
`GOAL.md` M26 section, `docs/KRN_KERNEL.md`,
`docs/architecture/package-boundaries.md`,
`docs/decisions/ADR-0009-canonical-harness-spine.md`,
`packages/codex-adapter/src/contracts.ts`,
`packages/codex-adapter/src/renderExecutionBrief.ts`,
`packages/core/src/capabilityPlan.ts`,
`packages/core/src/codexAdapterPlanRef.ts`,
`packages/harness/src/compiler/compileHarnessPlan.ts`,
`packages/harness/src/compiler/createCapabilityPlan.ts`,
`packages/harness/src/compiler/createEvidenceContract.ts`,
`packages/db/src/schema/events.ts`,
`packages/db/src/repositories/DrizzleHarnessRunRepository.ts`,
`packages/workers/src/*`,
`packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/parseArgs.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, and
`packages/cli/src/runDoctorCommand.ts`.

Next action:
Run `git diff --check`, commit
`feat(codex): add Codex adapter contracts`, push, then start M26.02 execution
brief renderer.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless a later
M26 slice explicitly needs raw source/audit material.
