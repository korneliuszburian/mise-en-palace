# IMR-38 Activation Utility Source/Eval Follow-Up Source

Source class: repo-local review evidence.

## Claim

The IMR-37 heartbeat-routed activation utility candidate is accepted for manual
source/eval follow-up only.

## Mechanism

`krn heartbeat preview --review-*` found the live knowledge-acquisition
candidate from the AMA brain-search readback, reported
`candidateReviewability: ready`, preserved activation utility evidence, and
kept `mutation: none`.

## KRN Implication

KRN can carry this accepted review into bounded source/eval follow-up evidence
without changing activation ranking, creating a worker job, mutating source
truth, or promoting Memory Core state.

## Evidence

- Report:
  `docs/reviews/controlled-dogfood/2026-07-01-imr-37-activation-utility-candidate-review/REPORT.md`
- Candidate:
  `knowledge-acquisition-heartbeat:readback-brain-search-towards-autonomous-memory-agents-cost-aware-knowledge-extraction-cascade:missing_evidence`
- Decision:
  `accept_for_manual_followup`
- Candidate found:
  `true`
- Candidate reviewability:
  `ready`
- Activation utility verdict:
  `linked_evidence_exploration_candidate`
- Selected knowledge:
  `missing`
- Source/link/graph:
  `useful`
- Mutation:
  `none`

## Does Not Prove

This source does not prove candidate truth, source truth, source-search
completeness, ranking quality, semantic-aware Thompson sampling, autonomous
acquisition, worker daemon readiness, product readiness, or Memory Core mutation
safety.

## Falsifier

The follow-up is invalid if the accepted candidate cannot be linked to existing
source/eval evidence paths, if the route requires ranking/schema/runtime/API/MCP
work, or if any step treats this review as final truth instead of bounded
follow-up evidence.
