# IMR-05 Store-Backed Pattern Gate For Autonomous Memory Agents

Status: docs/source-decision slice, not implementation.

Date: 2026-06-30

## Executive Verdict

The Autonomous Memory Agents paper is relevant to KRN, but only as a lab-test
source. Its mechanism maps cleanly to KRN heartbeat/dreaming: when the brain
cannot answer because evidence is missing, stale, contradictory, or weak, it
should propose a reviewable acquisition/escalation candidate. It does not
justify autonomous Memory Core mutation, broad crawling, ranking rewrites, API,
MCP, dashboard, or product-readiness claims.

The store-backed pattern gate helped by constraining the intake to bounded
source decisions and by showing the paper was not yet retained in KRN brain
knowledge. That missing signal is useful: the next step is one falsifiable
candidate-lane lab-test, not a research backlog.

## Scope

Issues:

```txt
mise-en-palace-nrw: Use store-backed brain packets as pre-coding pattern gate.
mise-en-palace-1sv: Evaluate Autonomous Memory Agents paper for KRN memory acquisition.
```

Changed files:

```txt
docs/KRN_SOURCES.md
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-30-imr-05-store-backed-pattern-gate-ama/REPORT.md
```

Non-goals:

- no runtime source changes;
- no Memory Core mutation;
- no crawler, API, MCP, dashboard, worker daemon, or ranking rewrite;
- no product-readiness claim;
- no broad research archive.

## Store-Backed Brain Pre-Gate

Command:

```sh
rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "autonomous memory agents active knowledge acquisition memory heartbeat dreaming" --store-only --limit 5 --json
```

Result:

```txt
brainKnowledgeReadback: store_only
selectedKnowledge: 5 packets
answerUsefulness: partly_useful_missing_document
```

Usefulness:

| Packet | Verdict | Why |
|---|---|---|
| `e3a72d7f-0fbf-4263-a2f8-cf8c93cc9c27` | helped | Reinforced that KRN should select, apply, verify, and forget task-specific context instead of loading broad context. |
| `b055fffe-de70-49e4-86b0-a806a2f12e86` | helped | Reinforced that local source claims should drive bounded source-decision edges. |
| `3afb4c95-eaad-4df1-aa72-e8c739f385dd` | neutral/helped | Supported using governed local artifact/source-claim preview, but did not define this paper decision by itself. |
| graph relation packets | neutral/noise | Relevant to graph-brain work, but not the owner knowledge for this paper intake. |
| missing AMA paper | helped as gap | The paper was not retained before this run, so source-search correctly could not use it as brain knowledge. |

Proof boundary:

```txt
Proves: store-backed selected knowledge can shape a bounded paper intake.
Does not prove: semantic ranking quality, complete pattern coverage, paper truth,
or that source-search selected every best possible context item.
```

## Source-To-Decision

```yaml
source_id: autonomous-memory-agents
title: Towards Autonomous Memory Agents
url: https://arxiv.org/abs/2602.22406
trust_tier: medium
source_class: papers
mechanism: >
  Memory agents become more useful when they actively acquire, validate, and
  curate missing knowledge through a cost-aware cascade and memory-selection
  exploration/exploitation, rather than only storing available history.
krn_implication: >
  KRN heartbeat/dreaming should propose candidate-only acquisition or
  escalation work when source/brain search reports missing, stale,
  contradictory, or low-confidence evidence.
decision_kind: lab_test
decision: >
  Retain the paper as a bounded lab-test source for a memory acquisition
  escalation candidate lane. Do not add autonomous memory mutation, crawler,
  API, MCP, dashboard, or ranking rewrite from this source alone.
does_not_prove: >
  KRN product readiness, source truth, that paper benchmark gains transfer to
  KRN, that Oxford is the paper affiliation, or that autonomous retrieval should
  bypass KRN review gates.
consumer: >
  Heartbeat/dreaming candidate runtime, pattern/research brain, source-search
  missing-evidence readback, and future brain-QA/eval candidates.
falsifier: >
  A future missing-evidence run cannot produce a reviewable acquisition or
  escalation candidate, or an acquisition path mutates durable memory without
  review-gated acceptance.
candidate_output:
  type: EvalCandidate
  reviewability: ready
  decision: review
```

## What Changed

- Added the paper to `docs/KRN_SOURCES.md` with source class, decision kind,
  mechanism, KRN implication, consumer, falsifier, and proof boundary.
- Updated compact active state to point at the next bounded issue:
  `mise-en-palace-q95`.
- Recorded this dogfood report as IMR-05.

## Candidate Output

```txt
EvalCandidate:
  Lab-test missing-evidence source/brain search -> acquisition/escalation candidate.

Why:
  The paper's active-acquisition mechanism only becomes useful in KRN if a
  missing-evidence condition creates a reviewable candidate without mutating
  durable truth.

Evidence refs:
  - docs/KRN_SOURCES.md#towards-autonomous-memory-agents
  - this report
  - Beads issue mise-en-palace-q95

Does not prove:
  product readiness, ranking quality, autonomous memory safety, or benchmark
  transfer.

Reviewability:
  ready
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk bd prime` | passed | Beads workspace was readable before continuing work. | Does not prove all Beads issues are complete. |
| `rtk git status --short --branch` | passed | Worktree state was inspected before edits. | Does not prove remote CI state. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "autonomous memory agents active knowledge acquisition memory heartbeat dreaming" --store-only --limit 5 --json` | passed | Store-backed selected knowledge was available before paper intake. | Does not prove semantic ranking quality or complete retained pattern coverage. |
| `rtk curl -L --max-time 20 https://arxiv.org/abs/2602.22406` | passed | Paper metadata and abstract were reachable from arXiv in this shell. | Does not prove paper claims transfer to KRN or social-post affiliation claims. |
| `rtk pnpm db:ready` | passed | Local DB readiness was checked during the slice. | Does not prove production DB state. |
| `rtk pnpm --filter @krn/harness test -- sourceMapInvariants activePlanInvariants patternChainInvariants` | passed | Source map and active plan invariants still hold after the retained paper decision. | Does not prove product readiness or future implementation quality. |
| `rtk git diff --check` | passed | The final diff has no whitespace errors. | Does not prove semantic correctness. |

## Brain Usefulness

Verdict: positive.

The brain helped keep the source intake bounded. It selected useful governing
packets about bounded context and source-to-decision behavior, and it exposed
that this specific paper was missing from retained knowledge before the slice.
The result is not a new product surface; it is one retained lab-test decision
and one bounded follow-up issue.

What still needs proof:

- missing-evidence readback creating a candidate automatically;
- candidate-only heartbeat/dreaming behavior under test;
- next-run reuse of this retained paper decision;
- any improvement in answer quality, retrieval quality, or review burden.

## Next Action

```txt
mise-en-palace-q95: Lab-test memory acquisition escalation candidate.
```
