---
name: brain-store-schema
description: Use when designing or changing KRN Drizzle/Postgres schema, migrations, repository adapters, memory/source/run ledgers, retrieval tables, outbox events, or worker job persistence.
---

# Brain Store Schema

Use this skill when a change touches the Postgres-backed KRN brain store.

## Trigger

- New or changed Drizzle schema, migration, repository adapter, mapper, or SQL
  helper.
- New memory, source graph, retrieval, evidence, feedback, outbox, or worker-job
  persistence behavior.

## Workflow

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

## Forbidden

- Do not make markdown or `.krn` runtime truth.
- Do not hide first-class state entirely in JSONB.
- Do not add Redis, Kafka, Neo4j, Qdrant, Elastic, or OpenSearch for the first
  spine.
- Do not trust raw DB JSON as a domain object.

## Verification

Run `pnpm typecheck`, relevant tests, `pnpm --filter @krn/db db:generate` when
schema changes, `pnpm --filter @krn/db db:check`, SQL inspection, and
`git diff --check`.
