# Progress

Goal: M25 - Activation Engine V1 integrated into persisted harness plan.

Current slice: Slice 08 anti-rot and handoff complete.

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
- Slice 04 added `packages/db/src/activationSmoke.ts` and exported
  `runActivationSmokeCheck` from `@krn/db`.
- Slice 04 added root command `pnpm db:smoke:activation` through
  `krn db smoke activation`.
- Slice 04 activation smoke creates a smoke workspace/project/run, seeds source
  claims, memory records, anti-memory, and a search document, runs the harness
  activation engine, persists retrieval candidates, activation decisions,
  context inclusions/exclusions, reads back context/retrieval linkage, and
  cleans marker rows to zero.
- Slice 05 updated `krn plan` output to print context status, bounded
  inclusions, explicit exclusions, and abstention status in the top-level plan
  summary before the Codex execution brief.
- Slice 06 added activation readiness inspection in `@krn/db` and doctor
  reporting in `@krn/cli`.
- Slice 06 doctor now reports activation domain contracts, activation engine
  surface, activation smoke command availability, activation runtime proof,
  broad context dump absence, core `requiredSkills` absence, and derived
  activation readiness.
- Slice 07 dogfooded activation on the real next task:
  `improve KRN doctor activation readiness`.
- Slice 07 captured persisted evidence for execution run
  `bb33bd3d-02df-4ff3-839b-6f545de88b4c`.
- Slice 07 recorded run IDs, retrieval counts, activation counts, evidence IDs,
  what helped, and what was not proven in `DOGFOOD.md`.
- Slice 08 reran the full M25 anti-rot suite against the local DB-backed
  runtime: typecheck, full tests, doctor, DB readiness, all persistence smokes,
  retrieval substrate smoke, and activation smoke.
- Slice 08 confirmed the TypeScript surface keeps the current boundary
  discipline: no `any`, double assertions, or TypeScript suppressions were
  found in `packages/**/*.ts`.
- Slice 08 updated `HANDOFF.md`, `BLOCKERS.md`, and this run ledger to mark
  M25 complete and point the next implementation slice at M26.00.

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
- Slice 04 RED: `pnpm --filter @krn/db test -- activationSmoke.test.ts`
  failed because `runActivationSmokeCheck` was not exported.
- Slice 04 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed
  because `krn db smoke activation` parsed as invalid usage.
- Slice 04 GREEN: `pnpm --filter @krn/db test -- activationSmoke.test.ts`
  passed with 10 test files and 25 tests.
- Slice 04 GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed
  with 52 tests.
- First Slice 04 `pnpm typecheck` failed on `exactOptionalPropertyTypes`
  because `tokenBudget: undefined` was passed to `createContextAssembly`.
- `pnpm typecheck`: passed after omitting `tokenBudget` when absent.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:activation`: passed with retrieval candidates `6`, activation
  decisions `6`, included decisions `2`, excluded decisions `2`, conflict
  decisions `1`, stale decisions `1`, context items `2`, context exclusions
  `4`, and cleanup remaining marker count `0`.
- `pnpm test`: passed with 18 test files and 98 tests.
- Slice 05 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed
  because persisted plan output did not include `Context status: assembled` in
  the top-level KRN Plan summary.
- Slice 05 GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with
  53 tests after adding activation summary formatting.
- `pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph
  readiness"`: passed with preview abstention, `Context status: abstained`,
  `Context inclusions: - none`, `Context exclusions: - none`, and no writes.
- `pnpm typecheck`: passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn plan --task "improve KRN doctor source graph readiness"
  --persist`: passed with context included `3`, context excluded `0`, context
  status `assembled`, explicit inclusion lines, explicit `Context exclusions:
  - none`, and persisted execution run `f522815d-3056-4815-88ba-ff225771bd1a`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:activation`: passed again with retrieval candidates `6`, activation
  decisions `6`, included decisions `2`, excluded decisions `2`, conflict
  decisions `1`, stale decisions `1`, context items `2`, context exclusions
  `4`, and cleanup remaining marker count `0`.
- `pnpm test`: passed with 18 test files and 99 tests.
- Slice 06 RED: `pnpm --filter @krn/cli test -- runCli.test.ts` failed
  because doctor did not print activation checks and
  `deriveActivationReadiness` was not exported.
- Slice 06 GREEN: `pnpm --filter @krn/cli test -- runCli.test.ts` passed with
  54 tests.
- `pnpm --filter @krn/db test -- activationSmoke.test.ts`: passed with 10 test
  files and 25 tests.
- `pnpm typecheck`: passed.
- `pnpm --filter @krn/cli krn doctor`: passed without DB and reported
  activation preview, activation smoke command availability, broad context dump
  absence, and core `requiredSkills` absence.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:activation`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported activation runtime proof ready
  with decisions `22`, inclusions `21`, exclusions `1`, and activation
  readiness ready.
- `pnpm test`: passed with 18 test files and 100 tests.
- Slice 07 `krn plan --task "improve KRN doctor activation readiness"
  --persist`: passed with context included `3`, context excluded `0`, context
  status `assembled`, context assembly
  `bb8ad48a-b675-4c79-ac71-edaa665129c9`, and execution run
  `bb33bd3d-02df-4ff3-839b-6f545de88b4c`.
- Slice 07 evidence capture for run
  `bb33bd3d-02df-4ff3-839b-6f545de88b4c`: passed and persisted evidence bundle
  `4bf9c4f4-684e-4a4d-972d-f1def2d80620`.
- Slice 07 DB readback for context assembly
  `bb8ad48a-b675-4c79-ac71-edaa665129c9`: passed with retrieval run
  `d15b1b47-0e0f-48eb-b385-bfaaffa9c0a7`, retrieval candidates `3`,
  activation decisions `3`, included decisions `3`, excluded decisions `0`,
  context items `3`, and context exclusions `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:activation`: passed after dogfood with cleanup remaining marker
  count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed after dogfood and reported activation readiness
  ready with decisions `25`, inclusions `24`, and exclusions `1`.
- Slice 08 `git status --short --branch`: passed with clean
  `## main...origin/main` before handoff doc edits.
- Slice 08 `git log --oneline -12`: passed and showed the M25 commits through
  `f5c0ba2 docs(run): record activation dogfood pass`.
- Slice 08 TypeScript hygiene scan over `packages/**/*.ts`: passed with no
  `any`, no `as unknown as`, no `@ts-ignore`, and no `@ts-expect-error`
  matches.
- Slice 08 `pnpm typecheck`: passed across 7 workspace packages.
- Slice 08 `pnpm test`: passed with 18 test files and 100 tests.
- Slice 08 DB-backed `krn doctor`: passed and reported activation readiness
  ready with decisions `25`, inclusions `24`, exclusions `1`, broad context
  dump absent, core `requiredSkills` absent, and forbidden surfaces absent.
- Slice 08 `pnpm db:ready`: passed with Postgres reachable, 6/6 migrations
  applied, pgvector available, and brain store readiness ready.
- Slice 08 `pnpm db:smoke`: passed with project readback matched and cleanup
  completed.
- Slice 08 `pnpm db:smoke:harness-plan`: passed with evidence contract
  commands `3`, run events `1`, and cleanup remaining marker count `0`.
- Slice 08 `pnpm db:smoke:harness-evidence`: passed with one evidence bundle,
  review assessment, feedback delta, run events `2`, and cleanup remaining
  marker count `0`.
- Slice 08 `pnpm db:smoke:source-graph`: passed with one source claim, one
  source decision edge, one rejection, outbox events `2`, and cleanup remaining
  marker count `0`.
- Slice 08 `pnpm db:smoke:memory-governance`: passed with one reviewed memory
  candidate, memory record/version/application, one anti-memory record, outbox
  events `2`, and cleanup remaining marker count `0`.
- Slice 08 `pnpm db:smoke:retrieval-substrate`: passed with search documents
  `4`, lexical results `1`, retrieval candidates `2`, activation decisions
  `2`, context items `1`, context exclusions `1`, and cleanup remaining marker
  count `0`.
- Slice 08 `pnpm db:smoke:activation`: passed with source claims `3`, memory
  records `2`, anti-memory records `1`, search documents `1`, retrieval
  candidates `6`, activation decisions `6`, included decisions `2`, excluded
  decisions `2`, conflict decisions `1`, stale decisions `1`, context items
  `2`, context exclusions `4`, and cleanup remaining marker count `0`.

Next:

- Run `git diff --check`.
- Commit Slice 08 as `docs(handoff): update activation engine status`.
- Start M26.00 Codex adapter and worker surface inventory.
