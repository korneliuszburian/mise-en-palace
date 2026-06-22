# Blockers

No hard blocker for M24.00.

Known gaps for later M24 slices:

- no `pnpm db:smoke:retrieval-substrate` yet;
- no typed repository methods for search document creation or lexical search;
- no typed repository methods for embedding model or placeholder/vector row
  storage;
- no doctor retrieval/search substrate readiness yet;
- no live smoke proof that cleanup count is zero after the full retrieval
  substrate chain.

Resolved in M24.01:

- durable retrieval schema now represents search documents, vector-ready
  embedding rows linked to search documents, retrieval run mode/budget,
  candidate search-document linkage, and activation candidate/budget/impact
  trace fields.

Non-goals that remain intentionally blocked:

- external embedding service integration;
- background embedding worker runtime;
- separate vector database;
- separate search engine;
- dashboard;
- broad automatic retrieval or naive RAG context dump.
