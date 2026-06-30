# V361 Graph Brain V0 Entity/Relation Answer Delta

Status: complete.

## Executive Verdict

V361 proves the smallest useful graph-brain answer-package delta: `krn source
search --json` now exposes read-only `relationSupport` for included
SourceClaims with persisted `SourceClaimEdge` rows.

The slice rejected a new extraction layer because deterministic local
entity/claim/relation extraction already exists in source artifact preview. The
product gap was answer-package consumption of existing relation support, not
another extractor, schema, ranking, UI/API/MCP, crawler, embedding, or worker
runtime.

## Scope

Task:

```txt
V361-00 Graph Brain V0 Entity/Relation Extraction And Answer Delta
```

Persisted KRN plan:

```txt
executionRun: 18145922-1603-4644-b715-9efd1c4ea1b1
taskContract: 17900c84-0e06-4128-95f7-b1ba898cc4e1
contextAssembly: d5e63e3b-4510-47a7-b06e-822b96661a2b
.local-lab/v361/plan.txt
```

Changed source:

```txt
packages/cli/src/runSourceSearchCommand.ts
packages/cli/src/runSourceSearchCommand.test.ts
```

Live readback:

```txt
.local-lab/v361/temporal-claim-graph-relation-support.json
```

Persisted evidence:

```txt
evidenceBundle: d977e1d5-df92-47a0-b676-36b5a16fa850
reviewAssessment: 1049f2d8-3956-4d7c-9588-2c049cffb479
feedbackDelta: fcfe220f-5039-4110-a27c-90889af9a0b6
observationGroup: db675443-83f6-420f-b414-ee3bae42c9cd
observationItems: 5
reflectionRecord: 24b7ec1c-b610-4c04-b1f8-45103790ba11
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

Non-goals:

- no new extraction layer;
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

## What Changed

`SourceSearchAnswerPackage` now includes:

```txt
relationSupport: SourceSearchRelationSupport[]
```

Each relation support item contains:

```txt
sourceClaimId
edgeId
direction
relatedSourceClaimId
kind
consumer?
doesNotProve?
evidenceRef?
sourceDecisionRef?
sourceRanges?
```

The relation support is built by read-only calls to
`listSourceClaimEdgesForClaim` for included SourceClaim candidates after
candidate selection. It does not alter candidate ranking, retrieval semantics,
or DB state.

## Live Readback

Command:

```txt
krn source search --query "temporal claim graph" --limit 16 --max-inclusions 6 --json
```

Result:

```txt
answerUsefulness: useful
supportingClaims: 3
supportingDocuments: 3
relationSupport: 2
```

The answer-usefulness reasons now include:

```txt
Answer package includes SourceClaimEdge relation support.
```

Live relation support included:

```txt
sourceClaimId: 931e7faa-a982-498f-a265-6a938800f707
edgeId: ddbcef43-a680-407d-bf8b-2b95c07e40d4
kind: narrows
relatedSourceClaimId: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27

sourceClaimId: 578d247c-caa7-4cf2-8b27-0a211a00c778
edgeId: 415321b3-4a26-4634-bfbe-38b756777d6a
kind: narrows
relatedSourceClaimId: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
```

Both edges preserve `consumer`, `doesNotProve`, `evidenceRef`, and
`sourceRanges`.

## Source-To-Decision

Source: V358 graph mini Brain-QA diagnostic closure, existing
`sourceArtifactPreviewExtraction` path, relation-grounded QA helper, and
SourceClaimEdge readback surface.

Mechanism: KRN already has deterministic local entity/claim/relation extraction
and persisted SourceClaimEdge rows. The missing product value was that source
search answer packages did not expose relation support alongside supporting
claims and documents.

KRN implication: before adding graph runtime, schema, ranking, crawler,
embeddings, UI/API/MCP, or worker execution, source-search answer packages
should consume existing reviewed relation support.

Decision: adopt a read-only answer-package `relationSupport` field and reject a
new extraction layer for this slice.

Consumer: graph mini Brain-QA loop and technical operators consuming
`krn source search --json`.

Falsifier: `relationSupport` fails to appear for included SourceClaims with
persisted SourceClaimEdge rows, changes ranking/retrieval behavior, mutates DB
state, or pressures schema/runtime expansion.

Does not prove: source truth, edge correctness, answer correctness, ranking
quality, graph retrieval quality, extraction quality, broad benchmark quality,
product readiness, UI/API/MCP readiness, embeddings, crawler readiness, worker
runtime, or Memory Core mutation.

## TypeScript Boundary

Boundary: CLI readback over internal source-search answer package.

Pattern: explicit internal types, no `any`, no JSON trust shortcut, no DB schema
change, no optional-property weakening. `exactOptionalPropertyTypes` caught an
intermediate optional metadata bug and the final implementation only assigns
optional fields when metadata values are present.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm --filter @krn/cli test -- runSourceSearchCommand` | passed | focused source-search tests cover relationSupport JSON output | product readiness |
| `pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript compiles with strict optional boundaries | runtime quality |
| `pnpm typecheck` | passed | workspace TypeScript compile passes | product quality |
| `pnpm quality:fallow:ci` | passed | changed files have no Fallow findings | whole-repo perfection |
| `pnpm test` | passed | workspace tests pass | source truth or graph quality |
| `git diff --check` | passed | patch has no whitespace errors | semantic correctness |
| live relationSupport readback | passed | current Postgres readback exposes persisted SourceClaimEdge support in source-search JSON | answer correctness, ranking quality, or graph retrieval quality |
| `krn evidence capture --persist` | passed | evidence/review/feedback rows persisted for V361 | memory quality or product readiness |
| `krn observe --persist` | passed | observations were staged before reflection | reflection quality |
| `krn reflect --persist` | passed | reflection selected observations without Memory Core mutation | candidate usefulness |

## Review Burden Delta

Before V361, an operator had to leave `krn source search --json` and inspect
SourceClaimEdge readback separately to know whether answer-package claims had
relation support.

After V361, the answer package itself exposes relation support and proof
boundaries. Delta: lower for graph mini Brain-QA and relation-aware source
search consumers.

## Next Recommended Action

Open a bounded ingest v0 expansion:

```txt
V362-00 Ingest V0 Expansion With Bounded Evidence
```

Goal: prove a second local artifact can flow through existing source artifact,
SearchDocument, SourceClaim, SourceClaimEdge, and source-search answer package
readback without new crawler, embeddings, schema, ranking, UI/API/MCP, worker
runtime, broad benchmark, or Memory Core mutation.
