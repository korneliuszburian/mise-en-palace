# IMR-34 Activation Utility Readback Usefulness Check

Status: complete bounded usefulness check.

Issue: `mise-en-palace-mo4`.

## Executive Verdict

The new `activationUtility` readback is useful across the current batch. It
does not justify ranking changes, but it gives operators a better decision
surface:

- 6/8 queries: selected brain knowledge is sufficient; linked evidence remains
  supporting context.
- 2/8 queries: selected brain knowledge is missing, but source/link/graph
  evidence is useful; treat as exploration context.
- 0/8 queries: insufficient evidence.

Decision: accept the readback and route `linked_evidence_exploration_candidate`
into the next candidate-only heartbeat preview slice. Do not change ranking.

## Source To Decision

```yaml
source_id: arxiv:2602.22406
title: Towards Autonomous Memory Agents
url: https://arxiv.org/abs/2602.22406
trust_tier: medium
source_class: papers
mechanism: U-Mem proposes semantic-aware Thompson sampling to balance memory
  exploration and exploitation.
krn_implication: KRN should preserve exploration candidates when selected brain
  knowledge is absent but useful source/link/graph evidence exists.
decision_kind: adopt_candidate_only_followup
decision: keep activationUtility as read-only output and open a heartbeat
  candidate-only follow-up; do not change production ranking.
consumer: heartbeat preview candidate routing and future eval/golden candidates.
falsifier: batch readback cannot separate selected-knowledge-sufficient cases
  from linked-evidence exploration cases, or heartbeat routing mutates final
  memory/source truth.
does_not_prove: paper correctness, benchmark transfer to KRN, source truth,
  activation ranking quality, semantic-aware Thompson sampling, product
  readiness, or Memory Core mutation safety.
```

## Batch

Raw output directory:

```txt
/tmp/krn-imr-34-activation-utility-usefulness/
```

Command shape:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --silent --filter @krn/cli krn brain search \
  --query "<query>" \
  --catalog-file docs/brain-knowledge/catalog.json \
  --limit 16 \
  --max-inclusions 8 \
  --json
```

| ID | Selected knowledge | Source/link/graph | Verdict | Usefulness |
|---|---:|---|---|---|
| Q1 source-to-decision | 1 | useful | `selected_knowledge_sufficient` | helped |
| Q2 hook guardrail | 1 | useful | `selected_knowledge_sufficient` | helped |
| Q3 unknown-first TS | 1 | useful | `selected_knowledge_sufficient` | helped |
| Q4 graph relation | 1 | useful | `selected_knowledge_sufficient` | helped |
| Q5 ingest v0 | 0 | useful | `linked_evidence_exploration_candidate` | helped |
| Q6 heartbeat/dreaming | 2 | useful | `selected_knowledge_sufficient` | helped |
| Q7 acquisition escalation | 1 | useful | `selected_knowledge_sufficient` | helped |
| AMA natural query | 0 | useful | `linked_evidence_exploration_candidate` | helped |

Aggregate:

```txt
queries: 8
selected_knowledge_sufficient: 6
linked_evidence_exploration_candidate: 2
insufficient_evidence: 0
noise: 0
stale: 0
mutation: none
```

## Interpretation

The readback helps in two ways:

1. When selected knowledge exists, it tells the operator to use brain knowledge
   first and keep linked evidence as support.
2. When selected knowledge is missing but linked evidence is useful, it prevents
   a false low-utility conclusion and points to exploration context.

This is enough to route the exploration verdict into candidate-only heartbeat
preview. It is not enough to change activation ranking.

## Next Issue

```txt
mise-en-palace-6mn: Route activation utility exploration candidates into heartbeat preview.
```

Acceptance target:

```txt
heartbeat preview preserves activationUtility exploration evidence in a
candidate-only follow-up with mutation none and proof/non-proof boundaries.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-mo4 --claim` | passed | Durable task was claimed before work. | Does not prove readback usefulness. |
| eight `krn brain search --json` commands via batch script | passed | Current brain-search output exposes activationUtility over the mini Brain-QA/AMA batch. | Does not prove answer correctness, source truth, ranking quality, semantic search quality, or product readiness. |
| batch summarizer | passed | The readback can be condensed into selectedKnowledge/sourceLinkGraph/verdict/usefulness rows. | Does not prove future usefulness outside this batch. |

## Proof Boundary

Proves:

- activationUtility is visible and parseable in current `krn brain search`
  output;
- current mini Brain-QA/AMA batch has two useful exploration candidates and six
  selected-knowledge-sufficient cases;
- no query mutated KRN state.

Does not prove:

- source truth;
- answer correctness;
- ranking quality;
- semantic-aware Thompson sampling;
- autonomous learning;
- Memory Core usefulness;
- product readiness.
