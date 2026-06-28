# V318 Ingest v0 SearchDocument Persistence Readback

Status: complete source/DB slice.

Date: 2026-06-28.
DB used: yes.
Memory mutation: none.
Schema/migration changes: none.
Crawler/API/MCP/worker changes: none.
Embeddings/graph runtime: none.

## Executive Verdict

V318 proved the first bounded local artifact preview -> DB source/search
readback path. `krn source artifact preview --persist` now writes a
`SourceArtifact`, `SourceChunk`, and `SearchDocument` through existing
repository paths and immediately verifies lexical readback of the created
`SearchDocument`.

This is still Ingest v0. It proves one explicit local artifact can enter the
existing source/search substrate. It does not prove source truth, crawler
readiness, embeddings, graph retrieval, or product readiness.

## Owner Files Inspected

| File | Why |
|---|---|
| `packages/cli/src/runSourceArtifactPreviewCommand.ts` | Existing local artifact preview owner and smallest persist/readback surface. |
| `packages/cli/src/parseSourceArgs.ts` | CLI boundary for explicit `--persist`. |
| `packages/cli/src/databaseRuntime.ts` | DB runtime adapter boundary for existing repository access. |
| `packages/harness/src/repositories/sourceRepository.ts` | SourceArtifact/SourceChunk repository contract. |
| `packages/harness/src/repositories/retrievalRepository.ts` | SearchDocument repository/readback contract. |
| `packages/db/src/repositories/DrizzleSourceRepository.ts` | Existing Drizzle source persistence implementation. |
| `packages/db/src/repositories/DrizzleRetrievalRepository.ts` | Existing Drizzle SearchDocument persistence and lexical readback implementation. |

## Pattern Gate

| Pattern | Use | Outcome |
|---|---|---|
| `pattern:evidence-proof-non-proof-boundary` | Persistence output states what DB readback proves and does not prove. | helped |
| `pattern:source-to-decision-retention-gate` | V318 keeps source truth separate from source/search persistence and routes next work to SourceClaim review. | helped |
| `pattern:ts-boundary-unknown-first-result-state` | CLI/file inputs and candidate/search document input are parsed and narrowed before repository writes. | helped |

Initial broad pattern query for `source-to-decision persistence readback`
returned no results, so the gate used narrower `unknown-first` and
`proof non proof` readbacks.

## Source-To-Decision

- Source: V317 report, existing source/search DB repository contracts,
  `SourceArtifactInputSchema`, `SearchDocumentInputSchema`, and local DB
  readiness/smoke evidence.
- Mechanism: one explicit local file can become a persisted source artifact,
  persisted source chunk, and lexical search document without crawler,
  embeddings, graph runtime, or schema expansion.
- KRN implication: Ingest v0 can now move from preview/candidate output to
  governed source-claim review on top of a proven local artifact/search
  substrate.
- Decision: adopt explicit `--persist` for `krn source artifact preview`.
- Rejection: do not infer SourceClaim truth from file content and do not build
  crawler, embeddings, graph runtime, API/MCP, dashboard, or worker daemon in
  this slice.
- Consumer: V319 Ingest v0 SourceClaim Review Path.
- Falsifier: `--persist` cannot write and read back SourceArtifact,
  SourceChunk, and SearchDocument rows in the current shell.

## Implemented Behavior

`krn source artifact preview --persist` now:

```txt
1. reads one local file;
2. computes artifact and chunk hashes;
3. persists a SourceArtifact row;
4. persists SourceChunk rows for rendered chunks;
5. persists one SearchDocument row linked to the SourceArtifact and first chunk;
6. runs lexical readback using a deterministic hash-based query marker;
7. reports proof and non-proof boundaries.
```

The command still renders candidate bridge output. In persist mode the
SearchDocument candidate line points to the persistence readback instead of
claiming no row was created.

## DB Readback Evidence

Command:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn source artifact preview \
  --file docs/KRN_KERNEL.md \
  --chunk-lines 8 \
  --limit-chunks 1 \
  --persist
```

Result:

```txt
project: 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b
sourceArtifact: a9014986-63ec-443b-9c8e-36335ab7aad2
sourceChunks: 0cc5ecfb-e552-4834-9c56-45add6ed60cd
searchDocument: 8cd64cd5-870c-44ab-8d34-590906983606
lexicalReadbackQuery: krn-source-artifact-preview 55568e9ec7a48a12
lexicalReadback: hit
lexicalScore: 100
```

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- parseSourceArgs runSourceArtifactPreviewCommand` | passed | Parser and focused preview/persist behavior tests pass. | Does not prove full workspace behavior or live DB. |
| `rtk pnpm run typecheck` | passed | TypeScript strict boundaries compile across workspace. | Does not prove runtime product value. |
| `rtk pnpm --filter @krn/harness test -- activePlanInvariants contextHygieneInvariants` | passed | Compact root state remains internally consistent after activating V319. | Does not prove V319 implementation. |
| `rtk docker compose up -d krn-postgres && rtk docker compose ps krn-postgres` | passed | Local Postgres container was started for this shell. | Does not prove migrations or persistence until readiness/smoke pass. |
| `rtk pnpm db:ready` | passed after starting Postgres | Local DB reachable, 14/14 migrations applied, pgvector available. | Does not prove source/search behavior. |
| `rtk env KRN_DATABASE_URL=... pnpm --filter @krn/cli krn source artifact preview --file docs/KRN_KERNEL.md --chunk-lines 8 --limit-chunks 1 --persist` | passed | One local artifact persisted and SearchDocument lexical readback hit in this shell. | Does not prove source truth, embeddings, graph retrieval, crawler readiness, or product readiness. |
| `rtk pnpm db:smoke` | passed | DB runtime persistence smoke still passes after this slice. | Does not prove this specific source artifact is semantically useful. |
| `rtk env TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | Full workspace test suite passes. | Does not prove product readiness or broad corpus ingest. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior beyond formatting. |

## Proof Boundaries

What this proves:

- explicit local artifact preview can write existing DB SourceArtifact rows;
- rendered chunks can write existing DB SourceChunk rows;
- a SearchDocument can be created from that artifact/chunk evidence;
- lexical readback can find the created SearchDocument in the current shell;
- no DB schema migration, crawler, embeddings, graph runtime, API/MCP, worker,
  or Memory Core mutation was required.

What this does not prove:

- source truth;
- claim correctness;
- SourceClaim review quality;
- embeddings or vector retrieval;
- graph extraction or multi-hop retrieval;
- crawler readiness;
- mass corpus ingest;
- product readiness.

## Next Action

Move to:

```txt
V319 Ingest v0 SourceClaim Review Path
```

Goal: persist/read back one explicit SourceClaim linked to a local
SourceArtifact/SourceChunk using existing repository paths and review/proof
boundaries, without schema migration, crawler, embeddings, graph runtime,
dashboard, API/MCP, worker daemon, or Memory Core mutation.
