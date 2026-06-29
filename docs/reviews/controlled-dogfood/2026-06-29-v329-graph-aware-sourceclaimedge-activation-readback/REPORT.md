# V329 Graph-Aware SourceClaimEdge Activation Readback

Status: complete source readback repair, DB-backed dogfood.

## Verdict

V329 made persisted `SourceClaimEdge` readback graph-aware enough for operator
review by surfacing the adjacent `SourceClaim` as `edgeInfluencedSourceContext`.
This is a readback stub, not graph ranking, graph runtime, crawler work, or
source-truth promotion.

## Source To Decision

```yaml
source_id: v324-v328-graph-brain-readback-evidence
trust_tier: high
source_class: repo-local evidence
mechanism: V324 exposed SourceClaimEdge metadata, and V328 closed extraction
  noise before graph-aware retrieval. The next bounded gap was that an operator
  could see an edge id but not the adjacent claim context it should influence.
krn_implication: Graph Brain v0 needs reviewable edge-influenced context before
  any graph scoring, graph runtime, crawler, UI, API, MCP, or worker work.
decision_kind: adopt
decision: Extend read-only `krn source claim edges` output with adjacent
  SourceClaim context for each persisted edge.
does_not_prove: This does not prove source truth, edge correctness, graph
  retrieval quality, ranking quality, extraction quality, crawler readiness,
  product readiness, or Memory Core mutation.
consumer: `krn source claim edges --source-claim-id <id>`
falsifier: A persisted SourceClaimEdge exists but readback cannot show the
  adjacent SourceClaim context needed for operator review.
```

## Implementation

Changed:

- `packages/cli/src/runSourceClaimEdgesCommand.ts`
- `packages/cli/src/runSourceClaimEdgesCommand.test.ts`

Behavior:

- `krn source claim edges` still performs read-only Postgres readback.
- each edge now renders `edgeInfluencedSourceContext`;
- related `SourceClaim` rows are fetched through the existing repository method;
- missing adjacent claims are rendered as `relatedSourceClaimReadback: missing`;
- no write path, schema, graph runtime, ranking, crawler, UI/API/MCP, worker
  daemon, consensus runtime, or Memory Core mutation was added.

## DB Dogfood

Plan run:

```txt
executionRun: b48abc2f-fda4-463d-a660-6a2845ec8699
taskContract: 4d48a1b5-8b2e-41c8-8e8a-f74058bcaf4b
contextAssembly: d20b20ee-e0bc-423e-8521-30d2d5aba9bb
```

Persisted evidence loop:

```txt
evidenceBundle: 71a7121c-3a6c-4e0d-91e1-2e99ea0e9493
reviewAssessment: ce48ff92-41ba-4c70-b9cc-ad8abef5d26a
feedbackDelta: a421a911-09a4-4839-82d1-08382edb9a07
observationGroup: 534edb6d-0457-49db-85c3-e95414c32c31
observationItems: 5
reflectionRecord: 4f7f60fd-a8c4-4c39-92cc-b6e7cbc289e9
reflectionFindings: 0
candidateRowsWritten: no
MemoryRecord created: no
```

Live readback:

```txt
sourceClaimId: 578d247c-caa7-4cf2-8b27-0a211a00c778
sourceClaimEdge: 415321b3-4a26-4634-bfbe-38b756777d6a
relatedSourceClaimId: e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
relatedSourceClaimReadback: hit
Graph runtime: none
Memory mutation: none
```

## Activation Usefulness

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  helped: selected the adjacent source-state claim that the edge readback now
  surfaces as related context.

source_claim:7769dfc9-fb91-4f80-804f-01a206b7690e
  helped: kept the slice pre-retrieval and pre-runtime.

source_claim:b055fffe-de70-49e4-86b0-a806a2f12e86
  helped: reinforced source claims as the first reviewable graph substrate.

owner-file recall:
  mixed/noise: selected plan/run/activation owners, not
  `runSourceClaimEdgesCommand.ts`; manual source inspection found the owner.
```

Verdict: positive for persisted graph-source context, still mixed for
owner-file recall.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `pnpm --filter @krn/cli test -- parseSourceArgs runSourceClaimEdgesCommand` | passed | parser/readback behavior is covered | product graph quality |
| `pnpm run typecheck` | failed then passed | strict optional boundary caught an invalid optional shape; final TS checks pass | runtime graph quality |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `pnpm db:ready` | passed | local DB reachable, migrations applied, pgvector available | remote DB truth |
| `krn source claim edges --source-claim-id 578d...` | passed | live DB readback surfaces adjacent SourceClaim context | source truth or edge correctness |
| `git diff --check` | passed | no whitespace diff errors | behavior correctness |

## Next Recommended Task

```txt
V330 Edge-Aware SourceClaim Candidate Ranking Lab
```

Goal: add a bounded behavior lab/proof that a source claim connected through a
persisted `SourceClaimEdge` can be represented as edge-aware ranking/readback
input without claiming production graph retrieval quality.

Non-goals: no crawler, no schema, no graph database, no UI/API/MCP, no worker
daemon, no consensus runtime, no broad ranking rewrite, no Memory Core mutation.
