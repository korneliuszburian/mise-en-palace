# CQR-01 Consensus Relation Pattern Reuse

Date: 2026-07-01

## Verdict

positive with plan-bridge caveat

CQR-01 proved the retained consensus relation heartbeat review boundary is reused
by the next bounded mini Brain-QA / consensus-lane readback. Both exact and
natural `krn brain knowledge` queries selected:

```txt
pattern:consensus-relation-heartbeat-review-boundary
```

`krn brain search` also classified the same retained pattern as
`target_specific_selected_knowledge` and recommended using selected brain
knowledge first. The consensus heartbeat lane still renders the duplicate
relation candidate as review-ready, mutation-free, and candidate-only.

The caveat: persisted `krn plan --persist` did not select the retained pattern
for the equivalent task. This is a plan-bridge recall gap, not a blocker for
this readback slice. Follow-up Beads issue:

```txt
mise-en-palace-9ck: Repair retained pattern plan bridge recall for consensus relation boundary
```

## KRN Plan

Persisted plan: yes

```txt
operatorIntent: 48143822-adc6-4a51-9db3-8a300458b855
taskContract: b6e6b6a5-4bde-454a-9354-a1dde262e564
harnessPlan: 4f946016-f1b2-4e94-b684-7d02f4a9c9c2
contextAssembly: 1cc166f3-6799-442e-8774-c37673e839e7
executionRun: a80f7cbd-fc0b-44b9-ab67-141cb48a9074
```

Activation usefulness: mixed.

Useful:

- selected bounded source-to-decision and no-runtime/no-schema guardrails;
- selected target owner files for plan/run/activation surfaces;
- assembled a DB-backed execution run for evidence capture.

Weak:

- retained pattern selection returned `Retained pattern IDs: none`;
- the same task phrase later selected the correct pattern through
  `krn brain knowledge` and `krn brain search`.

## Readback Result

Exact retained-pattern query:

```txt
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --text "consensus relation heartbeat review boundary" --limit 5 --json
```

Result:

```txt
totalCards: 1
returnedCards: 1
card: pattern:consensus-relation-heartbeat-review-boundary
reviewability: ready
usefulnessOutcome: helped
mutation: none
```

Natural consensus-lane query:

```txt
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --text "consensus relation candidate review duplicate relation question usefulness" --limit 5 --json
```

Result:

```txt
totalCards: 1
returnedCards: 1
card: pattern:consensus-relation-heartbeat-review-boundary
reviewability: ready
usefulnessOutcome: helped
mutation: none
```

Combined brain-search query:

```txt
krn brain search --query "consensus relation candidate review duplicate relation question usefulness" --catalog-file docs/brain-knowledge/catalog.json --limit 5 --max-inclusions 3 --json
```

Result:

```txt
selectedKnowledge:
  id: pattern:consensus-relation-heartbeat-review-boundary
  targetFit: target_specific
  reviewability: ready
targetFitSummary: target_specific_selected_knowledge
activationUtility.verdict: selected_knowledge_sufficient
recommendedNextAction: Use selected brain knowledge first; linked evidence can remain supporting context.
mutation: none
```

Consensus heartbeat lane:

```txt
krn heartbeat preview --candidate-kind consensus_evaluation --consensus-candidate-file docs/reviews/controlled-dogfood/2026-07-01-cru-01-consensus-readback-review/consensus-candidate.json --max-candidates 1 --json
```

Result:

```txt
candidateKinds: consensus_evaluation
candidateId: cru-01-duplicate-relation-review
reviewability: ready
relationReviewFocus: duplicate
relationReviewQuestion: Review whether these claims are true duplicates before consolidation, suppression, or source truth changes.
reviewUsefulness: used
decisionOptions: review_candidate, defer_candidate, request_more_evidence
mutation: none
forbiddenWrites: memory_records, anti_memory_records, source_claims, source_decisions, eval_candidates
runtimeLoop.status: ready_for_operator_review
```

## Source-To-Decision

Source: CRP-01 retained pattern plus CRU-01/CRO-01/GCE-01 reports.

Mechanism: selected brain knowledge can surface a retained consensus relation
review boundary before opening runtime, graph ranking, source truth mutation, or
Memory Core mutation work. The heartbeat consensus_evaluation readback then
turns the selected pattern into a concrete candidate-review surface.

KRN implication: future consensus relation slices should query retained brain
knowledge first, then use heartbeat consensus_evaluation readback as the review
surface for duplicate/contradiction relation candidates.

Decision: adopt the retained consensus relation boundary as the active
pre-coding and review gate for the next consensus relation candidate work.

Consumer: next consensus/eval, graph-relation, and plan-bridge recall slices.

Falsifier: a future consensus relation task cannot surface the retained pattern
from `krn brain knowledge` / `krn brain search`, or still requires raw JSON,
implementation code, or historical reports to understand relation focus,
question, usefulness, evidence refs, decision options, or mutation boundaries.

## Review Burden Delta

Before CQR-01, the pattern was retained but not yet proven reusable by the next
readback loop.

After CQR-01:

- exact and natural readbacks select the retained pattern;
- combined brain-search marks it target-specific;
- heartbeat preview makes the candidate review surface visible;
- the plan bridge miss is isolated to one follow-up issue.

Review burden: low for brain-search/heartbeat reuse; medium for plan-bridge
reuse until `mise-en-palace-9ck` is fixed or explicitly rejected.

## Commands

Passed:

```txt
git fetch --prune
git status --short --branch
git log --oneline --decorate -8
bd prime
bd show mise-en-palace-vgy
bd update mise-en-palace-vgy --claim
pnpm db:ready
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --text "consensus relation heartbeat review boundary" --limit 5 --json
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --usefulness-outcome helped --text "consensus relation candidate review duplicate relation question usefulness" --limit 5 --json
krn brain search --query "consensus relation candidate review duplicate relation question usefulness" --catalog-file docs/brain-knowledge/catalog.json --limit 5 --max-inclusions 3 --json
krn plan --persist
krn heartbeat preview --candidate-kind consensus_evaluation --consensus-candidate-file docs/reviews/controlled-dogfood/2026-07-01-cru-01-consensus-readback-review/consensus-candidate.json --max-candidates 1 --json
bd create --title "Repair retained pattern plan bridge recall for consensus relation boundary" ...
krn evidence capture --persist
krn observe --persist
krn reflect --persist
```

Failed then rerun correctly:

```txt
krn brain search ... --json
krn heartbeat preview ... --json
```

Failure reason: `KRN_DATABASE_URL` was missing. Reruns with
`KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn` passed.

Persisted evidence/readback IDs:

```txt
evidenceBundle: 76cb53e9-0aa2-48e2-a4bb-b9b5d04f8da1
reviewAssessment: 68f23ce2-3352-4534-b3f3-b89c3ea8f923
feedbackDelta: 17997b05-058d-4793-90da-bc3354cb185a
observationGroup: bfca30d9-132c-4622-af24-1fbe72b184ab
reflectionRecord: 202736d2-8515-453a-8a37-37050c567c1d
```

Observe/reflect status:

```txt
observation items: 5
reflection observations selected: 5
findings: 0
contradictions: 0
gaps: 0
candidate rows written: no
MemoryRecord created: no
```

## What This Proves

- The retained consensus relation boundary is selected by exact and natural
  brain-knowledge queries.
- Combined brain search classifies the selected pattern as target-specific.
- The selected pattern changes the next source-to-decision decision: use
  heartbeat consensus_evaluation readback for relation candidate review before
  runtime/ranking/mutation work.
- The heartbeat consensus_evaluation lane remains candidate-only and
  mutation-free for the CRU-01 duplicate relation candidate.

## What This Does Not Prove

- source truth;
- relation correctness;
- duplicate consolidation safety;
- consensus correctness;
- graph ranking quality;
- plan-bridge retained-pattern recall quality;
- autonomous worker execution;
- Memory Core mutation safety outside this read-only path;
- product readiness.

## Candidates

MemoryCandidate:

```txt
Consensus relation tasks should query retained brain knowledge first and use
heartbeat consensus_evaluation readback before runtime, graph ranking, source
truth, or Memory Core mutation work.
```

EvalCandidate:

```txt
Plan retained-pattern selection should select
pattern:consensus-relation-heartbeat-review-boundary for a consensus relation
candidate review task that brain knowledge/search already selects.
```

No candidate was promoted.

## Next

Repair or explicitly reject the retained-pattern plan bridge recall gap:

```txt
mise-en-palace-9ck: Repair retained pattern plan bridge recall for consensus relation boundary
```
