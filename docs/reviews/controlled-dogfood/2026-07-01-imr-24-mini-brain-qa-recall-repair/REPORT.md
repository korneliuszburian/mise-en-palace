# IMR-24 Mini Brain-QA Retained Pattern Recall Repair

Status: complete.

Issue: `mise-en-palace-3tr`.

## Executive Verdict

The mini Brain-QA retained-pattern recall gap is repaired in the smallest
owning product surface: `krn brain search`.

Before:

```txt
Q4 graph query: selectedKnowledge = none
Q6 heartbeat query: selectedKnowledge = none
```

After:

```txt
Q4 graph query: selectedKnowledge = pattern:graph-relation-readback-boundary
Q6 heartbeat query: selectedKnowledge includes pattern:heartbeat-candidate-only-runtime-boundary
```

The repair does not change `krn brain knowledge` catalog semantics. It adds one
deterministic no-match retry inside integrated `krn brain search`: if the full
operator query returns no catalog-backed retained pattern, `brain search`
retries selected-knowledge readback with bridge terms removed.

## Scope

Changed:

- `packages/cli/src/runBrainSearchCommand.ts`
- `packages/cli/src/runBrainSearchCommand.test.ts`
- this report;
- compact root plan/ledger state;
- Beads task graph.

No benchmark platform, semantic ranking rewrite, embeddings, crawler, API/MCP,
worker daemon, DB schema, source truth mutation, or Memory Core mutation was
added.

## Source-To-Decision

- Source: IMR-23 seven-question mini Brain-QA readback and retained graph /
  heartbeat pattern evidence.
- Mechanism: integrated `brain search` receives operator/source-search-shaped
  queries that include bridge terms such as `source`, `evidence`, `temporal`,
  and `relation`; strict all-token catalog matching can miss retained patterns
  even when the mechanism terms are present.
- KRN implication: `brain search` should retry selected-knowledge readback with
  compact mechanism terms after a no-match, while preserving strict standalone
  `krn brain knowledge` semantics and proof boundaries.
- Decision: add deterministic no-match compact retry in `krn brain search`.
- Rejection: no semantic ranking rewrite, embeddings, broad benchmark platform,
  crawler, API/MCP, worker daemon, DB schema, source truth mutation, or Memory
  Core mutation.
- Consumer: `krn brain search`, mini Brain-QA, future pattern/research
  application gates.
- Falsifier: Q4/Q6 benchmark-shaped queries again return useful source-search
  evidence but empty selectedKnowledge, or broad unrelated queries start
  selecting retained patterns from bridge terms alone.

## Implementation

`krn brain search` now:

1. runs catalog-backed brain knowledge readback with the original query;
2. if no catalog cards return, builds a compact retry query by removing bridge
   terms:

   ```txt
   evidence, relation, relations, source, sources, temporal
   ```

3. uses the compact retry only if it returns retained patterns;
4. exposes `brainKnowledgeQueries` in JSON/text output so the retry is visible.

This keeps the change deterministic and reviewable. It is not a semantic
ranking layer.

## Post-Fix Mini Brain-QA Readback

Raw output directory:

```txt
/tmp/krn-imr-24-brain-qa
```

| ID | Brain knowledge queries | Selected knowledge | Source usefulness | Verdict |
|---|---|---|---|---|
| V376-Q1 | `source-to-decision retention gate consumer falsifier` | `pattern:source-to-decision-retention-gate` | `useful` | unchanged useful |
| V376-Q2 | `hook deterministic guardrail` | `pattern:codex-hook-deterministic-guardrail-boundary` | `partly_useful_missing_document` | unchanged useful with doc gap |
| V376-Q3 | `unknown-first external boundary explicit result state` | `pattern:ts-boundary-unknown-first-result-state` | `partly_useful_missing_document` | unchanged useful with doc gap |
| V376-Q4 | `graph sourceclaimedge relation temporal source relations -> graph sourceclaimedge` | `pattern:graph-relation-readback-boundary` | `partly_useful_missing_document` | repaired |
| V376-Q5 | `ingest v0 source artifact searchdocument sourceclaim activation -> ingest v0 artifact searchdocument sourceclaim activation` | none | `useful` | unchanged source-only; ingest pattern still deferred |
| V376-Q6 | `heartbeat dreaming source relation evidence -> heartbeat dreaming` | `pattern:cost-aware-acquisition-escalation-boundary`, `pattern:heartbeat-candidate-only-runtime-boundary` | `partly_useful_missing_document` | repaired; includes adjacent acquisition pattern |
| V376-Q7 | `cost-aware acquisition escalation source_search_review linked_document_review` | `pattern:cost-aware-acquisition-escalation-boundary` | `partly_useful_missing_document` | unchanged useful with doc gap |

Aggregate:

```txt
questions: 7
selectedKnowledgeHits: 6
source_useful: 2
source_partly_useful_missing_document: 5
source_no_answer: 0
graph_aware_results: 7
memory_mutation: none
```

## Review Burden Delta

Before: operators had to notice that Q4/Q6 had useful source evidence but empty
selectedKnowledge, then manually run narrower `krn brain knowledge` queries.

After: `krn brain search` performs one visible compact retry and surfaces the
retained graph / heartbeat patterns directly in selectedKnowledge.

Delta: reduced for future mini Brain-QA, pattern application gates, and
heartbeat/graph repair slices.

## Remaining Caveat

Q6 now selects both:

```txt
pattern:heartbeat-candidate-only-runtime-boundary
pattern:cost-aware-acquisition-escalation-boundary
```

This is acceptable for this slice because both are heartbeat/dreaming adjacent,
and the original failure was empty selectedKnowledge. It does not prove ranking
precision. If this becomes noisy in future runs, open a bounded precision repair
instead of widening this slice.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-3tr --claim` | passed | Durable task was claimed before source edits. | Does not prove recall repair. |
| `rtk pnpm --filter @krn/cli test -- runBrainSearchCommand` before implementation | failed as expected | Added tests reproduced the missing compact retry. | Does not prove the implementation. |
| `rtk pnpm --filter @krn/cli test -- runBrainSearchCommand` after implementation | passed | Focused CLI tests prove compact retry for graph and heartbeat benchmark misses, and existing brain-search behavior still passes. | Does not prove full workspace behavior. |
| `rtk pnpm --filter @krn/cli krn brain search --query "graph sourceclaimedge relation temporal source relations" --catalog-file docs/brain-knowledge/catalog.json --limit 16 --max-inclusions 6 --json` | passed | Q4 now selects `pattern:graph-relation-readback-boundary`. | Does not prove graph ranking quality or source truth. |
| `rtk pnpm --filter @krn/cli krn brain search --query "heartbeat dreaming source relation evidence" --catalog-file docs/brain-knowledge/catalog.json --limit 16 --max-inclusions 6 --json` | passed | Q6 now selects `pattern:heartbeat-candidate-only-runtime-boundary`. | Does not prove ranking precision or autonomous dreaming quality. |
| seven-question post-fix batch | passed | 6/7 questions now select retained knowledge and all 7 return source-search evidence. | Does not prove answer correctness, semantic search quality, or product readiness. |

## Proof Boundary

Proves:

- the Q4/Q6 selectedKnowledge miss is repaired;
- compact retry is deterministic and visible through `brainKnowledgeQueries`;
- `krn brain knowledge` remains the strict catalog surface;
- no state mutation happened in readback commands.

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
