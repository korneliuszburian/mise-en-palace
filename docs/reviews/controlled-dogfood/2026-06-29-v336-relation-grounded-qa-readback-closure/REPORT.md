# V336 Relation-Grounded QA Readback Closure

Status: complete bounded readback helper plus golden behavior proof.

## Verdict

V336 turns the V335 tiny graph-brain QA behavior into a compact reviewable
readback:

```txt
baseline:
  selected source claims
  verdict: insufficient
  review usefulness: weak

edge-aware:
  selected source claims
  verdict: grounded
  review usefulness: improved

outcome:
  improved
```

The new readback is used by both the focused activation test and the KRN golden
behavior gate. This closes the immediate V335 usefulness loop without adding a
graph database, crawler, UI/API/MCP, worker daemon, broad benchmark platform,
consensus runtime, broad ranking rewrite, or Memory Core mutation.

## Source To Decision

```yaml
source_id: v335-small-graph-brain-qa-case
trust_tier: high
source_class: repo-local evidence
mechanism: V335 proved the relation-dependent answer delta in a focused test,
  but the baseline-vs-edge answer outcome lived mostly inside the test/report
  rather than a reusable readback/golden proof surface.
krn_implication: Before expanding graph-brain surfaces, KRN needs the tiny
  relation-grounded answer delta to be reviewable and regression-protected as
  a bounded readback.
decision_kind: adopt
decision: Add a small relation-grounded QA readback helper and use it from the
  focused activation proof and golden behavior gate.
does_not_prove: This does not prove source truth, edge correctness, production
  graph retrieval quality, graph QA quality at scale, crawler readiness,
  product readiness, or Memory Core mutation.
consumer: V337 source-relation heartbeat candidate preview.
falsifier: The readback cannot show baseline selected context, edge-aware
  selected context, answer verdicts, used SourceClaim ids, outcome, and
  proof/non-proof boundary.
```

## Pattern Gate

Retained pattern search:

```txt
relation grounded QA readback proof boundary: 0 results
source to decision retention gate: 1 result
```

Applied:

```txt
source-to-decision-retention-gate: helped
evidence-proof-non-proof-boundary: helped through existing skill/report rules
```

## Implementation

Changed:

```txt
packages/harness/src/activation/relationGroundedQaReadback.ts
packages/harness/src/activation/index.ts
packages/harness/src/activation/index.test.ts
packages/harness/src/goldenKrnBehaviorGate.ts
packages/harness/src/goldenKrnBehaviorGate.test.ts
```

Added:

```txt
buildRelationGroundedQaReadback(...)
```

The readback returns:

```txt
baseline verdict / answer / review usefulness / included SourceClaim ids
edge-aware verdict / answer / review usefulness / included SourceClaim ids
outcome: improved | unchanged | regressed
proof
doesNotProve
```

Golden behavior case:

```txt
golden-case-graph-qa-001-a
```

The case fails if relation-grounded QA readback hides whether baseline or
edge-aware context grounded the answer.

## DB Dogfood

Fresh V336 persisted run:

```txt
executionRun: 996d68a4-967a-41b1-afec-4eaab64f9cda
taskContract: 92d3450c-0486-4ee6-8cbe-08f45d1ae8f5
harnessPlan: 84195014-d432-4b5b-accd-4a1da865160d
contextAssembly: 8133c99c-560e-4e0f-89f5-90a524bd0914
retrievalRun: 8881e7a6-6cab-42a8-b494-cbd0643e7e9c
evidenceBundle: a34c80ca-b00f-4956-a2fa-29e7e46129d5
reviewAssessment: a2728a89-4630-4a7a-bf47-4f1102b76076
feedbackDelta: 21c50db2-a83c-4737-b1b9-127bddef3b52
observationGroup: 95c416fa-5911-4010-95b5-8f6ce772e758
reflectionRecord: 5f0efc82-52db-43f5-8b5d-c08bdd99d2bd
```

Readback selected graph/source guardrails and readback owner files:

```txt
source_claim:e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27
  graphScore: 8
  sourceClaimEdgeInfluence: narrows

search_document:packages/cli/src/runRunShowCommand.ts
search_document:packages/harness/src/activation/activationEngine.ts
```

The DB run proves current activation can still retrieve graph/source context and
readback owner-file signals. It does not prove the new helper's answer outcome;
the focused tests/golden behavior gate prove that.

Evidence capture classified all changed files as intended, with zero unrelated
or unknown files. Observe and reflect persisted staging records without
MemoryRecord mutation or candidate row writes.

## Usefulness

| Evidence | Verdict | Why |
|---|---|---|
| Readback helper | positive | Makes baseline-vs-edge answer outcome explicit and reusable. |
| Golden behavior gate | positive | Protects the relation-grounded QA proof as real KRN behavior. |
| DB-backed V336 plan/readback | mixed positive | Selected source/edge guardrails and readback owner files, but not the new helper file before it existed in source state. |

## Commands

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `git fetch --prune` | passed | local refs refreshed | remote CI status |
| `git status --short --branch` | passed | worktree state was understood | correctness |
| `krn knowledge cards --text "relation grounded QA readback proof boundary"` | passed, 0 results | exact retained pattern query had no match | no relevant pattern exists |
| `krn knowledge cards --text "source to decision retention gate"` | passed, 1 result | source-to-decision retained pattern was readable | source truth |
| `pnpm db:ready` | passed | current-shell Postgres is reachable, 14/14 migrations applied, pgvector available | product readiness |
| `krn plan --persist` | passed | DB-backed V336 run exists | source truth or graph QA quality |
| `krn run show --run-id 996d68a4-967a-41b1-afec-4eaab64f9cda` | passed | persisted activation readback exposes graph/source context | helper behavior |
| `krn evidence capture --run-id 996d68a4-967a-41b1-afec-4eaab64f9cda --persist` | passed | persisted command provenance, intended-file classification, review assessment, feedback delta, and source-usefulness outcomes | memory quality, source truth, product readiness |
| `krn observe --run 996d68a4-967a-41b1-afec-4eaab64f9cda --persist` | passed | persisted observation group with five items and no MemoryRecord mutation | reflection quality |
| `krn reflect --scope run:996d68a4-967a-41b1-afec-4eaab64f9cda --persist` | passed | persisted reflection record with no MemoryRecord mutation or candidate row writes | candidate quality at scale |
| `pnpm --filter @krn/harness test -- goldenKrnBehaviorGate` | passed | golden behavior gate includes relation-grounded QA proof | production graph retrieval |
| `pnpm --filter @krn/harness test -- activation --testNamePattern "edge-selected source context"` | passed | focused V335/V336 readback behavior passes | source truth |
| `pnpm --filter @krn/harness test -- activePlanInvariants` | passed | compact root invariants pass after final root update | product readiness |
| `pnpm run typecheck` | passed | TypeScript workspace compiles | graph QA product quality |
| `TMPDIR=/home/krn/.cache/krn-tmp pnpm test` | passed | workspace tests pass | product readiness |
| `git diff --check` | passed | diff has no whitespace errors | behavior correctness |

## Proof Boundary

V336 proves KRN can render and regression-protect a tiny relation-grounded QA
answer delta.

V336 does not prove production graph retrieval quality, graph truth,
multi-hop corpus QA, embeddings, community summaries, crawler readiness,
operator-facing UI/search readiness, product readiness, autonomous
heartbeat/dreaming behavior, or Memory Core mutation.

## Next Recommended Task

```txt
V337 Source-Relation Heartbeat Candidate Preview
```

Goal: use the relation-grounded QA/readback and SourceClaimEdge context to add
one candidate-only heartbeat/dreaming preview that proposes source-relation
maintenance work without mutating final Memory Core or source truth.
