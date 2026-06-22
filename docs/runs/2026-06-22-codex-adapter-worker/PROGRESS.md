# Progress

Goal: M26 - Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton.

Current slice: Slice 04 hook expectation projection complete.

Completed:

- M25 activation engine is complete and pushed through
  `0933299 docs(handoff): update activation engine status`.
- M26 run ledger was created under
  `docs/runs/2026-06-22-codex-adapter-worker/`.
- Slice 00 inventoried the current Codex adapter package, `krn plan` brief
  rendering, capability plan, hook expectation seed, Goal/ExecPlan reference
  renderers, worker package, `worker_jobs`/`outbox_events` schema, CLI smoke
  routing, doctor routing, and package scripts.
- Slice 00 recorded source-to-decision implications in `DECISIONS.md`.
- Slice 01 added public Codex adapter contract types in
  `packages/codex-adapter/src/contracts.ts`.
- Slice 01 exported `CodexAdapterPlan`, `ExecutionBrief`,
  `CodexSkillBindingHint`, `CodexHookExpectation`, `CodexMcpResourceRef`,
  `CodexGoalRef`, `CodexExecPlanRef`, and `CodexSubagentProbeHint` from
  `@krn/codex-adapter`.
- Slice 01 kept full Codex contracts out of `packages/core`; core still only
  has the existing `CodexAdapterPlanRef`.
- Slice 02 added `createExecutionBrief` and `renderExecutionBriefText` so the
  Codex adapter renders from a typed `ExecutionBrief` artifact before text.
- Slice 02 upgraded the brief text with current task contract, explicit
  exclusions, source claims used, memory records used, anti-memory warnings,
  tool boundaries, typed skill binding hints, phase-aware hook expectations,
  MCP refs, subagent hints, stop condition, rollback expectation, next action,
  and what-this-does-not-prove.
- Slice 02 kept the existing `renderExecutionBrief(input)` wrapper stable for
  `krn plan`.
- Slice 03 added read-only CLI command `krn codex brief --run-id <id>`.
- Slice 03 loads persisted harness run aggregates by execution run ID, validates
  evidence contract metadata when present, reconstructs a transient capability
  plan, and renders the typed Codex execution brief without writes.
- Slice 03 uses a default read-only DB connection path instead of
  `createDatabaseRuntime`, avoiding workspace/project creation for brief
  readback.
- Slice 04 added typed `CodexHookExpectationProjection`.
- Slice 04 projects the M26.04 hook phases and expectations:
  `SessionStart`, `PreToolUse`, `PostToolUse`, `PreCompact`, and `Stop`.
- Slice 04 keeps hook behavior as expectations/projections only: no generated
  hook scripts, no hidden semantic decisions, no Codex invocation, and no
  memory mutation.
- Slice 04 renders `applies_to` details for hook expectations in the execution
  brief text.
- Slice 04 was committed and pushed as
  `97154a0 feat(codex): add hook expectation projection`.

Verification:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M26 ledger creation.
- Targeted read of `docs/KRN_KERNEL.md`: passed.
- Targeted read of `GOAL.md` M26 section: passed.
- Targeted reads of Codex adapter, harness compiler, capability/evidence
  contract, DB events schema, worker package, CLI plan/smoke/doctor routing,
  package scripts, package boundaries, and ADR-0009: passed.
- `pnpm --filter @krn/cli krn plan --task "render Codex execution brief for
  activated harness run"`: passed with preview abstention, zero writes, and
  rendered `KRN Codex Execution Brief`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and showed readiness through activation, with
  no Codex adapter or worker readiness section yet.
- `pnpm typecheck`: passed across 7 workspace packages.
- `git diff --check`: passed.
- Slice 01 RED: `pnpm --filter @krn/codex-adapter test --
  contracts.test.ts` failed because `./contracts.js` did not exist.
- Slice 01 GREEN: `pnpm --filter @krn/codex-adapter test --
  contracts.test.ts` passed with 2 test files and 2 tests.
- `pnpm typecheck`: passed across 7 workspace packages after adding contracts.
- `pnpm test`: passed with 19 test files and 101 tests.
- Core boundary scan found no `@krn/codex-adapter` import and no new Codex
  binding contracts in `packages/core`; only the existing `CodexAdapterPlanRef`
  remains.
- Adapter TypeScript hygiene scan found no `any`, no `as unknown as`, no
  `@ts-ignore`, and no `@ts-expect-error`.
- Slice 02 RED: `pnpm --filter @krn/codex-adapter test --
  renderExecutionBrief.test.ts` failed because `createExecutionBrief` was not a
  function and the old wrapper did not render `What This Does Not Prove`.
- Slice 02 GREEN: `pnpm --filter @krn/codex-adapter test --
  renderExecutionBrief.test.ts` passed with 2 test files and 4 tests.
- Initial Slice 02 package typecheck failed on stale refactor code:
  unused `renderHookExpectations`, unused `renderCapabilityPlan`, then missing
  `CapabilityPlan` type import.
- `pnpm --filter @krn/codex-adapter typecheck`: passed after the cleanup.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed with 19 test files and 103 tests.
- Slice 02 core boundary scan found no adapter import and no new full Codex
  binding contracts in `packages/core`; only existing `CodexAdapterPlanRef`
  remains.
- Slice 02 adapter TypeScript hygiene scan found no `any`, no `as unknown as`,
  no `@ts-ignore`, and no `@ts-expect-error`.
- `pnpm --filter @krn/cli krn plan --task "render Codex execution brief for
  activated harness run"`: passed and rendered the new typed brief sections in
  no-store preview mode.
- Slice 03 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed for the
  new `codex brief` tests with exit code `2` because the command did not
  exist.
- Slice 03 GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with
  56 tests.
- Initial Slice 03 CLI typecheck failed because `CreateDatabaseRuntime` was
  imported from the wrong module; the import was moved to `runPlanCommand`.
- `pnpm --filter @krn/cli typecheck`: passed.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed with 19 test files and 105 tests.
- Slice 03 CLI hygiene scan found no `any`, no `as unknown as`, no
  `@ts-ignore`, and no `@ts-expect-error`.
- Slice 03 write-surface scan found no write methods in
  `runCodexBriefCommand`; only the output line `Codex invocation: none`
  matched.
- DB-backed `krn codex brief --run-id
  bb33bd3d-02df-4ff3-839b-6f545de88b4c`: passed and rendered the M25 dogfood
  run with read-only Postgres, no Codex invocation, no memory mutation, source
  claims used, memory records used, and evidence expectations.
- Slice 04 RED: `pnpm --filter @krn/codex-adapter test --
  renderHookExpectations.test.ts` failed because
  `createCodexHookExpectationProjection` did not exist.
- Slice 04 GREEN: `pnpm --filter @krn/codex-adapter test --
  renderHookExpectations.test.ts` passed with 3 test files and 6 tests.
- `pnpm --filter @krn/codex-adapter test`: passed with 3 test files and
  6 tests.
- `pnpm --filter @krn/codex-adapter typecheck`: passed.
- `git diff --check`: passed.
- Slice 04 adapter TypeScript hygiene scan found no `any`, no `as unknown as`,
  no `@ts-ignore`, and no `@ts-expect-error`.
- Slice 04 core boundary scan found no adapter import and no new full Codex
  binding contracts in `packages/core`; only the existing
  `CodexAdapterPlanRef` remains.
- Slice 04 `.codex` scan found no hook scripts; only
  `.codex/agents/ts-type-critic.toml` exists.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed with 20 test files and 107 tests.

Next:

- Start M26.05 Codex adapter smoke path.
