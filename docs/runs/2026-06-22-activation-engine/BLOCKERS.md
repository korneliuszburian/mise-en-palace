# Blockers

No hard blocker for M25.00.

Known gaps for later M25 slices:

- current persisted live probe had zero context exclusions;

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

Resolved in M25.04:

- `pnpm db:smoke:activation` exists;
- activation smoke creates a store-backed noisy corpus and persists retrieval
  candidates, activation decisions, context items, and context exclusions;
- activation smoke readback proves included, excluded, conflict, and stale
  activation decisions;
- activation smoke cleanup proved remaining marker count `0`.

Resolved in M25.05:

- `krn plan` preview prints context status, inclusions, exclusions, and
  abstention;
- `krn plan --persist` prints bounded activation inclusions and explicit
  exclusions in the top-level KRN Plan summary;
- current real persisted plan has zero exclusions because of the live corpus,
  but it now prints `Context exclusions: - none` explicitly while
  `pnpm db:smoke:activation` proves the exclusion/conflict/stale path.

Resolved in M25.06:

- doctor reports activation domain contract presence;
- doctor reports activation smoke command availability;
- doctor reports activation runtime proof ready/unverified from durable
  activation/context rows;
- doctor reports broad context dump absence and core `requiredSkills` absence;
- DB-backed doctor reports activation readiness ready in the current local
  store.

Resolved in M25.07:

- activation was dogfooded on the real next task;
- dogfood evidence was captured for execution run
  `bb33bd3d-02df-4ff3-839b-6f545de88b4c`;
- dogfood readback recorded retrieval run
  `d15b1b47-0e0f-48eb-b385-bfaaffa9c0a7`, candidates, decisions, inclusions,
  and exclusions;
- dogfood limitations are explicitly recorded in `DOGFOOD.md`.

Non-goals that remain intentionally blocked:

- LLM-based ranking;
- external embedding generation;
- broad research or source crawler;
- memory auto-mutation;
- dashboard;
- public API.
