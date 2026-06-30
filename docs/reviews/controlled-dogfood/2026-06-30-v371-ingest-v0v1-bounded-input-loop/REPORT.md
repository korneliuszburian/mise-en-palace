# V371 Ingest V0/V1 Bounded Input Loop

Status: complete.
Date: 2026-06-30.

## Executive Verdict

V371 strengthened the existing bounded ingest path instead of adding a crawler
or platform. `krn source artifact preview --persist` now renders one compact
`Ingest loop readback` that connects artifact rows, chunk rows,
`SearchDocument`, `SourceClaim`, `SourceClaimEdge`, and the exact source/brain
search commands an operator should run before changing ranking, crawler, schema,
UI, API, or MCP.

## Source To Decision

Source: V340/V362 ingest reports, V370 graph readback, and current root V371
contract.

Mechanism: the existing source artifact preview command already owns the
bounded local file -> SourceArtifact -> SourceChunk -> SearchDocument ->
SourceClaim -> SourceClaimEdge path. The missing product value was one
operator-readable readback that made the whole loop and the next activation
query visible.

KRN implication: improve the existing ingest loop output before broadening into
crawler, schema, embeddings, UI/API/MCP, worker runtime, or ranking changes.

Decision: add an `Ingest loop readback` section to the existing persisted source
artifact preview output.

Consumer: technical operator running bounded ingest and later `krn source
search` / `krn brain search` readback.

Falsifier: a persisted local artifact cannot show artifact/chunk/search
document/source claim/source claim edge status plus exact activation/readback
commands in one output.

Does not prove: source truth, ranking quality, embeddings, graph retrieval
quality, crawler readiness, UI/API/MCP readiness, worker runtime readiness,
Memory Core mutation, or product readiness.

## Changed

- `packages/cli/src/runSourceArtifactPreviewCommand.ts`
  - added deterministic persisted ingest-loop readback lines.
- `packages/cli/src/runSourceArtifactPreviewCommand.test.ts`
  - covered ready and not-created readback states.
- `docs/reviews/controlled-dogfood/2026-06-30-v371-ingest-v0v1-bounded-input-loop/SOURCE.md`
  - bounded local artifact used for live DB proof.

No DB schema, crawler, embeddings, ranking rewrite, UI/API/MCP, worker runtime,
or Memory Core mutation was added.

## Pattern Gate

| Pattern | Verdict | Evidence |
| --- | --- | --- |
| `source-to-decision-retention-gate` | helped | kept mechanism, implication, consumer, falsifier, and does-not-prove explicit |
| `evidence-proof-non-proof-boundary` | helped | output and report separate proof from non-proof |
| `ts-boundary-unknown-first-result-state` | neutral | no new external parser boundary was added |

## Live DB Readback

Persisted artifact output:

```txt
sourceArtifact: 04dbe993-aea6-449c-b4b9-c07c10009b25
sourceChunks: 02b84720-d005-4845-aa17-2eceaf2333e0, 1982289b-21af-4644-9c83-358f388afdf2
searchDocument: 17dbf745-bb33-475e-b70d-b7c2d9e6563f
lexicalReadbackQuery: krn-source-artifact-preview 4df7a26572a05f1a
lexicalReadback: hit
sourceClaim: f654ae9a-f19d-4834-baac-89099d7d5d2e
sourceClaimReadback: hit
sourceClaimEdge: 60752e86-faf8-47ad-8825-dbbe877b357f
sourceClaimEdgeKind: narrows
sourceClaimEdgeReadback: hit
artifactToChunks: ready (2 chunk row(s))
chunkToSearchDocument: ready
searchDocumentToActivationReadback: ready
sourceClaimReadback: ready
sourceClaimEdgeReadback: ready
activationReadbackQuery: krn-source-artifact-preview 4df7a26572a05f1a
```

Source-search readback for the emitted query:

```txt
answerUsefulness: useful
supportingClaims: 4
supportingDocuments: 1
relationSupport: 3
missingEvidence: []
```

Brain-search readback for the emitted query:

```txt
kind: krn.brainSearch.preview.v1
sourceSearch.answerUsefulness: useful
sourceSearch.supportingClaims: 4
sourceSearch.supportingDocuments: 1
sourceSearch.relationSupport: 3
sourceSearch.graphReadback.graphAware: true
mutation: none
```

## Brain Usefulness

KRN helped positively as workflow and source context:

- DB-backed plan selected relevant ingest/source graph claims.
- Source-search readback exposed the exact prior ingest claims and relation
  support needed for this slice.
- The final output now reduces operator rereads by making the next readback
  command explicit.

Weakness:

- Knowledge-card query for combined `source-to-decision ingest v0 unknown-first`
  returned zero results; the narrower `source-to-decision` query was useful.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | current shell has reachable Postgres, 14/14 migrations, pgvector available | CI DB state or product readiness |
| `krn knowledge cards --text "source-to-decision"` | passed | retained pattern gate is readable | retained pattern completeness |
| `krn source search --query "ingest v0 source-to-decision"` | passed, partly useful | current store has ingest/source claims and relation support | SearchDocument coverage for broad query |
| `krn plan --persist` | passed | DB-backed V371 plan and context assembly were created | owner-file completeness or ranking quality |
| `pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand` | passed | focused CLI behavior is covered | full workspace correctness |
| `pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript compiles | runtime correctness |
| `pnpm quality:fallow:ci` | passed | changed JS/TS files pass Fallow | semantic product quality |
| `krn source artifact preview --persist` | passed | live artifact/chunk/search/claim/edge/readback loop works | source truth or ranking quality |
| `krn source search --query "krn-source-artifact-preview 4df7a26572a05f1a"` | passed | emitted source-search command can read back the persisted artifact | answer correctness |
| `krn brain search --query "krn-source-artifact-preview 4df7a26572a05f1a"` | passed | emitted brain-search command composes readbacks without mutation | knowledge-card completeness |
| `krn evidence capture --persist` | passed | changed-file classification and command provenance were persisted | that evidence capture ran the commands |
| `krn observe --persist` | passed | 5 observation items were staged without Memory Core mutation | reflection usefulness |
| `krn reflect --persist` | passed | reflection selected 5 observations without Memory Core mutation | candidate usefulness |

Persisted run IDs:

```txt
executionRun: fc083178-877c-4e68-a266-6bbe92c51fa7
evidenceBundle: 8d653491-feb3-4f75-999a-e8e1541f03ea
reviewAssessment: 1f6ba068-f61e-47b9-972c-1b5a55ad8852
feedbackDelta: 1d92832c-3b3e-4865-ad77-5300cfac5208
observationGroup: 36f338fc-346e-466c-ae82-6aeb8ab1229c
reflectionRecord: 0617c846-306a-4264-98ed-0739af2daa7e
```

## What This Proves

- The bounded local ingest command now renders one operator-readable loop
  status.
- The live persisted V371 artifact can be found by the emitted source-search
  and brain-search readback commands.
- The slice improved product-facing ingest readability without crawler,
  schema, UI/API/MCP, worker runtime, embeddings, ranking rewrite, or Memory
  Core mutation.

## What This Does Not Prove

- Source truth.
- Ranking quality.
- Embedding or semantic retrieval quality.
- Graph retrieval quality beyond existing SourceClaimEdge readback.
- Crawler readiness.
- UI/API/MCP readiness.
- Worker runtime readiness.
- Product readiness.
- Second-operator usability.

## Next Recommended Action

V372 Heartbeat/Dreaming Candidate Runtime Loop.

Boundary: turn the existing candidate-only heartbeat preview toward a bounded
runtime loop over current source/memory/review state, still without autonomous
Memory Core mutation, scheduler, daemon, crawler, UI/API/MCP, broad benchmark,
or product server.
