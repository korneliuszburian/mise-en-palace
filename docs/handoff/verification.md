# Verification

Latest verified slice: MM-46 capability domain hardening.

Passed:

- RED focused `pnpm --filter @krn/harness test -- compiler/index.test.ts`
  failed because capability requirements had no priority or binding kinds.
- GREEN focused `pnpm --filter @krn/harness test -- compiler/index.test.ts`
  passed with 9 files and 48 tests.
- Focused `pnpm --filter @krn/core typecheck` passed.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/codex-adapter typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 253 tests.
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

MM-46 behavior proof:

- `CapabilityRequirement` carries explicit `priority`.
- `CapabilityRequirement` carries binding kinds for later skill/rule/policy/
  tool binding work.
- `createCapabilityPlan` emits bounded binding kinds without moving
  `requiredSkills` into TaskContract.

Not proven by MM-46:

- Actual raw evidence fetching from activation trigger metadata remains future
  scope.
- Automatic DB loading of observations into `krn plan` remains future scope.
- Golden memory behavior remains future scope.
- CapabilityCompiler v1 mapping behavior remains MM-47.
