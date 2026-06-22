# Progress

Goal: M24 - Retrieval/search substrate plus activation trace persistence.

Current slice: Slice 03 retrieval repository methods complete.

Completed:

- M23 memory governance is the baseline: MemoryCandidate review/promotion,
  MemoryRecord versions, MemoryApplication, AntiMemoryRecord, evidence proposal
  surface, doctor readiness, dogfood, anti-rot, and handoff are complete.
- M24 run ledger was created under
  `docs/runs/2026-06-22-retrieval-substrate/`.
- Slice 00 inventoried the current retrieval/search surface in
  `RETRIEVAL_SUBSTRATE_INVENTORY.md`.
- Slice 00 recorded M24 source-to-decision implications in `DECISIONS.md`.
- Slice 01 added/tightened the retrieval search substrate schema:
  `retrieval_run_mode`, M24 subject vocabulary, search document search text and
  evidence/review/decision/run event linkage, embedding-to-search-document
  linkage, retrieval run execution/mode/budget/created timestamps,
  candidate-to-search-document linkage and score, and activation
  candidate/budget/impact fields.
- Slice 01 added schema regression coverage in
  `packages/db/src/schema/retrieval.test.ts`.
- Slice 01 generated migration
  `packages/db/src/migrations/0005_young_outlaw_kid.sql`.
- Slice 01 expanded harness retrieval/activation union types to match the
  widened durable vocabulary.
- Slice 02 added retrieval IO schemas and parse functions for SearchDocument,
  RetrievalRun, RetrievalCandidate, ActivationDecision, ContextItem, and
  ContextExclusion inputs.
- Slice 02 keeps retrieval external input as `unknown` until parsed, constrains
  retrieval mode and activation decision vocabulary, constrains context
  exclusion reasons, bounds numeric scores to `0..1000`, and defaults metadata
  objects at the parser boundary.
- Slice 03 added M24 retrieval read models and repository methods for
  SearchDocument creation, lexical search, EmbeddingModel creation, Embedding
  storage, create aliases for retrieval runs/candidates/activation decisions,
  list-by-run readback, and marker cleanup.
- Slice 03 updated Drizzle mappers for SearchDocument, EmbeddingModel,
  Embedding, and the new retrieval run/candidate/activation fields.
- Slice 03 kept existing compiler-facing retrieval methods compatible and
  updated no-store/fake repositories to satisfy the widened contract.

Verification:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M24 ledger creation.
- Targeted read of `docs/KRN_KERNEL.md`: passed.
- Targeted reads of retrieval DB schema, migration SQL, repository port,
  Drizzle adapter, mapper/read-model surface, package scripts, DB smoke
  routing, doctor readiness, pgvector readiness, and FTS helper: passed.
- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- Slice 01 RED: `pnpm --filter @krn/db test -- retrieval.test.ts` failed on
  missing M24 retrieval source vocabulary, search/embedding linkage, run,
  candidate, and activation fields.
- `pnpm --filter @krn/db test -- retrieval.test.ts`: passed.
- `pnpm db:generate`: passed and generated
  `packages/db/src/migrations/0005_young_outlaw_kid.sql`.
- SQL inspection of `0005_young_outlaw_kid.sql`: passed. It creates
  `retrieval_run_mode`, expands retrieval and activation enum values, adds
  nullable FK linkage columns, and adds indexes for new lookup fields.
- First Slice 01 `pnpm typecheck` failed because Drizzle row types had wider
  retrieval/activation vocabulary than `@krn/harness` read-model unions.
- `pnpm typecheck`: passed after expanding those public unions.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `6/6` and pgvector available.
- `pnpm test`: passed.
- `pnpm --filter @krn/db db:check`: passed.
- `git diff --check`: passed.
- Slice 02 RED: `pnpm --filter @krn/schema test` failed on missing
  retrieval parser exports.
- `pnpm --filter @krn/schema test`: passed with 9 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `git diff --check`: passed.
- Slice 03 RED: `pnpm --filter @krn/db test --
  DrizzleRetrievalRepository.test.ts mappers.test.ts` failed on missing M24
  repository methods, missing search/embedding mappers, and missing mapped
  retrieval run fields.
- `pnpm --filter @krn/db test -- DrizzleRetrievalRepository.test.ts
  mappers.test.ts`: passed.
- `pnpm typecheck`: passed.
- `pnpm test`: passed.
- `pnpm --filter @krn/db db:check`: passed.
- One-off live lexical repository check with `KRN_DATABASE_URL` inserted a
  SearchDocument, found it through `searchLexical`, and cleaned marker rows;
  output was `{"found":true,"cleanup":{"deletedCount":1}}`.

Next:

- M24.04: add self-cleaning `pnpm db:smoke:retrieval-substrate`.
