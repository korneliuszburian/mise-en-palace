# Progress

Goal: M25 - Activation Engine V1 integrated into persisted harness plan.

Current slice: Slice 03 noisy-brain activation fixture complete.

Completed:

- M24 retrieval/search substrate is complete and pushed through
  `34ff368 docs(handoff): update retrieval substrate status`.
- M25 run ledger was created under
  `docs/runs/2026-06-22-activation-engine/`.
- Slice 00 inventoried the current activation surface in
  `ACTIVATION_ENGINE_INVENTORY.md`.
- Slice 00 recorded source-to-decision implications in `DECISIONS.md`.
- Slice 01 added adapter-independent activation domain contracts in
  `packages/core/src/activation.ts` and exported them from `@krn/core`.
- Slice 01 added a harness RED/GREEN contract test in
  `packages/harness/src/activation/domainContracts.test.ts`.
- Slice 01 tied harness activation candidate kind and exclusion reason aliases
  to core vocabulary to avoid drift.
- Slice 02 added named activation engine v1 functions:
  `retrieveActivationCandidates`, `detectConflicts`, `scoreContextROI`,
  `assembleActivatedContext`, and `persistActivationTrace`.
- Slice 02 extended activation candidate retrieval to include lexical
  SearchDocument results and project anti-memory.
- Slice 02 added anti-memory conflict detection that excludes blocked source
  claims and records conflict activation decisions.
- Slice 02 refactored `compileHarnessPlan` to use activation engine helpers
  instead of inline candidate persistence.
- Slice 02 added `MemoryRepository.listAntiMemoryForProject` and the Drizzle
  implementation.
- Slice 03 added
  `tests/fixtures/activation/noisy-brain-selection.json` with one activation
  task, high-signal memory, stale memory, source claims, a search document, and
  anti-memory.
- Slice 03 added
  `packages/harness/src/activation/noisyBrainFixture.test.ts` to prove bounded
  inclusions, explicit exclusions, stale rejection, anti-memory blocking, and
  conflict flags.
- Slice 03 added `hasMechanism` to source activation candidates and made
  source safety override budget/low-ROI exclusions without overriding
  low-trust, stale, invalidated, superseded, or anti-memory unsafe decisions.

Verification:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M25 ledger creation.
- Targeted read of `docs/KRN_KERNEL.md`: passed.
- Targeted read of `GOAL.md` M25 section: passed.
- Targeted read of M24 retrieval handoff: passed.
- Targeted reads of current activation modules, compiler, repositories,
  context/retrieval schema, CLI plan runtime, no-store runtime, DB runtime,
  package scripts, and doctor/smoke surfaces: passed.
- `pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph
  readiness"`: passed with preview abstention, context included `0`, and
  context excluded `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "improve KRN doctor source graph readiness"
  --persist`: passed with context included `3`, context excluded `0`, and
  persisted IDs recorded in `ACTIVATION_ENGINE_INVENTORY.md`.
- Post-run DB audit for context assembly
  `8ee85cac-8fa7-418a-8a27-9ca06e763d0d`: passed with context items `3`,
  context exclusions `0`, activation decisions `3`, and retrieval candidates
  `3`.
- `pnpm typecheck`: passed.
- `git diff --check`: passed.
- Slice 01 RED: `pnpm --filter @krn/harness test --
  domainContracts.test.ts` failed because `createActivationAbstention` and the
  activation core exports did not exist yet.
- Slice 01 GREEN: `pnpm --filter @krn/harness test --
  domainContracts.test.ts` passed with 3 test files and 7 tests.
- `pnpm typecheck`: passed after adding core contracts and harness aliases.
- Boundary scan for `@krn/db`, `@krn/cli`, `@krn/codex-adapter`,
  `requiredSkills`, Codex skill IDs, and skill fields in `packages/core` found
  no matches.
- `pnpm test`: passed with 16 test files and 94 tests.
- `git diff --check`: passed.
- Slice 02 RED: `pnpm --filter @krn/harness test -- index.test.ts` failed
  because the compiler did not include search candidates.
- Slice 02 GREEN: `pnpm --filter @krn/harness test -- index.test.ts` passed
  with 3 test files and 8 tests.
- First full `pnpm test` after Slice 02 implementation failed in CLI plan tests
  because no-store preview called unavailable `searchLexical`.
- Root cause: no-store preview should return an empty search corpus, matching
  empty source/memory preview repositories, not throw.
- `pnpm --filter @krn/cli test -- runCli.test.ts`: passed after fixing
  no-store `searchLexical`.
- `pnpm typecheck`: passed.
- `pnpm test`: passed with 16 test files and 95 tests.
- `pnpm --filter @krn/cli krn plan --task "improve KRN doctor activation
  readiness"`: passed with preview abstention.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "improve KRN doctor activation readiness"
  --persist`: passed with context included `3`, context excluded `0`, and
  persisted execution run `c44204c0-be61-4839-b765-5002024f4c3e`.
- `git diff --check`: passed.
- Slice 03 RED-1: `pnpm --filter @krn/harness test --
  noisyBrainFixture.test.ts` failed because the bounded fixture selected
  source claim `claim-activation-smoke` instead of search document
  `search-activation-smoke`.
- Slice 03 RED-2: after correcting the fixture search score and adding
  `unknown` JSON fixture narrowing, `pnpm --filter @krn/harness test --
  noisyBrainFixture.test.ts` failed because source claim
  `claim-no-mechanism` was excluded as `over_budget` instead of `unsafe`.
- Slice 03 GREEN-1: after adding source mechanism safety,
  `pnpm --filter @krn/harness test -- noisyBrainFixture.test.ts` exposed an
  existing compiler regression where a low-trust source claim was incorrectly
  rewritten from `low_trust` to `unsafe`.
- Slice 03 GREEN-2: after preserving hard trust/temporal/anti-memory exclusion
  reasons, `pnpm --filter @krn/harness test -- noisyBrainFixture.test.ts`
  passed with 4 test files and 9 tests.
- `pnpm typecheck`: passed.
- `pnpm test`: passed with 17 test files and 96 tests.
- `git diff --check`: passed.

Next:

- Commit Slice 03 as `test(harness): add noisy brain activation fixture`.
- Start M25.04 by adding an activation smoke path that uses the fixture/DB path
  to prove included and excluded activation decisions.
