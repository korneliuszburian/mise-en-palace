# Store Boundary

Load this branch for the Postgres-backed Memory Core store: Drizzle schema,
migrations, repository adapters, mappers, SQL helpers, run ledgers, retrieval
tables, outbox events, or worker jobs.

## Invariants

1. Name the durable object, authority owner, and lifecycle transition.
2. Keep stable query fields relational; reserve JSONB for unstable metadata.
3. Preserve lineage, invalidation, TTL, confidence, trust, and run/event links
   when they affect authority or readback.
4. Narrow external or database JSON from `unknown` before constructing domain
   values.
5. Pair state changes with run/outbox evidence only when audit or work signaling
   is part of the contract.
6. Add migrations for schema changes and inspect generated SQL for critical
   columns, indexes, enums, and extensions.

## Proof

Use the relevant repository/DB test and migration smoke. For schema changes,
run the current DB generate/check commands from the repository gate map,
inspect SQL, and record rollback or migration risk.

Do not hide first-class state entirely in JSONB, trust raw DB JSON, introduce a
parallel datastore without a current consumer, or make Markdown runtime truth.
