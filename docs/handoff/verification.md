# Verification

Latest verified slice: MM-51 capability routing dogfood.

Passed:

- Live `krn plan --persist` created ExecutionRun
  `1c6dd716-3903-4d9f-b765-57c20019beff`.
- Initial read-only `krn codex brief --run-id` exposed generic capability
  hints because the persisted TaskContract was not passed to
  `createCapabilityPlan`.
- RED focused `pnpm --filter @krn/cli test -- runCli.test.ts` failed because
  readback did not include `unknown-first boundary check`.
- GREEN focused `pnpm --filter @krn/cli test -- runCli.test.ts` passed with
  6 files and 93 tests.
- Final read-only `krn codex brief --run-id
  1c6dd716-3903-4d9f-b765-57c20019beff` preserved task-text capability
  routing.
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

MM-51 behavior proof:

- Persisted memory implementation task selected small capability hints for
  source-to-decision, typescript-type-safety, test-driven-development,
  evidence-review-loop, and brain-store-schema.
- Read-only Codex brief readback preserves task-text TypeScript/review-risk/
  schema routing from the persisted TaskContract.
- Codex invocation remained `none`.
- Memory mutation remained `none`.
- No lifecycle storage, new CLI surface, execution authority, or automatic
  skill/rule growth was added.

Not proven by MM-51:

- Actual raw evidence fetching from activation trigger metadata remains future
  scope.
- Automatic DB loading of observations into `krn plan` remains future scope.
- Golden memory behavior remains future scope.
- EvidenceBundle hardening remains MM-52.
