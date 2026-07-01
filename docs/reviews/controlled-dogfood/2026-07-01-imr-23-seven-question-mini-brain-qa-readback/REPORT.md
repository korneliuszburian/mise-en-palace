# IMR-23 Seven-Question Mini Brain-QA Readback

Status: complete.

Issue: `mise-en-palace-rtp`.

## Executive Verdict

All seven compact Brain-QA questions were run through existing
`krn brain search --json`. The readback remains useful: every question returned
source-search evidence and graph-aware relation summaries, and four questions
selected retained brain knowledge.

The important gap is precise:

```txt
Q4 graph and Q6 heartbeat are source-search useful but do not select retained
patterns from the benchmark-shaped query.
```

This is not evidence for a broad ranking rewrite. It is evidence for a bounded
selected-knowledge recall repair or query-shape decision.

## Scope

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, benchmark harness, crawler, API/MCP, worker daemon, DB
schema, ranking rewrite, source truth, or Memory Core state changed.

## Source-To-Decision

- Source: `docs/benchmarks/brain-qa/v376-questions.json`, IMR-22, and live
  current-shell `krn brain search --json` readbacks.
- Mechanism: a compact Brain-QA batch can expose whether retained patterns are
  findable by realistic operator query shapes without creating a broad
  benchmark platform.
- KRN implication: KRN should use mini Brain-QA as a small product-facing
  readback loop for its own brain knowledge and source-search usefulness.
- Decision: accept the seven-question batch as useful evidence and open a
  bounded recall-gap repair for Q4/Q6.
- Rejection: no broad benchmark lane, semantic ranking rewrite, embeddings,
  crawler, API/MCP, worker daemon, DB schema, source truth mutation, or Memory
  Core mutation.
- Consumer: future mini Brain-QA readbacks and selected-knowledge recall repair.
- Falsifier: future mini Brain-QA reports cannot distinguish source-search
  usefulness from retained-pattern recall, or use this gap to justify a broad
  platform/ranking rewrite.

## Batch Results

Command pattern:

```sh
KRN_DATABASE_URL=postgres://krn:krn@localhost:54329/krn \
pnpm --filter @krn/cli krn brain search \
  --query "<query>" \
  --catalog-file docs/brain-knowledge/catalog.json \
  --limit 16 \
  --max-inclusions 6 \
  --json
```

Raw output directory:

```txt
/tmp/krn-imr-23-brain-qa
```

| ID | Selected knowledge | Source usefulness | Claims | Docs | Linked docs | Relations | Missing evidence | Verdict |
|---|---|---|---:|---:|---:|---:|---|---|
| V376-Q1 | `pattern:source-to-decision-retention-gate` | `useful` | 5 | 1 | 5 | 3 | none | useful |
| V376-Q2 | `pattern:codex-hook-deterministic-guardrail-boundary` | `partly_useful_missing_document` | 6 | 0 | 6 | 7 | artifact-linked docs visible but not included | useful with doc gap |
| V376-Q3 | `pattern:ts-boundary-unknown-first-result-state` | `partly_useful_missing_document` | 6 | 0 | 6 | 5 | artifact-linked docs visible but not included | useful with doc gap |
| V376-Q4 | none | `partly_useful_missing_document` | 6 | 0 | 6 | 6 | artifact-linked docs visible but not included | source useful, retained-pattern miss |
| V376-Q5 | none | `useful` | 5 | 1 | 5 | 4 | none | source useful, ingest pattern intentionally deferred |
| V376-Q6 | none | `partly_useful_missing_document` | 6 | 0 | 6 | 7 | artifact-linked docs visible but not included | source useful, retained-pattern miss |
| V376-Q7 | `pattern:cost-aware-acquisition-escalation-boundary` | `partly_useful_missing_document` | 6 | 0 | 6 | 4 | artifact-linked docs visible but not included | useful with doc gap |

Aggregate:

```txt
questions: 7
selectedKnowledgeHits: 4
source_useful: 2
source_partly_useful_missing_document: 5
source_no_answer: 0
graph_aware_results: 7
memory_mutation: none
```

## Gap Checks

Graph:

```txt
krn brain knowledge --text "graph relation readback boundary"
returned: pattern:graph-relation-readback-boundary

krn brain search --query "graph relation readback boundary source claim edge"
selectedKnowledge: none
```

Heartbeat:

```txt
krn brain knowledge --text "heartbeat candidate-only runtime boundary"
returned: pattern:heartbeat-candidate-only-runtime-boundary

krn brain search --query "heartbeat candidate-only runtime boundary"
selectedKnowledge:
- pattern:cost-aware-acquisition-escalation-boundary
- pattern:heartbeat-candidate-only-runtime-boundary
```

Interpretation:

- Q4 shows a selected-knowledge recall gap between `krn brain knowledge` and
  integrated `krn brain search`.
- Q6 shows a query-shape gap: narrower heartbeat wording selects the pattern,
  but the benchmark query does not.

## Review Burden Delta

Before: the compact benchmark still reflected six questions and did not show
whether Q7 or retained graph/heartbeat patterns were findable.

After: the batch identifies exactly where the brain is useful and where recall
fails:

- Q1/Q2/Q3/Q7: selected retained knowledge plus source-search evidence.
- Q4/Q6: source-search evidence, but missing selected retained knowledge.
- Q5: source-search evidence only, matching the earlier decision to defer ingest
  pattern retention.

Delta: reduced. The next repair is bounded to selected-knowledge recall rather
than broad search/ranking architecture.

## Next Bounded Action

Created:

```txt
mise-en-palace-3tr: Repair mini Brain-QA retained pattern recall gaps.
```

Rationale: Q4/Q6 reveal specific pattern-recall gaps after retention. The next
slice should inspect the smallest owning surface for selectedKnowledge matching
or benchmark query shape, then repair or explicitly preserve the gap with
evidence.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-rtp --claim` | passed | Durable task was claimed before work. | Does not prove readback usefulness. |
| `rtk pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove CI DB state or product readiness. |
| seven `rtk pnpm --filter @krn/cli krn brain search --json` commands via batch script | passed | Existing read-only brain search can run all seven compact questions and emit JSON evidence. | Does not prove answer correctness, source truth, ranking quality, semantic search quality, Memory Core mutation, or product readiness. |
| `rtk pnpm --filter @krn/cli krn brain knowledge --text "graph relation readback boundary" --json` | passed | The retained graph pattern exists and is findable through brain knowledge readback. | Does not prove integrated brain-search selectedKnowledge recall. |
| `rtk pnpm --filter @krn/cli krn brain search --query "graph relation readback boundary source claim edge" --json` | passed | Integrated brain search currently gives source-search evidence but no selected graph pattern for this graph query shape. | Does not prove a ranking rewrite is needed. |
| `rtk pnpm --filter @krn/cli krn brain knowledge --text "heartbeat candidate-only runtime boundary" --json` | passed | The retained heartbeat pattern exists and is findable through brain knowledge readback. | Does not prove benchmark Q6 selects it. |
| `rtk pnpm --filter @krn/cli krn brain search --query "heartbeat candidate-only runtime boundary" --json` | passed | Narrow heartbeat query can select the retained heartbeat pattern. | Does not prove broad heartbeat query quality. |

## Proof Boundary

Proves:

- all seven compact Brain-QA questions run through current-shell `krn brain
  search --json`;
- Q1/Q2/Q3/Q7 select retained knowledge;
- Q4/Q6 are source-search useful but miss retained pattern selection;
- Q5 remains source-search only, matching the earlier ingest-pattern deferral;
- no state mutation happened in the readback commands.

Does not prove:

- answer correctness;
- source truth;
- ranking quality;
- semantic search quality;
- graph retrieval quality;
- broad benchmark quality;
- autonomous learning quality;
- Memory Core usefulness;
- product readiness.
