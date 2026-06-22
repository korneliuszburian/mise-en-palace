# Blockers

Hard blockers:

- None for M22-M26.

Closed in M22-M26:

- M22 source artifacts, SourceClaims, SourceDecisionEdges, SourceRejections,
  source graph smoke, doctor readiness, and dogfood are proven.
- M23 memory candidates, reviewed promotion, memory records/versions,
  application feedback, anti-memory, memory governance smoke, doctor readiness,
  and dogfood are proven.
- M24 search documents, lexical search, pgvector readiness, retrieval
  candidates, activation decision persistence, retrieval smoke, doctor
  readiness, and dogfood are proven.
- M25 activation domain contracts, noisy fixture, persisted ContextAssembly
  inclusions/exclusions, `krn plan` activation use, activation smoke, doctor
  readiness, and dogfood are proven.
- M26 typed Codex adapter contracts, execution brief renderer, read-only
  `krn codex brief`, hook expectation projection, Codex adapter smoke, worker
  schema/repository/smoke, doctor readiness, dogfood, and anti-rot are proven.

Residual later scope:

- Production worker leasing/claim/retry execution is not built.
- Actual maintenance jobs are not executed.
- Codex is not invoked by KRN.
- MCP server is not built.
- API and dashboard are not built.
- Source crawler/research layer is not built.
- Broad eval/benchmark suite is not built.
- Plugin packaging is not built.

Explicit non-blockers:

- No dashboard UI exists by design.
- No API exists by design.
- No MCP server exists by design.
- No source crawler or research layer exists by design.
- No `.krn` runtime truth exists by design.
- No separate vector, graph, search, or queue store exists by design.
- No runtime markdown memory exists by design.
- No broad eval suite exists by design.
