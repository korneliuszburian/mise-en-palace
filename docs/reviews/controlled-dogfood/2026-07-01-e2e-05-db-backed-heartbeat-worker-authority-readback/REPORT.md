# E2E-05 DB-Backed Heartbeat Worker Authority Readback

Date: 2026-07-01

## Verdict

Positive.

This slice closes the E2E-04 live-readback caveat. KRN now has a DB-backed smoke
that seeds one expired `MemoryRecord`, runs the real heartbeat preview producer,
proves the emitted memory-staleness candidate includes validated
`expire_stale_memory` worker authority, and cleans up the seeded DB rows.

No worker daemon, queue runtime, scheduler, DB schema, dashboard, API, MCP,
broad eval platform, or product server was added.

## KRN Plan

Persisted plan run:

```txt
executionRun: 80b6d256-3cf2-45cd-86b1-a9e6010b72c0
operatorIntent: 6e7f0211-9f5b-4511-a293-47755ae73baa
taskContract: 151db1a0-5a7c-438f-b663-0a01eaf85bf4
harnessPlan: c080d9b0-7e67-4a52-938d-bd057a781fb7
contextAssembly: d99bf1d9-85fe-4ba0-86f0-ca0ce9fdd046
```

Activation usefulness: mixed positive. KRN selected useful no-runtime and
heartbeat/staleness guardrails, but owner-file recall missed the exact DB smoke
and heartbeat command surfaces. Source inspection found the owners:

```txt
packages/db/src/dbSmokeSupport.ts
packages/db/src/heartbeatWorkerAuthoritySmoke.ts
packages/cli/src/runDbSmokeCommand.ts
packages/cli/src/parseDbArgs.ts
packages/workers/src/brainHeartbeatPreview.ts
packages/workers/src/memoryStalenessHeartbeatPreview.ts
```

Retained pattern readback:

```txt
pattern:heartbeat-candidate-only-runtime-boundary -> helped
pattern:cost-aware-acquisition-escalation-boundary -> neutral/noise for this slice
```

## Source-To-Decision

Source: E2E-04 report and repo-local heartbeat/worker/DB smoke source.

Mechanism: E2E-04 proved candidate readback includes validated worker authority,
but a live heartbeat run emitted no candidate because the current DB had no
memory records. The missing proof was not another runtime feature; it was an
isolated DB-backed seed/readback/cleanup proof.

KRN implication: worker-backed heartbeat candidates need one DB-backed proof
that candidate-only output is visible from persisted state before any worker
daemon, queue runtime, scheduler, or Memory Core automation is introduced.

Decision: adopt a new internal DB smoke target:

```txt
krn db smoke heartbeat-worker-authority
```

Rejected: worker daemon, queue runtime, scheduler, DB schema, broad heartbeat
runtime, and mutating `krn heartbeat preview` with fixture setup concerns.

Consumer: DB smoke CLI, E2E reports, future heartbeat/dreaming candidate runtime
slices.

Falsifier: the smoke emits no memory-staleness candidate, omits
`workerAuthority`, reports non-passed worker authority, mutates outside the
isolated smoke seed, or leaves marker rows after cleanup.

## Changed

- Added `runHeartbeatWorkerAuthoritySmokeCheck` in `@krn/db`.
- Added `krn db smoke heartbeat-worker-authority`.
- Added root script `pnpm db:smoke:heartbeat-worker-authority`.
- Added parser/CLI tests for the new target and missing-DB guidance.
- Added DB export/test coverage for the new smoke helper.

## Live DB Readback

Latest live proof:

```txt
pnpm db:smoke:heartbeat-worker-authority

Memory records loaded: 1
Candidate kind: memory_staleness_maintenance_candidate
Candidate reviewability: ready
Candidate mutation: none
Memory staleness candidates: 1
Worker authority jobType: expire_stale_memory
Worker authority memoryCoreGate: must_create_reviewed_invalidation_candidate
Worker authority status: passed
Worker authority mutation: none
Cleanup remaining marker count: 0
Heartbeat worker authority smoke: passed
```

DB readiness in the same shell:

```txt
Postgres: reachable
Migrations expected: 14
Migrations applied: 14
pgvector: available
Brain store readiness: ready
```

## Verification

Passed:

```txt
pnpm --filter @krn/db test -- heartbeatWorkerAuthoritySmoke workerJobSmoke
pnpm --filter @krn/cli test -- parseDbArgs runCli
pnpm -C packages/db typecheck
pnpm -C packages/cli typecheck
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
pnpm db:ready
pnpm db:smoke
pnpm db:smoke:heartbeat-worker-authority
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
git diff --check
krn evidence capture --persist --run-id 80b6d256-3cf2-45cd-86b1-a9e6010b72c0
krn observe --run-id 80b6d256-3cf2-45cd-86b1-a9e6010b72c0 --persist
krn reflect --scope run:80b6d256-3cf2-45cd-86b1-a9e6010b72c0 --persist
```

Fallow changed-files gate passed. Broad Fallow completed and reported existing
baseline duplication groups in schema/harness files; they are not changed-file
failures and are out of this slice's scope.

Persisted dogfood evidence:

```txt
evidenceBundle: 2b2b9344-7aee-48f3-a0f5-9bb31c568f8f
reviewAssessment: ae2e8121-9c63-4934-90da-7ea2cc9a4bb9
feedbackDelta: e3115c01-9de8-43fd-b497-466269f327d1
observationGroup: 116a3905-0c3e-4cbc-8ac6-f2a771e584aa
observationItems: 5
reflectionRecord: cfc6fff4-0a7e-4953-a9d5-6838767d9434
```

Evidence capture classified all changed files as intended:

```txt
intended: 15
unrelated: 0
unknown: 0
command proof: 14 operator_reported / passed
memory mutation: none
```

## What Improved

- The E2E-04 no-candidate caveat is closed with a live DB-backed candidate.
- The worker-authority readback is now repeatable through a DB smoke command.
- The smoke proves setup, candidate emission, worker authority, and cleanup in
  one bounded command.
- The heartbeat lane remains candidate-only and mutation-free outside isolated
  smoke setup/cleanup.

## What This Does Not Prove

- worker job execution;
- scheduler readiness;
- queue throughput;
- autonomous maintenance safety;
- source truth;
- memory usefulness;
- candidate usefulness at scale;
- product readiness.

## Candidate Outputs

EvalCandidate:

```txt
Candidate: DB-backed heartbeat worker-authority smoke should remain green.
Decision: review
Reviewability: ready
Evidence refs:
- packages/db/src/heartbeatWorkerAuthoritySmoke.ts
- packages/cli/src/runDbSmokeCommand.ts
- this report
doesNotProve: does not prove worker execution, scheduler readiness, or Memory
Core automation safety
```

MemoryCandidate:

```txt
Candidate: Worker-backed heartbeat candidates should have DB-backed smoke proof
before runtime automation.
Decision: review
Reviewability: ready
Evidence refs:
- docs/reviews/controlled-dogfood/2026-07-01-e2e-04-worker-authority-heartbeat-readback/REPORT.md
- docs/reviews/controlled-dogfood/2026-07-01-e2e-05-db-backed-heartbeat-worker-authority-readback/REPORT.md
doesNotProve: does not prove all future heartbeat candidate kinds have DB-backed
proof
```

## Next Recommended Action

Move to the next audit/product cleanup with high leverage now that worker
authority has source, candidate, DB-backed readback, and cleanup proof. The
best next slice is review/feedback domain ownership consolidation unless Beads
has a higher-priority ready issue that directly closes the shared-brain vertical
loop.
