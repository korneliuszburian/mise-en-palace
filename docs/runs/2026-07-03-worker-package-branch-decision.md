# Worker Package Branch Decision Brief

Date: 2026-07-03.

Beads: `mise-en-palace-gfzi`, informing deferred `mise-en-palace-plnv`.

## Recommendation

Do not execute either destructive downscope or executor-build work yet. The
current evidence supports a narrower decision:

```txt
keep @krn/workers as contracts + candidate previews + authority readback;
do not call it a runtime;
do not build a daemon until a product loop needs autonomous execution;
do not delete the authority readback tables while DB/CLI consumers use them.
```

If a binary branch must be chosen later, prefer a conservative Branch A variant:
downscope vocabulary and package claims first, while retaining the preview
builders and authority readback. Branch B, a minimal executor, should wait until
a real product slice needs background execution rather than manual heartbeat
preview.

## Evidence

- `packages/workers/src/jobTypes.ts` defines job type contracts, write authority
  assessment, and readback; it does not process jobs.
- `maintenanceJobRuntimeContract.requiresBackgroundLoop` is `false`.
- `packages/workers/src/brainHeartbeatPreview.ts` exposes
  `runtimeLoop.mode: "manual_candidate_only"` and explicitly forbids
  `worker_jobs` mutation in runtime-loop readback.
- `packages/db/src/repositories/DrizzleWorkerJobRepository.ts` already supports
  enqueue/list/mark-running/succeeded/failed/skipped, but no executor claims and
  processes queued jobs.
- `packages/db/src/workerJobSmoke.ts` proves DB lifecycle transitions and
  authority-description readback, not autonomous worker execution.
- `packages/db/src/heartbeatWorkerAuthoritySmoke.ts` and
  `packages/cli/src/runHeartbeatPreviewCommand.ts` consume worker authority
  readback through heartbeat preview.

## Branch A: Downscope

Useful if the goal is to remove runtime overclaim quickly.

Keep:

- preview builders;
- maintenance job type contracts;
- DB queue repository and smoke coverage;
- authority readback as a review surface.

Change later:

- package/docs vocabulary from "workers runtime" to "worker contracts/previews";
- root proof language that could imply daemon, scheduler, leases, retries, or
  runtime enforcement.

Avoid:

- deleting `allowedWritesByMemoryCoreGate` or
  `requiredWritesByMemoryCoreGate` while heartbeat and DB smoke readbacks use
  them;
- deleting preview builders that currently feed CLI/DB product surfaces.

## Branch B: Minimal Executor

Useful only when a product loop requires autonomous maintenance.

Required scope:

- claim queued jobs safely;
- dispatch by `MaintenanceJobType`;
- consult write authority before mutation;
- mark succeeded/failed/skipped;
- prove idempotency and Memory Core non-mutation with DB tests.

Risk:

- it creates scheduler/lease/retry semantics that root `PLAN.md` currently
  rejects unless explicitly authorized;
- it expands product surface before manual heartbeat candidates have proven the
  need for background execution.

## Decision Boundary

This brief does not choose or implement `plnv`. It records that the package is
not pure dead code, but its runtime framing must stay bounded until the worker
branch is decided.
