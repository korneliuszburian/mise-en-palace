# IMR-28 AMA Source-Search Review

Status: complete.

Issue: `mise-en-palace-6qu`.

## Executive Verdict

The narrower source-search review did not resolve the AMA acquisition evidence
gap.

Store-backed source search can retrieve KRN governance claims and linked
SearchDocument references around acquisition, heartbeat, ingest, graph, and
bounded context. It still does not retrieve direct included SearchDocument
evidence for the `Towards Autonomous Memory Agents` mechanism:

```txt
cost-aware knowledge-extraction cascade
semantic-aware Thompson sampling
benchmark gains on HotpotQA / AIME25
```

Decision: open one bounded external source-decision/readback issue, not a broad
research lane. The next slice is `mise-en-palace-urp`.

## Scope

Inspected:

- current root active state;
- retained AMA source decision in `docs/KRN_SOURCES.md`;
- retained acquisition escalation pattern;
- IMR-27 linked-document review;
- live current-shell source-search readback for five narrower AMA queries;
- arXiv metadata for `2602.22406`.

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, runtime behavior, DB schema, crawler, worker daemon, API/MCP,
ranking, source truth, eval candidate, or Memory Core state changed.

## Source-To-Decision

- Source: `Towards Autonomous Memory Agents`, arXiv `2602.22406`, current
  retained KRN source decision, and live KRN source-search readback.
- Mechanism: U-Mem proposes active memory acquisition with a low-to-high cost
  knowledge-extraction cascade and semantic-aware Thompson sampling for
  exploration/exploitation over memories.
- KRN implication: KRN should not stop at passive retained docs. The brain needs
  a bounded acquisition path that can turn missing evidence into reviewable
  source work, while preserving candidate-only mutation boundaries.
- Decision: source-search review is insufficient; proceed to one bounded
  external source-decision/readback slice for the AMA paper.
- Rejection: no autonomous acquisition, crawler, worker daemon, API/MCP, DB
  schema, ranking rewrite, broad benchmark, source truth mutation, or Memory
  Core mutation.
- Consumer: pattern/research brain, heartbeat acquisition lane, future
  activation utility hypotheses, and brain-QA/eval candidates.
- Falsifier: the external AMA source-decision/readback cannot produce a
  reviewable local source decision or source artifact through existing paths, or
  it tries to bypass review gates and mutate durable memory.

## Query Review

Raw artifacts:

```txt
/tmp/krn-imr-28-ama-source-search-review/*.json
/tmp/krn-imr-28-ama-source-search-review/*.raw.json
```

| Query | Usefulness | Claims | Docs | Links | Verdict |
|---|---:|---:|---:|---:|---|
| `Towards Autonomous Memory Agents` | partly useful / missing document | 8 | 0 | 8 | Retrieves local KRN governance claims, not direct AMA paper evidence. |
| `knowledge-extraction cascade` | partly useful / missing document | 8 | 0 | 8 | Finds ingest/source graph context, not the AMA cascade mechanism. |
| `Semantic-Aware Thompson Sampling` | partly useful / missing document | 8 | 0 | 8 | Finds graph/activation context, not direct Thompson sampling evidence. |
| `Autonomous Memory Agents benchmark gains HotpotQA AIME25` | partly useful / missing document | 8 | 0 | 8 | Does not retrieve direct benchmark evidence. |
| `Autonomous Memory Agents cost-aware knowledge-extraction cascade semantic-aware Thompson sampling` | partly useful / missing document | 8 | 0 | 8 | Still over-constrained and missing included SearchDocument evidence. |

Common diagnostic:

```txt
likely over-constrained query shape: SourceClaims matched, but lexical
SearchDocument retrieval returned zero results; try a narrower topic-specific
query before changing ranking or coverage.
```

## External Source Check

arXiv metadata confirms:

```txt
title: Towards Autonomous Memory Agents
arxiv_id: 2602.22406
date: 2026-02-25
authors: Xinle Wu, Rui Zhang, Mustafa Anis Hussain, Yao Lu
pdf: https://arxiv.org/pdf/2602.22406
mechanism in abstract:
  cost-aware knowledge-extraction cascade;
  semantic-aware Thompson sampling;
  active acquire/validate/curate knowledge at minimum cost.
```

The social claim that this was "Oxford" was not treated as source truth. The
arXiv metadata readback is the authority used here.

## Decision

Source-search review partially resolves local KRN alignment:

```txt
candidate-only acquisition boundary: supported
linked-document/source-search escalation: supported
local source graph/readback caveats: supported
direct AMA paper mechanism evidence in store-backed search: still missing
```

Next step:

```txt
mise-en-palace-urp: Run bounded AMA external source-decision readback.
```

This keeps the retained cost-aware acquisition path:

```txt
linked_document_review -> source_search_review -> bounded_external_research
```

and stops before human review, crawler work, autonomous acquisition, or source
truth mutation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd prime` | passed | Beads workflow context was available after continuation. | Does not prove task correctness. |
| `rtk git fetch --prune && rtk git status --short --branch && rtk git log --oneline -n 8` | passed | Current worktree and local/remote state were inspected before work. | Does not prove source-search sufficiency. |
| `rtk bd show mise-en-palace-6qu` | passed | Active Beads issue and acceptance criteria were inspected. | Does not prove the issue is complete. |
| Five narrow `krn source search --json` commands | passed | Current Postgres can read persisted source/search candidates for the narrow queries and consistently reports missing included SearchDocument evidence. | Does not prove source truth, ranking quality, or that external research will resolve the gap. |
| `rtk curl -L https://arxiv.org/abs/2602.22406` | passed | arXiv metadata for the AMA paper is externally reachable in the current shell. | Does not validate paper claims or transfer benchmark gains to KRN. |

## Proof Boundary

Proves:

- source-search review was attempted before external acquisition;
- the store-backed source-search lane still lacks direct included SearchDocument
  evidence for the AMA paper mechanism;
- the next cost-aware step is bounded external source-decision/readback.

Does not prove:

- source truth;
- paper correctness;
- benchmark transfer to KRN;
- semantic ranking quality;
- acquisition success;
- autonomous acquisition safety;
- Memory Core usefulness;
- product readiness.
