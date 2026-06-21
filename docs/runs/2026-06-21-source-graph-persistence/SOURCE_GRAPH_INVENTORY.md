# Source Graph Persistence Inventory

## Scope

Slice 01 inspected the current source graph schema, migrations, repository
ports/adapters, core types, schema parse boundaries, and CLI surface.

Files inspected:

- `packages/db/src/schema/sources.ts`
- `packages/db/src/migrations/0001_superb_jetstream.sql`
- `packages/db/src/migrations/0002_shocking_post.sql`
- `packages/db/src/repositories/DrizzleSourceRepository.ts`
- `packages/db/src/repositories/mappers.ts`
- `packages/harness/src/repositories/sourceRepository.ts`
- `packages/core/src/source.ts`
- `packages/core/src/ids.ts`
- `packages/core/src/feedbackDelta.ts`
- `packages/schema/src/sourceClaim.ts`
- `packages/schema/src/index.test.ts`
- `packages/cli/src/parseArgs.ts`
- `packages/cli/src/databaseRuntime.ts`
- `packages/cli/src/runEvidenceCaptureCommand.ts`

## Existing persisted source graph

| M22 concept | Current surface | Status | Notes |
| --- | --- | --- | --- |
| `SourceArtifact` | `source_artifacts` | exists, needs tightening | Has project ref, kind, title, uri, content hash, trust tier, metadata, timestamps. Kind is `doc/file/url/paper/run/operator_input/external_doc`. |
| `SourceClaim` | `source_claims` | exists, needs tightening | Has artifact ref, optional chunk, claim, mechanism, `krnImplication`, `doesNotProve`, trust tier, support type, consumer, metadata. Missing run/harness linkage, status, falsifier, revisit condition. |
| `SourceDecisionEdge` | no exact table | missing | Current `source_decisions` is a decision record, not a typed edge to `harness_run/task_contract/harness_plan/context_assembly/evidence_bundle/review_assessment/feedback_delta/architecture_decision`. |
| claim-to-claim edges | `source_claim_edges` | exists but different purpose | Links claims to claims with `supports/contradicts/qualifies/depends_on/supersedes/duplicates`. Useful later but not the M22 decision edge. |
| `SourceRejection` | `source_rejections` | exists, needs tightening | First-class rejection exists, but lacks title, attempted claim, `rejectedBecause` enum, and run/harness linkage. |
| source retrieval/search linkage | embeddings/search docs FKs | exists | `embeddings` and `search_documents` can point to artifacts/claims, but M22 does not implement retrieval behavior. |

## Current vocabulary mismatch

Current source support type:

```txt
supports | contradicts | qualifies | background | does_not_support
```

M22 required support type:

```txt
mechanism | decision | risk | rejection | eval-design | implementation-boundary
```

Current trust tier:

```txt
high | medium | low
```

M22 suggested trust tier:

```txt
primary | official | project-decision | source-code | paper | practitioner | secondary | hypothesis
```

Decision:

- Keep old values only where existing activation code still expects them.
- Add M22-specific vocabulary where persisted source-to-decision behavior needs
  more precise semantics.
- Do not overload `supports/background` to mean implementation-boundary or
  project-decision.

## Current repository surface

Existing harness repository port:

- `createSourceArtifact(input)`
- `createSourceChunk(input)`
- `createSourceClaim(input)`
- `listClaimsForProject(projectId, limit)`
- `createSourceDecision(input)`

Existing Drizzle adapter:

- Implements the methods above.
- Emits `source.decision.created` outbox event for `createSourceDecision`.
- Does not expose `getSourceClaimById`.
- Does not expose `createSourceDecisionEdge`.
- Does not expose `listSourceDecisionEdgesForRun`.
- Does not expose `createSourceRejection`.
- Does not expose `listSourceClaimsForRun`.

## Current core types

Existing:

- `SourceClaim`
- `SourceDecisionEdge`
- `SourceTrustTier`
- `SourceSupportType`
- `SourceDecisionStatus`
- `SourceArtifactId`
- `SourceChunkId`
- `SourceClaimId`
- `SourceDecisionId`

Mismatch:

- Current `SourceDecisionEdge` models `source_decisions`:
  status/decision/rationale/falsifier/consumer.
- M22 needs a typed target edge:
  `sourceClaimId -> targetType/targetId`, plus support type, confidence, and
  notes.
- There is no `SourceRejection` core type yet.
- There is no source decision target type union yet.

## Current IO schemas

Existing:

- `parseSourceClaimInput`
- `SourceClaimInputSchema`

Missing:

- `SourceArtifactInput`
- `SourceDecisionEdgeInput`
- `SourceRejectionInput`
- M22 support type union
- M22 trust tier union
- M22 target type union
- M22 confidence union
- `rejectedBecause` union

Current SourceClaim input already requires:

- claim
- mechanism
- `krnImplication`
- `doesNotProve`
- trust tier
- support type
- consumer

It does not yet require or parse:

- title/artifact fields
- run ID
- falsifier
- revisit condition
- M22 support type vocabulary

## Current CLI surface

Existing commands:

- `krn plan`
- `krn doctor`
- `krn db readiness`
- `krn db smoke`
- `krn db smoke harness-plan`
- `krn db smoke harness-evidence`
- `krn evidence capture`

Missing commands:

- `krn source claim add`
- `krn source decision link`
- `krn source claim reject`
- `krn db smoke source-graph`

`krn evidence capture` currently writes empty `sourceDecisions` in persisted
feedback deltas. It does not emit or persist source candidates.

## Schema decision for next slice

M22 should not replace all existing source tables. The smallest honest path is:

1. Keep `source_artifacts`, `source_chunks`, `source_claims`,
   `source_claim_edges`, `source_decisions`, `source_rejections`, and
   `source_snapshots`.
2. Add or tighten the minimal fields needed for M22 semantics:
   - run/harness linkage for claims and rejections;
   - claim status;
   - falsifier and revisit condition on claims;
   - M22 support/trust/target/confidence/rejection enums;
   - a dedicated decision-edge table or equivalent table that stores typed
     `targetType`, `targetId`, `supportType`, `confidence`, and notes.
3. Preserve existing activation compatibility until the activation engine is
   explicitly updated.

If a migration is needed, Slice 02 owns it.

## Intentionally not implemented in M22

- crawler;
- external web research;
- broad source ingestion;
- source ranking quality;
- graph traversal runtime;
- dashboard/API/MCP surface;
- automatic source trust or automatic memory mutation;
- separate graph/vector/search store.

## Source To Decision

```yaml
source_id: local-source-graph-inventory
title: Current source graph schema and repository inventory
url: local repo
trust_tier: high
mechanism: Existing source tables and repository ports already persist artifacts,
  claims, claim-to-claim edges, decisions, and rejections, but current decision
  records do not model typed edges from source claims to harness artifacts.
krn_implication: M22 should extend the existing Postgres source graph instead of
  creating a crawler, separate graph store, or replacing the source schema.
decision: adopt existing source tables as the base, add only missing M22
  semantics, and keep decorative sources rejected.
does_not_prove: This inventory does not prove live source graph write/read/cleanup
  behavior or CLI command correctness.
consumer: M22 Slice 02 schema decision and Slice 04 repository work
falsifier: If Drizzle migration check or live smoke shows existing source tables
  cannot support typed decision edges without unsafe overloading, add a focused
  migration rather than reusing current `source_decisions`.
```
