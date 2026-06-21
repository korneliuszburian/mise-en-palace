# Blockers

Hard blockers:

- None through Slice 10.

Known unproven M21 behavior:

- Final handoff is not updated yet; Slice 11 owns completion status and next
  action.

Closed in Slice 09:

- Persisted harness loop dogfood is recorded in `DOGFOOD.md`.
- Anti-rot audit is recorded in `ANTI_ROT.md`.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
