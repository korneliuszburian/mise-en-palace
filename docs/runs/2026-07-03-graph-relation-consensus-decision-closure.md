# Graph Relation Consensus Decision Closure

Date: 2026-07-03

Bead: `mise-en-palace-royf`

## Objective

Take one relation-bearing consensus candidate through KRN readback and decide
whether the existing consensus relation pattern helps, stays neutral, or leaves
the task evidence-blocked.

## Input Candidate

Local dogfood input:

- `.local-lab/royf/consensus-candidate.json`
- candidateId: `royf-duplicate-source-relation`
- candidateKind: `source_decision_candidate`
- relationReviewFocus: `duplicate`
- edgeKind: `duplicates`
- risk evidence: partial overlap may make consolidation unsafe

## Plan Readback

Persisted plan selected the retained pattern:

- retainedPatternId: `consensus-relation-heartbeat-review-boundary`
- executionRun: `2ac1283a-fadc-4230-a42c-769c66f6d0f6`
- taskContract: `9edd666d-da58-4dbe-84dd-9d9778637c10`
- contextAssembly: `80396170-3589-4088-a1ae-fdb109384ae7`

## Heartbeat Readback

Command:

```sh
pnpm --filter @krn/cli krn heartbeat preview \
  --project 7d9d103a-1a8e-4492-a4ca-db3a5589bd9b \
  --candidate-kind consensus_evaluation \
  --consensus-candidate-file .local-lab/royf/consensus-candidate.json \
  --json
```

Readback:

- review/eval decision: `ready_for_behavior_proof`
- runtime status: `ready_for_operator_review`
- candidate kind: `consensus_candidate_evaluation_preview`
- decision options: `review_candidate`, `defer_candidate`,
  `request_more_evidence`
- relationReviewFocus: `duplicate`
- reviewUsefulness: `used`
- mutation: `none`

## Decision

Outcome: `helped`.

Reason: the retained pattern was selected during planning and the heartbeat
`consensus_evaluation` readback exposed the exact operator-facing fields needed
to avoid raw JSON or historical-report rereads:

- relation focus;
- review question;
- support/risk evidence refs;
- decision options;
- review usefulness;
- mutation boundary.

No code change was needed for this slice. The useful product work was the
bounded evidence loop and explicit proof boundary.

DB evidence:

- evidenceBundle: `cdae29ce-8465-404c-99c5-84a93efe22b0`
- reviewAssessment: `b02b4ff0-d519-41db-8965-813043ce81c3`
- feedbackDelta: `0bd53621-f02e-4a2b-88a4-690ec621bbe4`

## Proof Boundary

Proves:

- retained pattern selection worked for a relation/consensus task;
- heartbeat consensus readback surfaced a relation-bearing candidate with
  review usefulness and decision options;
- the current product surface can support a candidate-only relation consensus
  decision before mutation.

Does not prove:

- source truth;
- relation correctness;
- duplicate consolidation safety;
- graph ranking quality;
- autonomous worker execution;
- Memory Core mutation safety;
- product readiness.

