# ADR-0015: Worker Runtime Boundary

Status: accepted.

Date: 2026-06-24

Decision status: defer.

## Context

KRN has typed maintenance job descriptions, enqueue ports, Postgres
`worker_jobs` persistence, outbox events, and lifecycle smokes. It does not have
a worker daemon, background loop, job executor, autonomous maintenance runtime,
or Memory Core mutation worker.

C4 decides whether to add that runtime now. The answer is no: keep the worker
runtime deferred until a concrete self-hosting bottleneck proves it is needed.

## Source To Decision

```yaml
source_id: krn-kernel-runtime-truth
source: docs/KRN_KERNEL.md
mechanism: KRN supplies bounded context, store-backed memory, policy, traces,
  review gates, and feedback; Codex remains the executor.
krn_implication: Background workers must not become a second autonomous executor
  or hidden memory writer.
decision: defer worker runtime execution.
rejection: do not add daemon, scheduler, or background loop now.
falsifier: KRN cannot keep its memory/source/eval state current through
  governed operator commands and reviewed candidate paths.
```

```yaml
source_id: postgres-worker-job-plane
source: docs/decisions/ADR-0010-brain-store-postgres-pgvector.md
mechanism: Postgres owns outbox events and worker jobs for the first spine,
  while separate queue infrastructure is rejected until proven necessary.
krn_implication: If a worker runtime is later accepted, it starts from the
  existing Postgres worker_jobs/outbox_events plane, not Redis/Kafka.
decision: keep Postgres worker-job storage as contract/readiness surface only.
rejection: do not introduce a separate queue service for this epoch.
falsifier: Postgres worker_jobs/outbox_events cannot support explicit locking,
  retry, idempotency, and audit for the first real job executor.
```

```yaml
source_id: current-worker-contracts
source: packages/workers/README.md and packages/workers/src/jobTypes.ts
mechanism: worker jobs declare input schema, idempotency key, output event,
  failure state, allowed writes, forbidden writes, and Memory Core gate.
krn_implication: Write authority can be reviewed before runtime execution
  exists.
decision: retain typed job contracts and enqueue ports.
rejection: do not treat requiresBackgroundLoop=false descriptions as a daemon.
falsifier: a job type cannot express its allowed and forbidden writes before
  runtime execution.
```

```yaml
source_id: worker-job-persistence-smoke
source: packages/db/src/repositories/DrizzleWorkerJobRepository.ts and
  packages/db/src/workerJobSmoke.ts
mechanism: DB code can enqueue jobs, read queued rows, transition lifecycle
  status, and clean smoke rows.
krn_implication: storage/readback/lifecycle proof exists, but execution proof
  does not.
decision: allow repository lifecycle operations and smokes as DB proof only.
rejection: do not describe lifecycle smoke as production job execution.
falsifier: persisted worker job lifecycle cannot be inspected or replayed during
  a future executor proof.
```

```yaml
source_id: staging-and-admission-doctrine
source: docs/decisions/ADR-0013-observation-is-staging-not-memory.md and
  docs/decisions/ADR-0014-activation-is-admission-control.md
mechanism: observations/reflections stay staging/candidate paths, and activation
  is the admission boundary for context.
krn_implication: workers may help produce staging records or candidates only
  after review boundaries are explicit; they cannot bypass activation,
  MemoryReviewGate, or source-decision review.
decision: future workers may write only declared staging/candidate/readiness
  outputs.
rejection: no worker may directly create MemoryRecord, AntiMemoryRecord,
  SourceClaim, or SourceDecision truth.
falsifier: a worker path writes final truth without a reviewed gate.
```

## Decision

Defer the worker daemon/job executor.

The accepted current boundary is:

- `@krn/workers` owns job type descriptions and enqueue contracts.
- `packages/db` owns Postgres worker job persistence, lifecycle readback, and
  smoke proof helpers.
- Enqueue paths may write `worker_jobs` and `outbox_events`.
- DB lifecycle smokes may transition and clean test `worker_jobs` rows.
- No production worker runtime polls `worker_jobs`.
- No background loop or daemon runs maintenance automatically.
- No worker path mutates Memory Core or final source/eval truth.

If a future ADR accepts runtime execution, it must keep the current write
authority table:

| Job type | Future allowed writes | Forbidden final-truth writes |
| --- | --- | --- |
| `embed_source_chunk` | `worker_jobs`, `outbox_events`, `embeddings` | `memory_records`, `anti_memory_records`, `source_claims`, `source_decisions` |
| `embed_memory_record` | `worker_jobs`, `outbox_events`, `embeddings` | `memory_records`, `anti_memory_records`, `source_claims`, `source_decisions` |
| `compact_memory` | `worker_jobs`, `outbox_events`, `memory_candidates` | `memory_records`, `anti_memory_records`, `source_claims`, `source_decisions` |
| `detect_contradiction` | `worker_jobs`, `outbox_events`, `reflection_records` | `memory_records`, `anti_memory_records`, `source_claims`, `source_decisions` |
| `expire_stale_memory` | `worker_jobs`, `outbox_events`, `memory_candidates` | `memory_records`, `anti_memory_records`, `source_claims`, `source_decisions` |

Eval candidate worker jobs are intentionally absent from the current worker
contract. ADR-0016 keeps eval candidates proposal-only through FeedbackDelta
and ReflectionRecord lineage until a real standalone eval consumer/review path
exists.

## Future Runtime Preconditions

A worker runtime can be reconsidered only after all of these are true:

- one concrete job type has a current self-hosting bottleneck or operator burden;
- the job has a deterministic input builder and idempotency key;
- the executor has explicit lock, retry, timeout, and failure semantics;
- command evidence records what ran and what it does not prove;
- output writes stay inside the job's declared allowed writes;
- Memory Core writes still go through reviewed candidate promotion;
- the first proof is a one-shot/manual executor path before any daemon loop;
- rollback is `git revert <runtime commit>` plus deletion or replay of marked
  test job rows.

## Rejected Alternatives

- Build a daemon now: rejected because there is no proven job-execution
  bottleneck and it would add hidden agency before candidate quality is mature.
- Add cron/background maintenance: rejected because recurring execution hides
  proof and retry behavior behind time.
- Let workers compact or expire Memory Core directly: rejected because it
  bypasses MemoryReviewGate and anti-memory/source review.
- Add Redis, Kafka, or another queue: rejected by ADR-0010 until Postgres
  worker-job tables fail a concrete first-spine requirement.
- Add dashboard/admin worker controls: rejected because C4 is a runtime-boundary
  decision, not product UX.
- Add eval-candidate promotion jobs now: rejected by ADR-0016 because no
  standalone eval candidate lifecycle, review gate, or execution consumer
  exists.

## Verification

This ADR is upheld when:

- worker package docs still say no daemon/background loop/job executor exists;
- job descriptions keep `requiresBackgroundLoop: false`;
- job descriptions declare allowed writes, forbidden writes, and Memory Core
  gates;
- DB smokes are described as storage/readback/lifecycle proof only;
- any new worker execution path has a successor ADR or ADR update before code.

This ADR is violated when:

- a process polls `worker_jobs` without a successor ADR;
- docs claim autonomous maintenance or job execution exists because lifecycle
  smokes pass;
- a worker writes `memory_records`, `anti_memory_records`, `source_claims`, or
  `source_decisions`;
- a recurring scheduler runs before a one-shot/manual executor proof exists;
- a separate queue store is introduced before Postgres worker jobs are falsified.

## Does Not Prove

This decision does not prove workers will never be needed. It proves only that
the current repo should keep workers as typed contracts and Postgres lifecycle
proof until a concrete runtime executor slice has a stronger falsifier.
