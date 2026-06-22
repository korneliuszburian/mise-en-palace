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

Non-goals that remain intentionally blocked:

- external embedding service integration;
- background embedding worker runtime;
- separate vector database;
- separate search engine;
- dashboard;
- broad automatic retrieval or naive RAG context dump.
