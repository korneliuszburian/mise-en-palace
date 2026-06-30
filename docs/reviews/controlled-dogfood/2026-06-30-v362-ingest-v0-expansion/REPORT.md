# V362 Ingest V0 Expansion With Bounded Evidence

Status: complete.

## Executive Verdict

V362 proved a second bounded local artifact flow through the existing ingest v0
path and source-search answer package, without adding crawler, embeddings,
schema, ranking, UI/API/MCP, worker runtime, broad benchmark, or Memory Core
mutation.

The run also found and fixed a real live-DB gap: `source artifact preview
--persist` extracted `createSourceChunk` from the repository object and lost the
class receiver. Unit fakes did not catch it because fake methods did not depend
on `this`. The fix binds the repository method before invoking it and adds a
regression test that would have failed before the fix.

## Source-To-Decision

- Source: V316-V323 ingest v0 reports, V356-V361 source-search/graph readbacks,
  and the live V362 failure.
- Mechanism: the artifact preview path already owns local file -> SourceArtifact
  -> SourceChunk -> SearchDocument -> reviewed SourceClaim -> SourceClaimEdge;
  the missing evidence was a second artifact live replay, not a new ingest
  subsystem.
- KRN implication: expand product usefulness by proving the existing vertical
  under live DB conditions before adding any broader product surface.
- Decision: fix the repository receiver bug and prove the second artifact flow
  through existing CLI/DB/readback paths.
- Consumer: Ingest v0, source-search answer packages, future graph-brain
  readbacks.
- Falsifier: a second local artifact cannot produce SourceArtifact,
  SourceChunk, SearchDocument, SourceClaim, SourceClaimEdge, and source-search
  `relationSupport` readback in the current shell.
- Does not prove: source truth, extraction quality, ranking quality, graph
  retrieval quality, crawler readiness, product readiness, UI/API/MCP readiness,
  worker runtime, broad benchmark quality, or Memory Core mutation.

## Changed

- `packages/cli/src/runSourceArtifactPreviewCommand.ts`
  - binds `createSourceChunk` to `databaseRuntime.sourceRepository` before
    invoking it.
- `packages/cli/src/runSourceArtifactPreviewCommand.test.ts`
  - adds a receiver-sensitive regression test for source chunk persistence.
- `docs/reviews/controlled-dogfood/2026-06-30-v362-ingest-v0-expansion/SOURCE.md`
  - second bounded local artifact used for live DB replay.

## Live DB Readback

Persisted local artifact command:

```txt
sourceArtifact: 561ceab9-f67b-493b-8017-8156d1650bc0
sourceChunks: 6ed506f4-e84f-455e-b2d1-d4a00143a05a
searchDocument: 60c400a7-eabc-4179-a571-6d77660f4b3d
lexicalReadback: hit
sourceClaim: e4bfcdea-d201-4e0f-9d73-94e200b9fe4f
sourceClaimReadback: hit
sourceClaimEdge: 0549c002-d52f-4cf0-a6ba-e5e9a36e2ead
sourceClaimEdgeKind: narrows
sourceClaimEdgeReadback: hit
Memory mutation: none
Embeddings: none
Graph runtime: none
Crawler: none
```

Source-search answer-package readback:

```txt
query: V362 second bounded local artifact
answerUsefulness: useful
supportingClaims: 5
supportingDocuments: 1
queryShapeDiagnostics: []
new relationSupport edge: 0549c002-d52f-4cf0-a6ba-e5e9a36e2ead
new relationSupport consumer: V362 ingest v0 expansion
```

Persisted evidence / observation / reflection:

```txt
executionRun: f86ff91d-6579-4d10-9b34-679356c2dfb6
evidenceBundle: c9db92e3-1089-4b6c-92bd-9e01273a5b8b
reviewAssessment: 5c57729c-291f-4ce5-b853-2b42f9e8430f
feedbackDelta: 620bcf7c-37dc-4bc3-87d1-5797582520b1
observationGroup: 1821bbc2-76b7-48b2-99ff-4a32547c55fd
observationItems: 9
reflectionRecord: c6f7b9ab-2ad7-42ea-aa62-1942d4cf6584
reflectionFindings: 4
reflectionGaps: 4
MemoryRecord created: no
Candidate rows written: no
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm db:ready` | passed | Current shell can reach Postgres, 14/14 migrations, pgvector available | Product readiness |
| `krn plan --persist` | passed | DB-backed KRN plan created run `f86ff91d-6579-4d10-9b34-679356c2dfb6` and selected ingest/source graph claims | Selected context sufficiency or ranking quality |
| `krn source artifact preview --extract-candidates` | passed | The second artifact has ready deterministic local extraction candidates | Extraction quality or source truth |
| first `krn source artifact preview --persist` | failed | Exposed a live receiver-binding bug before SourceChunk persistence | That DB adapter or graph edge persistence were globally broken |
| `pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand` | passed | Focused CLI behavior and receiver-binding regression pass | Full product quality |
| `pnpm --filter @krn/cli run typecheck` | passed | CLI TypeScript boundaries compile | Runtime correctness |
| second `krn source artifact preview --persist` | passed | Second artifact persisted and read back artifact/chunk/search/claim/edge rows | Ranking, crawler, embeddings, product readiness |
| `krn source search --json` | passed | Source-search answer package includes the new relation support | Answer correctness or broad query quality |
| `pnpm typecheck` | passed | Workspace TypeScript compiles | Product readiness |
| `pnpm quality:fallow:ci` | passed | Changed JS/TS files pass Fallow changed-file quality gate | Whole-repo quality beyond configured gates |
| `pnpm db:smoke:source-graph` | passed | Source graph live smoke still creates/reads claim edges | V362 answer quality |
| `pnpm db:smoke:retrieval-substrate` | passed | Retrieval substrate live smoke still creates/searches documents | V362 source truth |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace tests pass | CI or production readiness |
| `krn evidence capture --persist` | passed | Final bundle preserved intended file classification with unrelated/unknown = none and 11 operator-reported command rows | That the commands were executed by evidence capture |
| `krn observe --persist` | passed | Same-run observation persisted 9 items before reflection | Reflection quality or Memory mutation |
| `krn reflect --persist` | passed | Same-run reflection selected 9 observations and produced 4 gap findings without Memory mutation | Candidate quality at scale or autonomous dreaming |

## Brain Usefulness

KRN helped positively as a governed workflow:

- DB-backed planning selected relevant ingest/source graph claims.
- The bounded product task caught a real live persistence bug instead of
  producing a docs-only pass.
- Existing source-search answer-package output made the second artifact
  relation support directly reviewable.

Weakness:

- Owner-file recall still surfaced general plan/run files, not
  `runSourceArtifactPreviewCommand.ts`; `rg` and source inspection found the
  true owner.

## Next Recommended Action

Proceed to:

```txt
V363 Heartbeat/Dreaming Candidate Generator V0
```

Boundary: candidate-only generator over existing source/memory/review state.
No autonomous Memory Core mutation, no worker daemon, no scheduler, no crawler,
no embeddings, no UI/API/MCP.
