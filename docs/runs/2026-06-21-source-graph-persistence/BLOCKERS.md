# Blockers

Hard blockers:

- None through Slice 00.

Known unproven M22 behavior:

- SourceArtifact, SourceClaim, SourceDecisionEdge, and SourceRejection
  persistence are not proven yet.
- No source graph smoke command exists yet.
- CLI commands for `krn source claim add`, `krn source decision link`, and
  `krn source claim reject` are not implemented yet.
- `krn doctor` does not yet report source graph readiness.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No crawler or research layer exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.

Closed in Slice 01:

- Current source graph schema/repository/type/CLI surface was inventoried in
  `SOURCE_GRAPH_INVENTORY.md`.
