# CRP-01 Consensus Relation Pattern Retention

Date: 2026-07-01

## Verdict

positive

CRP-01 retained the now-proven consensus relation heartbeat review boundary as
queryable brain knowledge. The retained pattern is available through
`krn brain knowledge` with source refs, evidence refs, consumers, falsifier,
doesNotProve, and helped usefulness feedback.

## KRN Plan

Persisted plan: yes

```txt
operatorIntent: 701a3ebe-dcd5-4906-a883-cd6342b935ca
taskContract: 6568b9da-14ad-4109-a3b9-fb42e8092aea
harnessPlan: 0e883a88-f508-47f7-bd10-06031e7f8240
contextAssembly: 9e7134d6-cb95-4581-8e41-1e1e32b984bd
executionRun: 91369a87-f653-4531-9cec-1a66c9db4945
```

Activation usefulness: mixed.

Useful:

- selected source-to-decision and bounded-product guardrails;
- reinforced no dashboard/API/MCP/worker/runtime/schema expansion.

Weak:

- retained pattern selection returned no exact consensus relation pattern before
  CRP-01;
- owner-file recall selected plan/run/activation files, not the catalog owner
  path.

This weakness is now partially closed by the new retained pattern.

## Source-To-Decision

Source: CRU-01 repo-local evidence plus CRO-01/GCE-01 implementation reports.

Mechanism: heartbeat `consensus_evaluation` readback can expose relation focus,
relation question, review usefulness, support/risk evidence refs, reviewability,
decision options, and mutation boundaries in one operator-facing candidate-only
readback.

KRN implication: consensus/eval and graph relation work should use this retained
boundary before opening consensus runtime, graph ranking, source truth mutation,
or Memory Core mutation work.

Decision: adopt as queryable retained brain knowledge.

Consumer: future source-to-decision pattern gates, consensus/eval candidate
review slices, graph relation duplicate/contradiction review gates, and mini
Brain-QA consensus relation cases.

Falsifier: a future consensus/eval or graph relation candidate still requires raw
JSON, implementation code, or historical reports to identify relation focus,
review question, support/risk evidence, review usefulness, decision options, or
mutation boundaries.

## Changed

Added:

```txt
docs/patterns/retained-patterns/consensus-relation-heartbeat-review-boundary.json
docs/brain-knowledge/usefulness-feedback/cru-01-consensus-relation-heartbeat-review.json
```

Updated:

```txt
docs/brain-knowledge/catalog.json
packages/cli/src/runKnowledgeCardsCommand.test.ts
packages/harness/src/brainKnowledgeReadModelInvariants.test.ts
```

## Readback

Command:

```txt
pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --text "consensus relation heartbeat review boundary" --json
```

Result:

```txt
totalCards: 1
returnedCards: 1
card: pattern:consensus-relation-heartbeat-review-boundary
status: active
reviewability: ready
usefulnessOutcome: helped
mutation: none
```

## Verification

Passed:

```txt
pnpm db:ready
krn plan --persist
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --text "consensus relation heartbeat review boundary" --json
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
pnpm --filter @krn/harness test -- brainKnowledgeReadModelInvariants brainKnowledgeReadModel
pnpm run typecheck
TMPDIR=/home/krn/.cache/krn-tmp pnpm test
pnpm quality:fallow
git diff --check
krn evidence capture --persist
krn observe --persist
krn reflect --persist
```

Failed then fixed:

```txt
pnpm --filter @krn/cli test -- runKnowledgeCardsCommand
```

Initial failure: adding the new consensus relation pattern made an older broad
`graph relation readback` test select two valid relation patterns and raised
helped-pattern totals from 15 to 16. The test query was narrowed to the graph
pattern's distinct SourceClaimEdge/GraphRAG terms, and count expectations were
updated.

Persisted evidence/readback IDs:

```txt
evidenceBundle: d8c7bf94-6432-4581-94c8-85ee015d54d9
reviewAssessment: bc7da697-4ca3-4d1f-a5e8-3abd10a6a423
feedbackDelta: fa0758c4-47e3-4e2b-b57d-4dda84d0f094
observationGroup: 6c0a6d24-6c2f-43c7-b4ff-a88a34654f8a
reflectionRecord: fde02f22-7697-4209-9d18-c496f2b445fe
```

## What This Proves

- The CRU-01 consensus relation review boundary is retained as a pattern.
- The pattern is queryable through `krn brain knowledge`.
- The pattern carries source refs, evidence refs, consumers, falsifier,
  doesNotProve, and helped usefulness feedback.
- The catalog/read-model tests cover the new pattern.

## What This Does Not Prove

- source truth;
- relation correctness;
- duplicate consolidation safety;
- consensus correctness;
- graph ranking quality;
- autonomous worker execution;
- Memory Core mutation safety outside this read-only path;
- product readiness.

## Next

Use the retained pattern in a bounded mini Brain-QA/consensus lane check so the
new brain knowledge is not only present, but reused by the next planning/review
loop.
