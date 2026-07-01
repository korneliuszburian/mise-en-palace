# GRE-01 Graph Relation Focus Eval Readback

Date: 2026-07-01

## Summary

GRE-01 proves the relation focus added in GCR-01 can be consumed by an existing
bounded eval/readback path, not only printed in heartbeat candidate text.

The existing relation-grounded QA readback now accepts optional relation review
input:

```txt
relationReviewFocus
relationReviewQuestion
sourceClaimEdgeId
edgeKind
```

The tiny graph-brain QA proof uses a `duplicates` SourceClaimEdge and records
that `relationReviewFocus: duplicate` was consumed by
`relation_grounded_qa_readback`.

No broad eval platform, multi-agent runtime, worker daemon, crawler, entity
extractor, DB schema, graph ranking rewrite, dashboard/API/MCP, or Memory Core
mutation was added.

## KRN Plan

Persisted plan:

```txt
executionRun: 3e9329e8-8e64-447b-ba40-08068f827b9e
operatorIntent: e451c582-0485-4aac-807f-dc4f62b7de1e
taskContract: d64948f2-fd70-4855-9f8a-bda9b9f517cd
harnessPlan: 0c26801c-17ce-4a23-8d80-b03b3a8f7a59
contextAssembly: 73c41878-0ab5-47db-99f3-1d837eff18fc
```

Activation usefulness: mixed.

KRN selected useful graph/ingest guardrails but owner-file recall again pointed
at broad plan/activation files rather than the direct eval/readback owner. Local
source inspection found the owning surface:

```txt
packages/harness/src/activation/relationGroundedQaReadback.ts
packages/harness/src/activation/index.test.ts
packages/core/src/source.ts
packages/workers/src/sourceRelationHeartbeatPreview.ts
```

Retained pattern selection: rejected/deferred by plan readback.

## Source To Decision

Source:

```txt
docs/reviews/controlled-dogfood/2026-07-01-gcr-01-graph-contradiction-duplicate-candidates/REPORT.md
packages/workers/src/sourceRelationHeartbeatPreview.ts
packages/harness/src/activation/relationGroundedQaReadback.ts
packages/harness/src/activation/index.test.ts
docs/brain-knowledge/usefulness-feedback/v377-brain-qa-pattern-coverage-gap.json
GRE-01 Beads issue: mise-en-palace-0e1
```

Mechanism:

```txt
GCR-01 made SourceClaimEdge maintenance candidates expose relationReviewFocus
and relationReviewQuestion. The relation-grounded QA readback already compares a
no-relation baseline against an edge-aware selected-source path. By carrying the
relation review focus through that readback, the eval surface can show whether a
graph relation review signal was actually used by a bounded QA proof.
```

KRN implication:

```txt
Graph relation candidate output should become reusable eval/readback input,
otherwise it remains operator-facing text and does not improve the brain loop.
```

Decision:

```txt
Adopt SourceRelationReviewFocus as a small source-domain type in @krn/core.
Keep the worker export as an alias for compatibility. Add optional
relationReview input/output to relation-grounded QA readback and prove a
duplicate edge consumes it.
```

Rejected:

```txt
New eval platform, consensus runtime, worker daemon, DB schema, graph ranking
rewrite, entity extraction, Memory Core mutation, and dashboard/API/MCP.
```

Consumer:

```txt
relation-grounded QA readback
graph relation heartbeat candidates
future consensus/eval candidate preview
mini Brain-QA graph relation cases
```

Falsifier:

```txt
relationReviewFocus remains only in heartbeat candidate text, relation-grounded
QA readback drops it, or duplicate relation focus does not appear in the bounded
QA proof output.
```

## Changed

```txt
packages/core/src/source.ts
  Added SourceRelationReviewFocus as a small source-domain vocabulary.

packages/workers/src/sourceRelationHeartbeatPreview.ts
  Reused SourceRelationReviewFocus while preserving the worker-facing alias.

packages/harness/src/activation/relationGroundedQaReadback.ts
  Added optional relationReview input and readback output with proof/non-proof.

packages/harness/src/activation/index.test.ts
  Changed the tiny graph-brain QA proof to use a duplicate SourceClaimEdge and
  assert relationReviewFocus consumption.
```

## Verification

Passed:

```txt
pnpm --filter @krn/harness test -- activation/index
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
pnpm --filter @krn/harness test -- activePlanInvariants
git diff --check
```

Persisted run evidence:

```txt
evidenceBundle: 2a7fdfe4-457f-4dbb-9bd9-30503596bfcf
reviewAssessment: 23edaa7d-9515-4e02-8a47-3eeccd9fdc8f
feedbackDelta: 0be195b5-1849-4777-bc67-156a34be8a6b
changed files: 10 intended, 0 unrelated, 0 unknown
command evidence: 8 operator_reported/passed
memory mutation: none
feedback candidate reviewability: too_vague
observation group: b52ecf97-09c9-4ba9-b9db-f5e9b4978667
observation items: 13
reflection record: 4bcc3ffa-0f6d-4cbc-a4cf-4768bef35155
reflection findings: 5 gaps, 0 contradictions
reflection candidate rows written: no
```

## Proof

This proves:

```txt
relationReviewFocus can cross from graph relation candidate vocabulary into a
bounded graph-brain QA readback.
The existing relation-grounded QA proof now records duplicate relation focus as
used by the edge-aware path.
The change is covered by focused harness tests, full tests, typecheck, and
Fallow.
```

This does not prove:

```txt
Duplicate truth is correct.
Contradiction resolution or duplicate consolidation exists.
Graph retrieval/ranking quality improved.
Consensus runtime, multi-agent debate, entity extraction, crawler, or Memory
Core mutation exists.
Codex will use the readback correctly.
```

## Brain Usefulness Verdict

```txt
positive
```

The brain workflow helped preserve the bounded product direction and connect
GCR output to a downstream eval/readback consumer. Owner-file recall remains
weak for this slice.

## Candidate Outputs

Allowed candidate outputs:

```txt
EvalCandidate:
  Relation-grounded QA readback should preserve relationReviewFocus for
  duplicate/contradiction edge-aware cases.

MemoryCandidate:
  Shared graph relation review focus should live in source-domain vocabulary
  when consumed by worker and eval surfaces.

AntiMemoryCandidate:
  Do not treat relationReviewFocus consumption as proof of relation truth,
  duplicate consolidation, contradiction resolution, or graph ranking quality.
```

No candidate was promoted.

## Next Recommended Action

Continue with `mise-en-palace-kvz`: use graph relation focus in the existing
consensus/eval candidate preview, or explicitly reject that route with
source-to-decision evidence.
