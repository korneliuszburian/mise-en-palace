# GCE-01 Consensus Relation Focus

Date: 2026-07-01

## Summary

GCE-01 routes graph relation review focus into the existing candidate-only
consensus/eval preview.

`buildConsensusCandidateEvaluationPreview` now accepts optional
`relationReview` input and emits a `relationReview` readback with:

```txt
sourceClaimEdgeId
edgeKind
relationReviewFocus
relationReviewQuestion
consumedBy
reviewUsefulness
doesNotProve
```

The preview also appends the relation review question to application guidance
so the focus changes operator-facing review instructions instead of remaining a
passive metadata field.

No broad eval platform, multi-agent runtime, worker daemon, crawler/entity
extraction, DB schema, Memory Core mutation, dashboard/API/MCP, graph ranking
rewrite, or autonomous consensus runtime was added.

## KRN Plan

Persisted plan:

```txt
executionRun: dbc3780f-db01-4f7a-a189-5d99ffddc10b
operatorIntent: a5c51afe-08fd-467b-ba6b-f4daf1aa436b
taskContract: a3732661-be41-4559-bd22-46c42f7703dd
harnessPlan: 6e22c285-fa05-4b31-b759-9189fe4ebdb0
contextAssembly: 24cc178d-b525-45ec-b406-5ad3fea88a60
```

Activation usefulness: mixed.

KRN selected useful guardrails about bounded local evidence, ingest/source
readback, and no runtime expansion. It did not select the direct owner file:

```txt
packages/workers/src/consensusCandidateEvaluationPreview.ts
```

Owner-file recall again selected broad plan/activation files. Local source
inspection found the actual owning surface.

Retained pattern selection from the persisted plan: rejected/deferred. A broad
pre-coding brain knowledge query returned no match, but narrower readbacks
selected useful retained patterns:

```txt
pattern:graph-relation-readback-boundary
pattern:heartbeat-candidate-only-runtime-boundary
```

## Source To Decision

Source:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v339-consensus-candidate-evaluation-preview/REPORT.md
docs/reviews/controlled-dogfood/2026-06-30-v367-consensus-eval-candidate-lane/REPORT.md
docs/reviews/controlled-dogfood/2026-07-01-gre-01-graph-relation-focus-eval-readback/REPORT.md
packages/workers/src/consensusCandidateEvaluationPreview.ts
packages/workers/src/consensusCandidateEvaluationPreview.test.ts
pattern:graph-relation-readback-boundary
pattern:heartbeat-candidate-only-runtime-boundary
GCE-01 Beads issue: mise-en-palace-kvz
```

Mechanism:

```txt
V339 added a candidate-only consensus/eval preview over support, dissent, risk,
decision options, reviewability, evidence refs, and no-mutation boundaries.
GRE-01 proved relationReviewFocus can be consumed by bounded graph QA readback.
By routing relationReviewFocus into the existing consensus preview, graph
relation disputes become reviewable consensus/eval input without creating a
runtime consensus agent or mutating source truth.
```

KRN implication:

```txt
Graph relation focus should flow through candidate-only review/eval surfaces
before KRN attempts any consensus runtime, graph ranking repair, or truth
mutation.
```

Decision:

```txt
Adopt optional relationReview input/output on consensus candidate evaluations.
Use the shared SourceRelationReviewFocus source-domain vocabulary. Append the
relation review question to application guidance and preserve mutation: none.
```

Rejected:

```txt
New eval platform, consensus runtime, multi-agent debate, worker daemon,
crawler/entity extraction, DB schema, graph ranking rewrite, Memory Core
mutation, source truth mutation, dashboard/API/MCP.
```

Consumer:

```txt
candidate-only consensus/eval preview
future operator-facing consensus readback
future graph relation mini Brain-QA cases
```

Falsifier:

```txt
A duplicate/contradiction SourceClaimEdge focus cannot appear in consensus
candidate evaluation output, relation review questions do not affect operator
guidance, or the preview implies source truth/promotion/mutation.
```

## Changed

```txt
packages/workers/src/consensusCandidateEvaluationPreview.ts
  Added relationReview input/output and guidance routing.

packages/workers/src/consensusCandidateEvaluationPreview.test.ts
  Added duplicate relation focus coverage with mutation/forbidden-write checks.

packages/workers/README.md
  Updated current truth for consensus relation review focus.
```

## Verification

Passed before final evidence capture:

```txt
pnpm --filter @krn/workers test -- consensusCandidateEvaluationPreview
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow:ci
pnpm quality:fallow
pnpm --filter @krn/harness test -- activePlanInvariants
git diff --check
```

Fallow note:

```txt
quality:fallow:ci found no issues in changed files.
quality:fallow exited 0 and reported existing broad duplication findings in
DB schema/harness files; no new changed-file issue was reported for this slice.
```

Persisted run evidence:

```txt
evidenceBundle: 8c707540-c296-4d87-9e0b-4d33cc4337c5
reviewAssessment: b5066e50-b5ea-4ee9-9a83-1c25d5902e37
feedbackDelta: cbcb1a95-40a4-4fb2-b23b-3d7c905b456a
changed files: 9 intended, 0 unrelated, 0 unknown
command evidence: 8 operator_reported/passed
memory mutation: none
feedback candidate reviewability: too_vague
observation group: 2635f9a7-fe4c-4392-8a40-a7afd7b69778
observation items: 5
reflection record: 60110578-74e5-4c80-b208-59716b5f6386
reflection findings: 0 gaps, 0 contradictions
reflection candidate rows written: no
```

## Proof

This proves:

```txt
relationReviewFocus can cross from graph relation candidate/eval vocabulary
into candidate-only consensus/eval readback.
The consensus preview can preserve duplicate relation focus and append the
review question to operator guidance while keeping mutation none.
```

This does not prove:

```txt
Duplicate truth is correct.
Consensus correctness exists.
Multi-agent debate exists.
Graph retrieval/ranking quality improved.
Source truth, SourceClaimEdge, EvalCandidate, or Memory Core rows were mutated.
Operator-facing CLI/API/MCP readback exists.
```

## Brain Usefulness Verdict

```txt
positive
```

The retained graph relation and candidate-only runtime patterns helped constrain
the implementation to one existing pure worker preview. The persisted KRN plan
was useful for guardrails but weak for direct owner-file recall.

## Candidate Outputs

Allowed candidate outputs:

```txt
EvalCandidate:
  Consensus candidate evaluation preview should preserve relationReviewFocus for
  contradiction/duplicate relation review cases.

MemoryCandidate:
  Graph relation focus should flow through candidate-only review/eval lanes
  before any consensus runtime or source truth mutation.

AntiMemoryCandidate:
  Do not treat consensus relation focus consumption as proof of source truth,
  duplicate consolidation, contradiction resolution, consensus correctness, or
  graph ranking quality.
```

No candidate was promoted.

## Next Recommended Action

Expose or reuse consensus relation review readback through one operator-facing
surface, or explicitly reject that route if source inspection shows the pure
worker preview should remain internal until a stronger product loop exists.
