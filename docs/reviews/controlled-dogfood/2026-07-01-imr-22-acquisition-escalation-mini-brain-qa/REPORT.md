# IMR-22 Acquisition Escalation Mini Brain-QA

Status: complete.

Issue: `mise-en-palace-85t`.

## Executive Verdict

The compact mini Brain-QA surface now includes one acquisition-escalation query.
The canonical query is mechanism-first:

```txt
cost-aware acquisition escalation source_search_review linked_document_review
```

`krn brain search` finds the retained pattern:

```txt
pattern:cost-aware-acquisition-escalation-boundary
```

No broad benchmark lane, crawler, API/MCP, worker daemon, DB schema, ranking
rewrite, source truth mutation, or Memory Core mutation was added.

## Scope

Changed:

- `docs/benchmarks/brain-qa/v376-questions.json`
- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source or runtime behavior changed.

## Source-To-Decision

- Source: `Towards Autonomous Memory Agents`, IMR-18 through IMR-21 local
  dogfood reports, and retained
  `cost-aware-acquisition-escalation-boundary`.
- Mechanism: useful autonomous-memory systems do not jump straight to expensive
  acquisition; they escalate from cheaper available evidence toward more costly
  research/review only when cheaper evidence remains insufficient.
- KRN implication: mini Brain-QA should check that KRN can recall the retained
  low-to-high acquisition boundary before future heartbeat/dreaming work opens
  external research, human review, automation, or mutation.
- Decision: add one compact acquisition-escalation question to the mini Brain-QA
  query list.
- Rejection: do not create a broad benchmark lane, crawler, API/MCP, worker,
  schema, ranking rewrite, source truth mutation, autonomous acquisition, or
  Memory Core mutation.
- Consumer: compact mini Brain-QA readback and future acquisition escalation
  eval candidates.
- Falsifier: `krn brain search` cannot select
  `pattern:cost-aware-acquisition-escalation-boundary` for the canonical
  acquisition-escalation query.

Source usefulness:

- `Towards Autonomous Memory Agents`: already retained as a lab-test source.
- Why: supplied the acquisition/escalation mechanism; local IMR evidence defines
  the KRN-specific boundary.
- Does not prove: benchmark transfer, source truth, autonomous learning quality,
  product readiness, or that KRN should bypass source/review gates.

## Query Added

```json
{
  "id": "V376-Q7",
  "query": "cost-aware acquisition escalation source_search_review linked_document_review",
  "expectedSurface": "brain-knowledge and source-search readback",
  "expectedUse": "Recall the retained acquisition escalation boundary before opening expensive acquisition work."
}
```

## Readback Evidence

Mechanism-first query:

```txt
selectedKnowledge: pattern:cost-aware-acquisition-escalation-boundary
reviewability: ready
recommendedNextAction: Use the matching brain knowledge as pattern guidance and
  the source-search answer package as evidence before changing code.
```

Paper-title query:

```txt
query: Autonomous Memory Agents cost-aware acquisition escalation source_search_review linked_document_review
selectedKnowledge: none
sourceSearch.answerUsefulness: useful
```

Decision: keep mini Brain-QA mechanism-first. The paper-title query is a useful
future alias/source-routing signal, but it is not the canonical recall test for
the retained KRN pattern.

## Review Burden Delta

Before: repeated Brain-QA readbacks would not check whether the retained
acquisition boundary remained findable.

After: the compact query list checks that the acquisition rule can be recalled
from brain knowledge before future work opens expensive acquisition paths.

Delta: reduced for future heartbeat/dreaming acquisition slices.

## Next Bounded Action

Run the seven-question mini Brain-QA readback and record the batch summary.

Rationale: Q7 is now present, but the compact batch report still reflects six
questions. The next slice should run all seven questions through existing
`krn brain search` JSON and summarize coverage without creating a broad
benchmark platform.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-85t --claim` | passed | Durable task was claimed before edits. | Does not prove benchmark coverage. |
| `rtk jq empty docs/benchmarks/brain-qa/v376-questions.json` | passed | The updated query file is valid JSON. | Does not prove brain-search usefulness. |
| `rtk pnpm db:ready` | passed | Local Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove CI DB state or product readiness. |
| `rtk pnpm --filter @krn/cli krn brain search --query "Autonomous Memory Agents cost-aware acquisition escalation source_search_review linked_document_review" --catalog-file docs/brain-knowledge/catalog.json --limit 5 --max-inclusions 5 --json` | passed | Paper-title query has useful source-search evidence but no selected retained pattern. | Does not prove the retained pattern is absent or ranking is wrong. |
| `rtk pnpm --filter @krn/cli krn brain search --query "cost-aware acquisition escalation source_search_review linked_document_review" --catalog-file docs/brain-knowledge/catalog.json --limit 5 --max-inclusions 5 --json` | passed | Mechanism-first query selects the retained acquisition escalation pattern. | Does not prove source truth, ranking quality, semantic search quality, Memory Core mutation, or product readiness. |

## Proof Boundary

Proves:

- mini Brain-QA now includes an acquisition-escalation query;
- mechanism-first brain search selects the retained pattern;
- paper-title query currently behaves as source evidence, not retained-pattern
  recall;
- no package source or runtime behavior changed.

Does not prove:

- answer correctness;
- source truth;
- ranking quality;
- semantic search quality;
- broad benchmark quality;
- autonomous acquisition safety;
- Memory Core usefulness;
- product readiness.
