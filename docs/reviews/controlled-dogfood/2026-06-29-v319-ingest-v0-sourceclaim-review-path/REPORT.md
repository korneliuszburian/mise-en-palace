# V319 Ingest v0 SourceClaim Review Path

Status: complete source/DB slice.

Date: 2026-06-29.
DB used: yes.
Memory mutation: none.
Schema/migration changes: none.
Crawler/API/MCP/worker changes: none.
Embeddings/graph runtime: none.

## Executive Verdict

V319 proved the next bounded Ingest v0 path: `krn source artifact preview
--persist` can now write and read back a governed `SourceClaim` linked to the
persisted local `SourceArtifact` and first `SourceChunk` when the operator
supplies explicit claim, mechanism, KRN implication, consumer, falsifier, and
does-not-prove fields.

This keeps source truth review-gated. The command still does not infer claims
from file content, does not promote truth, and does not mutate Memory Core.

## Owner Files Inspected

| File | Why |
|---|---|
| `packages/cli/src/runSourceArtifactPreviewCommand.ts` | Existing local artifact preview, candidate bridge, and persistence owner. |
| `packages/cli/src/runSourceArtifactPreviewCommand.test.ts` | Focused behavior coverage for preview/persist/readback output. |
| `packages/schema/src/sourceClaim.ts` | SourceClaim input validation contract. |
| `packages/harness/src/repositories/sourceRepository.ts` | SourceClaim repository contract. |
| `packages/db/src/repositories/DrizzleSourceRepository.ts` | Existing SourceClaim persistence/readback implementation. |
| `packages/cli/src/databaseRuntime.ts` | DB runtime repository boundary. |

## Pattern Gate

| Pattern | Use | Outcome |
|---|---|---|
| `pattern:evidence-proof-non-proof-boundary` | Output states exactly what DB readback proves and does not prove. | helped |
| `pattern:source-to-decision-retention-gate` | SourceClaim persistence requires explicit mechanism, implication, consumer, falsifier, and does-not-prove. | helped |
| `pattern:ts-boundary-unknown-first-result-state` | CLI inputs are parsed through schema boundary before repository writes. | helped |

## Source-To-Decision

- Source: V318 report, existing SourceArtifact/SourceChunk/SearchDocument DB
  readback, `SourceClaimInputSchema`, and `SourceRepository.createSourceClaim`.
- Mechanism: a local persisted artifact/chunk can carry an explicit governed
  SourceClaim through existing DB repository paths and immediate readback.
- KRN implication: Ingest v0 can now move from local source/search persistence
  to source decision linkage without crawler, schema, embeddings, graph runtime,
  dashboard, API/MCP, worker daemon, or Memory Core mutation.
- Decision: persist SourceClaim from `krn source artifact preview --persist`
  only when complete explicit source-claim fields are supplied.
- Rejection: do not infer claim truth from file content; do not create
  SourceClaim rows for absent or incomplete claim fields.
- Consumer: V320 Ingest v0 SourceDecision Linkage Readback.
- Falsifier: complete explicit SourceClaim fields cannot be linked to persisted
  SourceArtifact/SourceChunk rows and read back in the current shell.

## Implemented Behavior

`krn source artifact preview --persist` now:

```txt
1. persists SourceArtifact;
2. persists SourceChunk rows;
3. persists SearchDocument and verifies lexical readback;
4. if explicit SourceClaim fields are complete, persists SourceClaim;
5. reads back the SourceClaim by id;
6. renders candidate bridge row-created status;
7. preserves proof/non-proof and Memory mutation boundaries.
```

Absent SourceClaim fields still render `not generated`. Partial fields still
render `needs_more_evidence` and do not write a SourceClaim.

## DB Readback Evidence

Command:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn source artifact preview \
  --file docs/KRN_KERNEL.md \
  --chunk-lines 8 \
  --limit-chunks 1 \
  --persist \
  --claim "Local artifact preview can carry governed source claims." \
  --mechanism "The command persists SourceArtifact and SourceChunk rows before creating SourceClaim with explicit mechanism, consumer, falsifier, and doesNotProve." \
  --krn-implication "Use explicit local artifact evidence as the first Ingest v0 source-claim review path before crawler or graph work." \
  --does-not-prove "This does not prove source truth, automatic claim extraction, crawler readiness, embeddings, graph retrieval, or product readiness." \
  --support-type implementation-boundary \
  --trust-tier source-code \
  --consumer "V319 Ingest v0 SourceClaim Review Path" \
  --falsifier "The persisted SourceClaim is not linked to the persisted SourceArtifact or SourceChunk."
```

Result:

```txt
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
sourceArtifact: ba851bb3-df32-4152-b5e9-5f20a3bb1260
sourceChunks: d8164bbf-083d-4ca2-b56a-5a5a82aa2a39
searchDocument: 2a1c2538-5634-4299-8522-f16a54274c76
lexicalReadbackQuery: krn-source-artifact-preview 55568e9ec7a48a12
lexicalReadback: hit
lexicalScore: 100
sourceClaim: 3afb4c95-eaad-4df1-aa72-e8c739f385dd
sourceClaimReadback: hit
```

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runSourceArtifactPreviewCommand parseSourceArgs` | passed | Focused CLI preview/persist/source-claim behavior tests pass. | Does not prove live DB. |
| `rtk pnpm run typecheck` | passed | Strict TypeScript boundaries compile across workspace. | Does not prove runtime product value. |
| `rtk pnpm db:ready` | passed | Local Postgres is reachable, 14/14 migrations are applied, pgvector is available. | Does not prove source-claim behavior. |
| `rtk env KRN_DATABASE_URL=... pnpm --filter @krn/cli krn source artifact preview ... --persist ...` | passed | One local artifact/chunk/search document/source claim path persisted and read back in this shell. | Does not prove source truth, automatic extraction, embeddings, graph retrieval, crawler readiness, or product readiness. |

## Proof Boundaries

What this proves:

- existing DB paths can persist a governed SourceClaim linked to local artifact
  and chunk evidence;
- SourceClaim readback works in the current shell;
- absent/incomplete claim fields do not create SourceClaim rows;
- no schema migration, crawler, embeddings, graph runtime, API/MCP, worker, or
  Memory Core mutation was required.

What this does not prove:

- source truth;
- claim correctness;
- SourceDecision adoption/rejection quality;
- automatic claim extraction;
- graph extraction or multi-hop retrieval;
- crawler or mass-corpus ingest readiness;
- product readiness.

## Next Action

Move to:

```txt
V320 Ingest v0 SourceDecision Linkage Readback
```

Goal: link one persisted/proposed SourceClaim to a bounded SourceDecision or
SourceDecisionEdge through existing repository paths and read it back, without
schema migration, crawler, embeddings, graph runtime, dashboard, API/MCP,
worker daemon, or Memory Core mutation.
