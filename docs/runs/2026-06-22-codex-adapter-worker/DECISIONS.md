# Decisions

- Treat `GOAL.md` M26 as the active execution contract.
- Use `docs/runs/2026-06-22-codex-adapter-worker/` as the compact M26 run
  ledger. It is audit/handoff material only, not runtime memory.

## Slice 00 Decisions

- Source: `docs/KRN_KERNEL.md`.
  Mechanism: Codex surfaces are adapters over the canonical harness spine; the
  product brain remains bounded context, store-backed memory, source grounding,
  evidence, review, and feedback.
  KRN implication: M26 should render adapter outputs and worker skeletons, not
  execute Codex or create a new product runtime.
  Decision: extend `packages/codex-adapter`, CLI readback, and DB smoke/doctor
  proof in later M26 slices; do not build MCP server, dashboard, API, agent
  runner, sandbox orchestration, or broad worker runtime.
  Rejection/falsifier: if M26 code invokes Codex, spawns agents, or makes
  adapter output a second brain, the milestone is off-contract.

- Source: `docs/architecture/package-boundaries.md` and
  `docs/decisions/ADR-0009-canonical-harness-spine.md`.
  Mechanism: import direction is `codex-adapter -> core, harness`; core stays
  Codex-agnostic and represents skill need as `CapabilityRequirement`.
  KRN implication: full Codex contracts belong in `packages/codex-adapter`,
  not `packages/core`.
  Decision: keep `CodexAdapterPlanRef` in core as a reference only; add
  `CodexAdapterPlan`, skill binding hints, hook expectations, MCP refs, goal
  refs, ExecPlan refs, and subagent probe hints in the adapter package.
  Rejection/falsifier: any `@krn/codex-adapter` import or Codex-specific skill
  binding object in `packages/core` violates the boundary.

- Source: `packages/codex-adapter/src/renderExecutionBrief.ts` and
  `packages/cli/src/runPlanCommand.ts`.
  Mechanism: `krn plan` already renders a bounded brief from task contract,
  harness plan, context assembly, capability plan, and evidence contract.
  KRN implication: M26.02 should evolve the existing renderer into a typed
  brief artifact rather than creating a parallel formatter.
  Decision: keep the current renderer as the seed, add typed intermediate
  contracts, then flatten to text/JSON from that artifact.
  Rejection/falsifier: if CLI reimplements brief policy instead of calling the
  adapter renderer, adapter behavior will drift.

- Source: live preview command
  `pnpm --filter @krn/cli krn plan --task "render Codex execution brief for activated harness run"`.
  Mechanism: preview mode rendered `KRN Codex Execution Brief` with abstained
  context, non-goals, capability plan, tool boundaries, skill hints, evidence
  contract, hook expectations, goal reference, and ExecPlan reference without
  DB writes.
  KRN implication: renderer viability is proven in preview, but persisted
  readback is not.
  Decision: M26.03 must load a persisted execution run by ID and render a brief
  without recompiling or mutating state.
  Rejection/falsifier: if `krn codex brief --run-id` cannot render from stored
  run/context/evidence records, the adapter is not connected to the harness
  spine.

- Source: `packages/codex-adapter/src/renderHookExpectations.ts`.
  Mechanism: current hook expectations are just required evidence command
  strings.
  KRN implication: M26.04 still needs a real projection for `SessionStart`,
  `PreToolUse`, `PostToolUse`, `PreCompact`, and `Stop` expectations.
  Decision: preserve the current command-derived hints as a weak seed, but add
  phase-aware typed hook expectations before claiming M26 hook readiness.
  Rejection/falsifier: if hook readiness is based only on required command
  strings, it is too weak.

- Source: `packages/db/src/schema/events.ts` and `packages/workers/src/*`.
  Mechanism: DB already has `worker_jobs` and `outbox_events`; worker package
  already has typed enqueue ports and maintenance job descriptions.
  KRN implication: M26 worker work should tighten and prove the existing
  Postgres job/outbox path, not introduce Redis/Kafka or a daemon.
  Decision: add missing job types/status alignment, DB-backed repository
  methods, and self-cleaning smoke around the existing tables.
  Rejection/falsifier: if worker proof requires an external queue or background
  loop, it violates M26 worker semantics.

- Source: `GOAL.md` M26 worker semantics.
  Mechanism: required job types include `embed_memory_record`, and statuses
  include `skipped`.
  KRN implication: current worker package and DB status vocabulary are close
  but not aligned with the current goal.
  Decision: M26.06/M26.07 must explicitly reconcile `embed_memory_record`,
  `skipped`, and `availableAt` vs `runAfter` rather than silently accepting the
  older worker vocabulary.
  Status after Slice 06: worker package and Drizzle schema vocabulary are
  reconciled; DB-backed repository methods and smoke proof remain for
  M26.07/M26.08.
  Rejection/falsifier: if `pnpm db:smoke:worker-jobs` cannot enqueue and
  transition every required job type, worker skeleton proof is incomplete.

## Slice 00 Skill Record

- `codex-adapter-plan`: used to classify renderer, skill hint, hook, MCP ref,
  Goal/ExecPlan ref, and execution-brief boundaries.
- `brain-store-schema`: used to inventory `worker_jobs`, `outbox_events`, and
  missing DB-backed worker repository/smoke behavior.
- `source-to-decision`: used to convert local code/docs evidence into
  decisions, rejections, and falsifiers.

## Slice 01 Decisions

- Source: `GOAL.md` M26.01 and
  `docs/architecture/package-boundaries.md`.
  Mechanism: M26 needs Codex-specific adapter contracts, while core must remain
  Codex-agnostic.
  KRN implication: adapter contracts are public `@krn/codex-adapter` exports,
  not core domain fields.
  Decision: add `contracts.ts` in `packages/codex-adapter` and export
  `CodexAdapterPlan`, `ExecutionBrief`, skill binding hints, hook
  expectations, MCP refs, goal refs, ExecPlan refs, and subagent probe hints
  from the adapter package.
  Rejection/falsifier: if core imports `@krn/codex-adapter` or owns full Codex
  hook/skill/MCP contracts, the boundary is wrong.

- Source: `packages/codex-adapter/src/contracts.test.ts`.
  Mechanism: the contract test constructs a bounded adapter plan that contains
  execution brief, explicit inclusions/exclusions, skill hints, hook
  expectations, MCP refs, goal/ExecPlan refs, subagent probe hints, stop
  condition, rollback expectation, and does-not-prove statements.
  KRN implication: M26.02 can render from a typed intermediate artifact rather
  than raw formatter arguments.
  Decision: keep the contract object explicit and inspectable; do not add a
  renderer-side Codex invocation or mutation API.
  Rejection/falsifier: if later renderer code cannot consume this typed
  artifact without widening to `any`, the contract is insufficient.

## Slice 01 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN contract coverage
  before adding production exports.
- `codex-adapter-plan`: used to keep contract vocabulary at the Codex adapter
  boundary.
- `typescript-type-safety`: used for public adapter API shape, core boundary
  scan, and no-`any` implementation.
- `superpowers:verification-before-completion`: used before claiming tests or
  typecheck passed.

## Slice 01 Type-Safety Notes

- Boundary classification: public Codex adapter API.
- Validation/narrowing: no external input boundary added in this slice; later
  CLI/DB metadata parsing must validate `unknown` before creating these
  contracts.
- Public type changes: `@krn/codex-adapter` now exports
  `CodexAdapterPlan`, `ExecutionBrief`, `CodexSkillBindingHint`,
  `CodexHookExpectation`, `CodexMcpResourceRef`, `CodexGoalRef`,
  `CodexExecPlanRef`, `CodexSubagentProbeHint`, and related unions.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions, and no `@krn/codex-adapter` import in core.

## Slice 02 Decisions

- Source: `GOAL.md` M26.02 and `packages/codex-adapter/src/contracts.ts`.
  Mechanism: M26 requires a bounded execution brief with explicit included and
  excluded context, evidence contract, tool boundaries, stop condition,
  rollback expectation, next action, and what-this-does-not-prove.
  KRN implication: renderer should operate on a typed artifact before
  flattening to text so CLI and later JSON output do not reimplement policy.
  Decision: add `createExecutionBrief(input): ExecutionBrief` and
  `renderExecutionBriefText(brief): string`, then keep
  `renderExecutionBrief(input)` as a compatibility wrapper.
  Rejection/falsifier: if CLI needs to inspect formatter internals or rebuild
  brief sections itself, M26.02 did not create the right adapter boundary.

- Source: `packages/codex-adapter/src/renderHookExpectations.ts`.
  Mechanism: previous hook expectations were only required command strings.
  KRN implication: the brief should at least expose phase-aware expectations
  before M26.04 adds the dedicated projection slice.
  Decision: add typed `createCodexHookExpectations` with `SessionStart`,
  `PreToolUse`, `PostToolUse`, `PreCompact`, and `Stop` phases, while keeping
  hook behavior as expectations only.
  Rejection/falsifier: if hook code starts making semantic decisions or running
  hidden scripts, M26 has crossed the adapter boundary.

## Slice 02 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN renderer coverage
  before changing production code.
- `codex-adapter-plan`: used to keep the renderer bounded to Codex-facing
  instructions, references, hints, and evidence expectations.
- `typescript-type-safety`: used for typed `ExecutionBrief` creation and
  adapter public exports without weakening core.
- `superpowers:systematic-debugging`: used when package typecheck exposed
  stale refactor code after the GREEN test.
- `superpowers:verification-before-completion`: used before claiming typecheck,
  tests, and live preview passed.

## Slice 02 Type-Safety Notes

- Boundary classification: adapter renderer public API and compatibility
  wrapper used by CLI.
- Validation/narrowing: no new external input boundary; M26.03 must validate
  persisted metadata before creating the typed brief from DB rows.
- Public type changes: `createExecutionBrief`, `renderExecutionBriefText`,
  `createCodexSkillBindingHints`, and `createCodexHookExpectations` are now
  exported through existing package exports.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions, and no full Codex contracts in core.

## Slice 03 Decisions

- Source: `GOAL.md` M26.03 and
  `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`.
  Mechanism: persisted run aggregate readback already returns task contract,
  harness plan, context assembly, execution run, evidence bundles, review
  assessments, feedback deltas, and run events by execution run ID.
  KRN implication: `krn codex brief --run-id` can render from persisted state
  without recompiling a plan or writing new rows.
  Decision: use `getHarnessRunByExecutionRunId` as the read path for the CLI
  command.
  Rejection/falsifier: if the command creates execution runs, evidence bundles,
  memory records, or source decisions, it violates M26.03.

- Source: `packages/cli/src/databaseRuntime.ts`.
  Mechanism: existing `createDatabaseRuntime` ensures workspace/project rows
  and is appropriate for write paths, but not for read-only brief rendering.
  KRN implication: the default M26.03 runtime must not create workspace/project
  rows just to read a run.
  Decision: add a read-only DB runtime path inside `runCodexBriefCommand` that
  opens Postgres and constructs `DrizzleHarnessRunRepository` directly.
  Rejection/falsifier: if a default `krn codex brief` run writes rows, the
  command is not read-only.

- Source: `GOAL.md` M26.03 output mode note and current CLI style.
  Mechanism: this CLI does not have a general output mode pattern yet.
  KRN implication: adding JSON output here would create a local special case
  before the CLI style exists.
  Decision: implement text output only for M26.03; revisit JSON output when the
  CLI has a shared output-mode convention.
  Rejection/falsifier: if later CLI commands standardize `--output json`, this
  command should join that pattern.

## Slice 03 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN CLI command
  coverage before implementation.
- `codex-adapter-plan`: used to keep the command read-only and focused on
  rendering the adapter brief.
- `typescript-type-safety`: used for CLI parsing, metadata narrowing, and
  read-only repository boundaries.
- `superpowers:systematic-debugging`: used when CLI typecheck exposed the
  wrong type import.
- `superpowers:verification-before-completion`: used before claiming CLI tests,
  typecheck, full tests, and live DB proof passed.

## Slice 03 Type-Safety Notes

- Boundary classification: CLI input, persisted metadata readback, and
  read-only DB adapter boundary.
- Validation/narrowing: `runCodexBriefCommand` treats harness plan metadata as
  `unknown` and narrows the optional evidence contract shape before use; it
  falls back to `createEvidenceContract` if metadata is absent or invalid.
- Public type changes: `CliCommand` now includes `codexBrief`; CLI exports
  `runCodexBriefCommand`.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions.

## Slice 04 Decisions

- Source: `GOAL.md` M26.04.
  Mechanism: hook expectations must cover `SessionStart`, `PreToolUse`,
  `PostToolUse`, `PreCompact`, and `Stop`, while remaining projections only.
  KRN implication: the adapter needs a typed hook expectation projection that
  downstream smoke/doctor checks can inspect without relying on real hook
  scripts.
  Decision: add `CodexHookExpectationProjection` and
  `createCodexHookExpectationProjection(evidenceContract)` in
  `packages/codex-adapter`.
  Rejection/falsifier: if projection proof requires files under `.codex/hooks`
  or hidden hook behavior, M26.04 crossed the boundary.

- Source: `packages/codex-adapter/src/renderHookExpectations.ts`.
  Mechanism: Slice 02 already produced phase-aware expectations but did not
  expose the projection rules or what the projection refuses to do.
  KRN implication: M26.04 should preserve the existing helper surface while
  making the stronger projection explicit.
  Decision: keep `createCodexHookExpectations` and `renderHookExpectations` as
  compatibility helpers backed by the projection artifact.
  Rejection/falsifier: if execution brief rendering and direct hook rendering
  diverge on phase/action semantics, the helpers are not projection-backed.

- Source: `GOAL.md` M26.04 `PostToolUse` expectation and
  `EvidenceContract.commands`.
  Mechanism: command evidence comes from required evidence commands.
  KRN implication: hook projection should reference evidence expectations but
  not run commands or record evidence itself.
  Decision: project required commands as `appliesTo` entries such as
  `command evidence: pnpm typecheck`, plus failure/success signal notes.
  Rejection/falsifier: if this code executes commands or writes evidence
  bundles, it is no longer an adapter projection.

## Slice 04 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN hook projection
  coverage before implementation.
- `codex-adapter-plan`: used to keep hook behavior as Codex-facing
  expectations instead of hook scripts.
- `typescript-type-safety`: used for the public projection contract and
  compatibility helper shape.
- `superpowers:verification-before-completion`: used before claiming adapter
  tests or typecheck passed.

## Slice 04 Type-Safety Notes

- Boundary classification: public Codex adapter projection API.
- Validation/narrowing: no new external input boundary; the projection consumes
  typed `EvidenceContract`.
- Public type changes: `CodexHookExpectationProjection`,
  `createCodexHookExpectationProjection`, and
  `renderHookExpectationProjection`.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions.

## Slice 05 Decisions

- Source: `GOAL.md` M26.05.
  Mechanism: Codex adapter readiness must be proven by a DB smoke command that
  creates or reuses a persisted run with activated context, renders the
  execution brief, verifies required sections and bounded references, verifies
  no Codex execution happened, and cleans up created rows.
  KRN implication: the smoke path must cross DB readback and adapter rendering,
  not only unit-test the renderer.
  Decision: add `pnpm db:smoke:codex-adapter` and `krn db smoke
  codex-adapter`.
  Rejection/falsifier: if the smoke can pass without persisted readback,
  context exclusions, hook expectations, or cleanup count zero, it does not
  satisfy M26.05.

- Source: `docs/architecture/package-boundaries.md`.
  Mechanism: `packages/db` owns Drizzle schema, SQL helpers, and repositories;
  `packages/codex-adapter` owns Codex-facing rendering; `packages/cli` may call
  both as an adapter.
  KRN implication: a DB package smoke helper must not import
  `@krn/codex-adapter` or render Codex-specific surfaces.
  Decision: keep Codex adapter smoke orchestration in `packages/cli` while
  using DB repositories for persistence and readback.
  Rejection/falsifier: if `packages/db` imports `@krn/codex-adapter`, the
  package boundary has regressed.

- Source: `packages/db/src/schema/retrieval.ts` and existing smoke cleanup
  patterns.
  Mechanism: several retrieval/source tables use `onDelete: set null`, so
  deleting a workspace alone does not prove cleanup.
  KRN implication: Codex adapter smoke must clean marker rows explicitly and
  count them after cleanup.
  Decision: cleanup deletes marker `run_events`, the known `retrieval_run`,
  marker `search_documents`, marker `source_artifacts`, and the smoke
  workspace, then counts remaining marker/context rows.
  Rejection/falsifier: if cleanup remaining marker count is non-zero, the smoke
  fails.

## Slice 05 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN smoke formatter and
  CLI target coverage before implementation.
- `codex-adapter-plan`: used to keep smoke output focused on adapter brief
  rendering and proof, not Codex execution.
- `brain-store-schema`: used for marker cleanup and Postgres table lifecycle.
- `source-to-decision`: used to map GOAL/package-boundary/schema evidence into
  implementation decisions and falsifiers.
- `typescript-type-safety`: used for CLI target union, metadata narrowing, and
  smoke report boundaries.
- `superpowers:verification-before-completion`: used before claiming tests,
  typecheck, or live DB smoke passed.

## Slice 05 Type-Safety Notes

- Boundary classification: CLI target parsing, DB persistence/readback, DB JSON
  evidence-contract metadata, and Codex adapter rendering boundary.
- Validation/narrowing: persisted `harnessPlan.metadata.evidenceContract` is
  treated as `unknown` and narrowed before creating an `EvidenceContract`;
  fallback uses `createEvidenceContract`.
- Public type changes: `DbSmokeRuntime["target"]` now includes `codexAdapter`;
  CLI exports a new internal smoke report formatter/check module.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions.

## Slice 06 Decisions

- Source: `GOAL.md` M26.06.
  Mechanism: the worker skeleton must expose job records for
  `embed_source_chunk`, `embed_memory_record`, `compact_memory`,
  `detect_contradiction`, `expire_stale_memory`, and
  `promote_eval_candidate`; target statuses include `skipped`; scheduling is
  named `runAfter`.
  KRN implication: the public worker contract should use the M26 vocabulary
  before DB repository methods and smoke proof are added.
  Decision: add `embed_memory_record`, `workerJobStatuses`, `jobType`, and
  `runAfter` to `packages/workers`.
  Rejection/falsifier: if M26.07 repository methods need to translate from
  older `type` / `availableAt` worker inputs, Slice 06 did not align the
  worker boundary.

- Source: `packages/db/src/schema/events.ts` and generated migration
  `packages/db/src/migrations/0006_lucky_ken_ellis.sql`.
  Mechanism: existing SQL columns are already `type` and `available_at`, and
  Drizzle can expose different TypeScript property names without renaming SQL
  columns; adding `skipped` to the enum is an additive migration.
  KRN implication: M26.06 can align the Drizzle/schema contract with
  `jobType` / `runAfter` while avoiding a destructive or noisy column rename.
  Decision: map `workerJobs.jobType` to SQL `type`, map
  `workerJobs.runAfter` to SQL `available_at`, and add only enum value
  `skipped` in migration SQL.
  Rejection/falsifier: if future smoke proof cannot enqueue/list by
  `jobType` and `runAfter`, or if the migration contains drop/rename behavior,
  this alignment is insufficient.

- Source: existing Postgres enum values in `worker_job_status`.
  Mechanism: removing enum values such as `dead_letter` and `cancelled` is not
  an additive Postgres migration and is not required for job record proof.
  KRN implication: the target worker package lifecycle can be exact without
  risking historical enum-value removal in the DB during M26.06.
  Decision: keep legacy DB enum values inert for compatibility, but expose the
  public worker package lifecycle as `queued`, `running`, `succeeded`,
  `failed`, and `skipped`.
  Rejection/falsifier: if M26.07 or M26.08 uses `dead_letter` or `cancelled`
  as target worker lifecycle states, the worker semantics have drifted from
  `GOAL.md`.

## Slice 06 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN worker contract
  and DB schema coverage before implementation.
- `brain-store-schema`: used for Drizzle worker job schema, enum migration,
  SQL inspection, and migration risk assessment.
- `source-to-decision`: used to map GOAL/schema/migration evidence into
  decisions and falsifiers.
- `typescript-type-safety`: used for worker public types, generic payload
  boundaries, and no-`any` verification.
- `superpowers:verification-before-completion`: used before claiming package
  tests, typecheck, migration checks, or live DB readiness passed.

## Slice 06 Type-Safety Notes

- Boundary classification: public worker package API and DB schema property
  names over existing SQL columns.
- Validation/narrowing: no new external input parser is added in this slice;
  M26.07 repository adapters must narrow DB JSON payloads before returning
  typed worker records.
- Public type changes: `MaintenanceJob` now uses `jobType`; worker scheduling
  now uses `runAfter`; `WorkerJobStatus` is exported from the
  `workerJobStatuses` target lifecycle.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions.

## Slice 07 Decisions

- Source: `GOAL.md` M26.07.
  Mechanism: M26.07 requires repository methods for enqueue, read, queued
  listing, status transitions, and cleanup, while forbidding daemon behavior,
  external side effects, and job execution.
  KRN implication: the worker job proof should add a DB persistence adapter,
  not a worker runtime.
  Decision: add `DrizzleWorkerJobRepository` in `packages/db` with
  `enqueueWorkerJob`, `getWorkerJobById`, `listQueuedWorkerJobs`,
  `markWorkerJobRunning`, `markWorkerJobSucceeded`, `markWorkerJobFailed`,
  `markWorkerJobSkipped`, and `cleanupTestWorkerJobs`.
  Rejection/falsifier: if repository methods execute jobs, call embeddings, or
  require a background loop, M26.07 has crossed into worker runtime scope.

- Source: `docs/architecture/package-boundaries.md` and existing DB repository
  layout.
  Mechanism: `packages/db` owns Drizzle schema and repository
  implementations; `packages/workers` owns worker job definitions and thin
  execution boundaries.
  KRN implication: DB can implement the Postgres adapter while avoiding a new
  package dependency from `packages/db` to `packages/workers`.
  Decision: define DB-local repository record/input types using the same M26
  `jobType` / `runAfter` vocabulary, and add an `enqueue` alias so the adapter
  can structurally satisfy the existing worker enqueue port later without a
  direct import.
  Rejection/falsifier: if future code has to translate from older
  `type` / `availableAt` names or import `@krn/workers` into `packages/db`,
  the boundary is drifting.

- Source: `packages/db/src/schema/events.ts` and Slice 06 decision on legacy
  DB enum values.
  Mechanism: the DB enum still contains inert legacy values
  `dead_letter` and `cancelled`, but the target worker lifecycle is
  `queued`, `running`, `succeeded`, `failed`, and `skipped`.
  KRN implication: repository readback must not silently normalize legacy
  states into target states.
  Decision: `mapWorkerJob` rejects DB-only legacy statuses and unsupported job
  types instead of returning them as target worker records.
  Rejection/falsifier: if worker smoke can pass while reading `dead_letter` or
  `cancelled` as a target lifecycle state, the repository boundary is too
  loose.

## Slice 07 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN repository method
  and mapper coverage before implementation.
- `brain-store-schema`: used for worker job lifecycle persistence and cleanup
  boundaries over `worker_jobs`.
- `source-to-decision`: used to record DB/worker package boundary and legacy
  status decisions.
- `typescript-type-safety`: used for DB JSONB payload narrowing, target status
  narrowing, and `exactOptionalPropertyTypes` correction.
- `superpowers:systematic-debugging`: used when package typecheck exposed the
  optional-property mapper issue.
- `superpowers:verification-before-completion`: used before claiming package
  tests, typecheck, root gates, or scans passed.

## Slice 07 Type-Safety Notes

- Boundary classification: DB row to repository record adapter and public DB
  repository API.
- Validation/narrowing: `mapWorkerJob` narrows SQL `jobType`, target status,
  and JSONB payload before returning `WorkerJobRecord`; unsupported target
  values throw instead of being trusted.
- Public type changes: `@krn/db` repository exports now include worker job
  input/record/result types and `DrizzleWorkerJobRepository`.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions.

## Slice 08 Decisions

- Source: `GOAL.md` M26.08.
  Mechanism: M26.08 requires `pnpm db:smoke:worker-jobs`, DB-required
  enqueue/readback/running/succeeded/skipped/failed transitions, cleanup, and
  cleanup remaining marker count zero.
  KRN implication: worker smoke should prove the DB lifecycle of the worker
  skeleton, not execute maintenance work.
  Decision: add `runWorkerJobSmokeCheck` in `@krn/db` and route
  `krn db smoke worker-jobs` through CLI formatting. The smoke enqueues one
  job per M26 job type, verifies queued readback, transitions all jobs through
  `running`, completes a controlled 2/2/2 succeeded/skipped/failed split, and
  cleans by marker IDs.
  Rejection/falsifier: if the smoke requires a daemon, invokes embeddings,
  performs real maintenance, or leaves marker rows behind, M26.08 is not a
  skeleton smoke proof.

- Source: `docs/KRN_KERNEL.md` runtime truth and `AGENTS.md` no broad worker
  runtime boundary.
  Mechanism: KRN should build selected, verified, store-backed machinery while
  avoiding dashboards, broad multi-agent systems, file-backed runtime memory,
  and broad worker runtime in this phase.
  KRN implication: M26.08 can use Postgres `worker_jobs` as durable state but
  must not add Redis/Kafka, background loops, process spawning, or actual job
  execution.
  Decision: keep the smoke as a synchronous DB proof over existing repository
  methods and leave worker execution to a later accepted milestone.
  Rejection/falsifier: if worker smoke starts long-running behavior or imports
  execution-layer worker code into `packages/db`, the package boundary has
  drifted.

## Slice 08 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN CLI and DB smoke
  coverage before implementation.
- `brain-store-schema`: used for worker job persistence lifecycle, marker
  cleanup, and Postgres-only proof.
- `source-to-decision`: used to map M26.08 and kernel boundaries into the
  smoke/worker runtime decision.
- `typescript-type-safety`: used for public `WorkerJobSmokeReport`, CLI target
  routing, and avoiding `any` or double assertions.
- `superpowers:verification-before-completion`: used before claiming focused
  tests, typecheck, live smoke, root gates, or scans passed.

## Slice 08 Type-Safety Notes

- Boundary classification: CLI args/env, public `@krn/db` smoke helper output,
  and DB repository lifecycle records.
- Validation/narrowing: CLI continues to require `KRN_DATABASE_URL`; DB
  repository readback still narrows `jobType`, lifecycle status, JSONB payload,
  and timestamps before smoke logic consumes records.
- Public type changes: `@krn/db` now exports `WorkerJobSmokeInput`,
  `WorkerJobSmokeReport`, and `runWorkerJobSmokeCheck`.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions.

## Slice 09 Decisions

- Source: `GOAL.md` M26.09.
  Mechanism: M26.09 requires doctor checks for Codex adapter renderer,
  execution brief smoke, hook expectation projection, no Codex execution
  runner, no MCP server, worker job schema, worker job smoke, no Redis/Kafka,
  and no broad worker daemon.
  KRN implication: `krn doctor` should report adapter/worker readiness and
  forbidden surfaces, while remaining a read-only diagnostic command.
  Decision: add `deriveCodexAdapterReadiness`,
  `deriveWorkerJobReadiness`, `checkCodexAdapter`, and `checkWorkerJobs` to the
  CLI doctor path. Doctor reports command availability and surface readiness;
  runtime proof stays in explicit smoke commands run by the operator.
  Rejection/falsifier: if doctor invokes Codex, starts MCP, runs smoke commands,
  starts worker loops, or treats markdown docs as runtime proof, the boundary is
  broken.

- Source: `docs/KRN_KERNEL.md` and `AGENTS.md`.
  Mechanism: KRN should build machinery that verifies context/application
  surfaces without adding dashboard, benchmark, broad multi-agent, file-backed
  memory, MCP, or broad worker runtime in this phase.
  KRN implication: readiness checks can inspect package manifests and concrete
  source entrypoints, but must not scan raw docs as truth or depend on lockfile
  optional peers as runtime infrastructure.
  Decision: narrow forbidden Redis/Kafka detection to project package manifests
  and forbidden Codex/MCP detection to command entrypoints and package paths,
  excluding doctor guard strings and tests.
  Rejection/falsifier: if doctor flags its own labels or optional peer metadata
  as runtime infrastructure, the check is too broad.

## Slice 09 Skill Record

- `superpowers:test-driven-development`: used for RED/GREEN doctor output and
  derive-readiness coverage.
- `superpowers:systematic-debugging`: used to trace false-positive doctor
  blocker output before narrowing scans.
- `source-to-decision`: used to record the read-only doctor boundary and
  forbidden-surface scan scope.
- `typescript-type-safety`: used for exported doctor derive helpers and strict
  file/JSON boundary handling.
- `brain-store-schema`: used to keep worker job readiness tied to existing
  Postgres schema/repository surfaces without schema changes.
- `superpowers:verification-before-completion`: used before claiming live
  doctor, smoke commands, typecheck, tests, or scans passed.

## Slice 09 Type-Safety Notes

- Boundary classification: CLI doctor output, repo file reads, package manifest
  JSON parsing, and static source-surface scans.
- Validation/narrowing: existing `readJsonObject` keeps package JSON as
  `Record<string, unknown>` until script checks narrow string values.
- Public type changes: `runDoctorCommand.ts` now exports
  `deriveCodexAdapterReadiness` and `deriveWorkerJobReadiness` for focused
  tests.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions.

## Slice 10 Decisions

- Source: `GOAL.md` M26.10.
  Mechanism: M26.10 requires a live persisted `krn plan`, read-only
  `krn codex brief`, Codex adapter smoke, worker job smoke, persisted
  evidence capture, and live doctor proof.
  KRN implication: dogfood should use KRN's own persisted harness and adapter
  surfaces to inspect KRN, not rely on chat memory or docs-only assertions.
  Decision: record execution run
  `e6b02685-63ed-48a2-a5cd-07b1a9a64fab` as the M26.10 dogfood run and keep
  the proof in the M26 run ledger.
  Rejection/falsifier: if the run cannot be read back through
  `krn codex brief`, or if evidence capture cannot persist records for the
  run, M26.10 dogfood is incomplete.

- Source: `docs/KRN_KERNEL.md` kernel law and runtime truth.
  Mechanism: KRN supplies bounded context, service/store-backed memory,
  source grounding, traces, review gates, and feedback; Codex executes, and
  KRN must not become an alternative executor.
  KRN implication: dogfood may prove adapter rendering and worker job
  persistence, but it must not invoke Codex, mutate memory automatically,
  start MCP, or execute worker jobs.
  Decision: treat M26.10 as evidence of adapter/readiness/skeleton behavior
  only. The recorded proof explicitly preserves `Codex invocation: none`,
  `Memory mutation: none`, worker job smoke transitions, and cleanup counts.
  Rejection/falsifier: if the dogfood path invokes Codex, starts a server,
  adds a worker daemon, or treats worker jobs as executed maintenance work,
  it violates the kernel boundary.

- Source: `krn evidence capture` behavior and M26.10 live output.
  Mechanism: evidence capture records changed files, skipped command
  placeholders, diff risk, review burden, rollback path, and feedback
  candidates, then persists evidence/review/feedback records when configured.
  KRN implication: persisted capture is evidence ledgering, not test
  execution.
  Decision: record the persisted evidence bundle
  `3ccbf304-fb5a-482a-a30e-8dff95d2a160`, review assessment
  `7cbc61c2-b4c1-4056-a890-21fe5e89c873`, and feedback delta
  `a1f834b7-b3fd-4a81-945e-309451d93cf7`; run final typecheck/test/diff
  separately before commit.
  Rejection/falsifier: if evidence capture claims skipped commands passed,
  the review loop evidence is misleading.

## Slice 10 Skill Record

- `codex-adapter-plan`: used for persisted Codex brief readback and adapter
  boundary checks.
- `evidence-review-loop`: used to record run ID, command proof, diff risk,
  review burden, rollback, and feedback-candidate persistence status.
- `source-to-decision`: used to map GOAL/kernel evidence into decisions and
  non-proof boundaries.
- `typescript-type-safety`: used to classify this as docs-only plus CLI/DB
  boundary verification; no TypeScript source changed in the dogfood slice.
- `superpowers:verification-before-completion`: used before claiming live DB
  readiness, smokes, doctor, or final quality gates passed.

## Slice 10 Type-Safety Notes

- Boundary classification: docs-only ledger update after CLI/env/DB command
  execution; no TypeScript source changed.
- Validation/narrowing: live commands exercised existing CLI env parsing,
  persisted run readback, evidence-contract metadata parsing, and DB repository
  readback paths.
- Public type changes: none.
- Type-safety exceptions: none; no `any`, no double assertions, no TypeScript
  suppressions introduced.
