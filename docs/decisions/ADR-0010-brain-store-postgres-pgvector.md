# ADR-0010: PostgreSQL Pgvector Brain Store

Status: accepted.

## Context

KRN needs one typed state plane for harness runs, Memory Core, source graph,
retrieval, events, outbox work, and later read models. ADR-0002 already rejects
runtime markdown memory. `GOAL.md` and `PLAN.md` now require a Postgres-backed
final harness spine rather than contracts detached from storage.

## Source To Decision

```yaml
source_id: goal-final-harness-spine
title: GOAL.md compact activation contract and PLAN.md living ExecPlan
trust_tier: high
mechanism: The active goal names PostgreSQL plus pgvector, Drizzle, Zod, and the
  forbidden separate stores as completion constraints.
krn_implication: The first implementation spine must start from the target data
  plane instead of adding in-memory contracts and choosing storage later.
decision: adopt PostgreSQL plus pgvector as the canonical KRN brain store.
does_not_prove: The exact table design, migration strategy, or production
  operating posture is already correct.
consumer: ADR, package boundaries, DB schema milestone, doctor checks.
falsifier: Drizzle migrations cannot express the harness, memory, source,
  retrieval, event, outbox, and worker-job contracts without hidden side stores.
```

```yaml
source_id: adr-0002-memory-is-store-backed
title: ADR-0002 Memory Is Store-Backed, Files Are Export
trust_tier: high
mechanism: Runtime memory requires lineage, confidence, validity, invalidation,
  owner, application guidance, and retrieval abstention.
krn_implication: Memory must be queryable, invalidatable, and auditable as typed
  state, not reconstructed from markdown files.
decision: model Memory Core as PostgreSQL tables, with vectors and full-text
  indexes as retrieval aids inside the same canonical store.
does_not_prove: PostgreSQL is the best long-term store for every future KRN
  deployment size.
consumer: DB schema, repository interfaces, activation engine, doctor checks.
falsifier: Memory records cannot preserve lineage, validity, feedback counters,
  and activation traces in a reviewable relational model.
```

```yaml
source_id: krn-kernel-runtime-truth
title: docs/KRN_KERNEL.md Runtime Truth and Decision Rule
trust_tier: high
mechanism: Active context must be selected, task-specific, source-grounded, and
  verified through source -> mechanism -> KRN implication -> decision/rejection -> consumer -> falsifier.
krn_implication: Source graph edges, claim support, context inclusions, and
  context exclusions must be first-class typed records.
decision: represent graph and retrieval evidence in PostgreSQL tables first;
  defer separate graph, search, vector, and queue systems.
does_not_prove: A dashboard, MCP server, or broad benchmark lane should exist.
consumer: Source graph schema, retrieval schema, package boundaries.
falsifier: The activation engine cannot record both selected and rejected
  context with reasons, source lineage, and stable identifiers.
```

## Decision

PostgreSQL plus pgvector is the canonical KRN brain store for the first
implementation spine.

PostgreSQL stores:

- harness state;
- project and kernel state;
- Memory Core records and versions;
- source artifacts, chunks, claims, decisions, and rejections;
- relational graph edges;
- PostgreSQL full-text search documents;
- pgvector embeddings;
- retrieval runs, candidates, activations, inclusions, and exclusions;
- run events;
- outbox events;
- worker jobs;
- later read-model inputs.

Drizzle owns the schema and migrations. Zod owns IO/API/CLI validation before
data reaches domain or repository code.

Graph starts as relational edge tables. Vector search starts as pgvector.
Lexical search starts as PostgreSQL full-text search. Async work starts as
PostgreSQL outbox and worker-job tables.

Docker Postgres with pgvector is acceptable for local development. PGlite may
be used only for lightweight local or test adapters if it does not redefine the
canonical PostgreSQL design.

Qdrant, Neo4j, LanceDB, Elastic, OpenSearch, Redis, and Kafka are rejected for
the first implementation spine. They may be reconsidered only after the typed
Postgres-backed spine proves a concrete bottleneck or missing capability.

Markdown and `.krn/**` are not Memory Core and are not runtime product truth.
They may be docs, source, audit, export, seed, or backup artifacts only.

## Consequences

- `packages/db` owns Drizzle schema, migrations, SQL helpers, database
  connection adapters, and Postgres-backed repository implementations.
- `krn doctor` must report brain-store readiness honestly instead of implying a
  store exists before it does.
- Retrieval and activation schemas must model both inclusions and exclusions.
- Memory and source updates remain candidates until explicit review accepts
  them.
- No separate vector, graph, search, or queue infrastructure is added before the
  first working harness vertical slice.
