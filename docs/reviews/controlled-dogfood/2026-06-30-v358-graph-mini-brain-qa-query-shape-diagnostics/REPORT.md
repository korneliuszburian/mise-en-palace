# V358 Graph Mini Brain-QA Query-Shape Diagnostics Closure

Status: complete.

## Executive Verdict

The graph-relations mini Brain-QA closure passes. The broad graph-relations query
now explains its own failure shape through `queryShapeDiagnostics`, while the
narrow graph query still returns both governed SourceClaims and SearchDocuments
without diagnostic noise.

This means the V356/V357 fix reduced manual DB/source inspection burden for this
case. The next graph-brain step should be a bounded graph brain v0
entity/relation extraction and answer-delta vertical, not another source-search
diagnostic repair.

## Scope

Task:

```txt
V358-00 Graph Mini Brain-QA Query-Shape Diagnostics Closure
```

Persisted KRN plan:

```txt
executionRun: 964b10ca-42e8-48b4-8daf-734ab435a3b6
taskContract: 4a18e517-66dd-4497-b970-54745499f8c8
contextAssembly: 949327e4-49ee-43af-a1e9-c45dfa66656a
.local-lab/v358/plan.txt
```

Persisted evidence:

```txt
evidenceBundle: dbe829e3-02c1-4e6f-a0ac-6b76df981aa5
reviewAssessment: 64090251-705a-4d80-8160-57484e2de95d
feedbackDelta: a1c19ed2-7d91-4c3b-87c4-66f1c2b3de2f
observationGroup: e011a547-434e-4b01-81ff-3bba1cdec63c
observationItems: 5
reflectionRecord: f32b0c01-b70e-4c4b-814b-771ad19ae791
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

Readback artifacts:

```txt
.local-lab/v358/broad-graph-relations.json
.local-lab/v358/narrow-temporal-claim-graph.json
```

Non-goals:

- no source change;
- no DB schema;
- no ranking rewrite;
- no retrieval semantics change;
- no crawler;
- no embeddings;
- no graph runtime;
- no worker runtime;
- no UI/API/MCP;
- no broad benchmark;
- no Memory Core mutation.

## Query Readback Matrix

| Query | Usefulness | Claims | Documents | Search results | Query diagnostics | Recommended action |
| --- | --- | ---: | ---: | ---: | --- | --- |
| `graph sourceclaimedge relation grounded qa temporal source relations` | `partly_useful_missing_document` | 6 | 0 | 0 | `likely over-constrained query shape` | Split broad queries into narrower topic-specific source searches before changing retrieval. |
| `temporal claim graph` | `useful` | 3 | 3 | 3 | none | Use claims/documents as a Pattern Application Gate, then verify against the target slice. |

Broad missing evidence:

```txt
included SearchDocument evidence for this combined query; topic-specific
SearchDocuments may still exist
```

Broad diagnostic:

```txt
likely over-constrained query shape: SourceClaims matched, but lexical
SearchDocument retrieval returned zero results; try a narrower topic-specific
query before changing ranking or coverage.
```

Narrow supporting documents:

```txt
search_document:a0c89f16-670f-4de6-b0c5-f7a95212e07e
search_document:9845a4dc-9853-40b2-84ae-6976db1174cc
search_document:835d3652-783f-4608-9fab-43fdbc434b4e
```

## Source-To-Decision

Source: V356 DB-backed graph relation SearchDocument support report and V357
source-search query-shape diagnostics report.

Mechanism: broad `websearch_to_tsquery` shapes can over-constrain lexical
SearchDocument retrieval while SourceClaims still match. A narrower
topic-specific query retrieves the relation SearchDocuments.

KRN implication: graph-relations consumers need query-shape diagnostics in the
answer package before assuming missing coverage, ranking failure, graph runtime
failure, or schema gaps.

Decision: close V358 as successful. Proceed to a bounded graph brain v0
entity/relation extraction and answer-delta vertical.

Consumer: graph mini Brain-QA loop and technical operators consuming
`krn source search --json`.

Falsifier: a future graph-relations answer package still requires manual DB or
source inspection to distinguish query shape from missing coverage, or the
diagnostic fires on useful claim+document packages.

Does not prove: answer correctness, source truth, ranking quality, graph
retrieval quality, broad benchmark quality, product readiness, UI/API/MCP
readiness, embeddings, crawler readiness, worker runtime, or Memory Core
mutation.

## Proof Boundary

Both readbacks were `read_only_postgres` with `dbWrites: none` and
`mutation: none`.

Runtime:

```txt
memoryMutation: none
crawler: none
embeddings: not_run
graphRuntime: not_run
```

The answer packages prove:

```txt
current Postgres can read persisted source/search candidates for this query
readback shows inclusion/exclusion, scores, reviewability, and proof boundaries
```

They do not prove:

```txt
source truth
ranking quality
embeddings
graph retrieval
crawler readiness
product readiness
Memory Core mutation
```

Evidence capture classified `.beads/issues.jsonl` as unrelated dirty context
because the Beads issue export changed while the intended deliverable was the
V358 report. This increases review burden but does not affect source-search
readback behavior.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | local Postgres is reachable with 14/14 migrations and pgvector | CI DB state or product readiness |
| broad graph source-search JSON readback | passed | broad graph-relations readback exposes query-shape diagnostics | answer correctness or ranking quality |
| narrow graph source-search JSON readback | passed | narrow graph readback returns claims and SearchDocuments without diagnostics | graph retrieval quality at scale |
| `git diff --check` | passed | report patch has no whitespace errors | semantic correctness |
| `krn evidence capture --persist` | passed | evidence/review/feedback rows persisted for the V358 run | Memory Core quality or product readiness |
| `krn observe --persist` | passed | observations were staged before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected observations and avoided Memory Core mutation | candidate usefulness |

## Review Burden Delta

Before V357/V358, the graph-relations gap required manual DB/source inspection
to decide whether the missing document support was a coverage gap or query-shape
ambiguity.

After V358, the broad answer package gives the consumer the relevant next
action directly: narrow the query before changing ranking or coverage.

Delta: reduced for this graph-relations mini Brain-QA case.

## Next Recommended Action

Open the next product-facing vertical:

```txt
V361-00 Graph Brain V0 Entity/Relation Extraction And Answer Delta
```

Goal: prove a small entity/relation extraction path can improve answer-package
support or explicitly fail without schema/ranking/UI/API/MCP expansion.
