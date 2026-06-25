# Worker Runtime Acceptance Gate Report

Status: E-02 completion report.

Date: 2026-06-25

## Executive Verdict

E-02 keeps worker runtime deferred. The repo has typed worker job contracts,
enqueue/outbox contracts, Postgres worker job persistence, and DB lifecycle
smoke proof. It still does not have a concrete self-hosting bottleneck that
requires a one-shot executor, and it should not add a daemon/background loop.

## Scope

Changed:

- `docs/decisions/ADR-0015-worker-runtime-boundary.md`;
- `docs/reviews/controlled-dogfood/2026-06-25-worker-runtime-acceptance-gate/REPORT.md`;
- `packages/db/src/workerJobSmoke.ts`;
- `packages/db/src/workerJobSmoke.test.ts`;
- `PLAN.md`;
- `GOAL.md`.

Not changed:

- `packages/workers` source;
- DB schema;
- worker runtime;
- daemon/background loop;
- Memory Core mutation path;
- dashboard/API/MCP.

## Decision

```yaml
decision: keep worker runtime deferred
status: defer
source_mechanisms:
  - ADR-0015 already defers worker runtime until a concrete bottleneck exists.
  - packages/workers declares job authority and requiresBackgroundLoop=false.
  - packages/db worker job smoke proves storage/readback/lifecycle only.
krn_implication: KRN can keep worker jobs as typed contracts without adding hidden agency.
accepted_boundary: contracts/enqueue/outbox/lifecycle smoke only.
rejected_alternatives:
  - daemon now
  - cron/background loop
  - one-shot executor without named bottleneck
  - Memory Core write worker
  - Redis/Kafka queue
verification:
  - worker tests
  - DB worker job smoke
  - typecheck/test/diff check
rollback: revert this docs decision commit
falsifier: a current dogfood run cannot keep memory/source/eval state useful through governed operator commands and reviewed candidate paths.
```

## Evidence Reviewed

| Source | Finding | Decision impact |
| --- | --- | --- |
| `docs/decisions/ADR-0015-worker-runtime-boundary.md` | Runtime deferred until concrete bottleneck proof. | Reaffirm defer. |
| `packages/workers/README.md` | Explicitly says no daemon, background loop, or executor. | No source change needed. |
| `packages/workers/src/jobTypes.ts` | Job descriptions include allowed/forbidden writes and `requiresBackgroundLoop: false`. | Contracts are sufficient for now. |
| `packages/workers/src/enqueueMaintenanceJob.ts` | Enqueue/outbox contract exists. | Runtime still absent by design. |
| `packages/db/src/workerJobSmoke.ts` | DB smoke covers lifecycle transitions and cleanup. | Storage proof exists; execution proof does not. |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn plan --task worker runtime acceptance gate --persist` | passed | E-02 has a persisted planning run and selected current write-authority context. | Does not prove worker runtime is needed. |
| `pnpm --filter @krn/workers test` | passed | Worker contract tests still pass. | Does not prove job execution. |
| `pnpm --filter @krn/db test -- workerJobSmoke DrizzleWorkerJobRepository` | passed | Worker job smoke planning and repository method tests pass. | Does not prove job execution. |
| `pnpm db:smoke:worker-jobs` | passed | Postgres worker job storage/readback/lifecycle works in current shell. | Does not prove worker runtime execution. |
| `pnpm typecheck` | passed | Workspace still typechecks. | Does not prove worker runtime correctness. |
| `pnpm test` | passed | Existing tests still pass. | Does not prove production readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove worker execution. |
| `krn evidence capture --persist` | passed | E-02 evidence, review assessment, feedback delta, changed-file classification, and command proof were persisted. | Does not prove worker execution. |
| `krn observe --persist` | passed | E-02 observation staging was persisted without Memory Core mutation. | Does not prove final memory truth. |
| `krn reflect --persist` | passed | E-02 reflection record was persisted without candidate row writes or Memory Core mutation. | Does not prove useful extraction at scale. |

## Persistence Evidence

```txt
executionRun: 150d5cb2-cace-4146-9251-eb946c82a1e1
taskContract: 2c815930-4437-4e15-9b38-8a8a6cfd7e7c
harnessPlan: 4cca4536-9c17-49e5-b85b-ac52911d57aa
contextAssembly: 54bb1bec-31b4-4e79-a17b-ee9ccc1696c7
evidenceBundle: 8080b1d2-8b4f-4411-b7b3-a3efc4e3ae0f
reviewAssessment: eb7bd0aa-e169-454c-ac20-e2109fbb2257
feedbackDelta: d51341be-ed7a-4678-916a-67d0a12457d3
observationGroup: 1daf9904-f551-40e5-96f4-ae1d9d4a4776
reflectionRecord: eae76a5d-f8aa-40b4-8065-55330afc929c
Memory mutation: none
MemoryRecord created: no
```

## Dogfood Brain Usefulness Section

### Brain Usefulness Summary

Brain ROI:
- positive

Overall verdict:
- KRN selected Memory Core write-authority guardrails that were directly
  relevant to rejecting a hidden worker runtime. Source inspection supplied the
  worker package and DB smoke details.

What this run proves:
- E-02 can preserve the no-hidden-agency worker boundary while keeping future
  runtime preconditions explicit.

What this run does not prove:
- workers will never be needed;
- job execution exists;
- production throughput;
- external target repo readiness.

DB used in current shell:
- yes for persisted KRN plan, evidence, observe, reflect, and worker job smoke.

## Verification Note

The first `pnpm db:smoke:worker-jobs` run failed because the smoke helper
expected transition counts for six jobs while the current worker job type list
contains five job types. E-02 repaired the smoke proof helper so expected
`succeeded` / `skipped` / `failed` counts derive from the actual enqueued job
count. This keeps the DB smoke honest without adding worker runtime behavior.

### Activated Context Usefulness

| Item | Type | Used? | Helped? | Notes |
| --- | --- | --- | --- | --- |
| MemoryReviewGate write-authority memory | memory | yes | helped | Prevented worker runtime from bypassing Memory Core gates. |
| Weak evidence source claim | source claim | yes | helped | Kept DB smoke from becoming execution proof. |
| Reflection quality caveat | source claim | yes | neutral | Relevant to avoiding autonomous candidate generation claims. |
| Worker source files | source inspection | yes | helped | Confirmed `requiresBackgroundLoop: false` and no executor. |

## Product Readiness Signal

Verdict:

```txt
worker contracts are ready for future proof, worker runtime remains deferred.
```

## Next Recommended Action

Continue to:

```txt
F-00 — Read-Only MCP/API Boundary Proof
```

Do not create MCP/API write surfaces. Start read-only over typed read models
only if F-00 accepts a bounded proof.
