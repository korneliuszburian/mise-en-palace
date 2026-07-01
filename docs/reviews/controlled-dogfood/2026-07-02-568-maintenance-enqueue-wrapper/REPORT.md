# 568 Maintenance Enqueue Wrapper Cleanup

Status: source repair dogfood.

Date: 2026-07-02

## Verdict

`packages/workers/src/enqueueMaintenanceJob.ts` no longer exports the transparent
`enqueueMaintenanceJob(input) => input.queue.enqueue(input.request)` wrapper.

The worker package still exposes the useful contract:

```txt
EnqueueMaintenanceJobRequest
EnqueueMaintenanceJobResult
MaintenanceJobQueueRepository
WorkerJobRecord
```

The test now exercises `queue.enqueue(request)` directly, so the source still
guards the one queue-port boundary from WRK-01 without keeping a pass-through API.

## Source-To-Decision

```txt
source: packages/workers/src/enqueueMaintenanceJob.ts and packages/workers/src/index.test.ts
mechanism: the only live source caller of enqueueMaintenanceJob was the workers
  package test; the function added no validation, transaction, policy, or
  normalization beyond forwarding to MaintenanceJobQueueRepository.enqueue.
KRN implication: keeping the helper makes a non-boundary look like a product API
  and increases package surface without improving worker safety.
decision: remove enqueueMaintenanceJob and EnqueueMaintenanceJobInput; keep the
  queue port and request/result types.
consumer: @krn/workers root package surface and future queue adapter tests.
falsifier: a source caller requires shared helper behavior that is not already
  carried by MaintenanceJobQueueRepository.enqueue.
```

## KRN Plan

Persisted run:

```txt
executionRun: eb483663-49b7-40af-9f82-0786ab26d36d
taskContract: 5c123b95-8295-4a04-914d-451e3446d33a
contextAssembly: 9284f50a-e6c7-4857-b478-cf9e2238e965
```

Usefulness: mixed. DB-backed plan persistence worked, but activation selected
general guardrails and unrelated owner files, not the worker owner file. Source
inspection with `rg` carried the repair.

Persisted evidence/readback:

```txt
evidenceBundle: 2aa2734e-60e0-42df-8c4a-914b400ba98e
reviewAssessment: 439ae7fa-3836-407e-8791-0f48d77d2b14
feedbackDelta: 9b0a86c4-73b0-4a25-9313-dea65f4b89f6
observationGroup: f2e867d2-2ad7-40ab-a063-7e13ce0b3d48
reflectionRecord: 8445bc29-2937-4003-8dda-ff919a799d43
```

Dirty-context classification: 9 intended, 0 unrelated, 0 unknown.

## Changed

- Removed `EnqueueMaintenanceJobInput`.
- Removed the transparent `enqueueMaintenanceJob` function.
- Updated the worker enqueue test to call `queue.enqueue(request)` directly.
- Updated package-surface docs to describe enqueue contract types and queue port,
  not a pass-through helper.

## Verification

| Command | Result | Proof boundary |
| --- | --- | --- |
| `pnpm --filter @krn/workers test -- index` | passed | Worker contract tests still pass. |
| `pnpm --filter @krn/workers exec tsc --noEmit` | passed | Worker package compiles. |
| `rtk proxy pnpm typecheck` | passed | Workspace package typechecks pass. |
| `pnpm test` | passed | Full workspace tests pass. |
| `pnpm quality:fallow:ci` | passed | Fallow found no changed-file issues. |
| `pnpm db:ready` | passed | Local DB is reachable with migrations and pgvector. |
| `git diff --check` | passed | Diff has no whitespace errors. |

## Proof / Non-Proof

This proves the workers package no longer exposes a transparent enqueue wrapper
and the queue-port contract remains typed and tested.

This does not prove:

- worker daemon readiness;
- DB transaction behavior;
- idempotency enforcement;
- runtime worker gate enforcement;
- Memory Core mutation safety;
- activation owner-file recall quality.

## Next

Open Beads follow-up:

```txt
mise-en-palace-5f9 Canonicalize anti-memory invalidation source claim field
```
