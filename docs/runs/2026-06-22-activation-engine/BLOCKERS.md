# Blockers

No hard blocker for M25.00.

Known gaps for later M25 slices:

- current persisted live probe had zero context exclusions;
- no `pnpm db:smoke:activation` path exists;
- doctor does not report activation readiness.

Resolved in M25.01:

- activation domain contracts named in `GOAL.md` are now exported from
  `@krn/core`;
- harness activation candidate kind and exclusion reason aliases now derive
  from core vocabulary;
- core activation contracts have no DB/CLI/Codex imports and no
  `requiredSkills` field.

Resolved in M25.02:

- activation can retrieve lexical SearchDocument candidates;
- activation can consult project-level anti-memory;
- anti-memory can exclude blocked source claims and persist conflict activation
  decisions;
- compiler activation trace persistence is named and no longer inline-only.

Resolved in M25.03:

- noisy-brain activation fixture exists under
  `tests/fixtures/activation/noisy-brain-selection.json`;
- harness test proves bounded inclusions, stale exclusion, anti-memory blocking,
  source-without-mechanism rejection, and conflict flags;
- source safety no longer lets decorative/no-mechanism source claims hide
  behind budget exclusions.

Non-goals that remain intentionally blocked:

- LLM-based ranking;
- external embedding generation;
- broad research or source crawler;
- memory auto-mutation;
- dashboard;
- public API.
