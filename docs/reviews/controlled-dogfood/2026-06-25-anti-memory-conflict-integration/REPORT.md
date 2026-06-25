# Anti-Memory Conflict Integration Report

Status: B-04 completion report.

Date: 2026-06-25

## Executive Verdict

B-04 proved anti-memory conflict integration through the review gate and
DB-backed activation. A stale memory application generated a reviewable
anti-memory candidate with candidate evidence, the candidate was explicitly
promoted through `krn memory anti promote`, and a later `krn plan --persist`
excluded the stale memory and its source claim as unsafe with the anti-memory
record ID in the explanation.

## Scope

Changed:

- `packages/cli/src/runMemoryRecordApplyCommand.ts`
- `packages/cli/src/runCli.test.ts`

Not changed:

- activation scoring;
- Memory Core promotion rules;
- MemoryReviewGate;
- AntiMemoryReviewGate policy;
- DB schema;
- reflection extraction;
- dashboard/API/MCP/server;
- worker runtime.

## Implementation Note

B-04 found a small gap in B-03 candidate generation: feedback-generated
anti-memory candidates were useful but did not include formal
`reflectionCandidateEvidence` metadata required by the AntiMemoryReviewGate.

The repair adds candidate evidence metadata:

```txt
provenance: local_operator_note
evidenceRefs:
  - memory-application:<id>
  - memory-feedback-event:<id>
doesNotProve:
  Operator feedback does not prove the anti-memory candidate should be promoted without review.
```

This keeps promotion review-gated. The CLI still does not auto-promote
anti-memory candidates.

## DB-Backed Dogfood

### 1. Create promotable stale-feedback candidate

```txt
memoryApplication: ec8842ae-fcf5-402a-a269-3b2367751581
memoryRecord: 41d1a2ef-3578-4e45-947f-42c6739796de
memoryFeedbackEvent: d2ecb126-026f-4f7b-8f9d-054db70d5fa9
antiMemoryCandidate: e2f3141a-2285-4fec-9710-47ec99fbf277
Candidate reviewability: review
```

Reason:

```txt
Stale: old krn audit slice guidance should be replaced by evidence capture,
DB smoke, dogfood reports, and source-to-decision records.
```

### 2. Promote through review gate

```txt
antiMemoryCandidate: e2f3141a-2285-4fec-9710-47ec99fbf277
antiMemoryRecord: 707f3d5a-ad6e-4303-8fbb-b9f014522231
reviewer: codex
evidenceReviewedRef: docs/reviews/controlled-dogfood/2026-06-25-memory-feedback-demotion-loop/REPORT.md
reviewedSourceClaimId: f0b5c9ee-01aa-41df-9268-7df3f7437068
```

### 3. Prove activation exclusion

Activation run:

```txt
b2e07c29-385c-4b4f-bd36-5e1f7563f051
```

Task:

```txt
Close a KRN implementation slice with evidence capture and DB smoke instead of krn audit slice governance proof
```

Explicit exclusions:

```txt
source_claim:f0b5c9ee-01aa-41df-9268-7df3f7437068
reason=unsafe
explanation=Blocked by anti-memory 707f3d5a-ad6e-4303-8fbb-b9f014522231: Stale: old krn audit slice guidance should be replaced by evidence capture, DB smoke, dogfood reports, and source-to-decision records.

memory_record:41d1a2ef-3578-4e45-947f-42c6739796de
reason=unsafe
explanation=Blocked by anti-memory 707f3d5a-ad6e-4303-8fbb-b9f014522231: Stale: old krn audit slice guidance should be replaced by evidence capture, DB smoke, dogfood reports, and source-to-decision records.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/cli test -- runCli runMemoryRecordApplyCommand` | passed | CLI tests cover feedback-generated anti-memory candidate evidence metadata. | Does not prove DB activation behavior. |
| `pnpm --filter @krn/cli typecheck` | passed | CLI type boundaries compile after evidence metadata change. | Does not prove full workspace behavior. |
| `KRN_DATABASE_URL=... krn memory record apply ... --outcome stale --persist` | passed | Stale feedback creates MemoryApplication, MemoryFeedbackEvent, and reviewable AntiMemoryCandidate. | Does not prove the candidate should be promoted. |
| `KRN_DATABASE_URL=... krn memory anti promote ... --persist` | passed | AntiMemoryReviewGate accepted the candidate and created AntiMemoryRecord. | Does not prove all anti-memory candidates are valid. |
| `KRN_DATABASE_URL=... krn plan --task ... --persist` | passed | Activation excluded stale memory/source claim with explicit anti-memory reason. | Does not prove activation scoring quality generally. |

## What This Does Not Prove

- Anti-memory quality at scale.
- Automatic demotion should exist.
- Memory Core should mutate without review.
- Target-repo product readiness.
- Dashboard/API/MCP/worker need.

## Next Recommended Action

Continue to:

```txt
C-00 — Target Repo Harness Trial
```

C-00 should use a real target repo or clearly separate project identity. It
should measure review burden and prove KRN beyond self-referential dogfood.
