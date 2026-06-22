# Decisions

- KRN remains a Codex operating layer, not an alternative executor.
- PostgreSQL with pgvector remains the first brain-store spine.
- Drizzle owns schema/migrations; Zod owns unknown-input parsing boundaries.
- Markdown remains docs/export/audit/handoff material, not runtime Memory Core.
- `packages/core` stays pure, library-safe, and Codex-agnostic.
- CLI remains an adapter over harness/DB services, not the product brain.
- DB writes require explicit `--persist` or explicit smoke commands.
- `krn doctor` stays read-only and does not run smokes or mutate state.
- Source graph decisions stay explicit: source -> mechanism -> KRN implication
  -> decision/rejection -> falsifier.
- Memory governance promotes through reviewed candidates and source-linked
  records; automatic memory mutation remains forbidden.
- Retrieval/search uses Postgres lexical search, pgvector readiness, relational
  edges, and persisted activation records; no separate vector/search/graph DB
  is introduced.
- Activation selects bounded context and can abstain; broad context dumps and
  core `requiredSkills` fields remain rejected.
- Codex adapter output is an adapter boundary: briefs, hook expectations, skill
  hints, Goal/ExecPlan refs, and MCP refs are rendered as inspectable text and
  typed artifacts; Codex is not invoked.
- Worker jobs are a skeleton over Postgres `worker_jobs` and `outbox_events`;
  no Redis/Kafka queue, daemon, loop, or job execution is added in M22-M26.
- Broad scan hits in doctor guard strings or negative fixtures are not product
  runtime proof; bounded entrypoint/manifest/package checks are authoritative.
- Next product work should start with a bounded worker lease/claim contract,
  not dashboard/API/MCP expansion.
