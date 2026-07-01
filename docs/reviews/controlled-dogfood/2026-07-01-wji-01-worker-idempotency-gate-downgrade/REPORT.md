# WJI-01 Worker Job Idempotency And Gate Boundary

Date: 2026-07-01

## Summary

WJI-01 inspected the worker job idempotency and `memoryCoreGate` boundary after
WJA-01 centralized worker authority constants.

The result is an explicit downgrade, not a runtime proof: worker job
idempotency is currently a key pattern only, and `memoryCoreGate` is currently a
declaration/readback boundary only. Operator-facing worker readbacks now expose
that fact instead of implying executable deduplication or runtime gate
enforcement.

No worker daemon, scheduler, queue runtime, DB schema, migration, Memory Core
mutation behavior, dashboard, API, MCP, or broad worker refactor was added.

## KRN Plan

Persisted plan:

```txt
executionRun: 13e4cbc0-7ed1-4152-8d8c-4330f198367e
operatorIntent: b6e07e9e-f2f9-4486-9687-e3be4236131c
taskContract: f010fe35-2987-4438-96a9-f1de7f9b21b8
harnessPlan: 07dc5499-86d8-4c38-b1aa-6f481ea48d89
contextAssembly: 48b642fb-e6c7-445e-beb8-00cb1e42d76d
```

Activation usefulness: mixed/weak.

The plan preserved broad guardrails, but did not select the direct worker job
schema/repository owner files. Source inspection found the owning surfaces:

```txt
packages/db/src/schema/events.ts
packages/db/src/repositories/DrizzleWorkerJobRepository.ts
packages/db/src/workerJobSmoke.ts
packages/db/src/heartbeatWorkerAuthoritySmoke.ts
packages/workers/src/jobTypes.ts
packages/cli/src/runDbSmokeCommand.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
```

Retained brain knowledge query for this slice returned no selected pattern
packets, so the implementation used repo-local evidence and source inspection.

## Source To Decision

Source:

```txt
docs/adr/ADR-0015-worker-job-execution-boundary.md
packages/db/src/schema/events.ts
packages/db/src/repositories/DrizzleWorkerJobRepository.ts
packages/db/src/workerJobSmoke.ts
packages/workers/src/jobTypes.ts
```

Mechanism:

```txt
worker_jobs currently has no idempotency key column or unique idempotency
constraint, and DrizzleWorkerJobRepository inserts worker jobs without dedup.
MaintenanceJobDescription exposes idempotencyKey and memoryCoreGate, but those
fields are authority/readback declarations, not runtime middleware, DB triggers,
or enforced write guards.
```

KRN implication:

```txt
KRN worker readback must not overstate worker safety. Until schema/repository
or runtime code proves deduplication and gate enforcement, the readback should
make the non-enforced boundary visible to operators and future evidence runs.
```

Decision:

```txt
Adopt explicit downgrade readback:
- idempotencyEnforcement: key_pattern_only_not_enforced
- memoryCoreGateEnforcement: declaration_only_not_runtime_enforced

Reject migration/runtime work in this slice because the task boundary was to
prove an existing boundary or downgrade it honestly.
```

Does not prove:

```txt
This does not prove duplicate worker jobs cannot be enqueued, that a worker
daemon exists, that a scheduler enforces gates, that DB writes are blocked by
memoryCoreGate, or that worker runtime safety is product-ready.
```

Consumer:

```txt
@krn/workers worker authority readback
@krn/db worker job smoke and heartbeat worker authority smoke
@krn/cli DB smoke and heartbeat preview output
schema regression documenting no current idempotency key column
```

Falsifier:

```txt
Future worker_jobs schema gains an idempotency key and unique constraint,
repository enqueue deduplicates jobs, runtime gate middleware rejects forbidden
Memory Core writes, or operator readback hides the not-enforced boundary.
```

## Changed

```txt
packages/workers/src/jobTypes.ts
  Added workerJobEnforcementBoundary and included idempotency/gate enforcement
  status in worker descriptions and authority readback.

packages/db/src/workerJobSmoke.ts
  Added shared enforcement-boundary readback so DB smoke reports that current
  worker idempotency and memoryCoreGate are not runtime-enforced.

packages/db/src/heartbeatWorkerAuthoritySmoke.ts
  Carries the same enforcement boundary through DB-backed heartbeat worker
  authority smoke.

packages/cli/src/workerJobSmoke.ts
packages/cli/src/runDbSmokeCommand.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
  Render the enforcement boundary in operator-facing output.

packages/db/src/schema/events.test.ts
  Documents that the current worker_jobs schema has no idempotencyKey column.

Adjacent tests
  Updated expected worker authority readbacks.
```

## Verification

Passed:

```txt
pnpm --filter @krn/workers test -- index brainHeartbeatPreview memoryStalenessHeartbeatPreview
pnpm --filter @krn/db test -- workerJobSmoke heartbeatWorkerAuthoritySmoke events
pnpm --filter @krn/cli test -- workerJobSmoke runDbSmokeCommand runHeartbeatPreviewCommand
pnpm db:ready
pnpm db:smoke:worker-jobs
pnpm db:smoke:heartbeat-worker-authority
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
git diff --check
```

Live DB smoke readback now includes:

```txt
Idempotency enforcement: key_pattern_only_not_enforced
Memory Core gate enforcement: declaration_only_not_runtime_enforced
Worker authority memoryCoreGate enforcement: declaration_only_not_runtime_enforced
Worker authority idempotency enforcement: key_pattern_only_not_enforced
```

Fallow:

```txt
First changed-files Fallow run caught excess complexity in workerJobSmoke.
The helper was simplified, focused DB tests passed again, and both changed-files
and broad Fallow gates then passed.
```

Persisted dogfood evidence is captured under execution run
`13e4cbc0-7ed1-4152-8d8c-4330f198367e`.

Command-shape corrections:

```txt
krn evidence capture --persist without KRN_DATABASE_URL failed with explicit env
guidance, then passed with KRN_DATABASE_URL set.
The first persisted capture omitted .beads/interactions.jsonl and the untracked
report directory from intended-file classification; the final capture included
both and produced unrelated: none, unknown: none.
```

Persisted run evidence:

```txt
finalEvidenceBundle: f7074ed2-9da6-4782-a89e-8964f766738d
finalReviewAssessment: 08980520-fcfe-4bb2-8169-3ea49b133420
finalFeedbackDelta: d5912ebd-cfdc-4294-8248-ce1a0e9317fe
finalObservationGroup: 151c0dc3-5f2f-41db-b54f-8b043a4abb9e
finalObservationItems: 9
finalReflectionRecord: b51dd6f7-61fc-4707-8a9c-687a4f4fa84c
finalReflectionObservationsSelected: 9
candidateRowsWritten: no
memoryMutation: none
```

## Proof

This proves:

```txt
Operator-facing worker authority readback no longer implies idempotent enqueue
deduplication or runtime memoryCoreGate enforcement.
DB smoke and heartbeat worker-authority smoke expose the same downgrade.
The current schema regression documents that no worker idempotency key column is
present today.
The downgrade preserves existing worker/DB/CLI test behavior.
Fallow changed-files and broad quality gates pass after simplification.
```

This does not prove:

```txt
Worker jobs execute.
Duplicate worker jobs are prevented.
memoryCoreGate is enforced against live DB calls.
A worker daemon, scheduler, queue runtime, or outbox dispatcher exists.
The broader worker runtime is product-ready.
```

## Review Burden

Low to medium. The slice touches worker authority readback, two DB smoke
surfaces, CLI formatting, and tests. It intentionally avoids runtime or schema
changes.

Rollback:

```txt
Remove workerJobEnforcementBoundary fields from worker descriptions/readbacks
and restore the prior smoke output expectations.
```

## Candidate Outputs

MemoryCandidate:

```txt
Worker idempotency key patterns are not runtime deduplication proof until the
worker_jobs schema/repository enforces uniqueness or deduplication.
reviewability: ready
decision: review
evidence refs: WJI-01 report, workerJobSmoke readback, schema events test
doesNotProve: does not prove future worker runtime idempotency.
```

AntiMemoryCandidate:

```txt
Do not infer runtime Memory Core write blocking from worker memoryCoreGate labels
or lifecycle smoke output.
reviewability: ready
decision: review
evidence refs: WJI-01 report, heartbeat worker authority smoke
doesNotProve: does not prove all docs/readbacks avoid overstating worker safety.
```

EvalCandidate:

```txt
Worker DB smoke should keep exposing key_pattern_only_not_enforced and
declaration_only_not_runtime_enforced until executable idempotency/gate
enforcement exists.
reviewability: ready
decision: review
evidence refs: workerJobSmoke tests, heartbeatWorkerAuthoritySmoke tests
doesNotProve: does not prove worker daemon readiness.
```

## Next

Next highest-ROI work should keep moving the product loop forward without
pretending worker runtime exists. Good candidates:

```txt
1. Add an ExecutionBrief format/version contract so Codex-facing prompt changes
   are explicit and reviewable.
2. Continue evidence metadata/type-boundary hardening only when it blocks product
   loop proof.
3. Defer worker daemon/idempotency enforcement until root plan authorizes a real
   worker runtime slice.
```
