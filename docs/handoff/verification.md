# Verification

Latest verified slice: MM-34 SourceClaim and SourceDecisionEdge hardening.

Passed:

- RED focused DB source repository test failed because
  `assertSourceClaimGovernance` / `assertSourceDecisionGovernance` helpers did
  not exist.
- RED focused schema test failed because SourceClaim `falsifier` was still
  optional.
- GREEN focused `pnpm --filter @krn/db test -- repositories/DrizzleSourceRepository.test.ts`
  passed with 23 files and 61 tests.
- GREEN focused `pnpm --filter @krn/schema test -- index.test.ts` passed with
  1 file and 19 tests.
- GREEN focused `pnpm --filter @krn/cli test -- runCli.test.ts` passed with
  6 files and 92 tests.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 239 tests.
- Final DB-aware `pnpm db:smoke:source-graph` passed.
- Final DB-aware `pnpm db:smoke:activation` passed.
- Final DB-aware `pnpm db:smoke:codex-adapter` passed.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final `git diff --check` passed.
- Final forbidden directory scan found no added dashboard/API/MCP/research/
  pattern surfaces.
- Final `krn audit slice --since origin/main ...` passed with 0 findings.

MM-34 behavior proof:

- `parseSourceClaimInput` now rejects SourceClaim input without `falsifier`.
- `DrizzleSourceRepository.createSourceClaim` rejects missing/blank claim,
  mechanism, krnImplication, doesNotProve, trustTier, consumer, falsifier, and
  decorative support types.
- `DrizzleSourceRepository.createSourceDecisionEdge` rejects blank source,
  target, confidence, notes, and decorative support types.
- `DrizzleSourceRepository.createSourceDecision` rejects `adopt` and `reject`
  decisions without a linked SourceClaim.
- Source, activation, and codex-adapter smokes remain green after legacy
  negative examples were converted to decision-grade rejection/risk source
  records.

Not proven by MM-34:

- Full source rejection workflow quality.
- Trust-tier and temporal source behavior.
- Source graph health audit.
