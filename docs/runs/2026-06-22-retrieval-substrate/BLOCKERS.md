# Blockers

No hard blocker for M24.

Known gaps for later M24 slices:

- none.

Known risks for M25:

- M24 proves substrate persistence and auditability, not final activation
  ranking quality.
- external embedding provider behavior remains out of scope.
- background embedding worker behavior remains out of scope.

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
- M24 anti-rot passed across typecheck, tests, doctor, DB readiness, all DB
  smoke commands, DB schema check, and dogfood marker audit.

Non-goals that remain intentionally blocked:

- external embedding service integration;
- background embedding worker runtime;
- separate vector database;
- separate search engine;
- dashboard;
- broad automatic retrieval or naive RAG context dump.
