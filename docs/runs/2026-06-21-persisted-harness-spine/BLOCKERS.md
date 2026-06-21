# Blockers

Hard blockers:

- None through Slice 07.

Known unproven M21 behavior:

- `krn doctor` does not yet report harness persistence readiness; Slice 08 owns
  the read-only doctor checks.
- Persisted harness loop dogfood is not recorded yet; Slice 09 owns the
  operator-facing run record.
- Final anti-rot audit is not complete yet; Slice 10 owns the broad no-forbidden
  surface checks.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
