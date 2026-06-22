# Verification

## Slice 00

Commands run:

```sh
sed -n '1,220p' docs/KRN_KERNEL.md
sed -n '2375,2968p' GOAL.md
sed -n '1,220p' .agents/skills/codex-adapter-plan/SKILL.md
sed -n '1,220p' .agents/skills/brain-store-schema/SKILL.md
sed -n '1,260p' .agents/skills/source-to-decision/SKILL.md
git status --short --branch
find packages -maxdepth 3 -type f | sort | rg 'codex|worker|hook|mcp|capability|plan|execution|job|outbox'
rg -n "CodexAdapterPlan|ExecutionBrief|SkillBinding|HookExpectation|Mcp|MCP|GoalRef|ExecPlan|Subagent|CapabilityPlan|worker_jobs|workerJobs|outbox|WorkerJob|MaintenanceJob|codex brief|--brief|db:smoke:codex|db:smoke:worker" packages package.json docs -g '*.ts' -g '*.json' -g '*.md'
sed -n '1,240p' packages/codex-adapter/src/renderExecutionBrief.ts
sed -n '1,220p' packages/codex-adapter/src/renderExecutionBrief.test.ts
sed -n '1,200p' packages/codex-adapter/src/renderHookExpectations.ts
sed -n '1,220p' packages/codex-adapter/src/renderSkillHints.ts
sed -n '1,220p' packages/core/src/capabilityPlan.ts
sed -n '1,180p' packages/core/src/codexAdapterPlanRef.ts
sed -n '1,240p' packages/workers/src/jobTypes.ts
sed -n '1,240p' packages/workers/src/enqueueMaintenanceJob.ts
sed -n '1,180p' packages/db/src/schema/events.ts
rg -n "workerJobs|worker_jobs|WorkerJob|MaintenanceJob|job_status|worker_job" packages/db/src packages/cli/src package.json -g '*.ts' -g '*.json'
sed -n '1,340p' packages/cli/src/runPlanCommand.ts
sed -n '1,430p' packages/db/src/repositories/DrizzleHarnessRunRepository.ts
sed -n '1,180p' packages/harness/src/repositories/harnessRunRepository.ts
sed -n '1,220p' packages/harness/src/compiler/createCapabilityPlan.ts
sed -n '1,220p' packages/harness/src/compiler/createEvidenceContract.ts
cat package.json
pnpm --filter @krn/cli krn plan --task "render Codex execution brief for activated harness run"
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn doctor
pnpm typecheck
git diff --check
```

Results:

- M26 scope is bounded to adapter rendering and worker job skeletons; Codex
  execution, MCP server, dashboard, API, sandbox orchestration, plugin
  packaging, broad subagents, and broad workers are excluded.
- `packages/codex-adapter` exists and exports execution brief, goal reference,
  ExecPlan reference, hook expectation, and skill hint renderers.
- Current `renderExecutionBrief` is plain and non-mutating, but returns a
  string directly and does not yet expose the typed M26 contracts named in
  `GOAL.md`.
- Current hook expectations are weak: only required evidence command strings.
- `krn plan` already renders `KRN Codex Execution Brief` inline.
- Preview `krn plan` passed without DB writes and rendered a bounded brief with
  abstained context, non-goals, capability plan, tool boundaries, skill hints,
  evidence contract, hook expectations, goal reference, and ExecPlan reference.
- No standalone `krn codex brief --run-id <id>` command exists yet.
- No `--brief` integrated plan flag exists yet.
- `getHarnessRunByExecutionRunId` can load persisted run aggregates, giving
  M26.03 a concrete readback path.
- `CapabilityPlan` exists in core, but no persisted capability-plan table or
  typed readback exists.
- `EvidenceContract` is stored in harness plan metadata, but no typed metadata
  parser exists yet.
- `CodexAdapterPlanRef` exists in core as a reference; no full
  `CodexAdapterPlan` exists yet.
- `worker_jobs` and `outbox_events` exist in the DB schema.
- `packages/workers` defines typed maintenance jobs and enqueue ports, but
  lacks `embed_memory_record`.
- Worker status vocabulary currently includes `dead_letter` and `cancelled`,
  while `GOAL.md` names `skipped`.
- Worker scheduling uses `availableAt`, while `GOAL.md` names `runAfter`.
- No DB-backed `WorkerJobRepository` methods exist yet.
- No `pnpm db:smoke:codex-adapter` or `pnpm db:smoke:worker-jobs` scripts
  exist yet.
- DB-backed doctor passed and reports readiness through activation; it does not
  yet report Codex adapter or worker readiness.
- No Codex invocation runner, MCP server, Redis/Kafka queue, dashboard, public
  API, or broad worker daemon was found in the inspected surfaces.
- `pnpm typecheck` passed across 7 workspace packages.
- `git diff --check` passed.

## Slice 01

Commands run:

```sh
pnpm --filter @krn/codex-adapter test -- contracts.test.ts
pnpm --filter @krn/codex-adapter test -- contracts.test.ts
pnpm typecheck
pnpm test
rg -n "@krn/codex-adapter|CodexSkillBindingHint|CodexHookExpectation|CodexMcpResourceRef|CodexSubagentProbeHint|CodexAdapterPlan" packages/core/src packages/core/package.json
rg -n "\bany\b|as unknown as|// @ts-ignore|// @ts-expect-error" packages/codex-adapter/src --glob '*.ts'
```

Results:

- RED adapter test failed because `./contracts.js` did not exist.
- Added `packages/codex-adapter/src/contracts.ts`.
- Exported adapter contracts from `packages/codex-adapter/src/index.ts`.
- GREEN adapter test passed with 2 test files and 2 tests.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed with 19 test files and 101 tests.
- Core boundary scan found no adapter import and no new full Codex binding
  contracts in `packages/core`; only existing `CodexAdapterPlanRef` remains.
- Adapter TypeScript hygiene scan returned no matches for `any`, double
  assertions, or TypeScript suppressions.

## Slice 02

Commands run:

```sh
pnpm --filter @krn/codex-adapter test -- renderExecutionBrief.test.ts
pnpm --filter @krn/codex-adapter test -- renderExecutionBrief.test.ts
pnpm --filter @krn/codex-adapter typecheck
pnpm --filter @krn/codex-adapter typecheck
pnpm typecheck
pnpm test
rg -n "@krn/codex-adapter|CodexSkillBindingHint|CodexHookExpectation|CodexMcpResourceRef|CodexSubagentProbeHint|CodexAdapterPlan" packages/core/src packages/core/package.json
rg -n "\bany\b|as unknown as|// @ts-ignore|// @ts-expect-error" packages/codex-adapter/src --glob '*.ts'
pnpm --filter @krn/cli krn plan --task "render Codex execution brief for activated harness run"
```

Results:

- RED renderer test failed because `createExecutionBrief` was not a function
  and the existing wrapper did not render `What This Does Not Prove`.
- Added typed `createExecutionBrief(input): ExecutionBrief`.
- Added `renderExecutionBriefText(brief): string`.
- Kept `renderExecutionBrief(input): string` as a compatibility wrapper.
- Added typed skill binding hint creation and phase-aware hook expectation
  creation.
- GREEN renderer test passed with 2 test files and 4 tests.
- First package typecheck failed on stale refactor code: unused
  `renderHookExpectations`, unused `renderCapabilityPlan`, then missing
  `CapabilityPlan` type import. The stale helper/import were removed and the
  required type import was restored.
- Package typecheck then passed.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed with 19 test files and 103 tests.
- Core boundary scan found no adapter import and no new full Codex contracts in
  `packages/core`; only existing `CodexAdapterPlanRef` remains.
- Adapter TypeScript hygiene scan returned no matches for `any`, double
  assertions, or TypeScript suppressions.
- Live `krn plan` preview passed without DB writes and rendered current task
  contract, explicit exclusions, source claims used, memory records used,
  anti-memory warnings, tool boundaries, evidence contract, phase-aware hook
  expectations, skill binding hints, MCP refs, subagent hints, goal/ExecPlan
  refs, stop condition, rollback expectation, next action, and
  what-this-does-not-prove.

## Slice 03

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli typecheck
pnpm --filter @krn/cli typecheck
pnpm typecheck
pnpm test
rg -n "\bany\b|as unknown as|// @ts-ignore|// @ts-expect-error" packages/cli/src/runCodexBriefCommand.ts packages/cli/src/parseArgs.ts packages/cli/src/runCli.ts
rg -n "createExecutionRun|createEvidenceBundle|createMemory|promoteMemory|recordMemory|spawn|Codex invocation" packages/cli/src/runCodexBriefCommand.ts
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn codex brief --run-id bb33bd3d-02df-4ff3-839b-6f545de88b4c
```

Results:

- RED CLI test failed for `krn codex brief --run-id` because the command did
  not exist and returned exit code `2`.
- Added parser support for `krn codex brief --run-id <id>`.
- Added `runCodexBriefCommand`.
- Added CLI dispatcher and package export.
- GREEN CLI test passed with 56 tests.
- Initial CLI typecheck failed because `CreateDatabaseRuntime` was imported
  from `databaseRuntime` instead of `runPlanCommand`; fixing the type import
  made package typecheck pass.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed with 19 test files and 105 tests.
- CLI TypeScript hygiene scan returned no matches for `any`, double
  assertions, or TypeScript suppressions.
- Write-surface scan found no write methods in `runCodexBriefCommand`; only
  the output line `Codex invocation: none` matched.
- Live DB-backed `krn codex brief --run-id
  bb33bd3d-02df-4ff3-839b-6f545de88b4c` passed. It rendered read-only
  Postgres output with no Codex invocation, no memory mutation, persisted
  source claims used, persisted memory records used, tool boundaries, evidence
  contract, hook expectations, skill binding hints, stop condition, rollback
  expectation, and what-this-does-not-prove.

## Slice 04

Commands run:

```sh
pnpm --filter @krn/codex-adapter test -- renderHookExpectations.test.ts
pnpm --filter @krn/codex-adapter test -- renderHookExpectations.test.ts
pnpm --filter @krn/codex-adapter test
pnpm --filter @krn/codex-adapter typecheck
git diff --check
rg -n "\bany\b|as unknown as|// @ts-ignore|// @ts-expect-error" packages/codex-adapter/src --glob '*.ts'
rg -n "@krn/codex-adapter|CodexHookExpectationProjection|CodexHookExpectation|CodexAdapterPlan" packages/core/src packages/core/package.json
find .codex -maxdepth 3 -type f | sort
pnpm typecheck
pnpm test
```

Results:

- RED hook projection test failed because
  `createCodexHookExpectationProjection` was not a function.
- Added `CodexHookExpectationProjection`.
- Added `createCodexHookExpectationProjection`.
- Added `renderHookExpectationProjection`.
- Kept `createCodexHookExpectations` and `renderHookExpectations` as
  projection-backed compatibility helpers.
- Hook expectations now project `applies_to` details for compact pointers,
  destructive paths, generated files, write approval, tool boundary notes,
  command evidence, failure/success signals, compact handoff, and evidence
  capture suggestion.
- Projection rules explicitly say expectations/projections only, no hidden
  semantic decisions, and no hook scripts unless conventional and
  decision-recorded.
- Projection does-not-do entries include no hook script creation, no hook
  execution, no hidden semantic decisions, no Codex invocation, and no memory
  mutation.
- GREEN hook projection test passed with 3 test files and 6 tests.
- Full `@krn/codex-adapter` test passed with 3 test files and 6 tests.
- `pnpm --filter @krn/codex-adapter typecheck` passed.
- `git diff --check` passed.
- Adapter TypeScript hygiene scan returned no matches for `any`, double
  assertions, or TypeScript suppressions.
- Core boundary scan found only the existing `CodexAdapterPlanRef`; no
  `@krn/codex-adapter` import or full hook projection contract entered core.
- `.codex` scan found only `.codex/agents/ts-type-critic.toml`; no hook
  scripts were created.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed with 20 test files and 107 tests.

## Slice 05

Commands run:

```sh
pnpm --filter @krn/cli test -- codexAdapterSmoke.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli test -- codexAdapterSmoke.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:codex-adapter
KRN_DATABASE_URL=postgres://krn:krn@127.0.0.1:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@127.0.0.1:54329/krn pnpm db:smoke:codex-adapter
docker compose up -d krn-postgres
docker compose ps krn-postgres
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:codex-adapter
git diff --check
rg -n "\bany\b|as unknown as|// @ts-ignore|// @ts-expect-error" packages/cli/src/codexAdapterSmoke.ts packages/cli/src/runDbSmokeCommand.ts packages/cli/src/parseArgs.ts
rg -n "@krn/codex-adapter" packages/db/src packages/db/package.json packages/core/src packages/core/package.json
rg -n "codex\.invoked|codex\.executed|codex\.execution\.started|invoke Codex|Codex invocation" packages/cli/src/codexAdapterSmoke.ts packages/cli/src/runDbSmokeCommand.ts
pnpm typecheck
pnpm test
```

Results:

- RED formatter test failed because `./codexAdapterSmoke.js` did not exist.
- RED CLI test failed because `krn db smoke codex-adapter` returned usage exit
  code `2`.
- Added `packages/cli/src/codexAdapterSmoke.ts`.
- Added root script `pnpm db:smoke:codex-adapter`.
- Added CLI target `krn db smoke codex-adapter`.
- Smoke orchestration lives in `packages/cli` to preserve package boundaries:
  DB repositories persist/read state, Codex adapter renders the brief, and CLI
  composes the two.
- GREEN formatter/CLI tests passed with 2 test files and 58 tests.
- `pnpm --filter @krn/cli typecheck` passed.
- Initial live smoke/readiness attempts failed with `CONNECT_TIMEOUT` because
  local `krn-postgres` was not responding on `localhost` or `127.0.0.1`.
- `docker compose up -d krn-postgres` started the local pgvector Postgres
  service.
- `docker compose ps krn-postgres` reported the service healthy on host port
  `54329`.
- `pnpm db:ready` passed with Postgres reachable, 6 expected/applied
  migrations, and pgvector available.
- Live `pnpm db:smoke:codex-adapter` passed:
  - readback matched execution run
    `b2fe593f-76e7-4620-bf6b-ac363f330195`;
  - context assembly was `9b038fa2-9827-445d-a444-e13305e49e69`;
  - objective, non-goals, explicit exclusions, and evidence contract were
    present;
  - source claims used: 1;
  - memory records used: 1;
  - hook expectations: 5;
  - Codex invocations: 0;
  - cleanup remaining marker count: 0.
- `git diff --check` passed.
- CLI TypeScript hygiene scan returned no matches for `any`, double
  assertions, or TypeScript suppressions.
- Package-boundary scan returned no `@krn/codex-adapter` import in
  `packages/db` or `packages/core`.
- Codex invocation surface scan only found expected non-goal text and the
  explicit zero-invocation event-type guard.
- `pnpm typecheck` passed across 7 workspace packages.
- `pnpm test` passed with 21 test files and 109 tests.
