# Schema Decision

Scope: M21 Slice 02.

Decision: no new migration is needed for the primary persisted harness spine.

The required M21 entities already have Postgres/Drizzle tables:

- `operator_intents`
- `task_contracts`
- `harness_plans`
- `context_assemblies`
- `execution_runs`
- `evidence_bundles`
- `review_assessments`
- `feedback_deltas`
- `run_events`
- `outbox_events`

The only missing persistence surface is the evidence contract. For M21, use a
typed `harness_plans.metadata.evidenceContract` field when implementing
`krn plan --persist`.

Do not add an `evidence_contracts` table now.

## Why

- The current schema already stores the stable run spine relationally.
- `harness_plans.metadata` already exists and can carry unstable execution
  expectations without adding lifecycle or indexing policy prematurely.
- The M21 goal allows an evidence contract or evidence expectation field.
- A separate table would be useful only if evidence contracts need independent
  lifecycle, querying, status, or versioning.

## Implementation Constraints

- Treat persisted metadata as `unknown` at the adapter boundary.
- Narrow and validate `metadata.evidenceContract` before returning any
  domain/read model.
- Do not expose raw DB JSON to core or harness domain consumers.
- Do not use metadata for stable relational fields that already exist on the
  run spine.

## Falsifier

Add a dedicated schema/migration if Slice 03 or later cannot implement
persisted plan/evidence readback without:

- querying evidence contracts independently;
- versioning evidence contracts separately from harness plans;
- attaching multiple evidence contracts to one harness plan;
- indexing expected commands or proof requirements.

## Verification

- `pnpm --filter @krn/db db:check`: passed.
- `pnpm typecheck`: passed.
- `docker compose ps krn-postgres`: passed; local Postgres was healthy.
- `KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm db:ready`:
  passed with migrations expected `3`, applied `3`, pgvector available, and
  brain-store readiness ready.

## Source To Decision

```yaml
source_id: local-m21-inventory-and-db-check
title: M21 Slice 01 inventory plus Drizzle db:check/live db:ready
trust_tier: high
mechanism: Existing Drizzle tables cover the run spine and schema checks prove generated migrations remain consistent.
krn_implication: M21 should implement repository and CLI behavior before adding schema.
decision: adopt
does_not_prove: Evidence contract metadata parsing is implemented or safe yet.
consumer: M21 Slice 03 repository/readback and Slice 04 persisted plan implementation.
falsifier: Readback implementation requires independent evidence contract lifecycle or query indexes.
```
