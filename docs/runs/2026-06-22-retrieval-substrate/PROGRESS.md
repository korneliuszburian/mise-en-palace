# Progress

Goal: M24 - Retrieval/search substrate plus activation trace persistence.

Current slice: Slice 01 retrieval schema tightening complete.

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

Next:

- M24.02/M24.03: add typed IO/read models and Drizzle methods for
  `SearchDocument`, lexical search, `EmbeddingModel`, and placeholder/vector
  `Embedding` storage.
- M24.04: add self-cleaning `pnpm db:smoke:retrieval-substrate`.
