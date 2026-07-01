# WJA-01 Worker Job Authority Constants

Date: 2026-07-01

## Summary

WJA-01 centralized the invariant worker job runtime contract used by
`describeMaintenanceJob` while preserving the existing worker authority readback
shape for CLI, DB smoke, and heartbeat candidates.

The change is intentionally small: it does not add a worker daemon, scheduler,
queue runtime, DB schema, memory promotion path, dashboard, API, MCP surface, or
broad worker refactor.

## KRN Plan

Persisted plan:

```txt
executionRun: b63e12b7-46e4-4adc-9970-8061af24cef8
operatorIntent: 9b175184-093b-40b9-9523-245c9c4cdd30
taskContract: 0d0a2b74-110b-4696-8cb0-75a51e416647
harnessPlan: 79d52871-ea82-49a4-a780-fd5a76eb7409
contextAssembly: e52e02e8-c75a-45bf-9d2d-e15fbb8914aa
```

Activation usefulness: mixed/weak.

The plan preserved useful guardrails, but selected broad plan/activation owner
files instead of the direct worker authority owner file. Source discovery via
`rg` and local source inspection found the actual implementation surface.

## Source To Decision

Source:

```txt
packages/workers/src/jobTypes.ts
packages/workers/src/index.test.ts
packages/db/src/workerJobSmoke.ts
packages/db/src/heartbeatWorkerAuthoritySmoke.ts
packages/cli/src/doctorStaticChecks.ts
```

Mechanism:

```txt
MaintenanceJobDescription mixed invariant runtime fields
workerTable/outboxTable/outboxTopic/requiresBackgroundLoop/outputEvent/failureState
with per-job authority fields. The repeated literals made the contract look
more configurable than it is.
```

KRN implication:

```txt
Worker authority should keep one canonical runtime contract while still exposing
operator-readable readback that proves "candidate/authority only" and does not
pretend a worker daemon exists.
```

Decision:

```txt
Adopt the cleanup by adding maintenanceJobRuntimeContract and deriving
MaintenanceJobDescription field types from it. Preserve the public description
shape because DB/CLI/readback consumers rely on those fields.
```

Does not prove:

```txt
This does not prove worker execution, scheduler readiness, queue idempotency,
runtime write enforcement, Memory Core mutation safety outside declared
authority, or product readiness.
```

Consumer:

```txt
@krn/workers describeMaintenanceJob and worker authority readback.
```

Falsifier:

```txt
A worker authority description no longer exposes the runtime fields, DB smoke
cannot validate five job authorities, heartbeat worker authority readback loses
expire_stale_memory status passed, or tests/CLI consumers fail.
```

## Changed

```txt
packages/workers/src/jobTypes.ts
  Added maintenanceJobRuntimeContract as the single source for invariant worker
  runtime fields and reused it inside describeMaintenanceJob.

packages/workers/src/index.test.ts
  Asserted worker descriptions include the canonical runtime contract.
```

## Verification

Passed:

```txt
pnpm --filter @krn/workers test -- index
pnpm --filter @krn/db test -- workerJobSmoke heartbeatWorkerAuthoritySmoke
pnpm --filter @krn/cli test -- runDbSmokeCommand runHeartbeatPreviewCommand doctorStaticChecks
pnpm db:ready
pnpm db:smoke:worker-jobs
pnpm db:smoke:heartbeat-worker-authority
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
git diff --check
```

Command-shape corrections:

```txt
krn evidence capture --persist without KRN_DATABASE_URL failed with explicit env guidance, then passed with KRN_DATABASE_URL set.
krn reflect --run-id failed because current CLI expects --scope run:<id>, then passed with --scope run:b63e12b7-46e4-4adc-9970-8061af24cef8.
```

Persisted run evidence:

```txt
finalEvidenceBundle: f61b451a-14d6-4c03-b822-e861049ac2b3
finalReviewAssessment: 061e0bce-edd7-45ca-bb86-e79f7a21622f
finalFeedbackDelta: f4c10fe3-ba90-46d3-a252-32cdb05b7366
finalObservationGroup: 768ef5f8-9b1c-4d6c-a409-4559e0fdfa73
finalObservationItems: 9
finalReflectionRecord: cf2839ed-44b5-4078-a7b0-3b88817a8444
finalReflectionObservationsSelected: 14
candidateRowsWritten: no
memoryMutation: none
```

Fallow:

```txt
changed-files gate: 0 issues in 3 changed files
broad report: .local-lab/fallow/full.compact.txt
```

Broad Fallow still reports existing schema/harness duplication groups outside
this slice. Those are baseline cleanup evidence, not WJA-01 blockers.

## Proof

This proves:

```txt
The repeated worker runtime literals are centralized in source.
The existing worker authority readback shape remains intact.
Worker and adjacent DB/CLI consumers still pass.
DB-backed worker job smoke still validates 5 authorities.
DB-backed heartbeat worker authority smoke still emits passed expire_stale_memory
authority and cleanup.
```

This does not prove:

```txt
Worker jobs execute.
A scheduler or daemon exists.
Outbox dispatch is atomic or idempotent.
Worker gates are runtime-enforced against DB calls.
The broader audit is complete.
KRN is product-ready.
```

## Review Burden

Low. The diff is limited to the worker job authority type/description owner and
one focused test. Public readback fields remain present.

Rollback:

```txt
Revert maintenanceJobRuntimeContract and restore inline literals in
describeMaintenanceJob.
```

## Candidate Outputs

MemoryCandidate:

```txt
Worker authority readback should preserve a canonical runtime contract instead
of duplicating invariant runtime fields per job.
reviewability: ready
decision: review
evidence refs: WJA-01 report, worker tests, worker DB smoke
doesNotProve: does not prove worker execution or runtime gate enforcement.
```

EvalCandidate:

```txt
Worker job authority tests should fail if runtime contract fields drift from
describeMaintenanceJob readback.
reviewability: ready
decision: review
evidence refs: packages/workers/src/index.test.ts
doesNotProve: does not prove DB dispatch idempotency or daemon readiness.
```

AntiMemoryCandidate:

```txt
Do not treat worker job authority descriptions as proof that a worker daemon,
scheduler, or Memory Core mutation runtime exists.
reviewability: ready
decision: review
evidence refs: WJA-01 report, db smoke output
doesNotProve: does not prove future docs will avoid overstating worker runtime.
```

## Next

Recommended next audit/product slice:

```txt
Worker job idempotency/runtime enforcement proof or rejection.
```

Why:

```txt
WJA-01 only removes authority-description drift. The audit still flags worker
idempotency keys and memoryCoreGate strings as declarations that need executable
proof or explicit downgrade.
```
