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

Changed files:

- `docs/runs/2026-06-22-retrieval-substrate/RETRIEVAL_SUBSTRATE_INVENTORY.md`
- `docs/runs/2026-06-22-retrieval-substrate/DECISIONS.md`
- `docs/runs/2026-06-22-retrieval-substrate/PROGRESS.md`
- `docs/runs/2026-06-22-retrieval-substrate/VERIFICATION.md`
- `docs/runs/2026-06-22-retrieval-substrate/BLOCKERS.md`
- `docs/runs/2026-06-22-retrieval-substrate/HANDOFF.md`

Decisions:
Reuse the existing Postgres/Drizzle retrieval schema. Keep FTS/vector raw SQL
inside the DB package. Do not add external embedding services, worker runtime,
separate search/vector stores, dashboard, or broad context dump behavior for
M24.

Blockers/risks:
No hard blocker for M24.00. The main implementation gap is repository/CLI smoke
behavior for `SearchDocument`, lexical search, and embedding placeholder/vector
storage.

Context selectors:
`GOAL.md`, `docs/KRN_KERNEL.md`, `packages/db/src/schema/retrieval.ts`,
`packages/db/src/migrations/0002_shocking_post.sql`,
`packages/harness/src/repositories/retrievalRepository.ts`,
`packages/harness/src/repositories/types.ts`,
`packages/db/src/repositories/DrizzleRetrievalRepository.ts`,
`packages/cli/src/runDbSmokeCommand.ts`, `packages/cli/src/runDoctorCommand.ts`,
and `package.json`.

Next action:
M24.01/M24.02 should add/tighten typed repository and IO boundaries for search
documents, lexical search, embedding models, and embedding rows, then M24.04
should prove the full chain with `pnpm db:smoke:retrieval-substrate`.

Do not reread:
`docs/materials/` or broad historical docs unless the next task explicitly
requires raw source/audit material.
