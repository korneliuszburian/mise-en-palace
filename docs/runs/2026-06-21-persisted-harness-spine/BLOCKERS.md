# Blockers

Hard blockers:

- None through Slice 04.

Known unproven M21 behavior:

- `krn evidence capture --run-id <id> --persist` is not implemented or proven
  for evidence bundle, review assessment, and feedback delta persistence yet.
- Full persisted evidence loop cleanup is not recorded yet; Slice 05 proves
  persisted plan readback and cleanup only.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
