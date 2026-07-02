# Worker Job Type Ownership

Date: 2026-07-02.

Beads issue: `mise-en-palace-vds9`.

## Decision

`@krn/workers` is the canonical owner for active maintenance worker job
types and active worker job lifecycle statuses.

`@krn/db` repository contracts now derive these values from `@krn/workers`
instead of duplicating the same string tuples locally.

## Source To Decision

```txt
source:
  audit finding: packages/workers/src/jobTypes.ts and
  packages/db/src/repositories/workerJobTypes.ts duplicated the same job
  type list; packages/workers/src/enqueueMaintenanceJob.ts and DB repository
  types duplicated the same active status list.

mechanism:
  duplicated tuple constants can drift while still compiling inside each
  package. Worker-only additions or DB-only omissions would create mismatched
  smoke/repository behavior.

KRN implication:
  worker job readbacks and DB persistence would no longer describe the same
  maintenance job contract, weakening audit evidence around worker boundaries.

decision:
  keep active worker job type/status values canonical in @krn/workers and
  alias them from @krn/db repository contracts.

consumer:
  Drizzle worker job repository, mapper tests, worker job smoke, heartbeat
  worker authority smoke, and future worker runtime work.

falsifier:
  packages/db/src/repositories/workerJobTypes.test.ts fails if DB repository
  active job types or active statuses stop using the @krn/workers tuples.
```

## Changed Files

- `packages/db/src/repositories/workerJobTypes.ts`
  - imports `maintenanceJobTypes`, `workerJobStatuses`, `MaintenanceJobType`,
    and `WorkerJobStatus` from `@krn/workers`;
  - exports DB repository aliases as the active repository contract.
- `packages/db/src/repositories/workerJobTypes.test.ts`
  - proves DB repository values are the same tuple instances as the worker
    package values;
  - preserves the distinction between active repository statuses and
    schema-only legacy statuses.

## Proof

Focused checks:

```bash
rtk pnpm --filter @krn/workers test -- index
rtk pnpm --filter @krn/db test -- workerJobTypes workerJobMappers workerJobSmoke events
rtk proxy pnpm --filter @krn/workers typecheck
rtk proxy pnpm --filter @krn/db typecheck
```

Workspace and runtime checks:

```bash
rtk proxy pnpm typecheck
rtk pnpm test
rtk pnpm quality:fallow:ci
rtk pnpm eval:brain-battle:smoke
rtk pnpm db:ready
rtk pnpm db:smoke:worker-jobs
rtk pnpm db:smoke:heartbeat-worker-authority
rtk git diff --check
```

Result highlights:

```txt
workers focused tests: 6 files / 40 tests passed
db focused tests: 28 files / 89 tests passed
workers typecheck: passed
db typecheck: passed
workspace typecheck: passed
workspace tests: 132 files / 763 tests passed
Fallow changed-files audit: passed
brain-battle smoke: passed
DB readiness: ready
DB worker-jobs smoke: passed
DB heartbeat-worker-authority smoke: passed
git diff --check: passed
```

## Non-Proof

This does not implement a worker daemon, job claiming, idempotent enqueue
deduplication, retry/dead-letter runtime, worker cancellation runtime, memory
write enforcement, or DB schema migration.

The DB schema enum still includes `dead_letter` and `cancelled` as storage-level
legacy/future states. The active repository mapper intentionally rejects those
states until runtime semantics exist.

## Next Slice Candidates

- `mise-en-palace-fhus`: type doctor readiness outcomes before matching status
  strings.
- `mise-en-palace-m4bh`: make smoke fixture clocks explicit and readback-visible.
- `mise-en-palace-97a8`: harden Codex adapter proof/readiness checks.
- `mise-en-palace-58l0`: type source relation metadata readbacks.
- `mise-en-palace-t8bi`: brand retrieval-owned persisted IDs first.
- `mise-en-palace-mvrx`: rename only bounded worker leaf-preview names after
  ownership work lands.
