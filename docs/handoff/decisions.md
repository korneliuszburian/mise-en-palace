# Decisions

- KRN is a Codex operating layer, not an alternative executor or dashboard-first
  app.
- PostgreSQL with pgvector is the first canonical brain store. No Redis, Kafka,
  Neo4j, Qdrant, Elastic, or OpenSearch in the first spine.
- Drizzle owns database schema and migrations. Zod owns unknown-input parsing.
- Markdown is allowed for docs, exports, seeds, audits, and handoffs, but not
  runtime Memory Core.
- `packages/core` stays pure and Codex-agnostic.
- Codex-specific output lives in `packages/codex-adapter`.
- CLI is an adapter over harness services, not the architecture.
- `krn plan` may run as no-store preview when `KRN_DATABASE_URL` is absent.
- `krn evidence capture` prints evidence without automatic memory mutation when
  no persisted execution run is configured.
- Worker scope is typed enqueue/describe skeleton only; no daemon behavior yet.
- Repo-local skills now target operational harness disciplines instead of broad
  planning meta-work.
