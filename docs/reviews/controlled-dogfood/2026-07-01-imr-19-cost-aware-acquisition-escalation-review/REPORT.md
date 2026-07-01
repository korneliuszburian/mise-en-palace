# IMR-19 Cost-Aware Acquisition Escalation Review

Status: complete.

Issue: `mise-en-palace-ghj`.

## Executive Verdict

One live DB-backed cost-aware acquisition candidate was reviewed. The escalation
preview reduced review burden enough for manual follow-up: it clearly orders the
candidate from linked-document review to source-search review, bounded external
research, and human review only when cheaper evidence remains insufficient.

Decision: no source repair. Do not change wording, ranking, schema, crawler,
worker runtime, API/MCP, source truth, or Memory Core. The next bounded action is
to dogfood the missing-evidence-only branch, because that branch is test-covered
but not yet reviewed with live evidence.

## Scope

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, autonomous execution, crawler, worker daemon, API/MCP,
ranking rewrite, DB schema, source truth mutation, or Memory Core mutation was
changed.

## Source-To-Decision

- Source: IMR-18 live heartbeat output and retained `Towards Autonomous Memory
  Agents` source decision.
- Mechanism: useful acquisition should escalate from cheaper available evidence
  to more expensive evidence only when cheaper evidence is insufficient.
- KRN implication: the candidate-only escalation preview is useful if it lets an
  operator decide the next review step without opening automation or mutation
  work.
- Decision: accept the current linked-document escalation output for manual
  follow-up; no repair.
- Rejection: no autonomous acquisition, crawler, worker, API/MCP, ranking,
  schema, source truth, or Memory Core mutation.
- Consumer: heartbeat acquisition review and next missing-evidence-only dogfood.
- Falsifier: a future operator cannot choose the next review step from the
  escalation preview without reading raw JSON or guessing the cost order.

Source usefulness:

- `Towards Autonomous Memory Agents`: helped.
- Why: its cost-aware acquisition mechanism constrained the review to a
  candidate-only low-to-high evidence path and blocked autonomous mutation.
- Does not prove: benchmark transfer, source truth, product readiness, or that
  KRN should execute acquisition automatically.

## Live Candidate Review

Candidate:

```txt
id: knowledge-acquisition-heartbeat:readback-brain-search-local-artifact-preview-can-carry-governed-source-claims:missing_evidence
reviewability: ready
mutation: none
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
reason: cost-aware escalation preview reduces review burden enough for manual
  follow-up: review linked documents first, then source-search review, bounded
  external research, and human review only if cheaper evidence remains
  insufficient; no wording or code repair needed
```

## Review Burden Delta

Before IMR-18: the operator could see missing evidence and linked docs, but not
the ordered acquisition path.

After IMR-18 / this review: the operator can follow a low-to-high cost sequence
without raw JSON inspection or broad research work.

Delta: reduced for linked-document acquisition candidates.

Remaining gap: the missing-evidence-only branch is tested but not yet reviewed
with live evidence.

## Next Bounded Action

Created:

```txt
mise-en-palace-ich: Dogfood missing-evidence-only acquisition escalation.
```

Acceptance: select one missing-evidence-only acquisition candidate, verify the
escalation starts at `source_search_review`, record review burden and
proof/non-proof, then choose no-op or one bounded repair from evidence.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-ghj --claim` | passed | Durable task was claimed before review. | Does not prove review outcome. |
| `rtk pnpm db:ready` | passed | Current-shell Postgres is reachable with migrations and pgvector. | Does not prove remote DB state. |
| `rtk pnpm --filter @krn/cli krn brain search --query "Local artifact preview can carry governed source claims" --store-only --limit 5 --max-inclusions 5 --json` | passed | Live DB-backed readback produced the acquisition candidate input. | Does not prove ranking quality. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-ghj-brain-search.json --max-candidates 1 --json` | passed | Live candidate output included cost-aware escalation with `mutation: none`. | Does not prove candidate truth. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview ... --review-decision accept_for_manual_followup --json` | passed | Manual review result can accept the candidate for follow-up without mutation. | Does not prove source truth, promotion readiness, or autonomous execution safety. |

## Proof Boundary

Proves:

- one live cost-aware acquisition candidate is reviewable;
- the linked-document-first escalation order reduces review burden;
- no repair is needed for the linked-document branch;
- the next evidence gap is the missing-evidence-only branch.

Does not prove:

- source truth;
- retrieval ranking quality;
- acquisition success;
- autonomous worker safety;
- Memory Core usefulness;
- product readiness.
