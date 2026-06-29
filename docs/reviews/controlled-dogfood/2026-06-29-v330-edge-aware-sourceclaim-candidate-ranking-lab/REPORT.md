# V330 Edge-Aware SourceClaim Candidate Ranking Lab

Status: complete bounded activation lab, DB-backed dogfood.

## Verdict

V330 adds a bounded edge-aware source candidate input lab. `SourceClaimEdge`
relations can now enrich source candidates with explicit graph-score input and
review metadata before any production graph retrieval path exists.

This is not a broad ranking rewrite. It is a lab/proof seam that uses the
existing `graphScore` slot and keeps graph influence visible in candidate
metadata.

## Source To Decision

```yaml
source_id: v329-edge-influenced-readback
trust_tier: high
source_class: repo-local evidence
mechanism: V329 proved read-only SourceClaimEdge readback can surface adjacent
  SourceClaim context. The next bounded step is to represent that edge context
  as source candidate ranking input without wiring it into production retrieval.
krn_implication: Graph Brain v0 should make edge influence testable and
  reviewable before claiming graph retrieval quality.
decision_kind: adopt
decision: Add `applySourceClaimEdgeInfluence` as a pure activation lab helper
  that enriches source candidates with bounded graphScore and metadata.
does_not_prove: This does not prove source truth, edge correctness, production
  graph retrieval quality, graph runtime behavior, crawler readiness, product
  readiness, or Memory Core mutation.
consumer: future persisted edge-aware activation readback
falsifier: SourceClaimEdge-connected candidates cannot expose edge ids, edge
  kinds, seed claim ids, or graphScore input in a focused activation test.
```

## Implementation

Changed:

- `packages/harness/src/activation/rankCandidates.ts`
- `packages/harness/src/activation/index.test.ts`

Behavior:

- added pure `applySourceClaimEdgeInfluence` helper;
- accepts explicit `SourceClaimEdge` rows and seed source claim ids;
- enriches connected source candidates with bounded `graphScore`;
- stores edge ids, edge kinds, seed ids, and `doesNotProve` in metadata;
- leaves disconnected source candidates unchanged;
- does not query DB, mutate memory, change schema, crawl, or rewrite production
  activation retrieval.

## DB Dogfood

Plan run:

```txt
executionRun: 79eb148d-7017-4d49-8d01-913940ec0cd7
taskContract: 784550b3-7217-4852-a05f-81f88cd739ec
contextAssembly: 999c8a01-717b-42f6-a7ed-70b646172714
```

Persisted evidence loop:

```txt
evidenceBundle: 665a3c9e-9556-4737-ac64-1f0d5ab232b6
reviewAssessment: 03a480a0-c5ac-4efa-a28c-34fd8c2e7028
feedbackDelta: c156a231-d2b5-445d-bd07-6bc65fc86c14
observationGroup: 38ec75b2-1aad-48f1-a953-db316ac6bd2f
observationItems: 9
reflectionRecord: 89666cbe-3a22-4fc0-b38a-ca820c1b6afc
reflectionFindings: 5
reflectionGaps: 5
candidateRowsWritten: no
MemoryRecord created: no
```

Activation selected:

```txt
source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
source_claim:b055fffe-de70-49e4-86b0-a806a2f12e86
```

Owner-file recall still selected plan/run/activation owners, not specifically
`rankCandidates.ts`; manual source inspection found the owning seam.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/harness test -- activation` | passed | edge-aware helper behavior is covered in activation tests | production graph retrieval quality |
| `pnpm run typecheck` | passed | strict TypeScript checks pass | runtime graph behavior |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `pnpm db:ready` | passed | local DB reachable, migrations applied, pgvector available | remote DB truth |
| `krn plan --persist` | passed | DB-backed dogfood plan/run exists | Codex executed the work |
| `git diff --check` | passed | no whitespace diff errors | behavior correctness |

## Activation Usefulness

```txt
source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
  helped: kept the lab bounded to temporal edge semantics, not graph truth.

source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  helped: reinforced selected, task-specific context and no crawler/runtime jump.

source_claim:b055fffe-de70-49e4-86b0-a806a2f12e86
  helped: reinforced source claims as the graph-brain substrate.
```

Verdict: positive for source-state guardrails, still mixed for owner-file
recall.

## Next Recommended Task

```txt
V331 Persisted Edge-Aware Activation Readback
```

Goal: show the V330 edge-aware candidate input in a persisted activation
readback path without claiming production graph retrieval quality.

Non-goals: no crawler, no schema, no graph database, no UI/API/MCP, no worker
daemon, no consensus runtime, no broad ranking rewrite, no Memory Core mutation.
