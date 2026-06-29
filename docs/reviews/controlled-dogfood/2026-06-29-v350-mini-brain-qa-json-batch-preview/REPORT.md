# V350 Mini Brain-QA JSON Batch Preview

Status: complete.

## Executive Verdict

`krn source search --json` is usable across a small Brain-QA/readback batch
without parsing human text output. A local consumer parsed five DB-backed answer
packages with `JSON.parse` and extracted answer coverage, supporting evidence
counts, missing-evidence diagnostics, proof/non-proof boundaries, raw candidate
inspectability, and review parsing burden.

The batch lowered report parsing burden for all five cases. It also exposed the
next useful repair: `missingEvidence` is too coarse for broad/combined queries.
Some cases had supporting `SearchDocument` evidence while still reporting a
generic matching-document gap, and the graph-relations case had SourceClaims but
no SearchDocument support.

This proves the JSON readback shape can support a tiny Brain-QA batch. It does
not prove answer correctness, ranking quality, broad benchmark quality, or
product readiness.

## Scope

No package source was changed.

Local artifacts:

```txt
.local-lab/v350/plan.txt
.local-lab/v350/source-to-decision.json
.local-lab/v350/evidence-proof.json
.local-lab/v350/ingest-loop.json
.local-lab/v350/graph-relations.json
.local-lab/v350/heartbeat-consensus.json
.local-lab/v350/batch-summary.json
```

Committed artifact:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v350-mini-brain-qa-json-batch-preview/REPORT.md
```

## Pattern Gate

Selected patterns:

| Pattern | Outcome | Evidence | Does not prove |
|---|---|---|---|
| `evidence-proof-non-proof-boundary` | helped | The batch summary preserved `proof.doesNotProve`, command-free proof boundaries, and `runtime.memoryMutation: none`. | Does not prove answer correctness, source truth, or ranking quality. |
| `brain-knowledge-read-only-ui-boundary` | helped | V350 used read-only CLI JSON and local lab artifacts only. No UI/API/MCP, crawler, schema, worker, graph runtime, or Memory Core mutation was added. | Does not prove future product-surface readiness. |

## DB And Run Evidence

Preflight:

```txt
git status: clean before work
DB: ready
Postgres: reachable
Migrations applied: 14/14
pgvector: available
```

Persisted plan:

```txt
operatorIntent: 43de97c0-4c09-4b41-9a3b-7220e0087438
taskContract: a24d25b5-d895-46b4-af70-0620c131258f
harnessPlan: 765084b3-af02-4a03-805e-0352dfe81303
contextAssembly: b648fb07-cfa8-4aa9-9868-78db1061757e
executionRun: 4127e542-3989-43fc-9d56-3b89688645b3
evidenceBundle: d406613b-1092-425d-bc37-99b32f5758e8
reviewAssessment: 5b8597a8-2b83-49ce-84a8-c794f595c2d5
feedbackDelta: 56800462-04f0-412c-bfbb-c7e36ded57fb
observationGroup: c5f663c3-c476-457b-a4f8-76005d971e5d
reflectionRecord: 537f675f-82e6-4472-a0ed-07c244bd01d8
MemoryRecord created: no
```

Activation usefulness:

```txt
helped:
  - broad guardrails around source/search/activation ownership
  - heartbeat and graph source-claim context stayed visible

neutral:
  - selected owner files were not edited in this docs-only batch

missing:
  - no direct V349 consumer report was selected

verdict:
  mixed positive for guardrails, weak for direct report recall
```

## Batch Method

The consumer used:

```txt
JSON.parse over krn source search --json output
```

It did not parse human text output.

Queries:

```txt
source-to-decision retention gate consumer falsifier
evidence proof boundary command provenance does not prove
local ingest source artifact searchdocument sourceclaim activation
graph sourceclaimedge relation grounded qa temporal source relations
heartbeat dreaming memory staleness consensus eval candidate preserved dissent
```

## Batch Results

| Case | Coverage | Supporting claims | Supporting documents | Included | Excluded | Missing evidence | Parsing burden |
|---|---|---:|---:|---:|---:|---|---|
| source-to-decision | claim_and_document | 5 | 1 | 6 | 6 | none | lower |
| evidence-proof | claim_and_document | 5 | 1 | 6 | 6 | generic matching-document gap despite document support | lower |
| ingest-loop | claim_and_document | 5 | 1 | 6 | 7 | none | lower |
| graph-relations | claim_only | 6 | 0 | 6 | 5 | no SearchDocument support for combined graph query | lower |
| heartbeat-consensus | claim_and_document | 4 | 2 | 6 | 7 | generic matching-document gap despite document support | lower |

Aggregate:

```txt
cases: 5
coverage:
  claim_and_document: 4
  claim_only: 1
  document_only: 0
  none: 0
allHaveAnswer: true
allHaveProofBoundaries: true
allRawCandidatesInspectable: true
loweredParsingBurden: 5
missingEvidenceCases:
  - evidence-proof
  - graph-relations
  - heartbeat-consensus
memoryMutation: none
```

## Review Burden Delta

Before V348-V350:

```txt
Operators had to inspect text output and reports manually to compare answer
coverage, candidate counts, missing evidence, and proof boundaries.
```

After V350:

```txt
A small consumer can classify those fields across five questions from JSON:
answerPackage.answer
answerPackage.supportingClaims
answerPackage.supportingDocuments
answerPackage.missingEvidence
answerPackage.doesNotProve
includedCandidates
excludedCandidates
proof.doesNotProve
runtime.memoryMutation
```

Delta:

```txt
reduced for tiny Brain-QA/readback batches
```

## What This Proves

- JSON answer packages can be consumed across five Brain-QA/readback questions
  without parsing text output.
- Each package exposed answer, proof boundaries, raw included/excluded
  candidates, and non-mutation runtime fields.
- Review parsing burden was lower for all five cases.
- Current source-search coverage is enough for a tiny batch, but not clean
  enough to treat missing-evidence diagnostics as product-quality.

## What This Does Not Prove

- answer correctness;
- source truth;
- ranking quality;
- semantic retrieval quality;
- broad benchmark quality;
- UI/API/MCP readiness;
- product readiness;
- Memory Core mutation safety beyond this read-only run.

## Next Recommended Task

```txt
V351 Source Search Missing-Evidence Specificity Repair
```

Use the V350 batch as evidence to inspect and repair the smallest owning
surface for answer-package `missingEvidence` diagnostics. The goal is to avoid
generic or misleading document-gap language when supporting documents exist,
while preserving the real graph-relations SearchDocument coverage gap.

Non-goals:

```txt
no UI/API/MCP
no crawler
no schema
no ranking rewrite
no embeddings
no graph runtime
no broad benchmark
no Memory Core mutation
```
