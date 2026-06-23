# Verification

Latest verified slice: MM-50 TypeScript/review-risk capability routing.

Passed:

- RED focused `pnpm --filter @krn/harness test -- compiler/index.test.ts`
  failed because TypeScript boundary tasks only had generic `type_safety`
  evidence.
- GREEN focused `pnpm --filter @krn/harness test -- compiler/index.test.ts`
  passed with 9 files and 50 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/codex-adapter typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 47 files and 259 tests.
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

MM-50 behavior proof:

- TypeScript boundary task text strengthens `type_safety` evidence with
  `unknown-first boundary check` and `no type weakening`.
- Review-risk/diff-risk task text strengthens `evidence_capture` and
  `review_capture` with changed-file, diff-risk, and review-risk evidence.
- TaskContract still does not own `requiredSkills`.
- No lifecycle storage, CLI, execution authority, or automatic skill/rule
  growth was added.

Not proven by MM-50:

- Actual raw evidence fetching from activation trigger metadata remains future
  scope.
- Automatic DB loading of observations into `krn plan` remains future scope.
- Golden memory behavior remains future scope.
- Capability routing dogfood remains MM-51.
