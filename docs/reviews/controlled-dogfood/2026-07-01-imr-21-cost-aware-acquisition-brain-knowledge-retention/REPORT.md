# IMR-21 Cost-Aware Acquisition Brain Knowledge Retention

Status: complete.

Issue: `mise-en-palace-n71`.

## Executive Verdict

Cost-aware acquisition escalation was not represented in the active brain
knowledge catalog before this slice. It is now retained as one reusable pattern:

```txt
pattern:cost-aware-acquisition-escalation-boundary
```

The retained pattern covers both validated branches:

- linked-document candidates start with `linked_document_review`;
- missing-evidence-only candidates start with `source_search_review`;
- both paths escalate only toward bounded external research and human review
  after cheaper evidence remains insufficient.

Decision: retain the pattern. Do not add autonomous acquisition, crawler,
worker daemon, API/MCP, ranking rewrite, DB schema, source truth mutation, or
Memory Core mutation.

## Scope

Changed:

- retained pattern JSON;
- brain knowledge catalog;
- usefulness feedback JSON;
- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, runtime behavior, DB schema, crawler, worker daemon, API/MCP,
ranking, source truth, or Memory Core state was changed.

## Source-To-Decision

- Source: IMR-18, IMR-19, IMR-20 local dogfood reports and retained `Towards
  Autonomous Memory Agents` source decision.
- Mechanism: acquisition should proceed from cheaper available evidence to more
  expensive review only when cheaper evidence remains insufficient.
- KRN implication: the shared brain should remember the low-to-high
  candidate-only acquisition rule so future heartbeat/dreaming work does not
  jump straight to external research, human review, autonomous acquisition, or
  Memory Core mutation.
- Decision: retain `cost-aware-acquisition-escalation-boundary` as active brain
  knowledge.
- Rejection: no autonomous acquisition, crawler, worker, API/MCP, ranking,
  schema, source truth, or Memory Core mutation.
- Consumer: future heartbeat knowledge-acquisition review, heartbeat/dreaming
  candidate runtime slices, pattern/research brain acquisition gates, and future
  acquisition escalation eval candidates.
- Falsifier: a future acquisition candidate opens bounded external research,
  human review, autonomous acquisition, source truth mutation, or Memory Core
  mutation before exhausting cheaper linked-document or store-backed
  source-search review; or a missing-evidence-only candidate starts at
  `linked_document_review`.

Source usefulness:

- `Towards Autonomous Memory Agents`: helped.
- Why: supplied the active acquisition / cost-aware cascade mechanism, but local
  IMR-18..20 evidence determined the KRN-specific retained boundary.
- Does not prove: benchmark transfer, source truth, autonomous learning quality,
  product readiness, or that KRN should run acquisition automatically.

## Retained Artifact

Pattern:

```txt
docs/patterns/retained-patterns/cost-aware-acquisition-escalation-boundary.json
```

Catalog:

```txt
docs/brain-knowledge/catalog.json
```

Usefulness feedback:

```txt
docs/brain-knowledge/usefulness-feedback/imr-21-cost-aware-acquisition-escalation.json
```

## Readback Evidence

Before retention, the operator-facing catalog query returned zero cards:

```txt
krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json \
  --text "cost-aware acquisition escalation source_search_review linked_document_review"

totalCards: 0
returnedCards: 0
```

After retention, the same query returned the retained pattern:

```txt
totalCards: 1
returnedCards: 1
card: pattern:cost-aware-acquisition-escalation-boundary
reviewability: ready
nextAction: use
```

Integrated `krn brain search` also selected it:

```txt
selectedKnowledge: pattern:cost-aware-acquisition-escalation-boundary
recommendedNextAction: Use the matching brain knowledge as pattern guidance and
  the source-search answer package as evidence before changing code.
```

## Review Burden Delta

Before: future acquisition work had to reconstruct the low-to-high escalation
rule from IMR-18..20 reports or source code.

After: `krn brain knowledge` and `krn brain search` can surface the rule as a
review-ready pattern with consumers, falsifier, evidence refs, and
does-not-prove boundary.

Delta: reduced for future heartbeat/dreaming acquisition slices and
pattern/research gates.

## Next Bounded Action

Created:

```txt
mise-en-palace-85t: Add acquisition escalation to mini Brain-QA.
```

Rationale: the retained pattern is now searchable, but the compact mini
Brain-QA list predates it. A single acquisition-escalation question should make
future benchmark readback check whether this pattern remains findable without
creating a broad benchmark lane.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-n71 --claim` | passed | Durable task was claimed before edits. | Does not prove retention. |
| `rtk rg "cost-aware\\|low-to-high\\|linked_document_review\\|source_search_review" docs packages .agents PLAN.md PLANS.md` | passed | Existing references were in reports, plan/ledger, source/tests, and KRN source docs. | Does not prove the pattern was retained in brain knowledge. |
| `rtk pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "cost-aware acquisition escalation source_search_review linked_document_review" --json` before edit | passed | Active brain knowledge readback returned zero matching cards before retention. | Does not prove no related concept exists outside the explicit catalog. |
| `rtk pnpm --filter @krn/cli krn brain knowledge --catalog-file docs/brain-knowledge/catalog.json --text "cost-aware acquisition escalation source_search_review linked_document_review" --json` after edit | passed | The retained pattern parses and is searchable through brain knowledge readback. | Does not prove semantic ranking quality or product readiness. |
| `rtk pnpm --filter @krn/cli krn brain search --query "cost-aware acquisition escalation source_search_review linked_document_review" --catalog-file docs/brain-knowledge/catalog.json --limit 5 --max-inclusions 5 --json` | passed | Integrated brain search selects the retained pattern as `selectedKnowledge`. | Does not prove source truth, catalog completeness, ranking quality, Memory Core mutation, or product readiness. |

## Proof Boundary

Proves:

- cost-aware acquisition escalation was absent from explicit brain knowledge
  before this slice;
- the validated IMR-18..20 rule is retained once as a pattern;
- usefulness feedback links the retained pattern to the local dogfood evidence;
- `krn brain knowledge` and `krn brain search` can surface the pattern.

Does not prove:

- source truth;
- acquisition success;
- retrieval ranking quality;
- autonomous acquisition safety;
- Memory Core usefulness;
- KRN product readiness.
