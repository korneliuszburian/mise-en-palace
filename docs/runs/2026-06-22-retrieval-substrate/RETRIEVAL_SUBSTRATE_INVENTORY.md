# Retrieval Substrate Inventory

## Scope

Slice 00 inspected the current retrieval/search schema, migration surface,
repository port/adapters, CLI smoke/doctor routing, pgvector readiness, and
TypeScript boundary types.

Files inspected:

- `docs/KRN_KERNEL.md`
- `packages/db/src/schema/retrieval.ts`
- `packages/db/src/migrations/0002_shocking_post.sql`
- `packages/db/src/repositories/DrizzleRetrievalRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/harness/src/repositories/retrievalRepository.ts`
- `packages/harness/src/repositories/types.ts`
- `packages/db/src/migrationReadiness.ts`
- `packages/db/src/sql/fullTextSearch.ts`
- `packages/db/src/sql/pgvector.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/runDbSmokeCommand.ts`
- `packages/cli/src/runDoctorCommand.ts`
- `package.json`

## Existing Persisted Retrieval Surface

| M24 concept | Current surface | Status | Notes |
| --- | --- | --- | --- |
| `SearchDocument` | `search_documents` | exists, needs repository behavior | Has source/memory linkage, trust tier, validity window, metadata filters, title/body, nullable `search_vector`, and GIN index. No observed repository method inserts or lexical-searches it yet. |
| Lexical query | Postgres FTS via `tsvector` column | partial | Schema/index exist. No current helper or smoke proves `plainto_tsquery`/`websearch_to_tsquery` lookup or rank. |
| `EmbeddingModel` | `embedding_models` | exists, needs repository behavior | Provider/model/dimensions/status metadata are persisted. No repository method or smoke creates a placeholder model yet. |
| `Embedding` | `embeddings` | exists, needs repository behavior | Uses local pgvector `vector(1536)` with HNSW cosine index and source/memory linkage. No external embedding integration is present or needed for M24. |
| `RetrievalRun` | `retrieval_runs` | exists and repository-backed | `startRetrievalRun` and `completeRetrievalRun` exist in `RetrievalRepository` and Drizzle adapter. |
| `RetrievalCandidate` | `retrieval_candidates` | exists and repository-backed | `addCandidate` exists with lexical/vector/graph/temporal/context ROI score fields. |
| `ActivationDecision` | `activation_decisions` | exists and repository-backed | `recordActivationDecision` exists and supports included/excluded/abstained decisions. |
| `ContextItem` | `context_items` | exists and repository-backed | `storeContextSelection` writes inclusions from core `ContextInclusion`. |
| `ContextExclusion` | `context_exclusions` | exists and repository-backed | `storeContextSelection` writes exclusions and normalizes unknown reasons to `irrelevant`. |

## Current Repository Surface

Existing harness retrieval repository port:

- `startRetrievalRun(input)`
- `completeRetrievalRun(input)`
- `addCandidate(input)`
- `recordActivationDecision(input)`
- `storeContextSelection(input)`

Missing for M24:

- create/read `SearchDocument`;
- lexical search over `search_documents`;
- create/read `EmbeddingModel`;
- store placeholder/vector `Embedding`;
- cleanup helpers for self-cleaning retrieval smoke;
- typed read models for search documents and embeddings.

## Current CLI / Smoke / Doctor Surface

Existing root DB smoke scripts:

- `pnpm db:smoke`
- `pnpm db:smoke:harness-plan`
- `pnpm db:smoke:harness-evidence`
- `pnpm db:smoke:source-graph`
- `pnpm db:smoke:memory-governance`

Missing for M24:

- `pnpm db:smoke:retrieval-substrate`;
- `krn db smoke retrieval-substrate`;
- doctor retrieval/search substrate readiness section;
- durable runtime proof that search document, lexical query, embedding
  placeholder/vector row, retrieval run, candidates, activation decisions,
  context items, context exclusions, and cleanup all work in one chain.

## TypeScript Boundary Gaps

Current exported retrieval read models cover:

- `RetrievalRunRecord`;
- `RetrievalCandidateRecord`;
- `ActivationDecisionRecord`;
- `RetrievalSubjectType`;
- retrieval status/kind/decision unions.

Missing exported boundary types:

- `SearchDocumentRecord`;
- lexical search result/candidate input;
- `EmbeddingModelRecord`;
- `EmbeddingRecord`;
- input contracts for search document creation and embedding placeholder/vector
  storage.

## Slice 01/02/03/04 Implication

The DB substrate already exists. M24 should not add a new search engine,
separate vector DB, background embedding worker, external embedding service, or
dashboard. The next slices should tighten the typed repository/API surface and
prove the existing Postgres/Drizzle substrate with a self-cleaning smoke.
