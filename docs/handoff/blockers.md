# Blockers

Hard blockers:

- None for M20 local brain-store runtime proof.

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

Explicit non-blockers:

- No dashboard UI exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
