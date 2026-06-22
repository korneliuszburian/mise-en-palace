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
