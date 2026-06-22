# Verification

Latest final anti-rot:

- `git status --short --branch`: passed with clean `## main...origin/main`
  before M26.11 audit docs edits.
- `git log --oneline -20`: passed with latest audit base
  `c5a7490 docs(run): record Codex adapter and worker dogfood pass`.
- `docker compose ps krn-postgres`: passed with local pgvector Postgres
  healthy on host port `54329`.
- `pnpm typecheck`: passed across 7 workspace packages.
- `pnpm test`: passed across 26 test files and 120 tests.
- no-env `pnpm --filter @krn/cli krn doctor`: passed with DB-dependent
  readiness as preview-only and forbidden surfaces absent.
- live `pnpm db:ready`: passed with 7/7 migrations and pgvector available.
- `pnpm --filter @krn/db db:check`: passed.
- live DB smokes passed: `db:smoke`, `db:smoke:harness-plan`,
  `db:smoke:harness-evidence`, `db:smoke:source-graph`,
  `db:smoke:memory-governance`, `db:smoke:retrieval-substrate`,
  `db:smoke:activation`, `db:smoke:codex-adapter`, and
  `db:smoke:worker-jobs`.
- live DB `krn doctor`: passed with every readiness section ready and
  forbidden surfaces absent.
- forbidden directory and dependency scans passed.
- `git diff --check`: passed before M26.11 audit docs edits and again before
  M26.11 commit.

DB proof status:

- configured: proven with `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.
- migrations: proven, 7/7 applied.
- pgvector: proven.

Persisted harness status:

- plan persistence: proven.
- evidence persistence: proven.

Source graph status:

- source artifacts persisted: proven.
- source claims persisted: proven.
- source-to-decision edges persisted: proven.
- source rejections persisted: proven.

Memory governance status:

- candidates persisted: proven.
- reviewed promotion: proven.
- memory records/versions persisted: proven.
- application feedback persisted: proven.
- anti-memory persisted: proven.

Retrieval/search status:

- search docs persisted: proven.
- lexical search: proven.
- pgvector readiness represented: proven.
- retrieval candidates persisted: proven.
- activation decisions persisted: proven.

Activation status:

- noisy fixture: proven.
- ContextAssembly inclusions persisted: proven.
- ContextAssembly exclusions persisted: proven.
- `krn plan` uses activation: proven.

Codex adapter / worker status:

- execution brief rendered: proven.
- hook expectations projected: proven.
- worker jobs enqueued: proven.
- worker job transitions: proven.

Not proven by M22-M26:

- Codex execution.
- MCP availability.
- dashboard/API readiness.
- runtime markdown memory.
- separate vector/graph/search/queue stores.
- source crawler/research layer.
- production worker throughput.
- actual maintenance job execution.
