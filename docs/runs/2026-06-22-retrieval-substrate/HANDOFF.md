# Handoff

Objective:
Make retrieval/search substrate real enough to support M25 activation.

Last verified state:
M23 memory governance is complete and pushed. M24 Slice 00 inventoried the
existing retrieval/search substrate. The DB schema and migration already
include `embedding_models`, `embeddings`, `search_documents`,
`retrieval_runs`, `retrieval_candidates`, `activation_decisions`,
`context_items`, and `context_exclusions`. The current repository port/adapter
persists retrieval runs, candidates, activation decisions, and context
selection. It does not yet expose typed search document, lexical search,
embedding model, or embedding storage methods. There is no
`db:smoke:retrieval-substrate` script or doctor retrieval readiness section yet.
`pnpm typecheck` and `git diff --check` passed after the M24 Slice 00 ledger
was created.

M24 Slice 01 is complete. The retrieval schema now has M24 source vocabulary,
`retrieval_run_mode`, search document search text and evidence/review/decision
and run event linkage, embedding-to-search-document linkage, retrieval run
execution/mode/budget/created fields, candidate-to-search-document linkage and
score, activation retrieval-candidate linkage, context budget cost, and expected
decision impact. Migration `0005_young_outlaw_kid.sql` was generated and
applied locally through `pnpm db:ready`.

M24 Slice 02 is complete. `packages/schema/src/retrieval.ts` now exports Zod
schemas, inferred input types, and parse functions for search documents,
retrieval runs, retrieval candidates, activation decisions, context items, and
context exclusions. The parser boundary keeps input as `unknown`, defaults
metadata, constrains retrieval mode and activation/exclusion vocabulary, and
bounds score fields to `0..1000`.

M24 Slice 03 is complete. `RetrievalRepository` now has typed M24 methods for
SearchDocument creation, lexical search, EmbeddingModel creation, Embedding
storage, retrieval run/candidate/activation aliases, list-by-run readback, and
marker cleanup. DrizzleRetrievalRepository implements them, with FTS SQL kept in
the DB adapter. A one-off live check inserted a SearchDocument, found it through
`searchLexical`, and cleaned the marker row.

Changed files:

- `docs/runs/2026-06-22-retrieval-substrate/RETRIEVAL_SUBSTRATE_INVENTORY.md`
- `docs/runs/2026-06-22-retrieval-substrate/DECISIONS.md`
- `docs/runs/2026-06-22-retrieval-substrate/PROGRESS.md`
- `docs/runs/2026-06-22-retrieval-substrate/VERIFICATION.md`
- `docs/runs/2026-06-22-retrieval-substrate/BLOCKERS.md`
- `docs/runs/2026-06-22-retrieval-substrate/HANDOFF.md`
- `packages/db/src/schema/retrieval.ts`
- `packages/db/src/schema/retrieval.test.ts`
- `packages/harness/src/repositories/types.ts`
- `packages/db/src/migrations/0005_young_outlaw_kid.sql`
- `packages/db/src/migrations/meta/0005_snapshot.json`
- `packages/db/src/migrations/meta/_journal.json`
- `packages/schema/src/retrieval.ts`
- `packages/schema/src/index.ts`
- `packages/schema/src/index.test.ts`
- `packages/harness/src/repositories/retrievalRepository.ts`
- `packages/harness/src/repositories/types.ts`
- `packages/harness/src/compiler/index.test.ts`
- `packages/cli/src/noStoreRepositories.ts`
- `packages/db/src/repositories/DrizzleRetrievalRepository.ts`
- `packages/db/src/repositories/DrizzleRetrievalRepository.test.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/db/src/repositories/mappers.test.ts`

Decisions:
Reuse the existing Postgres/Drizzle retrieval schema. Keep FTS/vector raw SQL
inside the DB package. Do not add external embedding services, worker runtime,
separate search/vector stores, dashboard, or broad context dump behavior for
M24. Slice 01 keeps `subject_type`/`subject_id` as the canonical generic source
pointer instead of adding duplicate required `source_type`/`source_id` columns,
then expands the enum and adds concrete FKs where first-class tables already
exist.

Blockers/risks:
No hard blocker for M24.03. The main implementation gap is now the
self-cleaning `db:smoke:retrieval-substrate` command and later doctor readiness.

Context selectors:
`GOAL.md`, `docs/KRN_KERNEL.md`, `packages/db/src/schema/retrieval.ts`,
`packages/db/src/migrations/0002_shocking_post.sql`,
`packages/harness/src/repositories/retrievalRepository.ts`,
`packages/harness/src/repositories/types.ts`,
`packages/db/src/repositories/DrizzleRetrievalRepository.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, `packages/cli/src/runDoctorCommand.ts`,
and `package.json`.

Next action:
M24.04 should add `pnpm db:smoke:retrieval-substrate` and prove the full chain:
search document insert, lexical retrieval, embedding placeholder/vector row,
retrieval run, candidate, activation decision, context inclusion/exclusion, and
cleanup count zero.

Do not reread:
`docs/materials/` or broad historical docs unless the next task explicitly
requires raw source/audit material.
