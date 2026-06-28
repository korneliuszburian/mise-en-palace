# V320 Ingest v0 SourceDecision Linkage Readback

Status: complete source/DB slice.

Date: 2026-06-29.
DB used: yes.
Memory mutation: none.
Schema/migration changes: none.
Crawler/API/MCP/worker changes: none.
Embeddings/graph runtime: none.

## Executive Verdict

V320 proved the first bounded source-to-decision linkage readback for Ingest v0.
`krn source decision link --persist` now writes a `SourceDecisionEdge` from a
persisted `SourceClaim` and immediately reads that edge back by id.

This closes the local source path:

```txt
local file -> SourceArtifact -> SourceChunk -> SearchDocument -> SourceClaim
  -> SourceDecisionEdge readback
```

It still does not prove source truth, decision correctness, graph retrieval,
crawler readiness, embeddings, or product readiness.

## Owner Files Inspected

| File | Why |
|---|---|
| `packages/cli/src/runSourceDecisionLinkCommand.ts` | Existing source decision link CLI owner. |
| `packages/cli/src/parseSourceArgs.ts` | CLI input boundary for source decision link. |
| `packages/cli/src/databaseRuntime.ts` | DB runtime repository exposure. |
| `packages/harness/src/repositories/sourceRepository.ts` | SourceDecisionEdge repository contract. |
| `packages/db/src/repositories/DrizzleSourceRepository.ts` | Existing Drizzle source decision edge persistence implementation. |
| `packages/cli/src/runCli.test.ts` | Focused CLI behavior coverage. |
| `packages/db/src/repositories/DrizzleSourceRepository.test.ts` | Source repository surface coverage. |

## Pattern Gate

| Pattern | Use | Outcome |
|---|---|---|
| `pattern:source-to-decision-retention-gate` | Kept the SourceClaim -> SourceDecisionEdge link explicit, bounded, and falsifiable. | helped |
| `pattern:evidence-proof-non-proof-boundary` | CLI/report output names readback proof and non-proof. | helped |
| `pattern:ts-boundary-unknown-first-result-state` | Existing parser/schema boundary still validates CLI inputs before persistence. | helped |

## Source-To-Decision

- Source: V319 report, existing `SourceDecisionEdgeInputSchema`,
  `SourceRepository.createSourceDecisionEdge`, and local DB readback evidence.
- Mechanism: a persisted SourceClaim can support a bounded source decision edge
  through existing repository paths, and the created edge can be read back by id.
- KRN implication: Ingest v0 now has a minimal source-to-decision substrate
  before graph/entity, crawler, embeddings, or product UI/API work.
- Decision: add `getSourceDecisionEdgeById` and render
  `sourceDecisionEdgeReadback` in `krn source decision link --persist`.
- Rejection: do not create autonomous truth, graph runtime, crawler, schema, or
  source-decision adoption flow in this slice.
- Consumer: V321 Ingest v0 Activation Over Persisted Source State.
- Falsifier: `krn source decision link --persist` cannot read back the created
  SourceDecisionEdge by id in the current shell.

## Implemented Behavior

`krn source decision link --persist` now:

```txt
1. validates CLI input through SourceDecisionEdge schema;
2. confirms SourceClaim exists and is not rejected/deprecated;
3. creates SourceDecisionEdge;
4. reads the created SourceDecisionEdge by id;
5. renders sourceDecisionEdgeReadback: hit/missing;
6. preserves Memory mutation and graph runtime boundaries.
```

No DB schema changed. The new repository method is a readback over an existing
table.

## DB Readback Evidence

Fresh SourceClaim created first:

```txt
sourceArtifact: 581d344a-b300-43b8-8461-6ea5d0db9d47
sourceChunks: 0f1617e1-c1d2-4166-afe0-1f29ac38747e
searchDocument: bd1a38bd-b302-400d-a13c-c0c60ddd953d
sourceClaim: b055fffe-de70-49e4-86b0-a806a2f12e86
sourceClaimReadback: hit
```

Then linked:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn source decision link \
  --source-claim-id b055fffe-de70-49e4-86b0-a806a2f12e86 \
  --target-type architecture_decision \
  --target-id V320-ingest-v0-source-decision-linkage-readback \
  --support-type implementation-boundary \
  --confidence medium \
  --notes "V320 proves a persisted SourceClaim can support a bounded source decision edge with readback before graph or crawler work." \
  --metadata consumer=V320 \
  --metadata doesNotProve="This edge does not prove source truth, decision correctness, graph retrieval, crawler readiness, or product readiness." \
  --persist
```

Result:

```txt
sourceDecisionEdge: bb563467-dc0b-4be1-b570-21cd4df7f7a0
sourceDecisionEdgeReadback: hit
sourceClaimId: b055fffe-de70-49e4-86b0-a806a2f12e86
target: architecture_decision/V320-ingest-v0-source-decision-linkage-readback
supportType: implementation-boundary
confidence: medium
Memory mutation: none
Graph runtime: none
```

## Verification

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm --filter @krn/cli test -- runCli runSourceDecisionLinkCommand parseSourceArgs` | passed | Focused CLI source decision link behavior tests pass. | Does not prove live DB. |
| `rtk pnpm run typecheck` | passed | Strict TypeScript boundaries compile across workspace. | Does not prove runtime product value. |
| `rtk pnpm db:ready` | passed | Local Postgres is reachable, 14/14 migrations are applied, pgvector is available. | Does not prove source-decision behavior. |
| live SourceClaim create + `krn source decision link --persist` | passed | One SourceClaim -> SourceDecisionEdge path persisted and read back in this shell. | Does not prove source truth, decision correctness, graph retrieval, crawler readiness, embeddings, or product readiness. |
| `rtk pnpm db:smoke` | passed | DB runtime smoke still passes after this slice. | Does not prove this source decision is semantically useful. |

## Proof Boundaries

What this proves:

- existing DB paths can persist a SourceDecisionEdge linked to a SourceClaim;
- SourceDecisionEdge readback by id works in the current shell;
- rejected/deprecated SourceClaims remain blocked by existing guard;
- no schema migration, crawler, embeddings, graph runtime, API/MCP, worker, or
  Memory Core mutation was required.

What this does not prove:

- source truth;
- decision correctness;
- source-decision adoption/rejection quality;
- activation can select this persisted source state;
- graph extraction or multi-hop retrieval;
- crawler or mass-corpus ingest readiness;
- product readiness.

## Next Action

Move to:

```txt
V321 Ingest v0 Activation Over Persisted Source State
```

Goal: prove whether existing activation/readback surfaces can select or expose
the persisted local source/search/claim/decision substrate from V318-V320
without adding graph runtime, crawler, embeddings, dashboard, API/MCP, worker
daemon, or Memory Core mutation.
