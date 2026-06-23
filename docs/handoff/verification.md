# Verification

Latest verified slice: MM-65 optional Promptfoo-compatible export.

Passed:

- Preflight `git status --short --branch` showed branch `main` aligned with
  `origin/main` plus only the two raw research materials untracked.
- Preflight `git log --oneline -5` showed latest commit
  `61ea185 test(harness): add observation reflection golden cases`.
- RED focused `pnpm --filter @krn/harness test --
  goldenPromptfooExport.test.ts` failed because
  `goldenPromptfooExport.js` did not exist.
- GREEN focused `pnpm --filter @krn/harness test --
  goldenPromptfooExport.test.ts` passed with 14 files and 74 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 56 files and 303 tests.
- Final `git diff --check` passed.
- Final forbidden surface/dependency scan found no forbidden packages,
  `.krn` runtime truth directory, forbidden dependencies, server/listener
  surface, pattern CLI surface, or MCP runtime surface. Expected allow-list
  hits remained limited to fixtures/smokes, MemoryReviewGate, and low-level
  repository internals.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:ready` passed with 11/11 migrations and pgvector available.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  with explicit intended files and verification flags passed with verdict
  `pass` and 0 findings.

MM-65 behavior proof:

- `exportGoldenTasksToPromptfooSnapshot` emits one deterministic snapshot-only
  Promptfoo-compatible test per GoldenCase.
- The export carries behavior proof status from the golden runner and marks
  missing proof as `missing`, not passing.
- The export declares `promptfooDependency: "not_required"` and
  `doesNotExecuteModel: true`.
- The export is pure harness code and does not read files, write DB rows, call
  CLI, execute a model, or create a broad benchmark lane.

Not proven by MM-65:

- MM-66 EvalCandidate promotion gate remains next.
- DB-backed GoldenTask storage remains deferred until a runner/promotion
  lifecycle proves it is necessary.
- The two raw research materials under `docs/materials/` remain untracked dirty
  context and are intentionally not committed.
