# WRK-01 Worker Enqueue Atomicity Report

Status: source repair dogfood.

Date: 2026-07-01

## Executive Verdict

The audit finding was valid for the `@krn/workers` enqueue helper: the helper
previously orchestrated two independent writes, first worker job, then outbox
event. WRK-01 repaired the contract by requiring one `MaintenanceJobQueueRepository`
port to create the worker job and matching `worker_job.queued` event as one
adapter-owned operation. This removes the split-write failure mode from the
public workers helper without building a worker daemon or DB runtime.

## Source-To-Decision

```txt
source: packages/workers/src/enqueueMaintenanceJob.ts
mechanism: enqueueMaintenanceJob previously awaited workerJobs.enqueue and then
  outbox.enqueue, so a second-write failure could leave a job without an event.
KRN implication: the workers contract should not expose a helper that can create
  orphaned queue state; the atomic boundary belongs to one adapter-owned queue
  operation.
decision: replace split repository orchestration with MaintenanceJobQueueRepository.
consumer: @krn/workers enqueue contract and future DB-backed queue adapter.
falsifier: a caller can still pass separate workerJobs/outbox repositories to
  enqueueMaintenanceJob, or the helper performs two independent writes.
```

```txt
source: docs/architecture/package-boundaries.md and ADR-0015
mechanism: @krn/workers is a contract/skeleton package and no worker daemon or
  background executor is accepted in the current spine.
KRN implication: fix the enqueue contract, not a worker runtime. Do not add a
  scheduler, daemon, DB schema, or autonomous maintenance path.
decision: keep WRK-01 as a contract repair plus focused test.
consumer: current worker package, future worker-runtime ADR.
falsifier: this slice starts polling worker_jobs, adds a daemon, or claims job
  execution proof.
```

## What Changed

| Area | Change |
| --- | --- |
| Worker enqueue contract | Added `MaintenanceJobQueueRepository` and `EnqueueMaintenanceJobRequest`. |
| Split write helper | Removed the helper-level `workerJobs.enqueue -> outbox.enqueue` waterfall. |
| Dead escape hatch | Removed unused split worker/outbox repository interfaces from `@krn/workers`. |
| Tests | Updated the worker enqueue test to prove one queue-port call carries the complete request. |
| Docs | Updated `packages/workers/README.md` to describe one adapter-owned queue operation. |

## Verification

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/workers test -- index` | passed | Worker contract tests pass, including the queue-port enqueue behavior. | Does not prove DB transaction behavior or worker execution. |
| `pnpm --filter @krn/workers exec tsc --noEmit` | passed | The worker package public types compile after the contract change. | Does not prove downstream package behavior. |
| `pnpm --reporter append-only -r --workspace-concurrency=1 --if-present typecheck` | passed | All workspace package typecheck scripts pass. | Does not prove runtime behavior. |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass. | Does not prove production worker execution. |
| `pnpm quality:fallow:ci` | passed | Fallow changed-file audit found no issues in this slice. | Does not prove broad repo health. |
| `pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove worker enqueue atomicity. |
| `pnpm db:smoke:worker-jobs` | passed | Existing worker job DB lifecycle/readback smoke still passes. | Does not prove a daemon, scheduler, executor, or combined queue adapter exists. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior. |

## Proof Boundary

This slice proves the current `enqueueMaintenanceJob` helper no longer performs
two independent writes and no longer accepts separate worker job and outbox
repositories.

This slice does not prove:

- worker daemon readiness;
- background job execution;
- DB transaction behavior for a future queue adapter;
- production queue throughput;
- Memory Core mutation;
- that `DrizzleWorkerJobRepository` and `DrizzleOutboxRepository` are a combined
  queue implementation.

## Dogfood Brain Usefulness

| Lane | Verdict | Evidence |
| --- | --- | --- |
| Selected context | useful | `PLAN.md`, `PLANS.md`, package boundary docs, ADR-0015, and worker source constrained the repair. |
| Pattern use | helped | Simplicity/surgical-change rules prevented building a worker runtime or DB schema. |
| Evidence strength | good | Focused worker tests and worker package typecheck passed. Full repo gates remain required before commit. |
| Review burden | lower | The public contract now exposes a single atomic boundary instead of two write ports. |
| Brain ROI | positive | The audit finding became a bounded source repair instead of a broad worker-runtime detour. |

## Next Recommended Action

Run full verification, then continue with the next high-ROI source repair from
the audit: evidence metadata boundary validation, not worker daemon work.
