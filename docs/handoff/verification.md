# Verification

Latest verified slice: MM-36 trust and temporal source behavior.

Passed:

- RED focused DB source repository test failed because
  `rankSourceTrustTier` and `assessSourceClaimOverride` did not exist.
- GREEN focused `pnpm --filter @krn/db test -- repositories/DrizzleSourceRepository.test.ts`
  passed with 23 files and 65 tests.
- Focused `pnpm --filter @krn/db typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 244 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:source-graph` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-36 behavior proof:

- `rankSourceTrustTier` ranks official/primary/project-decision/source-code
  above high/paper, medium/practitioner/secondary, low, and hypothesis.
- `assessSourceClaimOverride` blocks a newer weak claim from overriding valid
  stronger consensus without an explicit reason.
- `assessSourceClaimOverride` allows a weaker challenge once stronger
  consensus is stale by `revisitWhen`.

Not proven by MM-36:

- Source graph health audit.
- Activation v2 trust/temporal integration.
