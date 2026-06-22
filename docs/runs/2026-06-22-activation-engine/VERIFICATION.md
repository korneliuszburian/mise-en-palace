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
