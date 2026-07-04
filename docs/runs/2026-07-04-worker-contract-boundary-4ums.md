# Worker Contract Boundary Decision

Date: 2026-07-04
Bead: `mise-en-palace-4ums`

## Decision

Keep `@krn/workers` as a contract/readback package. Do not build a daemon,
scheduler, lease loop, retry executor, or runtime worker process now.

Rename/downscope misleading worker vocabulary separately only where it implies
runtime execution. Follow-up Bead: `mise-en-palace-pj25`.

## Current Consumers

- `packages/db/src/workerJobSmoke.ts` reads worker job descriptions and validates
  worker-job persistence/readback.
- `packages/db/src/heartbeatWorkerBoundarySmoke.ts` reads heartbeat preview
  output and worker write-boundary readback from an expired MemoryRecord fixture.
- `packages/cli/src/doctorStaticChecks.ts` checks worker-job schema/repository
  and broad worker-daemon absence.
- `packages/workers/src/*Preview.ts` builds manual candidate-only preview
  readbacks used by CLI/tests/smokes.
- `docs/architecture/primitive-ledger.md`,
  `docs/architecture/package-surfaces.md`, and root plan surfaces already state
  that worker runtime is absent.

## Non-Consumers

- No product loop currently requires background execution.
- Memory advantage eval, Codex-vs-KRN comparator, source graph ranking, DB
  brain-search smoke, DB brain-loop smoke, and heartbeat boundary smoke all run
  without a worker executor.
- No runtime code claims jobs, polls `worker_jobs`, schedules retries, leases
  rows, or enforces idempotent execution.

## Runtime Authority

`@krn/workers` may describe allowed writes for review/readback, but it does not
enforce writes at runtime. The write-boundary tables are contract evidence, not
executor safety.

## Idempotency Boundary

Idempotency remains a queue/readback concern. Current DB smokes can enqueue,
transition, read back, and clean up worker jobs, but they do not prove duplicate
suppression, runtime leases, retries, or exactly-once behavior.

## Product Consumer

No named product consumer justifies an executor today. The next legitimate
consumer would need one of:

- scheduled memory/source maintenance that changes user-visible next-run
  outcomes and cannot be handled by explicit CLI/eval commands;
- background acquisition work with accepted write authority and review gates;
- a DB-backed product loop that fails without asynchronous job execution.

## Falsifier

Reopen executor work only if a bounded product slice proves:

- a named loop cannot be implemented as explicit CLI/readback/eval;
- required writes are known and mapped to Memory Core/source authority;
- idempotency, lease/retry semantics, rollback, and observability are specified;
- DB tests prove enqueue -> claim -> execute -> readback -> cleanup.

## Verification

```sh
git diff --check
```

No schema, migration, repository, or runtime code changed in this decision slice.
