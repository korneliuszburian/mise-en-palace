# V356 Graph Relation SearchDocument Support Vertical

Status: complete.

## Executive Verdict

The graph-relations gap from V355 is not a missing SearchDocument coverage bug.
Graph relation SearchDocuments exist and source search can include them for a
narrow relation query. The failing V355-style query was too broad for the
current `websearch_to_tsquery` lexical path: PostgreSQL required all broad terms
to match, so no SearchDocuments were retrieved.

Next work should improve operator-facing query-shape diagnostics, not ranking,
schema, crawler, embeddings, graph runtime, or UI/API/MCP.

## Scope

Task:

```txt
V356-00 Graph Relation SearchDocument Support Vertical
```

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
executionRun: ae002e98-b4b8-4dda-b9e9-250ec82cca6f
.local-lab/v356/plan.txt
```

The plan selected relevant guardrail/source context but this report relies on
live DB readback and source-search behavior, not plan output alone.

Persisted evidence:

```txt
evidenceBundle: 38258b2e-fb19-4874-b4ea-d8fa7ac374da
reviewAssessment: 78183e1b-35c3-494b-adfd-9b201df484af
feedbackDelta: 7fb83e13-06e8-4c4f-a8a3-88b504163f50
observationGroup: 82c04676-92a6-4e53-b7b2-95cd13183759
observationItems: 5
reflectionRecord: 1d276ead-e516-4dcd-8249-fdf878f2bc0b
reflectionObservationsSelected: 5
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

## Readback Results

V355 baseline query:

```txt
graph sourceclaimedge relation grounded qa temporal source relations
```

Result:

```txt
answerUsefulness: partly_useful_missing_document
SourceClaims: 6
SearchDocuments: 0
searchResults: 0
excluded SearchDocuments: 0
```

Additional broad relation queries produced the same shape:

| Query | Claims | Docs | Search results | Usefulness |
| --- | ---: | ---: | ---: | --- |
| graph sourceclaimedge relation grounded qa temporal source relations | 6 | 0 | 0 | partly_useful_missing_document |
| SourceClaimEdge relation | 6 | 0 | 0 | partly_useful_missing_document |
| temporal source relations | 6 | 0 | 0 | partly_useful_missing_document |
| relation grounded QA readback | 6 | 0 | 0 | partly_useful_missing_document |
| graph brain source relation readback | 6 | 0 | 0 | partly_useful_missing_document |

DB inspection found graph relation SearchDocuments:

```txt
search_documents: 13
source_claims: 11
matching graph/relation SearchDocuments: 3
matching graph/relation SourceClaims: 3
```

Narrow query:

```txt
temporal claim graph
```

Result:

```txt
answerUsefulness: useful
SourceClaims: 3
SearchDocuments: 3
missingEvidence: none
supporting SearchDocuments:
- search_document:a0c89f16-670f-4de6-b0c5-f7a95212e07e
- search_document:9845a4dc-9853-40b2-84ae-6976db1174cc
- search_document:835d3652-783f-4608-9fab-43fdbc434b4e
```

Narrow ADR query:

```txt
ADR-0021 temporal claim graph
```

Result:

```txt
answerUsefulness: useful
SourceClaims: 3
SearchDocuments: 3
missingEvidence: none
```

## Mechanism

The retrieval repository uses:

```txt
websearch_to_tsquery('english', input.query)
```

For the broad V355 query PostgreSQL produced:

```txt
'graph' & 'sourceclaimedg' & 'relat' & 'ground' & 'qa' & 'tempor' & 'sourc' & 'relat'
```

For the narrower query PostgreSQL produced:

```txt
'tempor' & 'claim' & 'graph'
```

The broad query is over-constrained for existing graph relation SearchDocuments.
The narrow query retrieves the ADR-backed relation documents correctly.

## Source-To-Decision

Source: V355 built-in usefulness loop and V356 DB-backed source-search readback.

Mechanism: `answerUsefulness` exposed that graph-relations had governed claims
but no SearchDocument support; V356 showed existing SearchDocuments are
retrievable with a narrower query, while broad `websearch_to_tsquery` requires
too many terms to match.

KRN implication: graph relation answer support is available, but source-search
needs explicit query-shape diagnostics so operators can distinguish missing
coverage from an over-constrained broad query.

Decision: close V356 without source changes and open V357 to add bounded
operator-facing query-shape diagnostics.

Consumer: next source-search product readback loop and graph mini Brain-QA.

Falsifier: V357 cannot derive a safe diagnostic from existing answer-package
fields without changing ranking/retrieval semantics, or a future graph relation
query still hides whether the gap is coverage or query shape.

Does not prove: answer correctness, source truth, ranking quality, graph
retrieval quality, product readiness, UI/API/MCP readiness, or Memory Core
mutation.

## Review Burden Delta

Before V356: the V355 graph-relations gap only said SearchDocument evidence was
missing.

After V356: the gap is classified as query-shape/readback ambiguity. Operators
can avoid a false coverage repair by narrowing the graph relation query.

Delta: lower diagnostic ambiguity, but future runs still need the CLI to expose
this without manual DB/psql inspection.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | local Postgres, migrations, and pgvector are ready in this shell | CI DB state or product readiness |
| DB `search_documents` / `source_claims` counts | passed | current store has 13 SearchDocuments and 11 SourceClaims | source truth or retrieval quality |
| DB graph/relation document inspection | passed | graph relation SearchDocuments exist for ADR-0021 | broad query quality |
| broad DB-backed source-search readbacks | passed | broad graph relation queries return claims but no documents | answer correctness |
| narrow DB-backed source-search readbacks | passed | narrower graph relation queries return claims and SearchDocuments | ranking quality or product readiness |
| `krn evidence capture --persist` | passed | evidence/review/feedback and source usefulness were persisted | memory quality or product readiness |
| `krn observe --persist` | passed | observations were created before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected persisted observations without Memory Core mutation | candidate usefulness |

## Next Recommended Action

Open V357:

```txt
V357-00 Source Search Query-Shape Diagnostics
```

Goal: add bounded source-search readback diagnostics that identify likely
over-constrained broad queries when claims exist but SearchDocuments do not,
without changing ranking, retrieval semantics, schema, crawler, embeddings,
graph runtime, UI/API/MCP, or Memory Core state.
