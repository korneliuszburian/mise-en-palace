# Blockers

No hard blocker for M25.00.

Known gaps for later M25 slices:

- current activation uses memory/source candidates, but not lexical
  SearchDocument candidates;
- current activation does not consult anti-memory;
- current activation does not model conflict sets;
- current persisted live probe had zero context exclusions;
- no noisy-brain activation fixture exists;
- no `pnpm db:smoke:activation` path exists;
- doctor does not report activation readiness.

Resolved in M25.01:

- activation domain contracts named in `GOAL.md` are now exported from
  `@krn/core`;
- harness activation candidate kind and exclusion reason aliases now derive
  from core vocabulary;
- core activation contracts have no DB/CLI/Codex imports and no
  `requiredSkills` field.

Non-goals that remain intentionally blocked:

- LLM-based ranking;
- external embedding generation;
- broad research or source crawler;
- memory auto-mutation;
- dashboard;
- public API.
