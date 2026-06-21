# Decisions

- KRN is a Codex operating layer, not an alternative executor or
  dashboard-first app.
- PostgreSQL with pgvector remains the canonical brain store for the first
  spine.
- `KRN_DATABASE_URL` is the canonical local DB runtime variable.
- Drizzle owns schema and migrations; Zod owns unknown-input parsing.
- Markdown remains docs/export/audit/handoff material, not runtime Memory Core.
- `packages/core` stays pure and Codex-agnostic.
- CLI remains an adapter over harness services, not the architecture.
- DB writes require explicit `--persist` or explicit smoke commands.
- `krn doctor` stays read-only and reports readiness from inspection only.
- M22 uses existing Postgres/Drizzle source graph tables plus the minimal typed
  M22 additions; no separate graph DB, crawler, API, dashboard, MCP server, or
  runtime markdown memory was added.
- M22 `source_decision_edges` are the typed source-claim-to-target edge model.
  Legacy `source_decisions` remain decision/adoption records and feedback
  candidates.
- Persisted SourceClaims require mechanism, does-not-prove, trust tier, support
  type, and consumer. Decorative or unsupported material belongs in
  SourceRejection, not a low-trust SourceClaim.
- `krn source decision link` verifies SourceClaim existence before creating an
  edge, but the edge does not prove the whole target.
- `krn evidence capture` may surface source decision candidates, but it does
  not create SourceClaims and does not mutate memory.
- Source graph dogfood rows are retained as local proof rows; smoke rows remain
  marker-scoped and cleaned up.
- M22 is complete. Next product capability starts with MemoryCandidate to
  reviewed MemoryRecord promotion.
