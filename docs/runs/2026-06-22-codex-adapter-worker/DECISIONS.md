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
