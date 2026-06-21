# Blockers

Hard blockers:

- None through Slice 04.

Known unproven M21 behavior:

- `krn evidence capture --run-id <id> --persist` is not implemented or proven
  for evidence bundle, review assessment, and feedback delta persistence yet.
- Live persisted run aggregate readback through the repository is not proven yet;
  Slice 04 proved SQL linkage, execution run creation, and evidence contract
  metadata persistence.
- Linked cleanup/readback proof for the persisted harness loop is not recorded
  yet.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
