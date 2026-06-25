# ADR-0021: Temporal Claim Graph

Status: accepted.

Date: 2026-06-25

## Context

KRN already has a Postgres-backed source graph:

- `source_claims`;
- `source_claim_edges`;
- `source_decisions`;
- `source_decision_edges`;
- `source_rejections`;
- source claim lifecycle status;
- `revisitWhen`;
- `doesNotProve`;
- falsifiers.

The current edge model already supports:

```txt
supports
contradicts
qualifies
depends_on
supersedes
duplicates
```

This is enough to prove the graph shape, but not enough to model changing
knowledge as product behavior. KRN still needs explicit semantics for claims
that narrow another claim, invalidate another claim, expire, or are only current
for a bounded time window.

B-00 is an ADR/design task only. It must not create migrations, repository
methods, workers, source crawlers, dashboard, API, MCP, or a graph database.

## Source To Decision

```yaml
source_id: adr-0010-postgres-brain-store
title: ADR-0010 PostgreSQL Pgvector Brain Store
trust_tier: high
mechanism: KRN's first source graph, retrieval, memory, and run state must live
  in the canonical Postgres/Drizzle brain store before separate graph/search
  infrastructure is considered.
krn_implication: Temporal claim graph starts as relational source-claim edge
  semantics in Postgres, not Neo4j, Qdrant, crawler, or dashboard work.
decision: adopt Postgres-backed temporal claim edges as the first temporal
  truth model.
does_not_prove: Current source_claim_edges already express every temporal
  relation needed by product use.
consumer: B-01 schema/repository implementation.
falsifier: A target-repo or dogfood task needs temporal claim reasoning that
  cannot be represented or queried with relational edges and typed metadata.
```

```yaml
source_id: adr-0011-observational-memory
title: ADR-0011 Observational Memory As Staging Layer
trust_tier: high
mechanism: Observations and reflections are staging records that can propose
  memory/source/eval candidates but must retain raw evidence paths and must not
  mutate Memory Core directly.
krn_implication: Temporal claim changes must enter as reviewable source claims,
  source decisions, anti-memory candidates, or memory candidates, not as
  automatic truth mutation from reflection.
decision: temporal graph updates are governed proposal/review operations.
does_not_prove: Reflection extraction quality is good enough to create temporal
  edges automatically.
consumer: reflection candidate review, source decision review, B-01 repository.
falsifier: A reflection path writes accepted temporal truth without a reviewed
  source decision or candidate gate.
```

```yaml
source_id: current-source-schema
title: packages/db/src/schema/sources.ts and packages/core/src/source.ts
trust_tier: source-code
mechanism: SourceClaim already has status, trust tier, support type,
  does-not-prove, falsifier, revisitWhen, and sourceClaimEdges with support,
  contradiction, qualification, dependency, supersession, and duplicate kinds.
krn_implication: B-01 should extend the existing edge model instead of adding a
  new graph subsystem or rebuilding SourceGraph from scratch.
decision: add only missing temporal relations and read-model semantics.
does_not_prove: Existing repository APIs expose the correct temporal read model.
consumer: B-01 schema/repository tests.
falsifier: B-01 cannot express invalidation/expiration/narrowing without a
  separate table or incompatible migration.
```

```yaml
source_id: a-01-a-02-dogfood
title: DB-backed owner-file recall dogfood and repair reports
trust_tier: project-decision
mechanism: Recent dogfoods showed that KRN should fix bounded read-model gaps
  from concrete evidence, not by adding broad subsystems.
krn_implication: Temporal graph implementation must start with one minimal
  schema/repository slice and one dogfood use, not a research-foundry or
  crawler lane.
decision: B-01 must include one dogfood source decision that uses the temporal
  relation.
does_not_prove: Temporal graph quality is solved by the ADR.
consumer: B-01 completion criteria.
falsifier: B-01 adds schema but no run or source decision consumes the edge.
```

## Decision

KRN will model temporal knowledge as reviewed source-claim relations inside the
existing Postgres source graph.

Temporal relations are edges between source claims. A temporal edge never makes
the newer claim globally true by itself. It only changes how activation,
review, memory, and source decisions should interpret related claims.

The accepted temporal relation vocabulary is:

```txt
supports:
  from claim increases confidence in to claim.

contradicts:
  from claim conflicts with to claim and requires review or exclusion.

qualifies:
  from claim limits, conditions, or weakens to claim.

depends_on:
  from claim requires to claim before it can be safely used.

supersedes:
  from claim replaces to claim for a named consumer/scope.

duplicates:
  from claim restates to claim and should not increase confidence alone.

narrows:
  from claim is a stricter scoped version of to claim.

invalidates:
  from claim makes to claim unsafe/stale for a named consumer/scope.

expires:
  from claim or edge states that to claim is no longer current after a temporal
  boundary.
```

Existing edge kinds remain valid. B-01 should add only the missing edge kinds:

```txt
narrows
invalidates
expires
```

If B-01 proves those cannot be added safely to the existing enum, it may instead
introduce a narrow temporal edge table. That fallback requires a migration note
explaining why the existing `source_claim_edges` table cannot carry the model.

## Temporal Edge Requirements

Every temporal edge must be reviewable:

- `fromSourceClaimId`;
- `toSourceClaimId`;
- relation kind;
- confidence;
- consumer/scope;
- evidence reference or source decision reference where available;
- `doesNotProve`;
- optional valid-from / valid-until / invalidated-at semantics if the chosen
  persistence shape supports them directly;
- metadata only for non-governing detail.

No behavior-governing temporal fact may live only in undocumented metadata.

## Read Model Requirements

B-01 must expose a minimal read model that can answer:

```txt
For claim X:
  what supports it?
  what contradicts it?
  what supersedes it?
  what narrows it?
  what invalidates it?
  what expires it?
```

The read model must not decide product truth by recency alone. It should return
relations and reasons so activation/review can decide whether to include,
exclude, or require raw recall.

## Rejected Alternatives

### Separate Graph Database

Rejected for the first temporal graph slice.

Reason: ADR-0010 already chose Postgres as the first brain store. A graph DB may
be reconsidered only after relational edges fail a concrete dogfood or target
repo requirement.

### Source Crawler

Rejected for B-00/B-01.

Reason: B-00 is about relation semantics, not source acquisition. Source
crawling would expand input volume before KRN proves temporal decision quality.

### Latest Claim Wins

Rejected.

Reason: recency is not authority. A newer claim may be wrong, lower-trust,
decorative, or only applicable to a narrower scope.

### Reflection Auto-Writes Temporal Truth

Rejected.

Reason: ADR-0011 makes reflection candidate-only. Temporal truth changes must
go through source decision/review paths.

### Metadata-Only Temporal Semantics

Rejected.

Reason: behavior-governing semantics hidden inside metadata recreate false
authority and make activation/review hard to test.

## Package And Runtime Boundaries

B-00 changes no package source.

B-01 may touch:

- `packages/core/src/source.ts`;
- `packages/schema/src/sourceClaim.ts` or related source schemas;
- `packages/db/src/schema/sources.ts`;
- DB migration metadata;
- source repository ports and Drizzle implementation;
- focused tests.

B-01 must not touch:

- dashboard/API/MCP/server surfaces;
- worker runtime;
- source crawler;
- activation scoring, except for a later explicitly named consumer slice;
- Memory Core promotion rules.

## Verification For B-01

B-01 must prove:

- missing temporal edge kinds or equivalent temporal edge table exist;
- repository can create/read at least one temporal relation;
- one dogfood source decision uses the temporal relation;
- `pnpm --filter @krn/db db:check` passes;
- relevant schema/repository tests pass;
- `pnpm typecheck`;
- `pnpm test`;
- `git diff --check`.

If DB is available, B-01 should include a current-shell DB smoke or dogfood
readback. Do not claim DB runtime truth without that command.

## Rollback

If B-01 adds only enum values, rollback is the focused migration/repository
commit. If B-01 adds a separate table, rollback must also remove repository
ports and any dogfood seed data created solely for the slice.

## Falsifiers

This ADR is violated if:

- B-01 adds Neo4j, Qdrant, crawler, dashboard, API, MCP, or worker runtime;
- temporal truth is decided by recency alone;
- temporal relation semantics live only in undocumented metadata;
- reflection writes accepted temporal truth directly;
- a temporal edge lacks a consumer/scope and does-not-prove boundary;
- schema exists but no dogfood source decision consumes the relation.

