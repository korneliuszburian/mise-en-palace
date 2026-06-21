# Verification

Latest M22 final anti-rot:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before final docs edits.
- `git log --oneline -12`: passed and showed M22 ledger, schema, IO,
  repository, smoke, CLI, doctor, and dogfood commits.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  source graph readiness as preview-only.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported:
  - migrations `verified (4/4 applied)`;
  - source graph schema `ready (8/8 tables present)`;
  - SourceRepository read path `reachable`;
  - source graph runtime proof `ready (claims 2, edges 2, rejections 2)`;
  - source graph readiness `ready`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `4/4` and pgvector available.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed with project readback matched and cleanup completed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:source-graph`: passed with source artifact, SourceClaim,
  SourceDecisionEdge, SourceRejection, outbox events `2`, and cleanup remaining
  marker count `0`.
- Forbidden surface scan for `apps`, `packages/api`, `packages/dashboard`,
  `.krn`, `packages/source-crawler`, `packages/research`, `packages/graph-db`,
  and `packages/neo4j`: passed with no output.
- No-`any` scan over KRN source packages: passed with no output.

M22 dogfood proof:

- Execution run: `4370785f-b177-45d7-89d9-08053a3e640d`.
- Source claim: `212815bc-477c-4985-8992-31825f5c5897`.
- Source decision edge: `9869be50-642b-4ddf-b60b-60360f9ea8ce`.
- Source rejection: `c35e59c2-587b-4875-b7b4-32118daf6966`.
- Evidence bundle: `dfa38982-a410-451c-a9e4-473cfaa3ad64`.
- Review assessment: `39476e2e-b5ee-46a2-9146-d2a33d09f4b9`.
- Feedback delta: `600c8b44-2df7-4096-8a53-369411b19e50`.

M22 completion audit:

- Source artifacts persisted: proven.
- Source claims persisted: proven.
- Source-to-decision edges persisted: proven.
- Source rejections persisted: proven.
- Smoke cleanup proven: proven.
- Doctor reports source graph readiness: proven.
- No forbidden surfaces: proven.

Detailed evidence lives in:

- `docs/runs/2026-06-21-source-graph-persistence/VERIFICATION.md`
- `docs/runs/2026-06-21-source-graph-persistence/DOGFOOD.md`
- `docs/runs/2026-06-21-source-graph-persistence/ANTI_ROT.md`
