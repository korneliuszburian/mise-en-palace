# Verification

Latest verified slice: MM-35 source rejection support boundary.

Passed:

- RED focused DB source repository test failed because
  `assertSourceDecisionSourceClaimCanSupport` did not exist.
- RED focused CLI test failed because a rejected SourceClaim still reached
  `createSourceDecisionEdge`.
- GREEN focused `pnpm --filter @krn/db test -- repositories/DrizzleSourceRepository.test.ts`
  passed with 23 files and 62 tests.
- GREEN focused `pnpm --filter @krn/cli test -- runCli.test.ts` passed with
  6 files and 93 tests.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 241 tests.
- Final DB-aware `pnpm db:smoke:source-graph` passed.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final `git diff --check` passed.
- Final forbidden directory scan found no added dashboard/API/MCP/research/
  pattern surfaces.
- Final `krn audit slice --since origin/main ...` passed with 0 findings.

MM-35 behavior proof:

- Public `krn source decision link --persist` rejects SourceClaims with
  `rejected` or `deprecated` status before calling `createSourceDecisionEdge`.
- `DrizzleSourceRepository.createSourceDecisionEdge` reads the linked
  SourceClaim and rejects rejected/deprecated claims at the repository boundary.
- Existing `source claim reject` remains the explicit path for decorative or
  unsupported sources; rejected claims are not reusable as decision support.

Not proven by MM-35:

- Trust-tier and temporal source behavior.
- Source graph health audit.
