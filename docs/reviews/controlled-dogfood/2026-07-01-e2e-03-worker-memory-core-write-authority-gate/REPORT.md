# E2E-03 Worker Memory Core Write Authority Gate

Date: 2026-07-01

## Verdict

Positive.

This slice turns worker `memoryCoreGate`, `allowedWrites`, and
`forbiddenWrites` from descriptive strings into executable validation.

The smallest product-relevant change was:

```txt
worker job description
-> deterministic write-authority assessment
-> describeMaintenanceJob assertion
-> behavior proof for mismatch
-> DB worker smoke readback: Authority validated jobs: 5
```

No worker daemon, queue runtime, DB schema, dashboard, API, MCP, broad scheduler,
or generic policy engine was added.

## KRN Plan

Persisted plan run:

```txt
executionRun: 285963d4-a90c-45dc-99da-a9003b111785
operatorIntent: deae24e9-69de-4fa9-aa70-4e1a9b0730be
taskContract: 7c360851-1cc3-4e30-8c71-70aeb41ef04b
harnessPlan: fe85866d-a883-42a7-b96e-2b8c6225c55b
contextAssembly: a2b6f78c-35ee-4323-9d32-40501d8bff20
```

Activation usefulness: mixed. KRN selected useful high-level guardrails around
activation/source/ingest boundaries, but missed the direct worker owner files.
The owning files were found through source inspection.

Retained pattern query:

```txt
worker Memory Core write authority gate allowedWrites forbiddenWrites memoryCoreGate
```

Result: no retained pattern matched. This was treated as no-match evidence, not
proof that no relevant pattern exists.

## Changed

- Added `assessMaintenanceJobWriteAuthority`.
- Added `assertMaintenanceJobWriteAuthority`.
- `describeMaintenanceJob` now asserts its write-authority contract before
  returning a description.
- Added a behavior proof that `no_memory_core_write` fails when it allows
  `memory_candidates`.
- DB worker smoke now imports worker descriptions and reports
  `Authority validated jobs`.
- CLI worker smoke output renders that authority-validation readback.

## Source-To-Decision

Source: repo-local audit finding and current worker source inspection.

Mechanism: worker job descriptions already declared `memoryCoreGate`,
`allowedWrites`, and `forbiddenWrites`, but no executable check tied those fields
together. A mismatch could make the safety boundary prose-only.

KRN implication: worker maintenance lanes should not be able to drift from
candidate-only/no-mutation boundaries without a deterministic failure.

Decision: adopt the smallest executable validator in `@krn/workers`, then expose
the current-job pass count through the existing DB worker smoke. Reject worker
daemon, queue runtime, DB schema, and generic policy engine work for this slice.

Consumer: worker job descriptions, DB worker smoke, future heartbeat/dreaming
candidate-only runtime work.

Falsifier: a worker job with `no_memory_core_write` can allow
`memory_candidates`, or a candidate-only gate can omit its required candidate
write without a failing test or smoke error.

## Verification

Passed:

```txt
pnpm --filter @krn/workers test -- index.test.ts
pnpm --filter @krn/db test -- workerJobSmoke.test.ts
pnpm --filter @krn/cli test -- workerJobSmoke.test.ts
pnpm run typecheck
pnpm db:ready
pnpm db:smoke:worker-jobs
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
pnpm --filter @krn/db db:check
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
git diff --check
```

Live DB smoke output included:

```txt
Authority validated jobs: 5
Worker jobs enqueued: 5
Queued jobs read back: 5
Running transitions: 5
Succeeded transitions: 2
Skipped transitions: 2
Failed transitions: 1
Cleanup remaining marker count: 0
Worker job smoke: passed
```

Persisted dogfood evidence for this implementation run:

```txt
executionRun: 285963d4-a90c-45dc-99da-a9003b111785
evidenceBundle: c7c8b6b1-cd52-4fdc-bfbf-0f2cfc0b4e26
reviewAssessment: d76ac48f-e515-47ec-a460-3b78335d3110
feedbackDelta: 9d710ae6-80b6-4052-b6f2-4e6c1212737f
observationGroup: e3a3a1a7-4825-483b-b5c9-ff850a040c16
observationItems: 5
reflectionRecord: 540bee78-0faf-45d0-8cfd-f48924dc0cb9
```

Evidence capture classified the dirty context as intended-only:

```txt
intended: 13
unrelated: 0
unknown: 0
command proof: 13 operator_reported / passed
memory mutation: none
```

## What Improved

- Worker Memory Core write authority is now executable.
- Current worker job descriptions fail fast if their gate/write declarations
  drift.
- The existing DB smoke exposes the authority-validation count before job
  lifecycle readback.
- The repair preserves candidate-only/no-final-truth mutation boundaries.

## What This Does Not Prove

- worker daemon execution;
- queue throughput;
- DB transaction isolation for future executors;
- semantic correctness of worker jobs;
- heartbeat/dreaming quality;
- autonomous Memory Core safety;
- product readiness.

## Brain ROI

Positive for source inspection and proof discipline.

Mixed for activation: the KRN plan supplied useful guardrails but missed direct
worker owner files, so manual `rg` and source inspection still carried the owner
selection.

## Candidate Outputs

MemoryCandidate:

```txt
Candidate: Worker maintenance lanes should validate write authority before
claiming Memory Core safety.
Decision: review
Reviewability: ready
Evidence refs: this report, packages/workers/src/jobTypes.ts,
packages/workers/src/index.test.ts, pnpm db:smoke:worker-jobs
doesNotProve: does not prove worker runtime safety or autonomous maintenance
```

AntiMemoryCandidate:

```txt
Candidate: Do not treat worker memoryCoreGate prose as enforcement unless the
gate is checked by executable validation or smoke readback.
Decision: review
Reviewability: ready
Evidence refs: this report
doesNotProve: does not prove every future worker executor write is intercepted
```

EvalCandidate:

```txt
Candidate: Worker write-authority tests should fail when no_memory_core_write
allows candidate or final Memory Core writes.
Decision: review
Reviewability: ready
Evidence refs: packages/workers/src/index.test.ts
doesNotProve: does not replace future executor-level tests
```

## Next Recommended Action

Use this gate as the safety baseline for the next heartbeat/dreaming vertical.
The next slice should make one candidate-only heartbeat output consume worker
authority readback, or move to the next highest-ROI shared-brain vertical if
Beads already has a more precise ready issue.
