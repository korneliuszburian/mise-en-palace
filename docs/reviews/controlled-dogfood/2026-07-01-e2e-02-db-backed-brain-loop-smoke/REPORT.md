# E2E-02 DB-Backed Brain Loop Smoke

Date: 2026-07-01

## Verdict

Positive.

This slice adds a single live DB smoke for the governed KRN brain loop:

```txt
evidence bundle
-> review assessment
-> feedback delta
-> source claim
-> MemoryCandidate
-> MemoryReviewGate
-> MemoryRecord + version
-> activation retrieval/context assembly
-> activation trace readback
-> memory application
-> cleanup
```

It closes the gap left by E2E-01: the in-memory harness proof now has a current-shell DB-backed readback counterpart.

## KRN Plan

Persisted plan run:

```txt
executionRun: dd80c946-e259-4d84-970e-a9969a26524b
operatorIntent: 69ce7cdd-7a01-4463-901c-0d6b4f4b1328
taskContract: 631306de-0846-4cf9-9466-3e020aabc6e7
harnessPlan: 87d1e504-46cf-4ffb-8585-b04d108e987d
contextAssembly: b8bf6b24-099f-4f40-ad97-f430855caade
```

Activation usefulness: mixed positive. KRN selected useful guardrails around source/ingest/activation, but owner-file discovery still needed manual source inspection of DB smoke owners.

## Changed

- Added `runBrainLoopSmokeCheck` in `@krn/db/dev`.
- Added CLI target `krn db smoke brain-loop`.
- Added root script `pnpm db:smoke:brain-loop`.
- Added cleanup/count support for the brain-loop smoke marker rows.
- Added tests for export, parser, and missing DB configuration path.

No DB schema, migration, worker daemon, crawler, dashboard, API, MCP, or activation scoring change was added.

## Live DB Proof

Command:

```txt
pnpm db:smoke:brain-loop
```

Passed with:

```txt
Evidence bundle: d7d86832-7d62-4b8e-93bf-1356227e5530
Review assessment: 5cad985d-9597-4d56-8420-87e5bf07b885
Feedback delta: 92d7ff03-d733-4a85-9874-b721837ceb2b
Memory candidate reviewed status: accepted
Memory record readback: matched
Context assembly readback: matched
Activation decisions: 3
Included memory decisions: 1
Context items: 2
Cleanup remaining marker count: 0
Brain loop smoke: passed
```

Persisted dogfood evidence for this implementation run:

```txt
executionRun: dd80c946-e259-4d84-970e-a9969a26524b
evidenceBundle: 8c52401c-ac48-4927-9963-a90e2e6bdb13
reviewAssessment: 3b7a49d8-635e-4989-b181-41920d3281ee
feedbackDelta: c6988931-8509-4247-b3fc-4950a6d76135
observationGroup: 2c93c8fd-1ec3-42ca-9558-65d0afe5a21a
observationItems: 5
reflectionRecord: 938e6049-9b2a-4da7-a444-4f0bbc5ae996
```

Run readback confirmed intended-only dirty-context classification:

```txt
intended: 15
unrelated: 0
unknown: 0
command proof: 11 operator_reported / passed
memory mutation: none
```

## Verification

Passed:

```txt
pnpm --filter @krn/db test -- brainLoopSmoke.test.ts
pnpm --filter @krn/cli test -- parseDbArgs.test.ts runCli.test.ts
pnpm run typecheck
pnpm --filter @krn/db db:check
pnpm db:ready
pnpm db:smoke:brain-loop
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
pnpm eval:brain-battle:smoke
pnpm eval:promptfoo:smoke
krn evidence capture --persist --run-id dd80c946-e259-4d84-970e-a9969a26524b
krn run show --run-id dd80c946-e259-4d84-970e-a9969a26524b --json
krn observe --run-id dd80c946-e259-4d84-970e-a9969a26524b --persist
krn reflect --scope run:dd80c946-e259-4d84-970e-a9969a26524b --persist
git diff --check
```

Fallow CI result: no issues in changed files after removing one small duplication against `memoryGovernanceSmoke`.

## Source-To-Decision

Source: local E2E-01 harness integration proof and DB smoke source inspection.

Mechanism: combine existing persisted harness evidence, memory governance, MemoryReviewGate, activation retrieval, and activation trace APIs into one current-shell DB smoke.

KRN implication: the shared brain kernel can now prove the main governed loop through live repositories, not only in memory and not only through separate smoke commands.

Decision: add a bounded `brain-loop` smoke target. Reject schema, worker runtime, crawler, broad benchmark, and activation scoring changes for this slice.

Consumer: DB readiness, future product-loop dogfood, and second-opinion review of the brain kernel loop.

Falsifier: `pnpm db:smoke:brain-loop` fails, cleanup leaves marker rows, MemoryReviewGate is bypassed, activation does not include the promoted memory, or run readback cannot see the activation trace.

## What Improved

- The core value loop is executable with one DB command.
- Memory promotion uses `MemoryReviewGate`, not direct repository promotion.
- Activation reuse is proven through persisted retrieval/context/decision readback.
- Cleanup is self-checking with marker count `0`.
- The smoke has a clear CLI surface and root script.

## What This Does Not Prove

- product readiness;
- activation ranking quality;
- autonomous reflection quality;
- worker runtime execution;
- graph retrieval quality;
- broad benchmark performance;
- memory usefulness at scale;
- UI/API/MCP readiness.

## Brain ROI

Positive for workflow direction and proof discipline.

Mixed for activation: the persisted plan supplied useful guardrails but still did not identify all direct DB smoke owner files. Manual source inspection remained necessary.

## Candidate Outputs

MemoryCandidate:

```txt
Candidate: DB-backed brain-loop smoke should remain the minimum product-loop proof before broader product surfaces.
Decision: review
Reviewability: ready
Evidence refs: this report, pnpm db:smoke:brain-loop output
doesNotProve: does not prove ranking quality, worker runtime, autonomous reflection, or product readiness
```

AntiMemoryCandidate:

```txt
Candidate: Do not claim KRN product readiness from DB smoke alone.
Decision: review
Reviewability: ready
Evidence refs: this report
doesNotProve: does not prove product readiness is blocked only by this caveat
```

EvalCandidate:

```txt
Candidate: Brain-loop smoke should fail if MemoryReviewGate is bypassed or activation does not include the promoted MemoryRecord.
Decision: review
Reviewability: ready
Evidence refs: packages/db/src/brainLoopSmoke.ts
doesNotProve: does not replace broader Brain-QA or multi-repo usefulness metrics
```

## Next Recommended Action

Use this smoke as the DB-backed baseline, then move to the next highest-ROI audit item that changes behavior instead of process text. Good candidates:

```txt
1. worker Memory Core gate/write authority enforcement;
2. typed review/evidence boundary cleanup if it affects persistence safety;
3. graph/ingest/heartbeat vertical loop that reuses this brain-loop proof.
```
