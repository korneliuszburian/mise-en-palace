# Verification

## Slice 00

Commands run:

```sh
git status --short --branch
sed -n '1,220p' docs/KRN_KERNEL.md
sed -n '2016,2378p' GOAL.md
sed -n '1,180p' docs/runs/2026-06-22-retrieval-substrate/HANDOFF.md
rg -n "assembleContext|ContextAssembly|contextAssembly|inclusions|exclusions|ContextInclusion|ContextExclusion|activation|Activation" packages docs -g '*.ts' -g '*.md'
rg -n "plan --task|krn plan|runPlan|persist|createTaskContract|createContextAssembly|createExecutionRun" packages/cli/src packages/harness/src packages/db/src -g '*.ts'
rg -n "SourceRepository|MemoryRepository|RetrievalRepository|list.*Source|list.*Memory|searchLexical|createRetrievalRun|storeContextSelection|MemoryRecord|SourceClaim" packages/harness/src packages/db/src packages/cli/src -g '*.ts'
pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph readiness"
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph readiness" --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/db exec tsx - <<'TS'
# context assembly readback audit
TS
cat package.json
rg -n "db:smoke:activation|activation readiness|Activation" packages/cli/src package.json packages/db/src -g '*.ts' -g 'package.json'
git log --oneline -8
pnpm typecheck
git diff --check
```

Results:

- Repository was clean before the M25 ledger was created.
- Kernel contract confirms M25 must select/apply/verify/forget context rather
  than build broad context.
- `GOAL.md` M25 requires deterministic activation over source/memory/search,
  trust and temporal filters, conflict/staleness handling, context ROI,
  persisted inclusions/exclusions, activation smoke, plan integration, doctor
  readiness, dogfood, and anti-rot.
- Existing activation modules already implement deterministic memory/source
  query terms, ranking, trust filtering, temporal filtering, context ROI,
  source-claim safety, and context assembly.
- `compileHarnessPlan` already uses the activation modules and persists
  retrieval run/candidates, activation decisions, context assembly, and
  context selection.
- Current plan preview abstains without DB and does not crash.
- Current persisted plan includes three source/memory context items and
  persists retrieval/activation records, but records zero context exclusions.
- No `pnpm db:smoke:activation` script or doctor activation readiness section
  exists yet.
- `memory_activation_traces` exists but is memory-only and is not used by the
  compiler path.
- `pnpm typecheck` passed.
- `git diff --check` passed.

## Slice 01

Commands run:

```sh
pnpm --filter @krn/harness test -- domainContracts.test.ts
pnpm --filter @krn/harness test -- domainContracts.test.ts
pnpm typecheck
rg -n "@krn/db|@krn/cli|@krn/codex-adapter|requiredSkills|CodexSkill|skillId" packages/core/src packages/core/package.json
pnpm test
git diff --check
```

Results:

- RED harness contract test failed because activation core exports were absent;
  the observed failure was `createActivationAbstention is not a function`.
- Added `packages/core/src/activation.ts` with
  `ActivationPolicy`, `TrustAssessment`, `ContextROI`, `ActivationTrace`,
  `ActivationInput`, `ActivationResult`, `ActivationAbstention`, `ConflictSet`,
  `ContextBudget`, activation vocabulary constants, and
  `createActivationAbstention`.
- Exported activation contracts from `packages/core/src/index.ts`.
- Updated harness activation type aliases for candidate kind and exclusion
  reason to derive from core vocabulary.
- GREEN harness contract test passed with 3 test files and 7 tests.
- `pnpm typecheck` passed.
- Boundary scan returned no matches for DB/CLI/Codex imports, `requiredSkills`,
  or skill ID fields in core.
- Full `pnpm test` passed with 16 test files and 94 tests.
- `git diff --check` passed.

## Slice 02

Commands run:

```sh
pnpm --filter @krn/harness test -- index.test.ts
pnpm --filter @krn/harness test -- index.test.ts
pnpm typecheck
pnpm test
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm typecheck
pnpm test
pnpm --filter @krn/cli krn plan --task "improve KRN doctor activation readiness"
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "improve KRN doctor activation readiness" --persist
git diff --check
```

Results:

- RED compiler test failed because search candidate `search-activation` was not
  included by the current compiler path.
- Added `toSearchCandidate`, `detectConflicts`, `scoreContextROI`,
  `assembleActivatedContext`, `retrieveActivationCandidates`, and
  `persistActivationTrace`.
- Added project-level anti-memory read path
  `MemoryRepository.listAntiMemoryForProject` with Drizzle and no-store
  implementations.
- `compileHarnessPlan` now retrieves memory/source/search candidates, detects
  anti-memory conflicts, persists retrieval candidates, activation decisions,
  context selection, and conflict metadata through activation helpers.
- GREEN compiler test passed with 3 test files and 8 tests.
- First full `pnpm test` failed in CLI no-store plan tests because no-store
  preview threw on `searchLexical`.
- Fixed no-store `searchLexical` to return an empty corpus; targeted CLI tests
  then passed with 51 tests.
- `pnpm typecheck` passed.
- Full `pnpm test` passed with 16 test files and 95 tests.
- Preview `krn plan` passed and still abstains without DB corpus.
- Live `krn plan --persist` passed. Current real corpus still produced
  included `3` and excluded `0`, which is expected until M25.03/M25.04 seed a
  noisy activation fixture/smoke with search hits and anti-memory conflicts.
- `git diff --check` passed.

## Slice 03

Commands run:

```sh
pnpm --filter @krn/harness test -- noisyBrainFixture.test.ts
pnpm --filter @krn/harness test -- noisyBrainFixture.test.ts
pnpm --filter @krn/harness test -- noisyBrainFixture.test.ts
pnpm --filter @krn/harness test -- noisyBrainFixture.test.ts
pnpm typecheck
pnpm test
git diff --check
```

Results:

- RED-1 failed because the first fixture score selected source claim
  `claim-activation-smoke` instead of search document
  `search-activation-smoke`; the fixture search score was then corrected to
  make the expected bounded-inclusion contract explicit.
- RED-2 failed because source claim `claim-no-mechanism` was excluded as
  `over_budget` instead of `unsafe`, proving the missing source-mechanism
  policy.
- Added `hasMechanism` to source activation candidates and source safety in
  `assembleContext` for source claims without a mechanism.
- GREEN-1 exposed a regression where an existing weak-context compiler test
  lost `low_trust`; source safety now only overrides `over_budget` and
  `low_context_roi`, while preserving low-trust, temporal, and anti-memory
  unsafe exclusions.
- GREEN-2 passed with 4 test files and 9 tests.
- `pnpm typecheck` passed.
- Full `pnpm test` passed with 17 test files and 96 tests.
- `git diff --check` passed.

## Slice 04

Commands run:

```sh
pnpm --filter @krn/db test -- activationSmoke.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/db test -- activationSmoke.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm typecheck
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:activation
pnpm test
```

Results:

- RED DB export test failed because `runActivationSmokeCheck` was undefined.
- RED CLI test failed because `krn db smoke activation` returned usage exit
  `2`.
- Added `packages/db/src/activationSmoke.ts`, exported it from `@krn/db`, added
  parser/CLI dispatch for `activation`, and added root script
  `pnpm db:smoke:activation`.
- Targeted DB test passed with 10 test files and 25 tests.
- Targeted CLI test passed with 52 tests.
- First `pnpm typecheck` failed because `tokenBudget: undefined` violated
  `exactOptionalPropertyTypes` at the `createContextAssembly` boundary.
- The boundary was fixed by omitting `tokenBudget` when absent; `pnpm
  typecheck` then passed.
- Live activation smoke passed with:
  - execution run `dc7b8f72-6cc7-4f94-b9c7-c8a8008f2086`;
  - retrieval run `7c1d546a-84b3-4873-b0f6-815277819d09`;
  - context assembly `129f088b-db0b-452a-9e2b-87c21ca0c1d9`;
  - source claims `3`, memory records `2`, anti-memory records `1`, search
    documents `1`, search candidates `1`;
  - retrieval candidates `6`, activation decisions `6`, included decisions
    `2`, excluded decisions `2`, conflict decisions `1`, stale decisions `1`;
  - context items `2`, context exclusions `4`;
  - cleanup remaining marker count `0`.
- Full `pnpm test` passed with 18 test files and 98 tests.

## Slice 05

Commands run:

```sh
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli test -- runCli.test.ts
pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph readiness"
pnpm typecheck
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn plan --task "improve KRN doctor source graph readiness" --persist
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke:activation
pnpm test
```

Results:

- RED CLI test failed because the top-level `KRN Plan` output did not include
  `Context status: assembled`; inclusions/exclusions only appeared later in the
  Codex execution brief.
- Added top-level activation summary formatting in
  `packages/cli/src/runPlanCommand.ts`:
  `Context status`, `Context inclusions`, `Context exclusions`, and
  `Context abstention` when the context assembly abstains.
- GREEN CLI test passed with 53 tests.
- Preview `krn plan` passed without writes and printed `Context status:
  abstained`, explicit empty inclusion/exclusion sections, and the abstention
  reason.
- `pnpm typecheck` passed.
- Live `krn plan --persist` passed and printed context included `3`, context
  excluded `0`, context status `assembled`, explicit inclusion lines, explicit
  `Context exclusions: - none`, and persisted execution run
  `f522815d-3056-4815-88ba-ff225771bd1a`.
- Live activation smoke still passed with included/excluded/conflict/stale
  activation decisions and cleanup remaining marker count `0`.
- Full `pnpm test` passed with 18 test files and 99 tests.
