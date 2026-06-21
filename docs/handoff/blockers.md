# Blockers

Hard blockers:

- None for the final harness-spine handoff.

Known unproven runtime areas:

- Live Postgres connection is not configured in this local run.
- pgvector extension and Drizzle migration table are not proven against a live
  database.
- `ExecutionRun`, evidence, feedback, memory, source, and eval candidates are
  not persisted in local no-store preview.
- Worker execution, leasing, retries, and background processing are not built.

Explicit non-blockers:

- No dashboard UI exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
