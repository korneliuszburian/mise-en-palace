# V335 Small Graph-Brain QA Case

Status: complete bounded behavior proof plus DB-backed run readback.

## Verdict

V335 proves a tiny relation-dependent graph-brain QA case:

```txt
same candidate set
same tight maxInclusions: 1 budget
no-relation baseline selects lexical-only context
baseline answer is insufficient
edge-aware path selects the SourceClaimEdge-connected answer claim
edge-aware answer is grounded by selected source context
```

This is the next step after V334. V334 proved `SourceClaimEdge` influence can
change bounded selection. V335 proves that changed selection can improve a tiny
answer/review outcome.

This still does not prove source truth, edge correctness, production graph
retrieval, graph QA quality, corpus-scale multi-hop behavior, crawler readiness,
UI/API/MCP readiness, product readiness, or Memory Core mutation.

## Source To Decision

```yaml
source_id: v334-edge-aware-activation-selection-delta
trust_tier: high
source_class: repo-local evidence
mechanism: V334 showed that SourceClaimEdge influence can change the bounded
  activation working set against a no-edge baseline under identical candidate
  and budget conditions.
krn_implication: Before expanding graph retrieval, KRN needs one tiny QA case
  where the changed working set improves answer grounding or review usefulness.
decision_kind: adopt
decision: Add a focused activation behavior proof for a relation-dependent QA
  scenario where the edge-selected SourceClaim grounds the answer and the
  no-relation baseline cannot.
does_not_prove: This does not prove source truth, edge correctness, production
  graph retrieval quality, graph QA quality at scale, crawler readiness,
  product readiness, or Memory Core mutation.
consumer: V336 relation-grounded QA readback closure.
falsifier: The edge-aware path selects the same context as the baseline or the
  selected edge-connected context does not improve the tiny QA/review outcome.
```

## Pattern Gate

Retained pattern search:

```txt
small graph brain QA source relation: 0 results
evidence proof non proof boundary: 2 results
source to decision retention gate: 1 result
```

Applied:

```txt
source-to-decision-retention-gate: helped
evidence-proof-non-proof-boundary: helped
codex-prompt-task-contract-proof-boundary: neutral
```

Reason: V335 needed source-to-decision and proof/non-proof boundaries. It did
not change Codex prompt task contracts.

## Implementation

Changed:

```txt
packages/harness/src/activation/index.test.ts
```

Added behavior proof:

```txt
uses edge-selected source context to ground a tiny graph-brain QA answer
```

The test constructs:

```txt
seed SourceClaim
answer SourceClaim
lexical-only competitor SourceClaim
SourceClaimEdge(seed -> answer, supports)
```

Baseline:

```txt
rankCandidates(candidates)
applyContextROI(maxInclusions: 1)
assembleContext(...)

included: claim-qa-lexical-only
answer verdict: insufficient
review usefulness: weak
```

Edge-aware:

```txt
applySourceClaimEdgeInfluence(candidates, edge, graphScore: 30)
rankCandidates(...)
applyContextROI(maxInclusions: 1)
assembleContext(...)

included: claim-qa-answer
answer verdict: grounded
review usefulness: improved
```

The test verifies `sourceClaimEdgeInfluence` metadata:

```txt
edgeIds: edge-qa-answer
edgeKinds: supports
seedSourceClaimIds: claim-qa-seed
doesNotProve: SourceClaimEdge influence does not prove source truth, edge
  correctness, ranking quality, or product graph retrieval quality.
```

No production scoring, schema, persistence, crawler, graph runtime, UI/API/MCP,
worker daemon, consensus runtime, or Memory Core behavior changed.

## DB Dogfood

Fresh V335 persisted run:

```txt
executionRun: 81d42a8d-5834-4e05-b0fc-84480229c52f
taskContract: 45e75674-c107-44a7-8bc0-7dfde7432514
harnessPlan: 08908327-4fc7-4848-8c65-14cd1c00fc85
contextAssembly: 78805905-0587-4c89-93c8-7780340ffb5b
retrievalRun: faa0ec35-eef3-4b18-a385-af4a33abc51e
evidenceBundle: 21f754af-2673-4bf6-adc0-e375afa1e239
reviewAssessment: fab15dd2-c7f1-4623-b4b6-53acc7c177b3
feedbackDelta: f12cecf5-e341-4529-bc8f-109459fa03c9
observationGroup: c8c9ef63-bf35-4f96-89f3-2bc84e11e4f4
observationItems: 5
reflectionRecord: 1ec08556-7f5b-4b5c-b857-e311bf963cd9
MemoryRecord created: no
Candidate rows written: no
```

Readback showed current activation still selects graph/source context:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  status: included
  lexicalScore: 180
  graphScore: 8
  totalScore: 218
  sourceClaimEdgeInfluence:
    edgeKinds: narrows
```

This DB readback does not itself prove the tiny QA answer outcome. The focused
behavior test proves the no-relation vs edge-aware QA delta.

## Usefulness

| Evidence | Verdict | Why |
|---|---|---|
| Focused QA test | positive | Edge-aware context selects the answer claim and baseline cannot ground the answer. |
| DB-backed V335 plan/readback | positive | Current live activation path selects graph/source context and edge metadata. |
| Retained pattern query | mixed | No direct graph-QA card exists; proof/source boundary cards helped. |

## Next Recommended Task

```txt
V336 Relation-Grounded QA Readback Closure
```

Goal: close the V335 usefulness loop by recording the relation-grounded QA proof
as a compact readback/reporting surface or golden case, without adding crawler,
graph DB, UI/API/MCP, worker runtime, broad benchmark, consensus runtime, or
Memory Core mutation.

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | local refs refreshed | remote CI status |
| `git status --short --branch` | passed | only intended source change existed during V335 | correctness |
| `pnpm db:ready` | passed | current-shell Postgres is reachable, 14/14 migrations applied, pgvector available | product readiness |
| `krn knowledge cards --text "small graph brain QA source relation"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `krn knowledge cards --text "evidence proof non proof boundary"` | passed, 2 results | proof-boundary retained patterns were readable | semantic ranking quality |
| `krn knowledge cards --text "source to decision retention gate"` | passed, 1 result | source-to-decision retained pattern was readable | source truth |
| `pnpm --filter @krn/harness test -- activation --testNamePattern "edge-selected source context"` | passed | focused QA behavior proof passes | production graph retrieval |
| `krn plan --persist` | passed | DB-backed V335 run exists | source truth or graph QA quality |
| `krn run show --run-id 81d42a8d-5834-4e05-b0fc-84480229c52f` | passed | persisted activation readback exposes edge-aware context | tiny QA answer outcome |
| `krn run show --run-id 81d42a8d-5834-4e05-b0fc-84480229c52f --json` | passed | JSON run readback is available | API/product readiness |
| `krn evidence capture --run-id 81d42a8d-5834-4e05-b0fc-84480229c52f --persist` | passed | EvidenceBundle/ReviewAssessment/FeedbackDelta persisted with command provenance and source usefulness | source truth or memory quality |
| `krn observe --run 81d42a8d-5834-4e05-b0fc-84480229c52f --persist` | passed | ObservationGroup persisted with 5 items | reflection quality |
| `krn reflect --scope run:81d42a8d-5834-4e05-b0fc-84480229c52f --persist` | passed | ReflectionRecord persisted after observe, no MemoryRecord created | candidate quality or graph QA quality |
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | compact active root invariants still pass before final root update | product readiness |
| `pnpm run typecheck` | passed | TypeScript workspace compiles | graph QA product quality |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |

## Proof Boundary

V335 proves a tiny, deterministic, relation-dependent QA/review delta in the
activation harness.

V335 does not prove production graph retrieval quality, graph truth,
multi-hop corpus QA, embeddings, community summaries, crawler readiness,
operator-facing UI/search readiness, product readiness, or autonomous
heartbeat/dreaming behavior.
