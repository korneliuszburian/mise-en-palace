# V355 Mini Brain-QA Built-In Usefulness Loop

Status: complete.

## Executive Verdict

The mini Brain-QA batch now consumes built-in `answerUsefulness` labels and
reasons from `krn source search --json`. No local usefulness classifier was
needed. Four cases are directly useful; the graph-relations case remains partly
useful because it has SourceClaims but no included SearchDocument evidence.

The next product-facing task should target graph relation answer support, not a
new guard or UI/API surface.

## Scope

This was a DB-backed readback/usefulness loop over the five V353/V354 source
search questions.

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

Persisted plan artifact:

```txt
executionRun: f514e534-1c53-421f-8a24-3a8779439033
.local-lab/v355/plan.txt
```

Persisted IDs:

```txt
evidenceBundle: cd5c649c-85c2-450c-9056-e0971360c699
reviewAssessment: e7c97f30-ad5b-4870-a198-6e0f78f2bb82
feedbackDelta: 95be7213-99d0-4f73-aa5d-f1c3a8ebf75c
observationGroup: 5e8317b3-c4a6-4a00-9a8a-6216d1296901
observationItems: 5
reflectionRecord: 4f4174a0-c2f5-43f7-a0af-8f3ddb18fbf0
reflectionObservationsSelected: 5
reflectionFindings: 0
reflectionGaps: 0
candidateRowsWritten: no
MemoryRecord created: no
```

## Batch Results

| Case | Usefulness | Claims | Docs | Missing evidence |
| --- | --- | ---: | ---: | --- |
| source-to-decision | useful | 5 | 1 | none |
| evidence-proof | useful | 5 | 1 | none |
| ingest-loop | useful | 5 | 1 | none |
| graph-relations | partly_useful_missing_document | 6 | 0 | SearchDocument evidence for combined query |
| heartbeat-consensus | useful | 4 | 2 | none |

Aggregate:

```txt
cases: 5
useful: 4
partlyUsefulMissingDocument: 1
partlyUsefulMissingClaim: 0
notUseful: 0
allRawCandidatesInspectable: true
memoryMutation: none
```

## Source-To-Decision

Source: V354 source-search answer usefulness classification report and V355
built-in readback batch.

Mechanism: built-in answer usefulness labels remove the local consumer
classification layer while preserving proof/non-proof boundaries.

KRN implication: mini Brain-QA can now consume source-search answer packages
directly; remaining weakness is graph relation document support, not JSON
parseability or usefulness labeling.

Decision: open V356 as a bounded graph relation answer-support vertical.

Consumer: V356 graph relation SearchDocument support work.

Falsifier: graph relation queries still remain claim-only after bounded source
support work, or usefulness labels start hiding missing evidence.

Does not prove: answer correctness, source truth, ranking quality, broad
benchmark quality, product readiness, UI/API/MCP readiness, or Memory Core
mutation.

## Review Burden Delta

Before V354: consumer code had to derive usefulness from support counts and
missing evidence.

After V354/V355: the batch directly reads `answerUsefulness` and reasons.

Delta: lower consumer logic and lower review burden for mini Brain-QA answer
packages. The graph-relations case still requires narrower source/document
support before stronger graph QA claims.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| five DB-backed `krn source search --json` commands | passed | built-in `answerUsefulness` exists across the batch | answer correctness, ranking quality |
| structural JSON readback with Node | passed | labels/reasons/support counts can be consumed without text parsing | product readiness or source truth |
| `krn evidence capture --persist` | passed | evidence/review/feedback and source usefulness were persisted | memory quality or product readiness |
| `krn observe --persist` | passed | observations were created before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected persisted observations without Memory Core mutation | candidate usefulness |

## Next Recommended Action

Open V356:

```txt
V356-00 Graph Relation SearchDocument Support Vertical
```

Goal: turn the graph-relations mini Brain-QA gap into a bounded product repair
or proof. The target is to make graph relation answers include reviewable
SearchDocument evidence where appropriate, without changing ranking, schema,
UI/API/MCP, crawler, embeddings, graph runtime, worker runtime, broad benchmark,
or Memory Core state.
