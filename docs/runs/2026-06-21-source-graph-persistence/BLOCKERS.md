# Blockers

Hard blockers:

- None through Slice 07.

Known unproven M22 behavior:

- CLI command for `krn source claim reject` is not implemented yet.
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

Closed in Slice 02:

- Minimal source graph schema now exists for M22 claim status/run linkage,
  typed decision edges, M22 source vocabulary, and first-class rejection
  fields.

Closed in Slice 04:

- Repository methods now exist for source claim lookup/run listing, decision
  edge creation/run listing, and source rejection creation.

Closed in Slice 05:

- `pnpm db:smoke:source-graph` exists and passed live with SourceArtifact,
  SourceClaim, SourceDecisionEdge, SourceRejection, outbox events, readback, and
  cleanup remaining marker count `0`.

Closed in Slice 06:

- `krn source claim add` exists, previews without DB writes, requires
  `KRN_DATABASE_URL` for `--persist`, writes SourceArtifact and SourceClaim
  through SourceRepository, and passed live persistence proof.

Closed in Slice 07:

- `krn source decision link` exists, previews without DB writes, requires
  `KRN_DATABASE_URL` for `--persist`, verifies SourceClaim existence, writes a
  SourceDecisionEdge through SourceRepository, and passed live persistence
  proof.
