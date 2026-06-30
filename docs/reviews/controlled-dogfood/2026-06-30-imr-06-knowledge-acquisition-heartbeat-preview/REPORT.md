# IMR-06 Knowledge Acquisition Heartbeat Candidate Preview

Status: source/product slice.

Date: 2026-06-30

## Executive Verdict

KRN now has a bounded candidate-only path for one key Autonomous Memory Agents
mechanism: explicit missing-evidence readback can become reviewable knowledge
acquisition work. This is not autonomous memory mutation. It is a heartbeat
preview candidate with source, query, missing evidence, consumer, falsifier,
`doesNotProve`, reviewability, `mutation: none`, and forbidden writes.

The slice deliberately stops before an operator-facing bridge from live
source/brain search output. That bridge is the next bounded issue, because q95
only required a fixture or CLI preview and the safest final-pattern first step
is the worker candidate primitive.

## Scope

Beads issue:

```txt
mise-en-palace-q95: Lab-test memory acquisition escalation candidate.
```

Changed source:

```txt
packages/workers/src/knowledgeAcquisitionHeartbeatPreview.ts
packages/workers/src/knowledgeAcquisitionHeartbeatPreview.test.ts
packages/workers/src/brainHeartbeatPreview.ts
packages/workers/src/brainHeartbeatPreview.test.ts
packages/workers/src/index.ts
packages/cli/src/runHeartbeatPreviewCommand.ts
```

Changed docs/state:

```txt
PLAN.md
PLANS.md
docs/reviews/controlled-dogfood/2026-06-30-imr-06-knowledge-acquisition-heartbeat-preview/REPORT.md
```

Non-goals:

- no DB schema;
- no crawler;
- no API/MCP/dashboard;
- no worker daemon;
- no ranking rewrite;
- no automatic Memory Core/source/eval mutation;
- no broad research archive.

## Source-To-Decision

```yaml
source_id: autonomous-memory-agents
title: Towards Autonomous Memory Agents
url: https://arxiv.org/abs/2602.22406
decision_kind: lab_test
mechanism: >
  Autonomous memory agents actively acquire, validate, and curate missing
  knowledge instead of relying only on passively accumulated conversation
  history.
krn_implication: >
  KRN should convert explicit missing-evidence readback into reviewable
  acquisition/escalation candidates before any memory/source/eval mutation.
decision: >
  Implement a worker-level knowledge-acquisition heartbeat preview candidate and
  aggregate it into brain heartbeat. Defer the live source/brain search bridge
  to a separate bounded issue.
consumer: >
  Heartbeat/dreaming candidate runtime and the next operator-facing
  missingEvidence bridge.
falsifier: >
  Missing-evidence input cannot produce a reviewable candidate, or candidate
  output mutates Memory Core, source truth, eval candidates, worker jobs, or DB
  schema.
does_not_prove: >
  Source truth, acquisition quality, ranking quality, product readiness,
  autonomous worker execution, or full source-search integration.
```

## Store-Backed Pattern Gate

Before coding, store-only brain search was run for:

```txt
Autonomous Memory Agents missing evidence acquisition escalation heartbeat candidate-only
```

Selected/used patterns:

| Pattern | Verdict | Use |
|---|---|---|
| task-specific context selection | helped | Kept the slice to a candidate preview, not crawler/runtime work. |
| local source claims drive bounded source decisions | helped | Confirmed this should remain source-to-decision plus falsifier. |
| graph relation packets | neutral | Relevant to future graph work, not the owner for this slice. |
| AMA paper retained source | used from `docs/KRN_SOURCES.md` | Defined active-acquisition as lab-test only. |

Missing:

```txt
No existing bridge from source/brain search missingEvidence output to heartbeat
knowledge-acquisition input. Created mise-en-palace-jta for that bounded bridge.
```

## What Changed

- Added `buildKnowledgeAcquisitionHeartbeatPreview`.
- Added `KnowledgeAcquisitionRequest` and
  `KnowledgeAcquisitionHeartbeatCandidate`.
- Aggregated acquisition candidates into `buildBrainHeartbeatPreview`.
- Extended heartbeat candidate counts/skipped counts and CLI rendering for the
  new candidate kind.
- Preserved `mutation: none` and explicit forbidden writes.

## Candidate Behavior

Input:

```txt
source: brain_search | source_search
query: text
missingEvidence: non-empty list
evidenceRefs: source/search/report refs
consumer: bounded consumer
falsifier: local falsifier
doesNotProve: proof boundary
```

Output:

```txt
kind: knowledge_acquisition_candidate
action: propose_knowledge_acquisition
reason: missing_evidence
reviewability: ready | needs_more_evidence
mutation: none
forbiddenWrites:
  memory_records
  anti_memory_records
  source_claims
  source_decisions
  source_claim_edges
  eval_candidates
  worker_jobs
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk bd prime` | passed | Beads state was loaded before continuing. | Does not prove the selected issue was complete. |
| `rtk env KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn pnpm --filter @krn/cli krn brain search --query "Autonomous Memory Agents missing evidence acquisition escalation heartbeat candidate-only" --store-only --limit 5 --json` | passed | Store-backed pattern/search readback was available before coding. | Does not prove ranking quality or complete retained pattern coverage. |
| `rtk pnpm --filter @krn/workers test -- knowledgeAcquisitionHeartbeatPreview brainHeartbeatPreview` | passed | Worker candidate preview and aggregator behavior are covered. | Does not prove CLI live integration or product readiness. |
| `rtk pnpm --filter @krn/cli test -- runHeartbeatPreviewCommand` | passed | CLI heartbeat rendering still handles heartbeat candidates after the new union member. | Does not prove a live source-search bridge exists. |
| `rtk pnpm --filter @krn/harness test -- activePlanInvariants patternChainInvariants sourceMapInvariants` | passed | Compact active state, pattern chain, and source map invariants still hold. | Does not prove product readiness. |
| `rtk pnpm -r --workspace-concurrency=1 --if-present typecheck` | passed | TypeScript strict boundaries compile across packages. | Does not prove runtime usefulness. |
| `rtk pnpm quality:fallow:ci` | passed | Fallow changed-files quality gate found no issues in changed files. | Does not prove whole-repo semantic quality. |
| `rtk pnpm test` | passed | Full workspace tests pass after the candidate preview change. | Does not prove real acquisition improves future work. |
| `rtk pnpm db:ready` | passed | Current-shell Postgres, migrations, and pgvector are ready. | Does not prove production DB state. |
| `rtk git diff --check` | passed | Diff has no whitespace errors. | Does not prove behavior correctness. |

## Brain Usefulness

Verdict: positive.

The retained paper and store-backed brain packets shaped the implementation:
the paper supplied the acquisition mechanism, while KRN source-to-decision
rules kept the output candidate-only and review-gated. The implementation
improves the heartbeat/dreaming layer without adding autonomous execution.

What this does not prove:

- live source/brain search output is wired into heartbeat preview;
- acquisition improves answer quality;
- ranking is correct;
- worker scheduling is ready;
- product readiness.

## Next Action

```txt
mise-en-palace-jta: Route missing-evidence readback into acquisition preview.
```
