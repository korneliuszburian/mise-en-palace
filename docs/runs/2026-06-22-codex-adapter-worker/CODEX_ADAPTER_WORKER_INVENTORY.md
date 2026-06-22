# Codex Adapter And Worker Inventory

Goal slice: M26.00 - inventory Codex adapter and worker surfaces before
adding contracts, CLI brief readback, DB smokes, or doctor readiness.

## Summary

M26 does not start from zero. The repo already has:

- `packages/codex-adapter` with a plain-text execution brief renderer, goal and
  ExecPlan reference renderers, skill hints, and basic hook expectations;
- `krn plan` inline rendering of `KRN Codex Execution Brief`;
- `packages/workers` with typed maintenance job definitions and enqueue ports;
- Postgres `worker_jobs` and `outbox_events` tables in `packages/db`;
- persisted run aggregate readback through `getHarnessRunByExecutionRunId`.

The current surface is not M26-complete. After Slice 08 it still lacks doctor
readiness for adapter/worker surfaces.

## Files Inspected

- `docs/KRN_KERNEL.md`
- `GOAL.md` M26 section
- `docs/architecture/package-boundaries.md`
- `docs/decisions/ADR-0009-canonical-harness-spine.md`
- `docs/KRN_SOURCES.md`
- `packages/codex-adapter/src/*`
- `packages/core/src/capabilityPlan.ts`
- `packages/core/src/codexAdapterPlanRef.ts`
- `packages/harness/src/compiler/compileHarnessPlan.ts`
- `packages/harness/src/compiler/createCapabilityPlan.ts`
- `packages/harness/src/compiler/createEvidenceContract.ts`
- `packages/harness/src/repositories/harnessRunRepository.ts`
- `packages/db/src/schema/events.ts`
- `packages/db/src/repositories/DrizzleHarnessRunRepository.ts`
- `packages/db/src/index.ts`
- `packages/workers/src/*`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runCli.ts`
- `packages/cli/src/runPlanCommand.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `packages/cli/src/runDoctorCommand.ts`
- `package.json`

## Existing Codex Adapter Surface

| M26 concept | Current surface | Status | Notes |
| --- | --- | --- | --- |
| Execution brief renderer | `renderExecutionBrief(input): string` | partial | Renders objective, non-goals, context inclusions/exclusions, capability plan, evidence contract, hook expectations, goal ref, and ExecPlan ref. It is plain and non-mutating. |
| Codex adapter package | `packages/codex-adapter` | exists | Correct boundary: imports `@krn/core` and `@krn/harness`; core does not import adapter. |
| `CodexAdapterPlan` | none | missing | Core only has `CodexAdapterPlanRef`; adapter package does not yet export a full adapter plan contract. |
| `ExecutionBrief` type | none | missing | Current renderer returns a string directly. M26.01/M26.02 should add a typed brief artifact before CLI/DB smoke rely on it. |
| Skill binding hints | `renderSkillHints(CapabilityPlan)` | partial | Maps capability requirement kinds to skill names. No typed `CodexSkillBindingHint` contract yet. |
| Hook expectations | `createCodexHookExpectationProjection(EvidenceContract)` | available | Projects `SessionStart`, `PreToolUse`, `PostToolUse`, `PreCompact`, and `Stop` as expectations only. It does not create hook scripts or make hidden semantic decisions. |
| MCP refs | none | missing | M26 should model refs only; no MCP server. |
| Goal ref | `renderGoalReference` | partial | String renderer exists, but no typed `CodexGoalRef` contract yet. |
| ExecPlan ref | `renderExecPlanReference` | partial | String renderer exists, but no typed `CodexExecPlanRef` contract yet. |
| Subagent hints | none | missing | No `CodexSubagentProbeHint`; M26 should keep these as hints only. |
| Codex execution | absent | correct | No Codex invocation runner found. |

## Current Plan Output Probe

Command:

```sh
pnpm --filter @krn/cli krn plan --task "render Codex execution brief for activated harness run"
```

Result:

- command passed;
- persistence was disabled;
- context status was `abstained`;
- context included `0`;
- context excluded `0`;
- output included `KRN Codex Execution Brief`;
- output included non-goals: do not invoke Codex, do not spawn agents, do not
  create dashboard;
- output included capability requirements, tool boundaries, skill hints,
  evidence contract, hook expectations, goal reference, and ExecPlan reference;
- no DB writes were performed.

This proves preview rendering works. It does not prove persisted run readback,
standalone `krn codex brief --run-id`, JSON output, DB smoke, or doctor
readiness.

## Harness / Persistence Surface

`compileHarnessPlan` already returns:

- `TaskContract`;
- `HarnessPlan`;
- `ContextAssembly`;
- `CapabilityPlan`;
- `CodexAdapterPlanRef`;
- `EvidenceContract`;
- `nextAction`.

`krn plan --persist` creates an `ExecutionRun` and stores:

- `evidenceContract` in `HarnessPlan.metadata`;
- `codexAdapterPlanRef` in `ExecutionRun.metadata`;
- a `plan.persisted` run event with the context assembly and adapter ref IDs.

`DrizzleHarnessRunRepository.getHarnessRunByExecutionRunId` reads back:

- operator intent;
- task contract;
- harness plan;
- context assembly;
- execution run;
- evidence bundles;
- review assessments;
- feedback deltas;
- run events.

Gaps:

- no persisted `CapabilityPlan` table or typed readback;
- no typed parser for `EvidenceContract` stored in metadata;
- no typed parser for `codexAdapterPlanRef` stored in execution metadata;
- no repository method dedicated to loading a Codex brief source aggregate;
- no `krn codex brief --run-id <id>` command.

## Existing Worker Surface

| M26 concept | Current surface | Status | Notes |
| --- | --- | --- | --- |
| `worker_jobs` table | `packages/db/src/schema/events.ts` | exists | Has id, `jobType`, status, payload, attempts, maxAttempts, `runAfter`, lockedAt, lockedBy, lastError, createdAt, updatedAt. Drizzle maps `jobType` to SQL `type` and `runAfter` to SQL `available_at`. |
| `outbox_events` table | `packages/db/src/schema/events.ts` | exists | Available for queued worker job event emission. |
| Worker package | `packages/workers` | exists | Owns typed maintenance job definitions and enqueue ports. |
| `embed_source_chunk` | `maintenanceJobTypes` | exists | Payload points to source chunk. |
| `embed_memory_record` | `maintenanceJobTypes` | exists | Payload points to memory record and optional embedding model. |
| `compact_memory` | `maintenanceJobTypes` | exists | Payload points to project and optional memory record. |
| `detect_contradiction` | `maintenanceJobTypes` | exists | Payload points to project and optional memory/source claim. |
| `expire_stale_memory` | `maintenanceJobTypes` | exists | Payload includes stale cutoff. |
| `promote_eval_candidate` | `maintenanceJobTypes` | exists | Payload points to eval candidate. |
| Worker job statuses | DB and worker types | aligned with compatibility note | Public worker lifecycle is `queued`, `running`, `succeeded`, `failed`, `skipped`. DB enum also retains legacy `dead_letter` and `cancelled` values as inert compatibility. |
| Run scheduling field | `runAfter` | aligned | Drizzle and worker package expose `runAfter`; SQL keeps existing `available_at` column. |
| WorkerJobRepository | `packages/db/src/repositories/DrizzleWorkerJobRepository.ts` | exists | Supports enqueue, read by id, queued listing, running/succeeded/failed/skipped transitions, and cleanup by test IDs. |
| Drizzle worker repository | `DrizzleWorkerJobRepository` | exists | DB-backed adapter over `worker_jobs`; no daemon, no execution, no external queue. |
| Worker smoke | `pnpm db:smoke:worker-jobs` | exists | Enqueues all six M26 job types, verifies queued readback, running transitions, succeeded/skipped/failed split, and cleanup count zero. |
| Daemon / loop | absent | correct | No broad worker runtime or infinite loop found. |
| Redis/Kafka | absent | correct | No separate queue infrastructure found. |

## CLI / Smoke / Doctor Surface

Existing root scripts:

- `pnpm db:smoke`
- `pnpm db:smoke:harness-plan`
- `pnpm db:smoke:harness-evidence`
- `pnpm db:smoke:source-graph`
- `pnpm db:smoke:memory-governance`
- `pnpm db:smoke:retrieval-substrate`
- `pnpm db:smoke:activation`
- `pnpm db:smoke:codex-adapter`
- `pnpm db:smoke:worker-jobs`

Missing for M26:

- `krn plan --task "..." --persist --brief` integrated mode;
- doctor Codex adapter readiness section;
- doctor worker job readiness section.

Current DB-backed doctor passed and reports readiness through activation. It
does not yet inspect Codex adapter renderer availability, hook expectation
projection, worker job schema, worker smoke availability, or forbidden worker
runtime/Redis/Kafka surfaces.

## M26 Gaps

- Add doctor readiness for adapter and worker surfaces.

## Non-Gaps

- Do not build a KRN MCP server.
- Do not invoke Codex.
- Do not spawn subagents.
- Do not build a dashboard or public API.
- Do not add Redis/Kafka or a broad worker daemon.
- Do not make markdown or `.krn` runtime truth.

## Slice 01 Update

M26.01 resolved the typed contract gap:

- `packages/codex-adapter/src/contracts.ts` now exports
  `CodexAdapterPlan`, `ExecutionBrief`, `CodexSkillBindingHint`,
  `CodexHookExpectation`, `CodexMcpResourceRef`, `CodexGoalRef`,
  `CodexExecPlanRef`, and `CodexSubagentProbeHint`;
- `packages/codex-adapter/src/index.ts` exports the contracts publicly;
- full Codex contracts remain out of `packages/core`.

Remaining adapter gaps now start at persisted `krn codex brief --run-id`
readback, adapter DB smoke, dedicated hook projection coverage, and doctor
readiness.

## Slice 02 Update

M26.02 resolved the typed renderer gap:

- `createExecutionBrief` creates a typed `ExecutionBrief`;
- `renderExecutionBriefText` renders text from the typed artifact;
- `renderExecutionBrief` remains as the compatibility wrapper used by
  `krn plan`;
- live no-store `krn plan` preview renders source claims used, memory records
  used, anti-memory warnings, phase-aware hook expectations, stop condition,
  rollback expectation, next action, and what-this-does-not-prove.

Remaining renderer-related work is DB smoke proof and doctor readiness.

## Slice 03 Update

M26.03 resolved the standalone CLI brief gap:

- `krn codex brief --run-id <id>` renders from persisted harness run readback;
- command output is read-only Postgres text output;
- the default runtime path opens a read-only harness repository and does not
  create workspace/project rows;
- harness plan metadata evidence contracts are narrowed from `unknown` before
  use, with fallback evidence-contract creation when metadata is absent or
  invalid;
- live DB-backed rendering passed for M25 dogfood run
  `bb33bd3d-02df-4ff3-839b-6f545de88b4c`.

JSON output remains deferred because the current CLI has no shared output-mode
style.

## Slice 04 Update

M26.04 resolved dedicated hook projection coverage:

- `CodexHookExpectationProjection` is exported from the adapter contracts;
- `createCodexHookExpectationProjection` creates the typed projection from an
  `EvidenceContract`;
- `renderHookExpectationProjection` renders the projection text;
- `createCodexHookExpectations` and `renderHookExpectations` remain as
  projection-backed compatibility helpers;
- execution brief hook lines now include `applies_to` details;
- projection rules and does-not-do entries explicitly keep the surface to
  expectations only, with no hook scripts, no hidden semantic decisions, no
  Codex invocation, and no memory mutation.

Remaining adapter work is now doctor readiness.

## Slice 05 Update

M26.05 resolved Codex adapter DB smoke proof:

- root script `pnpm db:smoke:codex-adapter` calls
  `krn db smoke codex-adapter`;
- smoke orchestration lives in `packages/cli`, not `packages/db`, because the
  DB package must not render Codex-specific adapter surfaces;
- smoke creates marker-scoped source, memory, search, anti-memory, harness, and
  execution-run records;
- smoke reads the persisted run aggregate back through
  `getHarnessRunByExecutionRunId`;
- smoke renders the Codex execution brief from persisted readback;
- smoke verifies objective, non-goals, explicit exclusions, evidence contract,
  bounded source and memory references, hook expectations, zero Codex
  invocation events, and cleanup count zero;
- live DB-backed smoke passed after local `krn-postgres` was started.

Remaining M26 work is worker job schema/repository/smoke, doctor readiness,
dogfood, anti-rot, and final handoff.

## Slice 06 Update

M26.06 resolved worker schema/type alignment:

- `maintenanceJobTypes` includes `embed_memory_record`;
- `MaintenanceJob`, `CreateWorkerJobInput`, `WorkerJobRecord`, and the queued
  worker outbox payload use `jobType`;
- worker scheduling uses `runAfter`;
- `workerJobStatuses` exposes the target lifecycle including `skipped`;
- Drizzle `workerJobs.jobType` maps to SQL `type`;
- Drizzle `workerJobs.runAfter` maps to SQL `available_at`;
- migration `0006_lucky_ken_ellis.sql` only adds `skipped` to
  `worker_job_status`.

Remaining worker work is smoke proof.

## Slice 07 Update

M26.07 resolved DB-backed worker repository methods:

- `DrizzleWorkerJobRepository` is exported from `@krn/db`;
- DB-local worker job input/record/result types are exported from `@krn/db`;
- `mapWorkerJob` narrows DB rows before returning typed worker job records;
- repository methods cover enqueue, read by ID, due queued listing, running,
  succeeded, failed, skipped, and cleanup transitions;
- the repository adds an `enqueue` alias for the existing worker enqueue port
  shape without importing `@krn/workers`;
- legacy DB statuses `dead_letter` and `cancelled` are rejected by the mapper
  instead of being returned as target lifecycle records.

## Slice 08 Update

M26.08 resolved worker smoke proof:

- root script `pnpm db:smoke:worker-jobs` calls
  `krn db smoke worker-jobs`;
- CLI missing-config output reports `KRN Worker Job Smoke` and the expected
  local Postgres next action;
- `runWorkerJobSmokeCheck` lives in `@krn/db`, because the proof is purely over
  Postgres worker job persistence;
- smoke applies migration readiness, enqueues one job for each M26 job type,
  reads those queued jobs back, marks all jobs running, then marks a controlled
  2/2/2 split succeeded/skipped/failed;
- smoke deletes all marker jobs and proves cleanup remaining marker count zero;
- smoke does not add Redis/Kafka, a daemon, actual job execution, embeddings,
  or a dependency from `packages/db` to `@krn/workers`.

Remaining M26 work is doctor readiness, dogfood, anti-rot, and final handoff.
