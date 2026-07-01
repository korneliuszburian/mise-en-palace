# IMR-50 Target-Fit Brain-QA Closure

Status: complete.

## Objective

Run a compact target-fit-aware Brain-QA/usefulness closure across current KRN
and second-repo queries, then choose the next bounded vertical slice from
evidence instead of opening an activation scoring or ranking repair.

## Source To Decision

- Source: IMR-49 target-fit-aware brain-search readback and current-shell
  store-backed Brain-QA batch.
- Mechanism: `knowledgeCards.targetFitSummary` distinguishes target-specific
  selectedKnowledge from generic-only guardrails, while source-search fields
  expose source evidence and missing included-document proof.
- KRN implication: the next product slice should route a real target-fit gap
  into candidate-only acquisition, not tune ranking by guesswork.
- Decision: next implement heartbeat acquisition routing for
  `generic_only_selected_knowledge` plus useful target/source evidence.
- Rejection: no activation scoring/ranking rewrite, crawler, DB schema, worker
  daemon, API/MCP, target writes, source truth mutation, eval promotion, or
  Memory Core mutation.
- Consumer: heartbeat/dreaming candidate runtime and multi-repo shared-brain
  usefulness loop.
- Falsifier: the q2-shaped readback already emits a reviewable acquisition
  candidate, or generic-only target-fit gaps keep producing no follow-up route.

## Batch

Command shape:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
  pnpm --filter @krn/cli krn brain search \
  --store-only --limit 12 --max-inclusions 6 --json
```

| Q | Query | Target-fit verdict | Source evidence | Result |
|---|---|---|---|---|
| 1 | `source artifact persisted readback SourceArtifact SourceChunk SearchDocument` | `target_specific_selected_knowledge` | 6 claims, 0 docs, 6 linked docs, 6 relations, 2 source decisions | Strong target-specific selectedKnowledge; included docs still missing. |
| 2 | `EKOLOGUS Brain quality gate` | `generic_only_selected_knowledge` | 5 claims, 1 doc, 5 linked docs, 5 relations, no missing evidence | Source evidence is useful, but selectedKnowledge is generic guardrails only. |
| 3 | `graph relation sourceclaimedge temporal relations graph-aware retrieval` | `target_specific_selected_knowledge` | 6 claims, 0 docs, 6 linked docs, 6 relations | Graph patterns are recalled; included docs still missing. |
| 4 | `heartbeat knowledge acquisition missing evidence candidate-only escalation` | `target_specific_selected_knowledge` | 6 claims, 0 docs, 6 linked docs, 1 relation, 2 source decisions | Heartbeat/acquisition patterns are recalled; included docs still missing. |
| 5 | `consensus eval candidate pro con dissent doesNotProve reviewable candidate` | `target_specific_selected_knowledge` | 6 claims, 0 docs, 6 linked docs, 2 relations, 2 source decisions | Consensus/eval preview pattern is recalled; no implementation slice yet. |
| 6 | `pattern research source-to-decision retained pattern falsifier senior TypeScript standards` | `target_specific_selected_knowledge` | 6 claims, 0 docs, 6 linked docs, 5 relations, 3 source decisions | Pattern/research rules are recalled; included docs still missing. |

## Closure

The target-fit repair is useful:

- 5/6 queries now clearly show target-specific selectedKnowledge.
- The second-repo query no longer hides behind generic selectedKnowledge; it is
  clearly `generic_only_selected_knowledge`.
- Source-search evidence for the second repo is useful, including one included
  SearchDocument and five linked docs.

The remaining product gap is not activation scoring. It is routing:

```txt
generic_only_selected_knowledge
+ useful target/source evidence
-> candidate-only acquisition request for target-specific SourceClaim review
```

Current heartbeat preview does not route this gap:

```txt
krn heartbeat preview --candidate-kind knowledge_acquisition \
  --acquisition-readback-file /tmp/krn-imr50/q2.json --json
```

Result:

```txt
knowledgeAcquisition candidates: 0
reviewEvalClosure: no_reviewable_candidates
mutation: none
```

## Next Slice

Created Beads issue:

```txt
mise-en-palace-zh0 — Route generic-only target-fit readback into heartbeat acquisition
```

Goal: make heartbeat preview consume brain-search `targetFitSummary` so a
generic-only selectedKnowledge readback with useful target/source evidence
produces a mutation-free knowledge acquisition candidate.

## Verification

```txt
git fetch --prune: passed
git status --short --branch: clean before work
git log --oneline -n 8: inspected
bd prime: inspected
pnpm db:ready: passed
six store-only brain-search JSON readbacks: passed
heartbeat preview over q2 generic-only readback: passed; emitted no candidates
```

## What This Proves

- Target-fit summary is useful as a Brain-QA closure signal.
- Current KRN internal queries mostly recall target-specific selectedKnowledge.
- Second-repo source evidence can be useful while selectedKnowledge remains
  generic-only.
- The next highest-ROI product slice is a heartbeat acquisition route for that
  generic-only target-fit gap.

## What This Does Not Prove

- Product readiness.
- Activation scoring quality.
- Ranking quality.
- Source truth.
- Autonomous heartbeat/dreaming runtime.
- Graph, ingest, consensus, or Memory Core mutation correctness.
