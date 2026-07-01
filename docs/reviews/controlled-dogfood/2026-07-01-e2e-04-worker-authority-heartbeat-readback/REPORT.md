# E2E-04 Worker Authority Heartbeat Readback

Date: 2026-07-01

## Verdict

Positive, with one live-readback caveat.

This slice routes the executable worker write-authority gate from E2E-03 into
heartbeat candidate readback. Memory-staleness heartbeat candidates now expose
the validated `expire_stale_memory` worker authority:

```txt
workerAuthority.jobType: expire_stale_memory
workerAuthority.memoryCoreGate: must_create_reviewed_invalidation_candidate
workerAuthority.status: passed
workerAuthority.allowedWrites: worker_jobs, outbox_events, memory_candidates
workerAuthority.forbiddenWrites: memory_records, anti_memory_records, source_claims, source_decisions
```

No worker daemon, queue runtime, DB schema, dashboard, API, MCP, broad scheduler,
or product server was added.

## KRN Plan

Persisted plan run:

```txt
executionRun: ec2a1fe3-bce0-4ffc-a7d5-e893415c172c
operatorIntent: 0c9277e2-2f1c-4a3c-b3ac-47dff6971e88
taskContract: 9d163afd-9bd3-4ac7-989d-3b8c8eb6f167
harnessPlan: 5d369a68-3c83-4043-85a7-24136e8dab3e
contextAssembly: 56fe4227-09bc-4626-99bf-e0cdc59373b2
```

Activation usefulness: mixed. The plan selected useful heartbeat, staleness,
ingest, and no-runtime guardrails, but owner-file recall missed the direct
worker/heartbeat files. Owner files were found through `rg` and source
inspection.

Retained pattern readback:

```txt
worker authority heartbeat candidate readback memoryCoreGate allowedWrites forbiddenWrites candidate-only mutation none
```

Result: no match. A broader query selected:

```txt
pattern:heartbeat-candidate-only-runtime-boundary
pattern:cost-aware-acquisition-escalation-boundary
```

Usefulness:

```txt
heartbeat-candidate-only-runtime-boundary: helped
cost-aware-acquisition-escalation-boundary: neutral
```

## Source-To-Decision

Source: E2E-03 report and current worker/heartbeat source inspection.

Mechanism: worker job descriptions now have executable write-authority
validation, but heartbeat candidates still only showed candidate forbidden
writes. Operators could not see which validated worker gate backed a
worker-backed maintenance candidate.

KRN implication: candidate-only heartbeat work should expose the validated worker
authority behind worker-backed maintenance candidates before any runtime
automation, worker daemon, scheduler, or Memory Core mutation is introduced.

Decision: adopt a small `WorkerJobAuthorityReadback` and attach the validated
`expire_stale_memory` authority to memory-staleness heartbeat candidates. Reject
worker runtime, queue runtime, DB schema, generic policy engine, and broad
heartbeat rewrite for this slice.

Consumer: heartbeat candidate JSON/text readback, operator review, future
DB-backed heartbeat smoke.

Falsifier: a memory-staleness heartbeat candidate can be emitted without
`workerAuthority.status: passed`, or the CLI hides the worker authority from
text/JSON readback.

## Changed

- Added `WorkerJobAuthorityReadback`.
- Added `buildMaintenanceJobAuthorityReadback(jobType)`.
- Memory-staleness heartbeat candidates now include validated
  `workerAuthority` for `expire_stale_memory`.
- CLI heartbeat text output renders candidate `workerAuthority`.
- Worker and CLI tests prove the worker authority appears in candidate readback.

## Verification

Passed:

```txt
pnpm --filter @krn/workers test -- index.test.ts memoryStalenessHeartbeatPreview.test.ts brainHeartbeatPreview.test.ts
pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand.test.ts
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm db:ready
pnpm quality:fallow:ci
pnpm quality:fallow
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
krn evidence capture --persist --run-id ec2a1fe3-bce0-4ffc-a7d5-e893415c172c
krn observe --run-id ec2a1fe3-bce0-4ffc-a7d5-e893415c172c --persist
krn reflect --scope run:ec2a1fe3-bce0-4ffc-a7d5-e893415c172c --persist
```

Live read-only heartbeat command passed but emitted no candidates because the
current project DB had no memory records:

```txt
krn heartbeat preview --candidate-kind memory_staleness --max-candidates 3
candidateIds: none
memoryRecords: 0
mutation: none
```

Changed-files Fallow passed. Broad Fallow still reports existing baseline
duplication findings outside this slice's changed files.

Persisted dogfood evidence:

```txt
evidenceBundle: 55d86a27-40bf-4257-a7aa-457c6a463a6f
reviewAssessment: 45c96f99-eee6-469b-86dc-08a8641e509d
feedbackDelta: cf4aaa8c-3eca-4051-ac90-fce018f07f96
observationGroup: 64f4236f-3fcd-44b0-a8f2-c5d7af592463
observationItems: 5
reflectionRecord: d3f93fdb-d049-46d3-908c-dd518301bb4e
```

Evidence capture classified all changed files as intended:

```txt
intended: 13
unrelated: 0
unknown: 0
command proof: 11 operator_reported / passed
memory mutation: none
```

## What Improved

- Worker-backed memory-staleness heartbeat candidates now show the executable
  worker gate that backs them.
- Candidate readback now distinguishes candidate forbidden writes from worker
  authority readback.
- The output remains candidate-only and mutation-free.

## What This Does Not Prove

- live DB-backed candidate emission;
- worker execution;
- queue throughput;
- scheduler readiness;
- autonomous maintenance safety;
- source or memory truth;
- product readiness.

## Candidate Outputs

MemoryCandidate:

```txt
Candidate: Heartbeat memory-staleness candidates should expose validated worker
authority before runtime automation.
Decision: review
Reviewability: ready
Evidence refs: this report, packages/workers/src/memoryStalenessHeartbeatPreview.ts,
packages/cli/src/runHeartbeatPreviewCommand.ts
doesNotProve: does not prove worker execution or live DB candidate availability
```

EvalCandidate:

```txt
Candidate: DB-backed heartbeat smoke should prove one emitted memory-staleness
candidate includes workerAuthority.status=passed.
Decision: review
Reviewability: ready
Evidence refs: live no-candidate heartbeat command in this report
doesNotProve: does not require a worker daemon or schema change
```

## Next Recommended Action

Open a DB-backed proof slice that seeds or selects one eligible MemoryRecord,
runs heartbeat preview/readback, and proves a live memory-staleness candidate
includes validated worker authority with cleanup.
