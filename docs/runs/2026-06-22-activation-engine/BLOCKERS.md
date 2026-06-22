# Blockers

No hard blocker for M25.00.

Known gaps for later M25 slices:

- activation domain contracts named in `GOAL.md` are not yet stable exported
  core/harness contracts;
- current activation uses memory/source candidates, but not lexical
  SearchDocument candidates;
- current activation does not consult anti-memory;
- current activation does not model conflict sets;
- current persisted live probe had zero context exclusions;
- no noisy-brain activation fixture exists;
- no `pnpm db:smoke:activation` path exists;
- doctor does not report activation readiness.

Non-goals that remain intentionally blocked:

- LLM-based ranking;
- external embedding generation;
- broad research or source crawler;
- memory auto-mutation;
- dashboard;
- public API.
