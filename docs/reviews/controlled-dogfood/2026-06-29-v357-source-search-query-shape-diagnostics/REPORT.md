# V357 Source Search Query-Shape Diagnostics

Status: complete.

## Executive Verdict

`krn source search` now exposes query-shape diagnostics in the answer package.
When SourceClaims are included, SearchDocuments are absent, and lexical
SearchDocument retrieval returned zero results, the output says this is likely
an over-constrained query shape and recommends a narrower topic-specific query
before changing ranking or coverage.

This closes the V356 operator burden: the graph-relations gap is visible in
JSON/text output without manual DB inspection.

## Scope

Task:

```txt
V357-00 Source Search Query-Shape Diagnostics
```

Changed source:

```txt
packages/cli/src/runSourceSearchCommand.ts
packages/cli/src/runSourceSearchCommand.test.ts
```

Non-goals:

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

## KRN Plan

Persisted plan artifact:

```txt
executionRun: b8857df7-6c79-4f19-930c-87f1fc2df197
.local-lab/v357/plan.txt
```

Persisted evidence:

```txt
evidenceBundle: 09cc8c6b-a184-4af6-9720-cee255d5f8eb
reviewAssessment: 60a5749e-a28b-4770-8993-eb15a3cc6ccf
feedbackDelta: 98194840-dc01-4dda-846c-e23ba3cd2560
observationGroup: f1b4e59d-a236-47fb-9359-0ddf87a323d8
observationItems: 5
reflectionRecord: 3ad5b3ed-18a3-4f7f-9d6e-24bb56af346f
reflectionObservationsSelected: 5
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

## Behavior

New answer package field:

```txt
queryShapeDiagnostics: string[]
```

Diagnostic condition:

```txt
supportingClaims > 0
supportingDocuments == 0
searchResults == 0
```

Diagnostic text:

```txt
likely over-constrained query shape: SourceClaims matched, but lexical
SearchDocument retrieval returned zero results; try a narrower topic-specific
query before changing ranking or coverage.
```

The field is empty for normal claim+document answer packages.

## DB Readback

Broad V356 query:

```txt
graph sourceclaimedge relation grounded qa temporal source relations
```

Result:

```txt
answerUsefulness: partly_useful_missing_document
SourceClaims: 6
SearchDocuments: 0
searchResults: 0
queryShapeDiagnostics: present
```

Narrow control query:

```txt
temporal claim graph
```

Result:

```txt
answerUsefulness: useful
SourceClaims: 3
SearchDocuments: 3
searchResults: 3
queryShapeDiagnostics: []
```

Artifacts:

```txt
.local-lab/v357/broad-graph-relations.json
.local-lab/v357/narrow-temporal-claim-graph.json
```

## Source-To-Decision

Source: V356 graph relation SearchDocument support report.

Mechanism: source-search can retrieve graph relation SearchDocuments for
narrow queries, but broad `websearch_to_tsquery` shapes can require too many
terms and return zero document matches while SourceClaims still match.

KRN implication: source-search answer packages should expose query-shape
ambiguity so operators do not confuse it with missing coverage or a ranking
bug.

Decision: add bounded query-shape diagnostics to source-search answer packages
without changing retrieval semantics.

Consumer: graph mini Brain-QA loop and technical operators using
`krn source search --json`.

Falsifier: diagnostic fires for normal claim+document packages, hides actual
missing coverage, or requires ranking/schema/runtime changes.

Does not prove: answer correctness, source truth, ranking quality, graph
retrieval quality, product readiness, UI/API/MCP readiness, or Memory Core
mutation.

## TypeScript Boundary

Boundary: CLI JSON/text readback over internal source-search answer package.

Pattern: strict internal type extension. No `any`, no external input trust, no
new parser boundary, no `ts-reset`, no DB schema change.

Typecheck passed.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | focused source-search output tests cover query-shape diagnostics | product readiness or ranking quality |
| `pnpm db:ready` | passed | local DB is reachable with migrations and pgvector | CI DB state or product readiness |
| broad DB-backed source-search readback | passed | graph broad query now exposes `queryShapeDiagnostics` | answer correctness |
| narrow DB-backed source-search readback | passed | normal graph relation query remains useful without diagnostic noise | ranking quality |
| `pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript strict compile still passes | runtime/product quality |
| `pnpm test` | passed | workspace tests pass | full product readiness |
| `git diff --check` | passed | patch has no whitespace errors | semantic correctness |
| `krn evidence capture --persist` | passed | evidence/review/feedback and source usefulness were persisted | memory quality or product readiness |
| `krn observe --persist` | passed | observations were created before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected persisted observations without Memory Core mutation | candidate usefulness |

## Review Burden Delta

Before V357: graph broad queries required manual DB/source-search inspection to
decide whether missing documents meant missing coverage or query shape.

After V357: JSON/text readback explicitly labels the likely query-shape case.

Delta: lower operator diagnostic burden for graph mini Brain-QA and future
source-search readbacks.

## Next Recommended Action

Open V358:

```txt
V358-00 Graph Mini Brain-QA Query-Shape Diagnostics Closure
```

Goal: rerun the graph-relations mini Brain-QA case using the new
`queryShapeDiagnostics` field and decide whether to proceed to graph brain v0
entity/relation extraction or another bounded source-search repair.
