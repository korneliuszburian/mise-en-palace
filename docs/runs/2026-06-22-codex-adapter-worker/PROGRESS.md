# Progress

Goal: M26 - Codex Adapter Execution Brief + Hook Expectations + Worker Job
Skeleton.

Current slice: Slice 01 Codex adapter contracts complete.

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

Next:

- Run `git diff --check`.
- Commit Slice 01 as `feat(codex): add Codex adapter contracts`.
- Start M26.02 execution brief renderer.
