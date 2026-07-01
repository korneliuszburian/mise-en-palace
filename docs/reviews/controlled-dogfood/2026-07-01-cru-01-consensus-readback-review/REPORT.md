# CRU-01 Consensus Relation Readback Review Proof

Date: 2026-07-01

## Verdict

positive

CRU-01 used the CRO-01 consensus relation readback in a bounded heartbeat review
loop. The readback made the relation focus and review question visible without
opening consensus runtime, worker daemon, graph ranking, DB schema, dashboard,
API/MCP, crawler, or Memory Core mutation work.

## KRN Plan

Persisted plan: yes

```txt
operatorIntent: 0fc60ed3-81af-4878-bb96-6c58abb94362
taskContract: 51479455-390a-4885-bf2d-5ab8a8bf157b
harnessPlan: 110fb9e8-e0c8-4ea0-ba24-0058022ca614
contextAssembly: bb2ed5a6-36ac-492c-add6-2cdc38d5f03c
executionRun: a5177c28-1a8d-4669-84c6-dba3618d3a66
```

Activation usefulness: mixed positive.

Useful:

- selected bounded readback/source graph guardrails;
- selected heartbeat/source follow-up boundaries;
- preserved no-platform/no-runtime direction.

Weak:

- retained-pattern pre-coding query selected no patterns until shorter manual
  mechanism queries were used;
- owner-file recall again pointed at plan/run/activation files, not the active
  heartbeat proof route.

## Retained Patterns Used

```txt
pattern:heartbeat-candidate-only-runtime-boundary -> helped
pattern:graph-relation-readback-boundary -> helped
pattern:evidence-proof-non-proof-boundary -> helped
```

The long query `consensus relation heartbeat readback review burden` selected
zero retained patterns. Shorter mechanism queries selected the relevant
patterns. This is a recall weakness, not a blocker for this slice.

## Input Artifact

```txt
docs/reviews/controlled-dogfood/2026-07-01-cru-01-consensus-readback-review/consensus-candidate.json
```

The artifact contains one `source_decision_candidate` with:

- relation review focus: `duplicate`;
- relation review question;
- support evidence refs from GCE-01 and CRO-01;
- risk evidence ref to this report;
- proof/non-proof boundaries.

## Commands

Passed:

```txt
pnpm db:ready
krn plan --persist
krn brain knowledge --text "heartbeat"
krn brain knowledge --text "graph relation"
krn brain knowledge --text "evidence proof boundary"
krn heartbeat preview --candidate-kind consensus_evaluation --consensus-candidate-file ... --max-candidates 1
krn heartbeat preview --candidate-kind consensus_evaluation --consensus-candidate-file ... --max-candidates 1 --json
krn heartbeat preview --candidate-kind consensus_evaluation --consensus-candidate-file ... --review-candidate-id consensus-candidate-evaluation:cru-01-duplicate-relation-review ...
git diff --check
krn evidence capture --persist
krn observe --persist
krn reflect --persist
```

Persisted evidence/readback IDs:

```txt
evidenceBundle: 4eb7f659-c052-44c2-8db6-fa79cd4b90cb
reviewAssessment: a512dfd1-2b2d-41bb-9fd7-5862628a4f24
feedbackDelta: 0404fe2d-d2b4-40a1-a0ce-e8833d675891
observationGroup: 265aec22-8277-4687-a739-a56dc913abc7
reflectionRecord: 20fab508-d216-4976-9143-c2ff7ce3f248
```

## Readback Result

Text and JSON heartbeat readbacks showed:

```txt
candidateKinds: consensus_evaluation
decision: ready_for_behavior_proof
runtimeLoop.status: ready_for_operator_review
candidateReviewability: ready
candidateReviewResult.candidateFound: true
candidateReviewResult.decision: accept_for_manual_followup
relationReviewFocus: duplicate
relationReviewQuestion: Review whether these claims are true duplicates before consolidation, suppression, or source truth changes.
reviewUsefulness: used
mutation: none
DB writes: none
```

## Review Burden Delta

Before CRU-01, reviewing this candidate required reading or reconstructing:

- the previous consensus preview report;
- the operator readback implementation report;
- proof boundaries for candidate-only/no-mutation behavior;
- relation focus and relation question separately.

After CRU-01, the heartbeat preview displayed in one operator-facing readback:

- review/eval closure status;
- runtime-loop readiness;
- candidate reviewability;
- support/risk evidence refs;
- relation focus;
- relation question;
- `reviewUsefulness`;
- decision options;
- mutation and forbidden writes;
- proof/non-proof boundaries.

Review burden: reduced from medium to low for this bounded candidate.

## Source-To-Decision

Source: CRO-01 report plus retained heartbeat/graph/evidence patterns.

Mechanism: heartbeat preview can route consensus relation candidates through a
manual candidate-only readback that carries reviewability, relation focus,
question, support/risk refs, and proof boundaries.

KRN implication: consensus relation review can be used as a review/eval
candidate lane before any autonomous consensus runtime, graph ranking, source
truth mutation, or Memory Core mutation.

Decision: accept the heartbeat route for manual consensus relation review
follow-up.

Consumer: future consensus/eval and graph relation candidate-review slices.

Falsifier: if a future real candidate cannot be reviewed from heartbeat output
without reading implementation code or raw JSON, the readback needs a focused UX
repair.

## What This Proves

- The new consensus relation readback can be exercised through `krn heartbeat
  preview`.
- Relation focus/question/usefulness are visible in text and JSON output.
- The candidate can be reviewed through the existing heartbeat review-result
  surface.
- The proof stays candidate-only and mutation-free.

## What This Does Not Prove

- source truth;
- relation edge correctness;
- consensus correctness;
- duplicate consolidation quality;
- graph ranking quality;
- autonomous worker execution;
- scheduler readiness;
- Memory Core mutation safety outside this read-only path;
- product readiness.

## Candidates

MemoryCandidate:

```txt
Consensus relation candidates should be reviewed through heartbeat
consensus_evaluation readback before runtime, graph ranking, source truth, or
Memory Core mutation work.
```

AntiMemoryCandidate:

```txt
Do not treat relationReviewFocus/reviewUsefulness as proof that a relation edge
is correct or that duplicate consolidation is safe.
```

EvalCandidate:

```txt
Heartbeat consensus_evaluation readback should remain reviewable for duplicate
relation candidates with support/risk evidence refs and mutation none.
```

No candidate was promoted.

## Next

Retain the now-proven consensus relation heartbeat review boundary as queryable
brain knowledge, then use it in a later mini Brain-QA/consensus lane check.
