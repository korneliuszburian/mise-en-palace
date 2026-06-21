# Blockers

Hard blockers:

- None for Slice 00.

Known unproven M21 behavior:

- `krn plan --persist` is not implemented or proven for persisted harness
  identity output yet.
- `krn evidence capture --run-id <id> --persist` is not implemented or proven
  for evidence bundle, review assessment, and feedback delta persistence yet.
- Linked cleanup/readback proof for the persisted harness loop is not recorded
  yet.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
