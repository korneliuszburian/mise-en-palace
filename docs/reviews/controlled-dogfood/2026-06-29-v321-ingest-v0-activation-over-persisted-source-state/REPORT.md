# V321 Ingest v0 Activation Over Persisted Source State

Status: bounded DB-backed source/readback proof.

Date: 2026-06-29

## Executive Verdict

V321 proves that existing KRN surfaces can persist a local source artifact,
read it back as SourceArtifact/SourceChunk/SearchDocument/SourceClaim, link the
SourceClaim to a SourceDecisionEdge, and activate persisted SourceClaims in
`krn plan --persist`.

The slice also fixed a product-facing readback gap: `krn run show` now exposes
exact context inclusion/exclusion details instead of only counts.

The important remaining gap is narrower: activation did not retrieve the
persisted local artifact SearchDocument through plan lexical search in this run
(`search=0`), even though direct source-artifact lexical readback hit the
SearchDocument. That should become the next bounded repair.

## Scope

Active task:

```txt
V321-00 Ingest v0 Activation Over Persisted Source State
```

Non-goals preserved:

```txt
no source crawler
no DB schema migration
no embeddings
no graph runtime
no dashboard
no API/MCP
no worker daemon
no Memory Core mutation
no activation scoring rewrite
```

## Source/Pattern Gate

```txt
source:
  GOAL.md / PLAN.md / PLANS.md / docs/KRN_KERNEL.md / KRN local skills

mechanism:
  existing activation reads project SourceClaims and lexical SearchDocuments,
  then context assembly persists inclusions/exclusions.

KRN implication:
  before graph/crawler work, local source state must be visible through
  persisted activation/readback surfaces.

decision:
  adopt a readback repair for `krn run show` context details; defer lexical
  SearchDocument activation repair to the next bounded slice.

consumer:
  V321 run readback, future ingest v0 activation repair, graph brain v0.

falsifier:
  if `krn run show` cannot expose selected SourceClaims/SearchDocuments from a
  persisted run, the readback is insufficient for operator proof.
```

## Live DB Proof

DB readiness:

```txt
pnpm db:ready
Postgres: reachable
Migrations: 14/14 applied
pgvector: available
Brain store readiness: ready
```

Persisted local source artifact:

```txt
file: docs/KRN_KERNEL.md
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
sourceArtifact: 3b57102c-a18f-4613-b766-1c63fc4fc6b0
sourceChunks:
  - 4c316ff5-d3cc-40df-a72c-2f600f12309a
  - 2d4a9295-bf6d-40d5-9554-1ae2f5c15b01
searchDocument: ccc44d6d-18ae-4b15-81cb-d948ea09b721
lexicalReadbackQuery: krn-source-artifact-preview 55568e9ec7a48a12
lexicalReadback: hit
sourceClaim: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
sourceClaimReadback: hit
```

Persisted source decision edge:

```txt
sourceDecisionEdge: 94c896cf-8464-4a38-8fa8-dd5718a4e155
sourceDecisionEdgeReadback: hit
sourceClaimId: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
target: architecture_decision/V321-ingest-v0-activation-over-persisted-source-state
```

Persisted plan activation:

```txt
executionRun: 1e2dbec7-56ac-4daf-b246-f8cb22bfd468
contextStatus: assembled
included: 6
excluded: 9
activationDiagnostics:
  sourceClaims=3
  search=0
  ownerFile=12
  merged=15
```

Selected source context included:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
source_claim:3afb4c95-eaad-4df1-aa72-e8c739f385dd
source_claim:b055fffe-de70-49e4-86b0-a806a2f12e86
```

`krn run show` readback after this slice now exposes exact inclusion/exclusion
details, including:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
search_document:d67827a8-74af-4159-82e7-1b0ab11e94bb
search_document:9f45c159-3d7d-4b0a-8bb4-b4bb79ec2e6c
search_document:e1c5f544-7ffd-4ef5-8e34-e8a6bc6c6257
```

## What Changed

Source files:

```txt
packages/cli/src/runRunShowCommand.ts
packages/cli/src/runRunShowCommand.test.ts
```

Behavior:

```txt
krn run show text output now renders:
  Context inclusion details
  Context exclusion details

krn run show --json now includes:
  context.inclusionDetails
  context.exclusionDetails
```

No DB schema, activation scoring, reflection, memory, crawler, graph, API, MCP,
or worker behavior changed.

## Proof / Non-Proof

Proves:

```txt
1. Local source artifact persistence/readback works for one current repo file.
2. SearchDocument direct lexical readback works for the artifact hash marker.
3. SourceClaim persistence/readback works.
4. SourceDecisionEdge persistence/readback works.
5. krn plan --persist can activate persisted SourceClaims.
6. krn run show can now replay exact context inclusions/exclusions from the
   persisted ContextAssembly.
```

Does not prove:

```txt
1. Source truth or claim correctness.
2. Product readiness.
3. Graph retrieval.
4. Embedding retrieval.
5. Source crawler readiness.
6. Memory Core mutation.
7. General activation ranking quality.
8. Plan lexical search can retrieve the persisted local artifact SearchDocument.
```

## Gap Found

Direct source artifact preview lexical readback hit:

```txt
searchDocument: ccc44d6d-18ae-4b15-81cb-d948ea09b721
lexicalReadback: hit
```

But `krn plan --persist` activation diagnostics showed:

```txt
search=0
```

This remained true even for a marker-only task:

```txt
krn-source-artifact-preview 55568e9ec7a48a12
```

Likely implication:

```txt
The persisted SearchDocument substrate exists, but plan activation search query
construction or search fallback is too strict/noisy for local artifact marker
retrieval.
```

This should be repaired as a bounded activation lexical-search/read-model task,
not by adding crawler, graph runtime, embeddings, or scoring rewrite.

## Dogfood Usefulness

Selected patterns:

```txt
source-to-decision: helped
activation-engine owner-file/readback gate: helped
brain-store-schema: helped
typescript-type-safety: helped
```

Brain ROI:

```txt
positive
```

Reason:

```txt
The run proved a real source-state path and exposed a precise missing substrate
for the next repair. The run also converted a count-only persisted readback into
reviewable context detail.
```

## Commands

```txt
rtk git fetch --prune
rtk git status --short --branch
rtk git log --oneline -n 8
rtk pnpm db:ready
rtk pnpm --filter @krn/cli krn source artifact preview ... --persist
rtk pnpm --filter @krn/cli krn source decision link ... --persist
rtk pnpm --filter @krn/cli krn plan --task ... --persist
rtk pnpm --filter @krn/cli krn run show --run-id ...
rtk pnpm --filter @krn/cli test -- runRunShowCommand
```

Full final verification is recorded in the commit/final response for this
slice.

## Next Recommended Task

```txt
V322 Activation Lexical Search Over Persisted Local Source Documents
```

Objective:

```txt
Make `krn plan --persist` retrieve persisted local artifact SearchDocuments when
the task query contains their explicit marker/hash terms, without broad ranking,
embeddings, crawler, graph runtime, or schema changes.
```

Success:

```txt
activationDiagnostics.searchResultCount > 0
and run show exposes the selected local artifact SearchDocument in
context.inclusionDetails or context.exclusionDetails.
```

