# Store Schema

Use this reference when implementation touches the Postgres-backed KRN brain
store: Drizzle schema, migrations, repository adapters, mappers, SQL helpers,
memory/source/run ledgers, retrieval tables, outbox events, or worker jobs.

## Procedure

1. Identify the durable object and its lifecycle.
2. Keep stable query fields relational; use JSONB only for unstable metadata.
3. Preserve lineage, invalidation, TTL, confidence, trust, and run/event links
   where relevant.
4. Put external or DB JSON behind adapters that narrow `unknown` before domain
   objects consume it.
5. Pair state changes with run events, outbox events, or worker jobs when the
   audit/work signal is part of the contract.
6. Add or update migrations and inspect generated SQL for critical columns,
   indexes, enums, and extensions.

## Output

- Schema/table changes.
- Repository and mapper impact.
- Migration evidence.
- Query/index rationale.
- Rollback or migration risk.

## Verification

Run relevant tests, `rtk proxy pnpm --filter @krn/db db:generate` when schema
changes, `rtk proxy pnpm --filter @krn/db db:check`, SQL inspection,
`rtk proxy pnpm typecheck`, and `rtk git diff --check`.

## Forbidden

- Do not make markdown or `.krn` runtime truth.
- Do not hide first-class state entirely in JSONB.
- Do not add Redis, Kafka, Neo4j, Qdrant, Elastic, or OpenSearch for the first
  spine.
- Do not trust raw DB JSON as a domain object.
