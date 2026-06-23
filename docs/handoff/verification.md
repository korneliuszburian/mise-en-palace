# Verification

Latest verified slice: MM-47 CapabilityCompiler v1.

Passed:

- RED focused `pnpm --filter @krn/harness test -- compiler/index.test.ts`
  failed because a memory/source/audit task did not include `schema_design` or
  `db_migration`.
- GREEN focused `pnpm --filter @krn/harness test -- compiler/index.test.ts`
  passed with 9 files and 49 tests.
- Focused `pnpm --filter @krn/codex-adapter test -- renderExecutionBrief.test.ts`
  passed with 3 files and 7 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/codex-adapter typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 254 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:activation` passed with cleanup count `0` and
  reported `Observation prefix items: 1`.
- Final grep proof showed no `requiredSkills` field in
  `packages/core/src/taskContract.ts`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-47 behavior proof:

- CapabilityCompiler v1 derives additional schema/db requirements from
  memory/source/audit task text.
- Memory/source/audit task fixtures route to `schema_design`, `db_migration`,
  `source_grounding`, `evidence_capture`, and `review_capture`.
- Codex adapter skill hints include `brain-store-schema`,
  `source-to-decision`, and `evidence-review-loop`.
- TaskContract remains free of `requiredSkills`.

Not proven by MM-47:

- Actual raw evidence fetching from activation trigger metadata remains future
  scope.
- Automatic DB loading of observations into `krn plan` remains future scope.
- Golden memory behavior remains future scope.
- Explicit SkillBinding/RulePackBinding/PolicyGateBinding/ToolBoundaryBinding
  models remain MM-48.
