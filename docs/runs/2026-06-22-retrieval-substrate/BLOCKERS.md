# Blockers

No hard blocker for M24.06.

Known gaps for later M24 slices:

- M24.07 still needs anti-rot verification and final handoff refresh.

Resolved in M24.01:

- durable retrieval schema now represents search documents, vector-ready
  embedding rows linked to search documents, retrieval run mode/budget,
  candidate search-document linkage, and activation candidate/budget/impact
  trace fields.
- retrieval IO parsers now exist for search documents, retrieval runs,
  candidates, activation decisions, context items, and context exclusions.
- typed retrieval repository methods now exist for search document creation,
  lexical search, embedding model creation, embedding row storage, retrieval
  run/candidate/activation aliases, list-by-run readback, and marker cleanup.
- `pnpm db:smoke:retrieval-substrate` now proves the full retrieval substrate
  chain and cleanup count zero.
- `krn doctor` now reports retrieval substrate readiness read-only.
- durable retrieval dogfood proof rows now exist, so doctor reports retrieval
  runtime proof as `ready`.

Non-goals that remain intentionally blocked:

- external embedding service integration;
- background embedding worker runtime;
- separate vector database;
- separate search engine;
- dashboard;
- broad automatic retrieval or naive RAG context dump.
