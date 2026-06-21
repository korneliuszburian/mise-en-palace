# Local Brain Store

This runbook starts the local KRN brain store with Postgres and pgvector.

Boundary:

- local development only;
- one Postgres service with pgvector;
- no Redis, Kafka, Qdrant, LanceDB, Neo4j, Elastic, dashboard, API, MCP, or
  runtime markdown memory.

## Configuration

Use the checked-in example value:

```sh
export KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn
```

Or create a local `.env` from `.env.example`. Keep `.env` uncommitted.

## Start Postgres

```sh
docker compose up -d krn-postgres
docker compose ps krn-postgres
```

The service uses `pgvector/pgvector:pg16`, database `krn`, user `krn`, and host
port `54329`.

## Validate Generated Migrations

```sh
pnpm --filter @krn/db db:check
```

This confirms generated Drizzle migration files are consistent with the current
schema. It does not prove the migrations were applied to a live DB.

## Apply and Verify Migrations

With `KRN_DATABASE_URL` exported:

```sh
pnpm db:ready
```

This command fails clearly without `KRN_DATABASE_URL`, checks DB reachability,
applies Drizzle migrations, verifies the applied migration count, checks
pgvector, and reports brain-store readiness.

## Current Proof Boundary

After Slice 03, this runbook proves local DB configuration, migration
application/verification, and pgvector availability against a running local DB.
Minimal persistence smoke proof remains pending until the Slice 05 command
exists and passes.
