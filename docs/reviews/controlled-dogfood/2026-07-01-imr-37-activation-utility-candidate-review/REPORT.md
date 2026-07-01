# IMR-37 Activation Utility Candidate Review

Status: complete bounded review closure.

Issue: `mise-en-palace-z22`.

## Executive Verdict

The heartbeat-routed activation utility candidate was reviewed through the
existing `krn heartbeat preview` manual candidate review surface.

Decision: `accept_for_manual_followup`.

The candidate is accepted only for manual source/eval follow-up. This does not
promote memory, mutate source truth, change ranking, create a worker job, or
claim semantic-aware Thompson sampling.

## Source To Decision

```yaml
source_id: docs/reviews/controlled-dogfood/2026-07-01-imr-36-activation-utility-eval-proof/REPORT.md
title: IMR-36 activation utility eval proof
trust_tier: repo-local evidence
source_class: dogfood report
mechanism: IMR-36 protects a heartbeat-routed activation utility acquisition
  candidate with behavior proof, mutation none, forbidden writes, and
  doesNotProve boundaries.
krn_implication: The next vertical step should review one concrete candidate
  result before retention, ranking, source truth, or runtime work.
decision_kind: adopt
decision: Use the existing manual heartbeat candidate review surface and accept
  the live AMA activation utility candidate for manual source/eval follow-up.
consumer: heartbeat candidate review closure and next source/eval follow-up
  slice.
falsifier: review cannot find the candidate, candidate reviewability is not
  ready, activationUtilityEvidence is absent, mutation is not none, or the
  follow-up requires ranking/schema/worker/API/MCP/Memory Core mutation.
does_not_prove: candidate truth, source truth, source-search completeness,
  ranking quality, semantic-aware Thompson sampling, autonomous acquisition,
  worker daemon readiness, or product readiness.
```

Retained patterns used:

| Pattern | Outcome | Evidence |
|---|---|---|
| `heartbeat-candidate-only-runtime-boundary` | helped | Kept review candidate-only with forbidden writes and mutation none. |
| `cost-aware-acquisition-escalation-boundary` | helped | Kept next step on linked/source/eval follow-up before external research or runtime work. |

## Live Readback

Raw readback files:

```txt
/tmp/krn-imr-37-activation-utility-candidate-review/brain-ama.json
/tmp/krn-imr-37-activation-utility-candidate-review/heartbeat-review.json
/tmp/krn-imr-37-activation-utility-candidate-review/heartbeat-review.txt
```

Brain-search query:

```txt
Towards Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling
```

Brain-search summary:

```txt
selectedKnowledge: 0
supportingClaims: 8
supportingDocuments: 0
sourceClaimDocumentLinks: 8
linkedSearchDocuments: 8
activationUtility.verdict: linked_evidence_exploration_candidate
activationUtility.selectedKnowledge: missing
activationUtility.sourceLinkGraph: useful
mutation: none
```

Candidate review result:

```txt
candidateId: knowledge-acquisition-heartbeat:readback-brain-search-towards-autonomous-memory-agents-cost-aware-knowledge-extraction-cascade:missing_evidence
candidateFound: true
decision: accept_for_manual_followup
nextAction: capture_review_evidence
candidateReviewability: ready
mutation: none
```

Review reason:

```txt
Activation utility candidate preserves selectedKnowledge missing, useful
source/link/graph evidence, evidence refs, doesNotProve, and mutation none;
accept for manual source/eval follow-up without promotion or ranking change.
```

## Decision

Accept the candidate for manual source/eval follow-up.

This is not a promotion. It only means the candidate is reviewable enough to
route into the next bounded retention/follow-up slice.

Next bounded action:

```txt
retain or record the accepted activation utility candidate as a bounded
source/eval follow-up artifact, still without ranking, schema, worker, API/MCP,
crawler, source truth, or Memory Core mutation.
```

## Proof Boundary

Proves:

- live DB-backed `krn brain search` still emits an activation utility exploration
  case for the AMA query;
- `krn heartbeat preview` can review the emitted candidate by exact candidate
  id;
- the candidate is found, reviewable, accepted for manual follow-up, and
  mutation-free;
- review output preserves proof/non-proof and forbidden-write boundaries.

Does not prove:

- AMA paper correctness;
- benchmark transfer;
- source truth;
- answer correctness;
- ranking quality;
- semantic-aware Thompson sampling;
- autonomous acquisition;
- worker daemon readiness;
- product readiness;
- Memory Core mutation safety.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm db:ready` | passed | Current shell Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove remote DB state. |
| `rtk ... krn brain knowledge --text "activation utility heartbeat candidate review evidence"` | passed, 0 results | Over-specific retained-pattern query has no match. | Does not prove no relevant pattern exists. |
| `rtk ... krn brain knowledge --text "heartbeat candidate"` | passed, 2 results | Retained heartbeat/acquisition patterns are available as read-only context. | Does not prove live DB state or ranking quality. |
| `rtk ... krn brain search --json` | passed | Live AMA readback exposes selectedKnowledge miss plus useful source/link/graph evidence. | Does not prove source truth or ranking quality. |
| `rtk ... krn heartbeat preview --review-* --json/text` | passed | Existing heartbeat review surface records `candidateFound: true`, `accept_for_manual_followup`, `candidateReviewability: ready`, and `mutation: none`. | Does not promote the candidate or prove product readiness. |

## Follow-Up

Open one bounded follow-up:

```txt
Retain accepted activation utility review as source/eval follow-up evidence.
```

The follow-up must stay candidate-only/review-only unless existing KRN source or
eval surfaces can represent the result without new schema, ranking, runtime, or
Memory Core mutation.
