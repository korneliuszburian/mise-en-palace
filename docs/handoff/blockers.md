# Blockers

Hard blockers:

- None for M22.

Closed in M22:

- Source artifacts persist through SourceRepository-backed CLI paths.
- SourceClaims persist with mechanism, does-not-prove, trust tier, support
  type, consumer, and optional run linkage.
- SourceDecisionEdges persist as typed links from SourceClaim to target
  harness artifacts.
- SourceRejections persist without creating SourceClaims.
- Source graph smoke proves artifact/claim/edge/rejection/outbox/readback and
  cleanup.
- `krn evidence capture` surfaces proposal-only source decision candidates.
- `krn doctor` reports source graph readiness read-only.
- M22 dogfood and anti-rot are recorded.

Residual later scope:

- Reviewed MemoryRecord promotion is not built yet.
- Anti-memory and memory invalidation workflows are not built yet.
- Retrieval/search substrate quality is not built yet.
- Durable activation over persisted memory/source records is not built yet.
- Worker execution, leasing, retries, and background processing remain later
  product work.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No source crawler or research layer exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
- No broad eval suite exists by design.
