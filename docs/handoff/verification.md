# Verification

Latest verified slice: MM-38 source-to-decision dogfood.

Passed:

- Live `krn plan --persist` created ExecutionRun
  `bba64c9a-eb96-47b7-819a-93937e6d8c5d`.
- Live `krn source claim add --persist` created SourceClaim
  `d5ea7024-7d7a-4291-a050-4de1fbebf605` with mechanism, doesNotProve,
  falsifier, implementation-boundary support, project-decision trust, consumer,
  and run linkage.
- Live `krn source decision link --persist` created SourceDecisionEdge
  `a343ebef-2951-4ba6-b0d7-8eb3af586509` targeting the same harness run.
- DB proof showed `run_source_claims = 1` and `run_source_decision_edges = 1`
  for the dogfood execution run.
- Final `pnpm typecheck` passed across all workspace packages.
- Final `pnpm test` passed across 46 files and 245 tests.
- Final `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`
  passed with 11/11 migrations and pgvector available.
- Final DB-aware `pnpm db:smoke:source-graph` passed with cleanup count `0`.
- Final `git diff --check` passed.
- Final forbidden surface scan found only existing guard/test/fixture
  references and no new runtime dashboard/API/MCP/research/pattern/source
  crawler surface.
- Final `krn audit slice --since origin/main --repo ../.. --fail-on warning`
  passed with verdict `pass` and 0 findings.

MM-38 behavior proof:

- One KRN implementation decision is represented as a decision-grade
  SourceClaim.
- The SourceClaim includes doesNotProve and falsifier.
- A SourceDecisionEdge links the claim to a concrete harness run.

Not proven by MM-38:

- Activation v2 trust/temporal integration.
- Source graph query quality.
- Production-scale source graph health.
