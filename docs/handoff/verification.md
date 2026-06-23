# Verification

Latest verified slice: MM-37 source graph health audit.

Passed:

- RED focused harness audit test failed because seeded decorative support,
  stale accepted claim, unlinked accepted claim, and rejected-claim decision
  support produced no source audit findings.
- GREEN focused `pnpm --filter @krn/harness test -- auditChecks.test.ts`
  passed with 9 files and 40 tests.
- Focused `pnpm --filter @krn/harness typecheck` passed.
- Focused `pnpm --filter @krn/db typecheck` passed.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 245 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:source-graph` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references, including the MM-37 negative source-crawler audit fixture, and no
  new runtime dashboard/API/MCP/research/pattern/source crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-37 behavior proof:

- `runSourceGroundingAudit` flags SourceClaim records with decorative support
  types as blocking findings.
- Accepted SourceClaims past `revisitWhen` are warning findings.
- Accepted SourceClaims without SourceDecision links are warning findings.
- SourceDecisions referencing rejected/deprecated claims are blocking findings.
- DB-backed audit semantic snapshots now include SourceClaim `trustTier`,
  `supportType`, and `revisitWhen`.

Not proven by MM-37:

- Activation v2 trust/temporal integration.
- Source-to-decision dogfood on a new memory implementation decision.
