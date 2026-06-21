# Blockers

Hard blockers:

- None through M21 Slice 10.

Closed in M20:

- Local Postgres/pgvector setup path exists: `.env.example`, `compose.yaml`,
  and `docs/runbooks/local-brain-store.md`.
- Live local Postgres reachability proved with
  `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn`.
- Drizzle migrations proved against the local DB: expected `3`, applied `3`.
- pgvector availability proved against the local DB.
- `krn doctor` reports exact DB readiness while staying read-only.
- Minimal persistence smoke path proved insert/read/cleanup through the Drizzle
  project repository path.

Out of M20 scope:

- Full evidence, feedback, memory, source, and eval candidate persistence beyond
  the minimal smoke path remains later product work.
- Worker execution, leasing, retries, and background processing remain later
  product work.

Closed in M21 so far:

- Persisted plan run creation exists behind explicit `krn plan --persist`.
- Persisted plan readback/cleanup is proven by `pnpm db:smoke:harness-plan`.
- Persisted evidence/review/feedback candidate writing exists behind explicit
  `krn evidence capture --run-id --persist`.
- Persisted evidence readback/cleanup is proven by
  `pnpm db:smoke:harness-evidence`.
- Harness persistence readiness is reported by read-only `krn doctor`.
- Persisted harness loop dogfood is recorded with live DB proof.
- Anti-rot audit is recorded with live DB and forbidden-surface proof.

Remaining M21 work:

- Final handoff is not updated yet.

Explicit non-blockers:

- No dashboard UI exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
