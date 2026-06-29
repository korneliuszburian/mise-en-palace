# V334 Edge-Aware Activation Selection Delta Proof

Status: complete bounded source proof plus DB-backed run readback.

## Verdict

V334 proves that `SourceClaimEdge` influence can change bounded activation
selection against a no-edge baseline.

The proof is deliberately small:

```txt
same candidate set
same tight maxInclusions: 1 budget
no-edge baseline selects lexical-only source claim
edge-aware path selects edge-connected source claim
```

This is stronger than V333's usefulness closure. V333 showed edge metadata was
review-useful and ranking-positive in a live run. V334 shows the existing edge
influence path can change which item enters the bounded working set.

This still does not prove production graph retrieval, source truth, edge
correctness, graph QA quality, or corpus-scale behavior.

## Source To Decision

```yaml
source_id: v333-edge-aware-activation-usefulness-closure
trust_tier: high
source_class: repo-local evidence
mechanism: V333 showed normal activation can select an edge-aware source
  candidate with persisted SourceClaimEdge metadata and graphScore, but did not
  prove edge influence could rescue or include an otherwise lower-ranked
  candidate.
krn_implication: Before graph QA or broader graph retrieval work, KRN needs a
  bounded selection-delta proof showing edge influence can change the selected
  working set under budget.
decision_kind: adopt
decision: Add a focused activation behavior proof comparing no-edge baseline
  selection with edge-aware selection under the same tight budget.
does_not_prove: This does not prove source truth, edge correctness, production
  graph retrieval quality, graph QA quality, crawler readiness, product
  readiness, or Memory Core mutation.
consumer: V335 small graph-brain QA case.
falsifier: A no-edge baseline and edge-aware path select the same candidate
  under the same bounded context policy when the edge-connected candidate should
  win only through SourceClaimEdge influence.
```

## Pattern Gate

Retained pattern search:

```txt
edge-aware activation selection delta: 0 results
source-to-decision: 3 results
```

Applied:

```txt
source-to-decision-retention-gate: helped
evidence-proof-non-proof-boundary: helped
```

Neutral:

```txt
codex-skill-progressive-disclosure-routing
```

Reason: V334 needed the source-to-decision and proof/non-proof retained
patterns. It did not change skills or routing behavior.

## Implementation

Changed:

```txt
packages/harness/src/activation/index.test.ts
```

Added behavior proof:

```txt
proves SourceClaimEdge influence can change bounded selection against a
no-edge baseline
```

The test constructs:

```txt
seed SourceClaim
edge-connected SourceClaim
lexical-only competitor SourceClaim
SourceClaimEdge(seed -> edge-connected, supports)
```

Baseline:

```txt
rankCandidates(candidates)
applyContextROI(maxInclusions: 1)
assembleContext(...)

included: claim-lexical-only
excluded: claim-edge-connected / over_budget
```

Edge-aware:

```txt
applySourceClaimEdgeInfluence(candidates, edge, graphScore: 30)
rankCandidates(...)
applyContextROI(maxInclusions: 1)
assembleContext(...)

included: claim-edge-connected
excluded: claim-lexical-only / over_budget
```

The test also verifies `sourceClaimEdgeInfluence` metadata:

```txt
edgeIds: edge-selection-delta
edgeKinds: supports
seedSourceClaimIds: claim-seed
doesNotProve: SourceClaimEdge influence does not prove source truth, edge
  correctness, ranking quality, or product graph retrieval quality.
```

No production scoring, ranking weights, schema, persistence, crawler, graph
runtime, UI/API/MCP, worker daemon, consensus runtime, or Memory Core behavior
was changed.

## DB Dogfood

Fresh V334 run:

```txt
executionRun: f0fc3a0b-7c52-42e6-b096-0bb2025abd61
taskContract: ea00c31e-6d42-4e87-a7e3-72e37f6eab41
contextAssembly: 753d4b69-a78e-4ef3-acfb-ba26c65336ba
retrievalRun: 697f0e51-7282-4dad-bba0-435c52d30f2c
```

Evidence and reflection:

```txt
evidenceBundle: b07dec35-e05c-4b8f-95ac-9e9197002f3f
reviewAssessment: 996293a4-9fdd-4cb3-a1b4-de1e71555a74
feedbackDelta: a115c5fe-2d62-4dd1-b5f7-dad6bb578110
observationGroup: c3b8e48e-50d2-42c9-b09e-69c3a01d60b5
observationItems: 5
reflectionRecord: 8f6cf9ee-8893-42b6-8988-b4754ee11828
MemoryRecord created: no
Candidate rows written: no
```

Readback showed the current persisted activation path still exposes edge-aware
metadata:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  status: included
  lexicalScore: 160
  graphScore: 8
  totalScore: 198
  sourceClaimEdgeInfluence:
    edgeIds:
      - ddbcef43-a680-407d-bf8b-2b95c07e40d4
      - 415321b3-4a26-4634-bfbe-38b756777d6a
    edgeKinds:
      - narrows
    seedSourceClaimIds:
      - 931e7faa-a982-498f-a265-6a938800f707
      - 578d247c-caa7-4cf2-8b27-0a211a00c778
```

This DB readback does not itself prove selection delta; the focused behavior
test proves the no-edge vs edge-aware delta.

## Activation Usefulness

| Evidence | Verdict | Why |
|---|---|---|
| Focused selection-delta test | strong positive | Same candidates and same budget select different items only after SourceClaimEdge influence. |
| DB-backed V334 plan/readback | positive | Current live path still selects edge-aware source context and exact activation owner file. |
| Retained pattern query | mixed | No exact edge-delta card exists; source-to-decision and proof-boundary cards helped. |

## Next Recommended Task

```txt
V335 Small Graph-Brain QA Case
```

Goal: use the edge-aware activation path in one tiny graph-brain QA scenario
where the answer or selected context depends on a source relation. The output
must be a bounded report/test, not crawler, graph DB, UI/API/MCP, worker runtime,
consensus runtime, or broad graph retrieval.

Rationale: V334 proved edge influence can change bounded selection. The next
product-facing question is whether that selected relation improves a small
question-answering/review scenario.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | local refs refreshed | remote CI status |
| `git status --short --branch` | passed | worktree was clean before V334 | product readiness |
| `git log --oneline -n 8` | passed | latest local history was visible | correctness |
| `krn knowledge cards --text "edge-aware activation selection delta"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `krn knowledge cards --text "source-to-decision"` | passed, 3 results | proof/source retained patterns were readable | ranking quality or completeness |
| `pnpm --filter @krn/harness test -- activation --testNamePattern "SourceClaimEdge influence can change bounded selection"` | passed | focused selection-delta behavior proof passes | production graph retrieval |
| `krn plan --persist` | passed | DB-backed V334 run exists | source truth or graph QA quality |
| `krn run show --run-id f0fc3a0b-7c52-42e6-b096-0bb2025abd61` | passed | text readback exposes persisted edge-aware context | command execution or source truth |
| `krn run show --run-id f0fc3a0b-7c52-42e6-b096-0bb2025abd61 --json` | passed | JSON readback exposes edge influence metadata | API/product readiness |
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | compact active root invariants pass | product readiness |
| `pnpm run typecheck` | passed | strict TypeScript workspace typecheck passes | graph retrieval quality |
| `pnpm db:ready` | passed | local Postgres reachable, 14/14 migrations applied, pgvector available | remote DB truth |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product graph QA quality |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |
| `krn evidence capture --persist` | passed | evidence, review assessment, feedback delta, command provenance, and source usefulness outcomes persisted | source truth or Memory Core mutation |
| `krn observe --persist` | passed | observation group/items persisted for the run | candidate quality |
| `krn reflect --persist` | passed | reflection record persisted after observe without MemoryRecord mutation or candidate rows | reflection extraction quality |

## Current Proof Boundary

V334 proves selection delta for the existing edge-influence mechanism in a
bounded behavior test. It does not prove production graph retrieval, source
truth, edge correctness, graph QA quality, corpus-scale retrieval, product
readiness, or Memory Core mutation.
