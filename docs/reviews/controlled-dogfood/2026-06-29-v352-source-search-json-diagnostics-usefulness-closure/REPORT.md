# V352 Source Search JSON Diagnostics Usefulness Closure

Status: complete.

## Executive Verdict

V352 confirmed that the V351 `missingEvidence` repair reduced operator
ambiguity for the focused source-search JSON cases. A small JSON consumer parsed
three live DB-backed answer packages with `JSON.parse` and classified supported
document cases versus real document gaps without parsing text output.

Result:

```txt
cases: 3
clear supported-document cases: 2
clear real document gaps: 1
ambiguous supported-document cases: 0
memory mutation: none
```

This closes the V350/V351 diagnostics loop. The next useful step should move up
one product level: use the JSON answer package to assess answer usefulness, not
continue refining diagnostics wording.

## Scope

No package source was changed.

Local artifacts:

```txt
.local-lab/v352/evidence-proof.json
.local-lab/v352/graph-relations.json
.local-lab/v352/heartbeat-consensus.json
.local-lab/v352/diagnostics-summary.json
```

Committed artifact:

```txt
docs/reviews/controlled-dogfood/2026-06-29-v352-source-search-json-diagnostics-usefulness-closure/REPORT.md
```

## Source-To-Decision

```txt
source: V351 source-search missing-evidence specificity repair
mechanism: answer-package missingEvidence is now derived from visible support
  counts, so a JSON consumer can distinguish supported cases from real gaps.
KRN implication: source-search JSON is ready for a small answer-usefulness
  closure before adding UI/API/MCP or broader benchmark surfaces.
decision: close diagnostics loop and advance to answer usefulness.
consumer: V353 mini Brain-QA answer usefulness closure.
falsifier: supported-document cases still require text inspection or look like
  real no-document gaps.
doesNotProve: answer correctness, source truth, ranking quality, broad
  benchmark quality, product readiness, or UI/API/MCP readiness.
```

## Pattern Gate

| Pattern | Outcome | Evidence | Does not prove |
|---|---|---|---|
| `evidence-proof-non-proof-boundary` | helped | The closure records what JSON diagnostics prove and do not prove. | Does not prove answer correctness or ranking quality. |
| read-only source-search boundary | helped | V352 used read-only DB-backed JSON readbacks and local artifacts only. | Does not prove future product-surface readiness. |

## DB Readback

Preflight:

```txt
DB: ready
Postgres: reachable
Migrations applied: 14/14
pgvector: available
executionRun: beb0d171-07fe-4573-a782-ad9bea385e63
evidenceBundle: 0f3b99ee-3eca-40d1-af4e-741dc4450364
reviewAssessment: 46a29470-e231-495f-810c-88d005de1704
feedbackDelta: ee449fb2-48d4-4b29-80c2-028aaae64fd5
observationGroup: 5e2cb2de-ea52-4d55-81e9-3f30271fb7b8
reflectionRecord: 79e2bfe6-1c9c-4dfe-b1b5-f4f017f9df0b
MemoryRecord created: no
```

## Closure Results

| Case | Claims | Documents | Missing evidence | Ambiguity |
|---|---:|---:|---|---|
| evidence-proof | 5 | 1 | none | clear_supported_case |
| graph-relations | 6 | 0 | included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist | clear_real_document_gap |
| heartbeat-consensus | 4 | 2 | none | clear_supported_case |

Aggregate:

```txt
cases: 3
clearSupportedCases: 2
clearRealDocumentGaps: 1
ambiguousSupportedDocumentCases: 0
allLowerParsingBurden: true
memoryMutation: none
```

## Review Burden Delta

Before V351:

```txt
The V350 batch had supported-document cases that still carried generic
document-gap diagnostics, so operators had to interpret whether the gap was
real.
```

After V351/V352:

```txt
The same focused cases classify cleanly from JSON:
  supported documents present -> missingEvidence: []
  no documents present -> specific included-SearchDocument gap
```

Delta:

```txt
reduced for source-search JSON diagnostics review
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | Current shell can reach Postgres, migrations, and pgvector. | Does not prove CI DB state or answer correctness. |
| V352 JSON readback batch | passed | Focused cases can be classified from JSON without text parsing. | Does not prove ranking quality or broad benchmark quality. |
| `git diff --check` | pending before final evidence capture | Whitespace only. | Does not prove behavior. |

## What This Proves

- V351 repaired the focused ambiguity found by V350.
- Supported-document cases no longer require manual interpretation of
  contradictory missing-evidence diagnostics.
- The graph-relations document gap remains visible.
- No source, retrieval, ranking, schema, UI/API/MCP, or Memory Core mutation was
  needed.

## What This Does Not Prove

- answer correctness;
- source truth;
- ranking quality;
- semantic retrieval quality;
- broad benchmark quality;
- product readiness;
- UI/API/MCP readiness.

## Next Recommended Task

```txt
V353 Mini Brain-QA Answer Usefulness Closure
```

Use a small JSON answer-package batch to classify whether answers are useful for
operator decisions, not only whether diagnostics are parseable. Keep it
read-only and bounded.
