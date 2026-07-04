# Worker Contract Decision 0ul0

Bead: `mise-en-palace-0ul0`

## Decision

Keep `@krn/workers` as a contract/readback package.

Do not implement a worker executor, daemon, scheduler, lease system, retry
runtime, or package rename in this slice. Revisit executor work only when one
named memory/retrieval product loop proves that background or one-shot job
execution is required.

## Evidence

`rg` consumer evidence:

```sh
rtk rg -n "from \"@krn/workers\"|@krn/workers|buildBrainHeartbeatPreview|buildMaintenanceCandidatePreview|buildMemoryStalenessHeartbeatPreview|buildSourceRelationHeartbeatPreview|buildKnowledgeAcquisitionHeartbeatPreview|buildConsensusCandidateEvaluationPreview|enqueueMaintenanceJob|describeMaintenanceJob|buildMaintenanceJobWriteBoundaryReadback" packages --glob '!**/*.test.ts'
rtk rg -n "workers stay|worker Memory Core|worker idempotency|plnv|worker daemon|worker contract|@krn/workers" PLAN.md GOAL.md PLANS.md README.md docs/KRN_KERNEL.md docs/architecture docs/runs/2026-07-04-post-dogfood-kernel-roadmap-synthesis.md
```

The first command found package consumers in CLI readback, DB smokes, DB
repository job-type ownership, and the workers package itself. It did not find a
production executor, daemon, scheduler, poller, or background loop consumer. The
second command checked active planning/architecture surfaces for the worker
runtime boundary and deferred `plnv` framing.

- `packages/cli/src/runHeartbeatPreviewCommand.ts` consumes
  `buildBrainHeartbeatPreview` for operator readback.
- `packages/cli/src/heartbeatPreviewReadback.ts` and
  `packages/cli/src/heartbeatPreviewFormat.ts` consume worker preview types for
  formatting/readback.
- `packages/db/src/heartbeatWorkerBoundarySmoke.ts` consumes
  `buildBrainHeartbeatPreview` for DB-backed boundary readback.
- `packages/db/src/workerJobSmoke.ts` consumes `describeMaintenanceJob` for
  worker job storage/readback smoke coverage.
- `packages/db/src/repositories/workerJobTypes.ts` derives active DB job type
  contracts from `@krn/workers`.

Worker contract evidence:

- `packages/workers/README.md` says the package is for maintenance job
  descriptions and enqueue ports, and explicitly lists no worker daemon, no
  background loop, and no job executor.
- `packages/workers/src/jobTypes.ts` sets
  `maintenanceJobRuntimeContract.requiresBackgroundLoop` to `false`.
- `packages/workers/src/jobTypes.ts` keeps declared allowed writes, forbidden
  writes, and Memory Core gates in `allowedWritesByMemoryCoreGate`,
  `requiredWritesByMemoryCoreGate`, and `writeBoundaryByType`.
- `packages/workers/src/__tests__/index.test.ts` verifies job descriptions,
  queue-port enqueue behavior, write-boundary readback, and invalid boundary
  failure without daemon behavior.
- `docs/decisions/ADR-0015-worker-runtime-boundary.md` already records the
  accepted worker runtime boundary and its 2026-07-04 post-cleanup
  re-evaluation.

## Why Not Executor Now

No current consumer requires autonomous execution. The current product-facing
paths use worker outputs as candidate/readback surfaces:

- heartbeat preview readback;
- DB smoke/readback of worker boundaries;
- maintenance job storage/lifecycle proof;
- candidate-only maintenance and source relation review surfaces.

The live memory/retrieval advantage work can proceed through governed commands,
retrieval, source grounding, review, and activation without a background worker.
An executor would add agency before a concrete bottleneck proves it is needed.

## Follow-Up Policy

No new follow-up Bead is opened for this decision. The chosen path is to keep
the existing contract/readback boundary and continue higher-ROI memory/source
advantage work.

Future executor work needs a new ADR-backed Bead naming:

- one job type;
- one product loop consumer;
- deterministic input builder and idempotency key;
- Postgres `worker_jobs` / `outbox_events` claim proof before any daemon;
- explicit lock, retry, timeout, failure, and rollback semantics.

## Proof Boundary

Proves:

- current worker consumers are readback/contract/storage consumers;
- current write-boundary tables are declared and tested;
- the selected branch is keep contract/readback;
- no executor product-loop consumer was found in the audited package and active
  planning/architecture surfaces.

Does not prove:

- workers will never be needed;
- every future or hidden product loop has no worker-executor need;
- worker execution, scheduler readiness, throughput, or idempotency enforcement;
- candidate truth or Memory Core mutation safety outside declared boundaries.

## Verification

- `rtk pnpm --filter @krn/workers test`: passed, 6 files / 43 tests.
- `rtk pnpm -C packages/workers typecheck`: passed.
- `rtk pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants`:
  passed, 33 files / 204 tests.
- `rtk pnpm run typecheck`: passed.
- `rtk pnpm quality:fallow:ci`: passed on changed files.
- `rtk git diff --check`: passed.
- GitHub Actions run `28703597625` for commit `132158ff` passed both jobs:
  DB readiness/smoke and Typecheck/tests/eval smoke.
