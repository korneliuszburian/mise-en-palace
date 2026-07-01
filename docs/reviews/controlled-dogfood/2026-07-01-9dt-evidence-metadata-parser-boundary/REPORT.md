# 9DT Evidence Metadata Parser Boundary

Date: 2026-07-01

## Verdict

Positive, bounded.

This slice used the retained TypeScript parser exemplar to repair one real
EvidenceBundle metadata boundary without broad schema work, DB migration, or
Memory Core mutation.

## Task

Use `pattern:ts-boundary-brain-knowledge-parser-exemplar` in one real source
repair.

Chosen boundary:

```txt
packages/core/src/evidenceBundle.ts
```

Reason:

`assessEvidenceBundleCompleteness` read `diffSummary` and `sourceRefs` directly
from `EvidenceBundle.metadata`, leaving an ad hoc metadata read at an evidence
review boundary.

## KRN Plan

Persisted run:

```txt
executionRun: ca2d5c1c-dadd-40be-a09f-354189d1214d
taskContract: 24ab81f7-a29d-419e-a3c2-51cde11ab958
harnessPlan: 229fc9d3-621a-4653-9363-bf89b35f3e58
contextAssembly: 52ae0eeb-8bcb-4cf7-a107-4e8a41d96033
```

Activation usefulness:

```txt
retained pattern selection: missed
owner-file recall: missed evidence metadata owner
manual brain knowledge query: helped
source inspection: helped
```

The long plan task did not select the parser exemplar. Shorter readback queries
did:

```txt
parser exemplar -> pattern:ts-boundary-brain-knowledge-parser-exemplar
unknown first -> parser exemplar + ts-boundary-unknown-first-result-state
```

## Source To Decision

```txt
source:
  pattern:ts-boundary-brain-knowledge-parser-exemplar

mechanism:
  parse external/catalog-like records from unknown, narrow finite fields near
  the boundary, reject malformed evidence fields with tests

KRN implication:
  EvidenceBundle metadata readback should have a named parser before evidence
  completeness decisions depend on metadata fields

decision:
  add parseEvidenceBundleMetadataReadback(input: unknown)

consumer:
  assessEvidenceBundleCompleteness

falsifier:
  completeness logic again reads bundle.metadata.diffSummary/sourceRefs directly
  or accepts malformed sourceRefs as sufficient evidence
```

## Changed

```txt
packages/core/src/evidenceBundle.ts
packages/core/src/evidenceBundle.test.ts
```

Added:

```txt
EvidenceBundleMetadataReadback
parseEvidenceBundleMetadataReadback(input: unknown)
```

`assessEvidenceBundleCompleteness` now uses the parser instead of ad hoc
metadata reads.

## Tests

Passed:

```txt
pnpm --filter @krn/core test -- evidenceBundle
pnpm typecheck
pnpm test
pnpm quality:fallow:ci
git diff --check
pnpm db:ready
```

Fallow result:

```txt
No issues in changed files
```

## Persisted Evidence

```txt
evidenceBundle: de92b214-3e48-4094-bb42-3a90d4b0601d
reviewAssessment: def3c49d-c1d9-40f3-ab38-a68a625d0909
feedbackDelta: 8af381c8-3d69-4bed-b778-bc5796600832
observationGroup: 9dcef03a-9394-428f-b7c8-0775611a402c
reflectionRecord: 96901681-3fe2-40f2-9d6b-599d4a0db528
```

Readback:

```txt
changed files: intended only
unrelated: none
unknown: none
commands: 7 operator_reported/passed
pattern usefulness: 2 helped
observations selected: 5
candidate rows written: no
MemoryRecord created: no
```

## Review Burden Delta

Before:

```txt
Reviewer had to inspect ad hoc metadata reads inside completeness logic.
```

After:

```txt
Reviewer can inspect one named readback parser and focused tests for trimming,
dropping malformed values, and preserving missing-field findings.
```

## Brain ROI

```txt
workflow: positive
pattern readback: positive when queried by mechanism terms
persisted plan activation: weak for this task
owner-file recall: weak for this task
```

The retained pattern helped only after a manual shorter query. This is a useful
signal for future pattern query shaping.

## What This Does Not Prove

- No DB schema validation was added.
- No broad Zod/io-ts platform was added.
- No EvidenceBundle storage contract changed.
- No Memory Core mutation occurred.
- No product readiness claim.
- No proof that retained-pattern plan selection is good for long task prompts.

## Candidate Follow-Up

```txt
EvalCandidate:
  retained pattern plan selection should find parser exemplars for metadata
  boundary tasks when short mechanism queries already do.
```
