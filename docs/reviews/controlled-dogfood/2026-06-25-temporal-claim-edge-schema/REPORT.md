# Temporal Claim Edge Schema And Repository Report

Status: B-01 completion report.

Date: 2026-06-25

## Executive Verdict

B-01 implemented the first Postgres-backed temporal claim edge slice without
adding a graph database, crawler, dashboard, API, MCP server, worker runtime, or
activation scoring change. The existing `source_claim_edges` table now supports
the missing temporal relations `narrows`, `invalidates`, and `expires`, and the
source repository can create and read reviewable temporal claim edges.

## Scope

Changed:

- `packages/core/src/source.ts`
- `packages/core/src/ids.ts`
- `packages/db/src/schema/sources.ts`
- `packages/db/src/repositories/DrizzleSourceRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/harness/src/repositories/sourceRepository.ts`
- focused tests
- Drizzle migration `0013_yummy_the_twelve.sql`

Not changed:

- activation scoring;
- Memory Core promotion rules;
- reflection extraction;
- dashboard/API/MCP/server surfaces;
- worker runtime;
- source crawler.

## Source To Decision

```yaml
source_id: adr-0021-temporal-claim-graph
title: ADR-0021 Temporal Claim Graph
trust_tier: project-decision
mechanism: KRN should extend existing Postgres source-claim relations with
  temporal edge semantics before considering graph databases or crawlers.
krn_implication: B-01 should add only missing temporal edge kinds and repository
  read/write support.
decision: adopt source_claim_edges as the first temporal claim graph substrate.
does_not_prove: Activation already consumes temporal edges or prevents stale
  context automatically.
consumer: B-01 schema/repository implementation.
falsifier: A dogfood or target repo task needs temporal source reasoning that
  cannot be represented with relational source-claim edges.
```

## Implementation Summary

The slice added:

- `SourceClaimEdgeKind`;
- `SourceClaimEdge`;
- `CreateSourceClaimEdgeInput`;
- repository methods:
  - `createSourceClaimEdge`;
  - `listSourceClaimEdgesForClaim`;
- mapper support for `SourceClaimEdge`;
- governance validation requiring:
  - `fromSourceClaimId`;
  - `toSourceClaimId`;
  - edge kind;
  - `metadata.consumer`;
  - `metadata.doesNotProve`;
- migration adding enum values:
  - `narrows`;
  - `invalidates`;
  - `expires`.

The implementation intentionally keeps temporal governing state relational
through the enum edge kind. Optional scope/evidence/source-decision details stay
in metadata, but the edge relation itself is not metadata-only.

## Runtime Proof

`pnpm db:smoke:source-graph` created and read back:

| Record | Value |
|---|---|
| Execution run | `59860da8-1970-4362-8a9a-f053042e77b9` |
| Source claim | `6aeaf56b-c81c-4832-b669-3fc722b984d2` |
| Temporal source claim | `a4ba0e72-063f-4aa7-915e-494b5324dcb0` |
| Source claim edge | `d894afdb-9c19-4f30-9863-ecf54365c3c7` |
| Source decision | `aa0fec56-6f7a-4fb3-80c9-bb762bc39092` |
| Source decision edge | `55f897de-4b37-4768-8eb5-3dd54164dd9c` |

The temporal edge used `kind: invalidates`. Cleanup completed with remaining
marker count `0`.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `pnpm --filter @krn/db test -- sourceGraphSmoke sources DrizzleSourceRepository mappers` | passed | Focused DB/schema/repository/mapper tests pass. | Does not prove full workspace behavior. |
| `pnpm --filter @krn/cli test -- runCli runDbSmokeCommand` | passed | CLI smoke output still renders after report shape change. | Does not prove DB runtime state. |
| `pnpm --filter @krn/db typecheck` | passed | DB package types compile with the new repository API. | Does not prove other packages compile. |
| `pnpm db:generate` | passed | Drizzle generated a focused migration from schema changes. | Does not prove migration applied to current DB. |
| `pnpm db:ready` | passed | Current shell DB is reachable with 14/14 migrations and pgvector. | Does not prove CI or remote DB readiness. |
| `pnpm --filter @krn/db db:check` | passed | Drizzle migration metadata is consistent. | Does not prove semantic product value. |
| `pnpm db:smoke:source-graph` | passed | Current shell can create/read/cleanup temporal source claim edge and source decision evidence. | Does not prove activation consumes temporal edges. |
| `pnpm typecheck` | passed | Full workspace TypeScript compile passes. | Does not prove runtime DB behavior beyond types. |
| `pnpm test` | passed | Full workspace test suite passes. | Does not prove production readiness. |
| `git diff --check` | passed | Diff has no whitespace errors. | Does not prove semantic correctness. |

## Product Implication

B-01 makes temporal knowledge representable and testable in the source graph. It
does not yet make activation or memory governance consume those edges. That is a
later B-phase consumer slice.

## Next Recommended Action

Continue to:

```txt
B-02 — Research-To-Brain Minimal Ingestion Lane
```

B-02 should use the new temporal edge capability only if the selected source
actually needs support/contradiction/narrowing/invalidation semantics. It should
not create a research-foundry product layer.
