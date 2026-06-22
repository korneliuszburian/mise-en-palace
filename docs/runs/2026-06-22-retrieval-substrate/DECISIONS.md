# Decisions

- Treat `GOAL.md` M24 as the active execution contract.
- Use `docs/runs/2026-06-22-retrieval-substrate/` as the compact M24 run
  ledger. It is audit/handoff material only, not runtime memory.
- Source: `docs/KRN_KERNEL.md`.
  Mechanism: KRN must select, apply, verify, and forget context instead of
  building larger context dumps.
  KRN implication: retrieval must persist why a context item was found,
  selected, or excluded.
  Decision: M24 will prove a bounded retrieval chain with `RetrievalRun`,
  `RetrievalCandidate`, `ActivationDecision`, `ContextItem`, and
  `ContextExclusion`, not a naive RAG dump.
  Rejection/falsifier: if the smoke only inserts text and returns it without
  activation/exclusion records, M24 is incomplete.
- Source: `packages/db/src/schema/retrieval.ts` and
  `packages/db/src/migrations/0002_shocking_post.sql`.
  Mechanism: Postgres/Drizzle already has `search_documents`,
  `embedding_models`, `embeddings`, `retrieval_runs`,
  `retrieval_candidates`, `activation_decisions`, `context_items`, and
  `context_exclusions`.
  KRN implication: M24 should reuse the existing brain-store substrate.
  Decision: do not introduce a separate vector DB, search service, or new
  storage topology for this milestone.
  Rejection/falsifier: only add infrastructure if Postgres/pgvector cannot
  satisfy the smoke proof.
- Source: `GOAL.md` M24 non-goals.
  Mechanism: external embedding integration and background worker runtime are
  explicitly out of scope.
  KRN implication: vector readiness can be proven with a placeholder/local
  vector row or explicitly skipped with reason.
  Decision: M24 smoke should prefer storing a local placeholder vector when
  pgvector is available and should report a clear skip reason only when the DB
  environment blocks it.
  Rejection/falsifier: calling an external embedding provider in M24 violates
  the milestone.
- Source: current `RetrievalRepository` port.
  Mechanism: run/candidate/activation/context selection writes already cross a
  typed harness boundary.
  KRN implication: search documents and embeddings should join the same typed
  boundary instead of being written ad hoc from CLI code.
  Decision: M24.02/M24.03 should add typed IO/read models and Drizzle adapter
  methods for search documents, lexical search, embedding model, and embedding
  storage.
  Rejection/falsifier: raw SQL may be used for FTS/vector operations inside the
  DB package, but CLI code must not own those persistence details.
- Source: current `package.json`, `parseArgs`, `runDbSmokeCommand`, and
  `runDoctorCommand`.
  Mechanism: prior milestones expose proof through package scripts, DB smoke
  routing, and read-only doctor readiness.
  KRN implication: retrieval substrate should follow the same operational
  pattern.
  Decision: add `pnpm db:smoke:retrieval-substrate`, route
  `krn db smoke retrieval-substrate`, and later add doctor readiness.
  Rejection/falsifier: docs-only proof or one-off SQL is not enough for M24.

Slice 00 skill record:

- `brain-store-schema`: used to inventory retrieval tables, migrations,
  repository gaps, and DB smoke implications.
- `activation-engine`: used to check that retrieval persistence remains a
  bounded activation trace rather than broad context injection.
- `typescript-type-safety`: used to inspect current harness read models and
  missing typed boundaries for search/embedding IO.
- `superpowers:test-driven-development`: used as a gate for upcoming M24 code
  slices.
