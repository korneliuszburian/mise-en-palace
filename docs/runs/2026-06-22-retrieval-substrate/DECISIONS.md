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
- Source: `GOAL.md` M24.01 and current `packages/db/src/schema/retrieval.ts`.
  Mechanism: current retrieval tables already use `subject_type`/`subject_id`
  to represent the source object generically.
  KRN implication: duplicating that as separate required `source_type` and
  `source_id` columns would add ambiguity without improving the M24 smoke
  proof.
  Decision: keep `subject_type`/`subject_id` as the canonical generic source
  pointer, expand the enum to cover M24 source objects, and add specific FKs
  where first-class tables exist.
  Rejection/falsifier: if M24.03 repository behavior cannot produce a
  source-grounded SearchDocument and read it back through lexical search, this
  decision must be revisited.
- Source: `GOAL.md` M24.01 embedding rules.
  Mechanism: pgvector is already installed and `embeddings.embedding` already
  uses `vector(1536)`.
  KRN implication: M24 needs vector-ready records, not a new vector service.
  Decision: add `embeddings.search_document_id` and keep pgvector in the
  existing Postgres schema.
  Rejection/falsifier: any M24 implementation that requires an external
  embedding provider or separate vector DB violates the milestone.
- Source: `GOAL.md` M24.02 and existing `packages/schema` parser pattern.
  Mechanism: KRN CLI/API/file inputs are untrusted until parsed through Zod.
  KRN implication: retrieval/search input must cross a typed validation
  boundary before repository code sees it.
  Decision: add retrieval IO schemas in `packages/schema`, export `parseX`
  functions that accept `unknown`, constrain mode/decision/reason enums, and
  bound numeric scores to `0..1000`.
  Rejection/falsifier: repository or CLI code accepting raw retrieval input
  without these parsers would violate the M24.02 boundary.
- Source: `GOAL.md` M24.03 and current `RetrievalRepository` port.
  Mechanism: compiler/runtime code already depends on retrieval run,
  candidate, activation decision, and context selection methods.
  KRN implication: M24 should extend that port instead of creating a parallel
  search adapter.
  Decision: keep existing methods for compatibility, add M24 method names and
  read models for SearchDocument, EmbeddingModel, Embedding, lexical search,
  list-by-run readback, and marker cleanup.
  Rejection/falsifier: if M24.04 smoke cannot prove the full chain through this
  repository, the repository contract is insufficient.
- Source: Postgres FTS behavior needed by M24.03.
  Mechanism: `searchLexical` uses `websearch_to_tsquery` and rank calculation
  inside the DB adapter.
  KRN implication: raw SQL remains contained in `packages/db`; higher layers
  receive typed read models and scores only.
  Decision: lexical FTS SQL lives in `DrizzleRetrievalRepository`.
  Rejection/falsifier: CLI/harness code should not construct FTS SQL directly.

Slice 00 skill record:

- `brain-store-schema`: used to inventory retrieval tables, migrations,
  repository gaps, and DB smoke implications.
- `activation-engine`: used to check that retrieval persistence remains a
  bounded activation trace rather than broad context injection.
- `typescript-type-safety`: used to inspect current harness read models and
  missing typed boundaries for search/embedding IO.
- `superpowers:test-driven-development`: used as a gate for upcoming M24 code
  slices.

Slice 01 skill record:

- `superpowers:test-driven-development`: used for RED/GREEN retrieval schema
  tests.
- `brain-store-schema`: used for Drizzle schema, generated migration, enum,
  FK, index, and live DB readiness checks.
- `typescript-type-safety`: used to keep harness read-model unions aligned
  with widened DB vocabulary without casts or `any`.
- `activation-engine`: used to keep schema fields focused on retrieval
  candidate and activation/exclusion traceability.
- `superpowers:systematic-debugging`: used after typecheck exposed the
  widened DB vocabulary versus harness type boundary mismatch.

Slice 02 skill record:

- `superpowers:test-driven-development`: used for RED/GREEN retrieval IO parser
  tests.
- `typescript-type-safety`: used for the unknown-input Zod boundary, parser
  exports, bounded numeric score types, and no-`any` implementation.
- `activation-engine`: used to constrain retrieval mode, activation decision,
  context inclusion, and explicit exclusion inputs.

Slice 03 skill record:

- `superpowers:test-driven-development`: used for RED/GREEN repository surface
  and mapper tests.
- `brain-store-schema`: used for repository adapter behavior, read models,
  raw SQL containment, and marker cleanup ordering.
- `typescript-type-safety`: used to widen public harness read models without
  casts or `any`.
- `activation-engine`: used to keep candidate readback, activation decisions,
  and context exclusion persistence explicit.
- `superpowers:systematic-debugging`: used for the one-off runtime check when
  `tsx -e` first failed on top-level await rather than repository behavior.
