# Progress

Goal: M24 - Retrieval/search substrate plus activation trace persistence.

Current slice: Slice 00 inventory and decisions.

Completed:

- M23 memory governance is the baseline: MemoryCandidate review/promotion,
  MemoryRecord versions, MemoryApplication, AntiMemoryRecord, evidence proposal
  surface, doctor readiness, dogfood, anti-rot, and handoff are complete.
- M24 run ledger was created under
  `docs/runs/2026-06-22-retrieval-substrate/`.
- Slice 00 inventoried the current retrieval/search surface in
  `RETRIEVAL_SUBSTRATE_INVENTORY.md`.
- Slice 00 recorded M24 source-to-decision implications in `DECISIONS.md`.

Verification:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M24 ledger creation.
- Targeted read of `docs/KRN_KERNEL.md`: passed.
- Targeted reads of retrieval DB schema, migration SQL, repository port,
  Drizzle adapter, mapper/read-model surface, package scripts, DB smoke
  routing, doctor readiness, pgvector readiness, and FTS helper: passed.
- `pnpm typecheck`: passed.
- `git diff --check`: passed.

Next:

- M24.01: add or tighten the retrieval repository/schema surface only where the
  inventory proves an actual gap.
- M24.02/M24.03: add typed IO/read models and Drizzle methods for
  `SearchDocument`, lexical search, `EmbeddingModel`, and placeholder/vector
  `Embedding` storage.
- M24.04: add self-cleaning `pnpm db:smoke:retrieval-substrate`.
