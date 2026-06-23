# Verification

Latest verified slice: MM-49 capability binding lifecycle gate.

Passed:

- RED focused `pnpm --filter @krn/core test -- capabilityPlan.test.ts` failed
  because `assessCapabilityBindingCandidatePromotion` did not exist.
- GREEN focused `pnpm --filter @krn/core test -- capabilityPlan.test.ts`
  passed with 4 files and 22 tests.
- Focused `pnpm --filter @krn/core typecheck` passed.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/codex-adapter typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 47 files and 258 tests.
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

MM-49 behavior proof:

- CapabilityBindingCandidate and CapabilityBindingReview exist as pure core
  contracts.
- Proposed or unreviewed binding candidates are not promotable.
- Approved review requires reviewer, approved decision, and evidence reference.
- No lifecycle storage, CLI, execution authority, or automatic skill/rule
  growth was added.

Not proven by MM-49:

- Actual raw evidence fetching from activation trigger metadata remains future
  scope.
- Automatic DB loading of observations into `krn plan` remains future scope.
- Golden memory behavior remains future scope.
- TypeScript/review-risk rule binding selection remains MM-50.
