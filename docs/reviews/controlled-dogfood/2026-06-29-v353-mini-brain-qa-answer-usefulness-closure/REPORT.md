# V353 Mini Brain-QA Answer Usefulness Closure

Status: complete.

## Executive Verdict

The five-case source-search JSON batch was useful for bounded operator
decisions, not only parseable. Four answer packages had supporting claims and
documents. One graph-relations package had claims but no supporting
SearchDocument, making it cautiously useful with a document-gap caveat. The
highest-ROI next step is to move this deterministic usefulness classification
into `krn source search --json`.

## Scope

This was a read-only usefulness closure over existing source-search JSON answer
packages.

Non-goals:

- no source change;
- no ranking change;
- no retrieval semantics change;
- no DB schema change;
- no UI/API/MCP;
- no crawler;
- no embeddings;
- no graph runtime;
- no worker runtime;
- no broad benchmark;
- no Memory Core mutation.

## KRN Plan

Persisted run:

```txt
executionRun: 64a00778-f3cd-4c71-9edd-7957210acf0e
taskContract: ae004664-1f27-4342-a3a6-a0898be83ad2
contextAssembly: 190f4ed2-0acf-4c09-8b8d-eeaf5bd8be81
```

Activation selected useful guardrails and owner-file candidates for activation
diagnostics, but the batch itself was driven by source-search JSON output.

## Batch Method

The local consumer parsed five `krn source search --json` outputs from
`.local-lab/v353/` and classified bounded answer usefulness without parsing
human-readable CLI text.

Queries:

```txt
source-to-decision retention gate consumer falsifier
evidence proof boundary command provenance does not prove
local ingest source artifact searchdocument sourceclaim activation
graph sourceclaimedge relation grounded qa temporal source relations
heartbeat dreaming memory staleness consensus eval candidate preserved dissent
```

Summary artifact:

```txt
.local-lab/v353/answer-usefulness-summary.json
```

## Results

| Case | Claims | Docs | Usefulness | Decision use |
| --- | ---: | ---: | --- | --- |
| source-to-decision | 5 | 1 | useful | can guide a bounded operator decision with claims and documents |
| evidence-proof | 5 | 1 | useful | can guide a bounded operator decision with claims and documents |
| ingest-loop | 5 | 1 | useful | can guide a bounded operator decision with claims and documents |
| graph-relations | 6 | 0 | partly_useful_missing_document | can guide cautiously through claims, but needs narrower document readback |
| heartbeat-consensus | 4 | 2 | useful | can guide a bounded operator decision with claims and documents |

Aggregate:

```txt
cases: 5
useful: 4
partly_useful_missing_document: 1
partly_useful_missing_claim: 0
not_useful: 0
allRawCandidatesInspectable: true
memoryMutation: none
```

## Source-To-Decision

Source: V353 JSON batch summary and V352 diagnostics usefulness closure.

Mechanism: existing answer-package fields expose supporting claim count,
supporting document count, missing evidence, raw candidate inspectability, and
proof boundaries.

KRN implication: consumers can classify bounded answer usefulness without text
parsing, but this should be part of operator-facing JSON output.

Decision: open V354 to add deterministic answer-usefulness classification to
`krn source search --json`.

Consumer: technical operators and the next mini Brain-QA loop.

Falsifier: usefulness classification cannot be derived from existing answer
package fields without making answer-correctness or ranking-quality claims.

Does not prove: answer correctness, source truth, ranking quality, broad
benchmark quality, product readiness, UI/API/MCP readiness, or Memory Core
mutation.

## Review Burden Delta

Before: a consumer had to inspect answer text, support counts, and
`missingEvidence` to infer whether an answer package could guide a decision.

After: the local JSON consumer showed a deterministic classification can be
derived from existing fields.

Delta: reduced for bounded source-search JSON consumers, but not yet reduced in
the CLI itself until V354 implements the field.

## Evidence / Observation / Reflection

Persistence status:

```txt
plan: persisted
evidence: persisted
observe: persisted
reflect: persisted
MemoryRecord mutation: none
```

Persisted IDs:

```txt
executionRun: 64a00778-f3cd-4c71-9edd-7957210acf0e
evidenceBundle: a4831964-29b8-4311-a699-ca8f25a0c462
reviewAssessment: 762eb533-d68d-4535-98ed-d0b0d89ac550
feedbackDelta: 38d8699d-9eb7-45a6-86eb-b4b41093c131
observationGroup: 96febb36-9404-4fbf-ac3d-4f7282b54951
observationItems: 5
reflectionRecord: 24825cb5-2bf3-463b-8a87-6e4b44315b62
reflectionObservationsSelected: 5
reflectionFindings: 0
reflectionGaps: 0
candidateRowsWritten: no
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | local Postgres was reachable for this slice | CI DB state, product readiness |
| V353 source-search JSON batch | passed | five answer packages were consumed and classified without text parsing | answer correctness, source truth, ranking quality |
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | root state stayed aligned and compact after V353 closeout | product readiness or source-search answer correctness |
| `git diff --check` | passed | current diff had no whitespace errors | behavior correctness |
| `krn evidence capture --persist` | passed | evidence, review, feedback, source usefulness, and changed-file classification were persisted | memory quality or product readiness |
| `krn observe --persist` | passed | observations were created for this run before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected persisted observations without Memory Core mutation | candidate usefulness or answer correctness |

## Candidate Outputs

EvalCandidate:

```txt
candidate: source-search JSON should expose answer usefulness classification.
evidence: .local-lab/v353/answer-usefulness-summary.json
reviewability: ready
doesNotProve: answer correctness, source truth, ranking quality, product readiness
decision: review
```

MemoryCandidate:

```txt
candidate: Answer usefulness must stay separate from answer correctness.
evidence: this report and V353 batch summary
reviewability: ready
doesNotProve: product readiness or ranking quality
decision: review
```

## Next Recommended Action

Open V354:

```txt
V354-00 Source Search Answer Usefulness Classification
```

Implement deterministic answer-usefulness classification in source-search JSON
using current answer-package fields. Do not change ranking, retrieval semantics,
schema, UI/API/MCP, crawler, embeddings, graph runtime, worker runtime, broad
benchmark, or Memory Core state.
