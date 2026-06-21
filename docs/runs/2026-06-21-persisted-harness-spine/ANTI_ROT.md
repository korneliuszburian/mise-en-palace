# Anti-Rot Audit

## Slice 10 audit

Commands:

- `git status --short --branch`: clean `main...origin/main`.
- `git log --oneline -12`: newest commits cover M21 Slice 00 through Slice 09.
- `pnpm typecheck`: passed across workspace projects.
- `pnpm test`: passed across workspace tests.
- `pnpm --filter @krn/cli krn doctor`: passed without DB config and reported
  preview-only persistence readiness.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter
  @krn/cli krn doctor`: passed and reported harness persistence readiness
  ready.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected/applied `3/3` and pgvector available.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:smoke`:
  passed.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-plan`: passed with cleanup remaining marker count `0`.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm
  db:smoke:harness-evidence`: passed with cleanup remaining marker count `0`.
- `pnpm --filter @krn/db db:check`: passed.
- `git diff --check`: passed.

Cleanup proof:

- Direct SQL counts for `krn-smoke-%`, `krn-harness-smoke-%`, and
  `krn-evidence-smoke-%` workspaces returned `0,0,0`.

Forbidden surface checks:

- No forbidden directories found for `apps`, `packages/dashboard`,
  `packages/api`, `packages/mcp`, `packages/research`, or `.krn`.
- No direct forbidden store dependency found in root/package manifests for
  Redis, Kafka, Qdrant, LanceDB, Neo4j, Elasticsearch, or OpenSearch.
- No eval/benchmark package or top-level eval/benchmark directory found.
- Core library-safe scan found no imports from `@krn/db`, `@krn/cli`,
  `@krn/codex-adapter`, Node built-ins, process, filesystem, child process, or
  fetch.
- No `any`, `as any`, or double assertion hit found in `packages/core`,
  `packages/harness/src`, `packages/db/src`, or `packages/cli/src`.

Notes:

- The broad text scan includes expected docs/test strings such as `.krn runtime
  truth`, `PLAN.md`, and "automatic memory mutation" as explicit non-goal or
  doctor-test language. No runtime markdown memory writer or automatic memory
  application implementation was found.
- The only previously known external-store lockfile hit is Drizzle optional peer
  metadata, not a KRN dependency.
