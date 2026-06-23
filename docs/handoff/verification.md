# Verification

> Historical audit/planning ledger.
> Not current execution truth.
> Current canonical execution plan: `/PLAN.md`.

Latest verified slice: QG-04H smell scan automation requirements.

Passed:

- QG-00 preflight `git status --short --branch` showed branch `main` aligned
  with `origin/main` plus only the two raw research materials untracked.
- QG-00 preflight `git log --oneline -8` showed latest commit
  `7e0c6b8 docs(memory): add blocking quality correction gate`.
- QG-00 preflight `git rev-parse HEAD` returned
  `7e0c6b8691c79e4ccba85bae9ac004f2fe63b5ad`.
- `pnpm typecheck` passed.
- `pnpm test` passed with 56 colocated test files.
- QG-00 inventory recorded package/test/export/script/docs/non-goal facts at
  `docs/plans/memory-ideal-state/QG-00-REPO-INVENTORY.md`.
- QG-01 focused RED test failed before implementation because
  `runBoundaryAudit` did not catch production imports from test modules, public
  test-helper exports, or production fixture imports.
- QG-01 focused GREEN test passed after boundary audit enforcement was added.
- QG-02 focused RED test failed before implementation because
  `runTypeSafetyAudit` did not catch double assertions, `@ts-ignore`, or
  undocumented `@ts-expect-error`.
- QG-02 focused GREEN test passed after type-safety audit enforcement was
  added.
- QG-02 records general code quality, naming, monolith-boundary, export,
  comments, test, and error-handling rules in
  `docs/standards/code-quality.md`.
- QG-03 `pnpm dlx knip --reporter json` initially found unused exports/types,
  duplicate activation aliases, and one fixture file finding.
- QG-03 cleanup removed clear zombie exports and converted local-only exported
  types to local types.
- QG-03 post-cleanup Knip reported only the accepted target-repo fixture file.
- QG-04 line-count scan identified the largest production files:
  `parseArgs.ts`, `runDoctorCommand.ts`, `auditChecks.ts`,
  `DrizzleObservationRepository.ts`, and `mappers.ts`.
- QG-04 duplicate-helper scan identified repeated CLI filesystem/JSON helpers,
  memory confidence parsing, schema metadata guards, and review signal
  normalization.
- QG-04 removed low-risk `placeholder` vocabulary from retrieval substrate
  smoke code and mapper tests.
- QG-04 focused `pnpm --filter @krn/db test -- mappers` passed with 23 files
  and 65 tests.
- QG-04 full `pnpm typecheck` passed.
- QG-04 full `pnpm test` passed.
- QG-04 `git diff --check` passed.
- QG-04 stale status scan passed.
- QG-04 `krn audit slice --fail-on warning` passed with verdict `pass` and 0
  findings.
- QG-04 recorded repair slices QG-04A through QG-04H at
  `docs/plans/memory-ideal-state/QG-04-SMELL-BLOAT-AUDIT.md`.
- QG-04A RED focused `pnpm --filter @krn/cli test -- cliFileBoundary` failed
  because `./cliFileBoundary.js` did not exist.
- QG-04A GREEN focused `pnpm --filter @krn/cli test -- cliFileBoundary` passed
  with 7 files and 96 tests.
- QG-04A focused `pnpm --filter @krn/cli test` passed with 7 files and 96
  tests.
- QG-04A focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04A full `pnpm typecheck` passed.
- QG-04A full `pnpm test` passed.
- QG-04A duplicate-helper scan found only canonical helper definitions in
  `packages/cli/src/cliFileBoundary.ts`.
- QG-04A `git diff --check` passed.
- QG-04A forbidden directory scan found no added forbidden surfaces.
- QG-04A stale status scan passed.
- QG-04A `krn audit slice --fail-on warning` passed with verdict `pass` and 0
  findings.
- QG-04B RED focused `pnpm --filter @krn/cli test -- parseMemoryArgs` failed
  because `./parseMemoryArgs.js` did not exist.
- QG-04B GREEN focused `pnpm --filter @krn/cli test -- parseMemoryArgs`
  passed with 19 files and 129 tests.
- QG-04B focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04B focused `pnpm --filter @krn/cli test` passed with 19 files and 129
  tests.
- QG-04B full `pnpm typecheck` passed.
- QG-04B full `pnpm test` passed.
- QG-04B `git diff --check` passed.
- QG-04B forbidden directory scan found no added forbidden surfaces.
- QG-04B `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-04B reduced `packages/cli/src/parseArgs.ts` to 379 lines and moved the
  remaining `memory` command-family grammar to
  `packages/cli/src/parseMemoryArgs.ts`.
- QG-04C RED focused `pnpm --filter @krn/cli test -- doctorRepoChecks` failed
  because `./doctorRepoChecks.js` did not exist.
- QG-04C GREEN focused `pnpm --filter @krn/cli test -- doctorRepoChecks`
  passed with 20 files and 131 tests.
- QG-04C RED focused `pnpm --filter @krn/cli test -- doctorStaticChecks`
  failed because `./doctorStaticChecks.js` did not exist.
- QG-04C GREEN focused `pnpm --filter @krn/cli test -- doctorStaticChecks`
  passed with 21 files and 133 tests.
- QG-04C focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04C focused `pnpm --filter @krn/cli test` passed with 21 files and 133
  tests.
- QG-04C partial extraction reduced `packages/cli/src/runDoctorCommand.ts` from
  2086 to 1688 lines by moving repo/static read-only checks to focused modules.
- QG-04C RED focused `pnpm --filter @krn/cli test -- doctorDbChecks` failed
  because `./doctorDbChecks.js` did not exist.
- QG-04C GREEN focused `pnpm --filter @krn/cli test -- doctorDbChecks` passed
  with 22 files and 135 tests.
- QG-04C RED focused `pnpm --filter @krn/cli test -- doctorReadiness` failed
  because `./doctorReadiness.js` did not exist.
- QG-04C GREEN focused `pnpm --filter @krn/cli test -- doctorReadiness` passed
  with 23 files and 137 tests.
- QG-04C focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04C focused `pnpm --filter @krn/cli test` passed with 23 files and 137
  tests.
- QG-04C full `pnpm typecheck` passed.
- QG-04C full `pnpm test` passed.
- QG-04C `git diff --check` passed.
- QG-04C forbidden directory scan found no added forbidden surfaces.
- QG-04C `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-04C completed extraction reduced `packages/cli/src/runDoctorCommand.ts`
  to 205 lines by moving DB-backed checks to `doctorDbChecks.ts` and readiness
  derivation to `doctorReadiness.ts`.
- QG-04D RED focused `pnpm --filter @krn/cli test -- parseMemoryConfidence`
  failed because `./parseMemoryConfidence.js` did not exist.
- QG-04D GREEN focused `pnpm --filter @krn/cli test -- parseMemoryConfidence`
  passed with 24 files and 140 tests.
- QG-04D focused `pnpm --filter @krn/cli typecheck` passed.
- QG-04D focused `pnpm --filter @krn/cli test -- runCli` passed with 24 files
  and 140 tests.
- QG-04D focused `pnpm --filter @krn/cli test -- parseMemoryArgs` passed with
  24 files and 140 tests.
- QG-04D duplicate confidence-parser scan shows MemoryCandidate and AntiMemory
  commands import the shared `parseMemoryConfidence` helper and no longer define
  local `confidenceAliases` or `parseConfidence`.
- QG-04D full `pnpm typecheck` passed.
- QG-04D full `pnpm test` passed.
- QG-04D `git diff --check` passed.
- QG-04D forbidden directory scan found no added forbidden surfaces.
- QG-04D `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-04E RED focused `pnpm --filter @krn/schema test -- schemaPrimitives`
  failed because `./schemaPrimitives.js` did not exist.
- QG-04E GREEN focused `pnpm --filter @krn/schema test -- schemaPrimitives`
  passed with 3 files and 25 tests.
- QG-04E focused `pnpm --filter @krn/schema typecheck` passed.
- QG-04E focused `pnpm --filter @krn/schema test` passed with 3 files and 25
  tests.
- QG-04E duplicate primitive scan shows only
  `packages/schema/src/schemaPrimitives.ts` defines `MetadataSchema`,
  `RequiredTextSchema`, `OptionalTextSchema`, and `TextListSchema`.
- QG-04E full `pnpm typecheck` passed.
- QG-04E full `pnpm test` passed.
- QG-04E `git diff --check` passed.
- QG-04E forbidden directory scan found no added forbidden surfaces.
- QG-04E `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-04F RED focused `pnpm --filter @krn/core test -- reviewSignal` failed
  because `./reviewSignal.js` did not exist.
- QG-04F GREEN focused `pnpm --filter @krn/core test -- reviewSignal
  reviewFeedback` passed with 8 files and 39 tests.
- QG-04F focused `pnpm --filter @krn/cli test -- runCli parseReviewArgs`
  passed with 24 files and 140 tests.
- QG-04F focused `pnpm --filter @krn/core typecheck` and
  `pnpm --filter @krn/cli typecheck` passed.
- QG-04F duplicate review-vocabulary scan shows ReviewAssessment,
  FeedbackDelta, and `runReviewAssessCommand.ts` no longer define local
  review outcome/risk sets or local outcome/risk normalizers.
- QG-04F full `pnpm typecheck` passed.
- QG-04F full `pnpm test` passed.
- QG-04F `git diff --check` passed.
- QG-04F forbidden directory scan found no added forbidden surfaces.
- QG-04F `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-04G RED focused `pnpm --filter @krn/db test -- memoryMappers` failed
  before `packages/db/src/repositories/memoryMappers.ts` existed.
- QG-04G pre-completion full `pnpm test` failed only on the new
  `memoryMappers.test.ts` incomplete DB-row fixture, then the row fixture was
  corrected.
- QG-04G GREEN focused `pnpm --filter @krn/db test -- memoryMappers` passed
  with 24 files and 67 tests.
- QG-04G focused `pnpm --filter @krn/db test -- mappers` passed with 24 files
  and 67 tests.
- QG-04G focused `pnpm --filter @krn/db typecheck` passed.
- QG-04G full `pnpm typecheck` passed.
- QG-04G full `pnpm test` passed.
- QG-04G `git diff --check` passed.
- QG-04G forbidden directory scan found no added forbidden surfaces.
- QG-04G `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-04G split memory row types, source-lineage narrowing, memory candidate
  JSON narrowing, and memory/anti-memory mapper implementations into
  `packages/db/src/repositories/memoryMappers.ts`; `mappers.ts` is now 714
  lines and preserves legacy memory mapper imports by re-export.
- QG-04H preflight `pnpm typecheck` passed.
- QG-04H preflight `pnpm test` passed.
- QG-04H recorded QG-06 automation requirements at
  `docs/plans/memory-ideal-state/QG-04H-SMELL-SCAN-AUTOMATION-REQUIREMENTS.md`.
- QG-04H requires QG-06 audit automation for placeholder vocabulary, duplicate
  helper families, large-file thresholds, behavior-governing metadata keys,
  export/dead-code findings, stale current-state docs, allowlist expiry, and
  seeded failure proofs.
- QG-04H full `pnpm typecheck` passed.
- QG-04H full `pnpm test` passed.
- QG-04H `git diff --check` passed.
- QG-04H forbidden directory scan found no added forbidden surfaces.
- QG-04H `krn audit slice --since origin/main --fail-on warning` passed with
  verdict `pass` and 0 findings.
- QG-05 RED focused `pnpm --filter @krn/harness test --
  goldenPromptfooResult.test.ts` failed before `goldenPromptfooResult.ts`
  existed.
- QG-05 GREEN focused `pnpm --filter @krn/harness test --
  goldenPromptfooResult.test.ts` passed with 15 files and 81 tests.
- QG-05 `pnpm exec promptfoo --version` returned `0.121.17`.
- QG-05 `pnpm exec promptfoo validate config -c
  tests/fixtures/promptfoo/krn-golden-smoke.yaml` passed with
  `Configuration is valid`.
- QG-05 `pnpm eval:promptfoo:smoke` passed 2/2 official Promptfoo cases and
  wrote `.local-lab/promptfoo/krn-golden-smoke-results.jsonl`.
- QG-05 recorded official source-to-decision adoption at
  `docs/plans/memory-ideal-state/QG-05-PROMPTFOO-DECISION.md`.
- QG-05 observed non-blocking Promptfoo CLI warnings: Node
  `DecompressInterceptor` experimental warning, telemetry shutdown timeout,
  package peer/deprecation warnings, and pnpm ignored transitive build scripts.
- QG-05 full `pnpm typecheck` passed after fixing exact-optional-property
  handling in the Promptfoo JSONL result parser.
- QG-05 full `pnpm test` passed.
- QG-05 `git diff --check` passed.
- QG-05 forbidden directory scan found no added forbidden surfaces.
- QG-05 `krn audit slice --since origin/main --fail-on warning` is expectedly
  blocked by the known pre-QG-06 audit limitation: the current audit snapshot
  lacks intended files and verification commands. The same audit without
  `--fail-on warning` exits 0 with verdict `advisory`, 0 blocking findings, and
  those 2 warnings only.

QG audit facts gathered during QG-00:

- Test files are currently colocated under `packages/*/src/**/*.test.ts`.
- Current strict TS settings are strong but not yet enforced by a single
  repo-wide quality gate document and automated audit.
- `README.md` was stale relative to the MM-65 implementation state.
- Existing audits do not yet prove absence of zombie exports, dead code, stale
  public docs, broad barrel overexposure, test-helper runtime leaks, or
  placeholder adapters.

Not proven by MM-65/QG pre-audit:

- QG-06 audit automation remains next.
- MM-66 EvalCandidate promotion gate remains blocked behind QG.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
