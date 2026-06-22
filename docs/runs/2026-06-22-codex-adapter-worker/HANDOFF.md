# Handoff

Objective:
Continue M26 Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton. M26.06 worker job schema alignment is complete; next implementation
slice is M26.07 WorkerJobRepository methods.

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
scan found no `any`, double assertions, or TS suppressions. M26.02 added typed
`createExecutionBrief` and `renderExecutionBriefText`, kept the existing
`renderExecutionBrief` wrapper stable, and upgraded live `krn plan` preview
output with explicit source claims, memory records, anti-memory warnings,
phase-aware hook expectations, stop condition, rollback expectation, and
what-this-does-not-prove. Full `pnpm typecheck` passed across 7 workspace
packages and full `pnpm test` passed with 19 test files and 103 tests after
M26.02. Live no-store `krn plan` preview passed with the new brief sections.
M26.03 added `krn codex brief --run-id <id>` as a read-only Postgres command.
CLI tests passed with 56 tests, full `pnpm typecheck` passed across 7 workspace
packages, and full `pnpm test` passed with 19 test files and 105 tests. Live
DB-backed brief rendering passed for execution run
`bb33bd3d-02df-4ff3-839b-6f545de88b4c`, with read-only Postgres output, no
Codex invocation, no memory mutation, source claims used, memory records used,
tool boundaries, evidence contract, hook expectations, skill hints, stop
condition, rollback expectation, and what-this-does-not-prove. M26.04 added a
typed `CodexHookExpectationProjection`, projection-backed helper functions, and
hook `applies_to` rendering in the execution brief. RED hook projection test
failed on the missing projection function; GREEN adapter tests passed with 3
test files and 6 tests, adapter typecheck passed, full `pnpm typecheck`
passed across 7 workspace packages, and full `pnpm test` passed with 20 test
files and 107 tests. Slice 04 was committed and pushed as
`97154a0 feat(codex): add hook expectation projection`. M26.05 added
`pnpm db:smoke:codex-adapter` and `krn db smoke codex-adapter`. The smoke path
creates marker-scoped source, memory, search, anti-memory, harness, and
execution-run records, reads the persisted run aggregate back through
`getHarnessRunByExecutionRunId`, renders the Codex execution brief, verifies
objective/non-goals/exclusions/evidence/source/memory/hook proof, verifies zero
Codex invocation events, and cleans up marker rows to zero. Live DB smoke
passed after local `krn-postgres` was started. Full `pnpm typecheck` passed
across 7 workspace packages and full `pnpm test` passed with 21 test files and
109 tests after M26.05. M26.06 added `embed_memory_record`, changed the public
worker skeleton contract to `jobType` and `runAfter`, added target worker
status `skipped`, mapped Drizzle `workerJobs.jobType` to SQL `type`, mapped
Drizzle `workerJobs.runAfter` to SQL `available_at`, and generated migration
`0006_lucky_ken_ellis.sql` to add `skipped` to `worker_job_status`. RED worker
and DB schema tests failed on the missing M26 worker contract. GREEN targeted
tests passed, `pnpm --filter @krn/db db:check` passed, full `pnpm typecheck`
passed across 7 workspace packages, full `pnpm test` passed with 22 test files
and 112 tests, and live `pnpm db:ready` passed with 7 expected/applied
migrations and pgvector available.

Changed files:
`packages/codex-adapter/src/contracts.ts`,
`packages/codex-adapter/src/contracts.test.ts`,
`packages/codex-adapter/src/index.ts`, and
`packages/codex-adapter/src/renderExecutionBrief.ts`,
`packages/codex-adapter/src/renderExecutionBrief.test.ts`,
`packages/codex-adapter/src/renderHookExpectations.ts`,
`packages/codex-adapter/src/renderHookExpectations.test.ts`,
`packages/codex-adapter/src/renderSkillHints.ts`, and
`packages/cli/src/codexAdapterSmoke.ts`,
`packages/cli/src/codexAdapterSmoke.test.ts`,
`packages/cli/src/runCodexBriefCommand.ts`,
`packages/cli/src/parseArgs.ts`,
`packages/cli/src/runCli.ts`,
`packages/cli/src/index.ts`,
`packages/cli/src/runCli.test.ts`, and
`packages/cli/src/runDbSmokeCommand.ts`,
`packages/db/src/schema/events.ts`,
`packages/db/src/schema/events.test.ts`,
`packages/db/src/migrations/0006_lucky_ken_ellis.sql`,
`packages/db/src/migrations/meta/0006_snapshot.json`,
`packages/db/src/migrations/meta/_journal.json`,
`packages/workers/src/jobTypes.ts`,
`packages/workers/src/enqueueMaintenanceJob.ts`,
`packages/workers/src/index.test.ts`,
`package.json`, and
`docs/runs/2026-06-22-codex-adapter-worker/*`.

Decisions:
Use the existing Codex adapter renderer as the seed, but add typed adapter
contracts before broadening CLI/DB smoke behavior. Keep full Codex adapter
types in `packages/codex-adapter`; keep core Codex-agnostic except for
`CodexAdapterPlanRef`. M26.02 should render from the new typed
`ExecutionBrief`/`CodexAdapterPlan` artifact instead of widening formatter
arguments or reimplementing policy in CLI. M26.03 loads persisted harness run
state, validates evidence-contract metadata, creates the typed brief, and
prints without writes or Codex invocation. M26.04 models hook behavior as a
typed projection only: no hook scripts, no hidden semantic decisions, no Codex
invocation, and no memory mutation. M26.05 keeps Codex adapter smoke
orchestration in `packages/cli`, not `packages/db`, because DB must not render
Codex-specific adapter surfaces. Use existing Postgres `worker_jobs` and
`outbox_events` for worker skeleton proof; do not add Redis/Kafka or a daemon.
M26.06 aligns the public worker contract with `jobType`, `runAfter`,
`embed_memory_record`, and `skipped`. It keeps SQL columns `type` and
`available_at` stable through Drizzle property aliases, and retains legacy DB
enum values `dead_letter` / `cancelled` as inert compatibility values while
the public worker lifecycle uses `queued`, `running`, `succeeded`, `failed`,
and `skipped`.

Blockers/risks:
No hard blocker. M26 is incomplete until WorkerJobRepository methods, worker
job smoke, doctor readiness, dogfood, final anti-rot, and final handoff are
complete.

Context selectors:
`GOAL.md` M26 section, `docs/KRN_KERNEL.md`,
`docs/architecture/package-boundaries.md`,
`docs/decisions/ADR-0009-canonical-harness-spine.md`,
`packages/codex-adapter/src/contracts.ts`,
`packages/codex-adapter/src/renderExecutionBrief.ts`,
`packages/codex-adapter/src/renderHookExpectations.ts`,
`packages/core/src/capabilityPlan.ts`,
`packages/core/src/codexAdapterPlanRef.ts`,
`packages/harness/src/compiler/compileHarnessPlan.ts`,
`packages/harness/src/compiler/createCapabilityPlan.ts`,
`packages/harness/src/compiler/createEvidenceContract.ts`,
`packages/db/src/schema/events.ts`,
`packages/db/src/schema/retrieval.ts`,
`packages/db/src/repositories/DrizzleHarnessRunRepository.ts`,
`packages/workers/src/*`,
`packages/cli/src/runPlanCommand.ts`,
`packages/cli/src/parseArgs.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, and
`packages/cli/src/codexAdapterSmoke.ts`,
`packages/cli/src/runDoctorCommand.ts`.

Next action:
Start M26.07 WorkerJobRepository methods.

Do not reread:
`docs/materials/`, broad historical docs, or old repo topology unless a later
M26 slice explicitly needs raw source/audit material.
