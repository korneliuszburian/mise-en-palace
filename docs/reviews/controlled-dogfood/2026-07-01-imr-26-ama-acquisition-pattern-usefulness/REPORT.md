# IMR-26 AMA Acquisition Pattern Usefulness Check

Status: complete.

Issue: `mise-en-palace-fp0`.

## Executive Verdict

The retained Autonomous Memory Agents acquisition mechanism is useful in the
heartbeat lane, but only as a bounded candidate-only acquisition workflow.

An AMA-shaped lack-of-knowledge query produced:

- partly useful source-search evidence;
- explicit missing evidence;
- no broad selectedKnowledge from the paper-title-shaped query;
- a recommended narrower brain-knowledge query;
- one review-ready heartbeat knowledge-acquisition candidate;
- linked-document-first cost escalation;
- `mutation: none`;
- forbidden writes for Memory Core, source truth, eval candidates, and worker
  jobs.

Decision: existing candidate-only plus cost-aware acquisition rules are
sufficient for this step. No source repair or ranking/filtering change is
warranted. The next step is to review the linked document evidence before any
bounded external research.

## Scope

Inspected:

- `docs/KRN_SOURCES.md#towards-autonomous-memory-agents`;
- `krn brain knowledge` readbacks for AMA/acquisition and heartbeat acquisition;
- live DB-backed `krn brain search` for an AMA-shaped missing-evidence query;
- live DB-backed `krn heartbeat preview` using that readback;
- live heartbeat candidate review output.

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, runtime behavior, DB schema, crawler, worker daemon, API/MCP,
ranking, source truth, eval candidate, or Memory Core state changed.

## Source-To-Decision

- Source: `Towards Autonomous Memory Agents`, retained in `docs/KRN_SOURCES.md`,
  plus IMR-18 through IMR-25 local evidence.
- Mechanism: autonomous memory agents actively acquire, validate, and curate
  missing knowledge through a cost-aware cascade rather than only storing
  already-seen context.
- KRN implication: KRN heartbeat/dreaming should propose candidate-only
  acquisition work when brain/source readback lacks evidence, while preserving
  source/review gates and avoiding autonomous Memory Core mutation.
- Decision: accept the retained mechanism for candidate-only acquisition
  usefulness; continue to linked-document review before any higher-cost step.
- Rejection: no autonomous acquisition, crawler, worker daemon, API/MCP, DB
  schema, ranking rewrite, source truth mutation, broad benchmark lane, or
  Memory Core mutation.
- Consumer: heartbeat knowledge acquisition, pattern/research brain, future
  acquisition eval candidates.
- Falsifier: an AMA-shaped missing-evidence run cannot create a reviewable
  acquisition candidate, skips cheaper linked-document/source-search review, or
  mutates durable truth before review.

## Readback Scenario

Scenario:

```txt
An agent lacks enough evidence for an Autonomous Memory Agents style acquisition
decision and must decide what to do before research, review, or memory mutation.
```

Broad query:

```txt
autonomous memory agents missing evidence heartbeat acquisition cost-aware
```

Brain-search result:

```txt
selectedKnowledge: none
answerUsefulness: partly_useful_missing_document
missingEvidence:
  included SearchDocument evidence for this combined query; artifact-linked
  SearchDocuments are visible but were not included by lexical retrieval
recommendedNextAction:
  Use source-search evidence cautiously and run a narrower brain knowledge query
  before retaining a pattern.
relationSupport: 6
```

Narrow follow-up query:

```txt
heartbeat acquisition missing evidence
```

Selected knowledge:

```txt
pattern:cost-aware-acquisition-escalation-boundary
```

Classification:

| Pattern/source | Outcome | Why |
|---|---|---|
| `Towards Autonomous Memory Agents` | helped | Supplied the active acquisition / cost-aware cascade mechanism, but local KRN evidence controls the product decision. |
| `pattern:cost-aware-acquisition-escalation-boundary` | helped | The narrow query selected the exact low-to-high acquisition rule and heartbeat candidate output followed it. |
| `pattern:heartbeat-candidate-only-runtime-boundary` | helped as behavior | The heartbeat candidate stayed candidate-only, reviewable, mutation-free, and listed forbidden writes even though the broad brain query did not select it directly. |
| Broad AMA selectedKnowledge | missing / acceptable | The broad paper-shaped query did not select retained knowledge, but it produced missing-evidence guidance and a narrower query recovered the governing pattern. This is not a ranking repair yet. |

## Heartbeat Candidate Output

Input:

```txt
krn heartbeat preview \
  --candidate-kind knowledge_acquisition \
  --acquisition-readback-file /tmp/krn-imr-26-ama-acquisition/ama-brain-search.json \
  --max-candidates 3 \
  --json
```

Candidate:

```txt
id: knowledge-acquisition-heartbeat:readback-brain-search-autonomous-memory-agents-missing-evidence-heartbeat-acquisition-cost-awa:missing_evidence
reviewability: ready
mutation: none
linkedDocumentEvidence:
  sourceClaimDocumentLinks: 6
  linkedSearchDocuments: 6
```

Escalation:

```txt
1. linked_document_review | low
2. source_search_review | low
3. bounded_external_research | medium
4. human_review | high
```

Manual review result:

```txt
decision: accept_for_manual_followup
nextAction: capture_review_evidence
reason: AMA-shaped lack-of-knowledge readback produced a candidate-only
  acquisition request with linked-document-first escalation, source-search
  fallback, bounded external research only after cheaper evidence, and mutation
  none.
```

## Decision

Existing rules are sufficient for this step.

Do not repair search/ranking now. The broad query miss is not harmless, but the
product path remains usable because `brain search` warns to narrow the query and
heartbeat turns the missing-evidence readback into a ready, mutation-free,
cost-aware candidate.

Next bounded action:

```txt
mise-en-palace-iux: Review AMA linked-document evidence before external acquisition.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk pnpm db:ready` | passed | Current-shell Postgres is reachable, migrations are applied, and pgvector is available. | Does not prove source truth, acquisition quality, or remote DB state. |
| `krn brain knowledge --text "autonomous memory agents acquisition"` | passed, zero cards | Broad paper-shaped catalog query did not directly select retained brain knowledge. | Does not prove no relevant pattern exists. |
| `krn brain knowledge --text "heartbeat acquisition missing evidence"` | passed | The retained cost-aware acquisition pattern is findable by mechanism-shaped query. | Does not prove semantic ranking quality. |
| AMA-shaped `krn brain search --json` | passed | Source-search produced partly useful missing-evidence readback and recommended a narrower brain-knowledge query. | Does not prove source truth or selectedKnowledge completeness. |
| Narrow `krn brain search --json` | passed | Mechanism-shaped query selects `pattern:cost-aware-acquisition-escalation-boundary`. | Does not prove broad paper-shaped queries should rank it. |
| `krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file ... --json` | passed | Missing-evidence readback produced one ready, candidate-only acquisition request with linked-document-first escalation and `mutation: none`. | Does not prove acquisition success or autonomous worker safety. |
| `krn heartbeat preview ... --review-decision accept_for_manual_followup --json` | passed | Manual review result can accept the candidate for follow-up without mutating durable truth. | Does not prove promotion readiness or Memory Core usefulness. |

## Proof Boundary

Proves:

- an AMA-shaped missing-evidence readback can drive a ready heartbeat acquisition
  candidate;
- the candidate remains candidate-only and mutation-free;
- the low-to-high acquisition cascade starts with linked document review when
  linked evidence exists;
- the retained cost-aware acquisition pattern is useful for this decision.

Does not prove:

- AMA benchmark transfer;
- source truth;
- answer correctness;
- semantic ranking quality;
- autonomous learning quality;
- autonomous acquisition safety;
- Memory Core usefulness;
- product readiness.
