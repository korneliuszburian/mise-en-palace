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
