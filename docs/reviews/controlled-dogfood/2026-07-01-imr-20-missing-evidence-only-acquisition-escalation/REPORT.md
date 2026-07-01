# IMR-20 Missing-Evidence-Only Acquisition Escalation Dogfood

Status: complete.

Issue: `mise-en-palace-ich`.

## Executive Verdict

One live DB-backed `source_search` readback was routed into heartbeat
knowledge-acquisition preview. The resulting candidate had no
`linkedDocumentEvidence`, started escalation at `source_search_review`, and
remained candidate-only with `mutation: none`.

Decision: no source repair. The missing-evidence-only branch behaves as
intended. The next action is no-op for this branch unless future dogfood shows
operators cannot distinguish source-search readback evidence from linked
document evidence.

## Scope

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, autonomous execution, crawler, worker daemon, API/MCP,
ranking rewrite, DB schema, source truth mutation, or Memory Core mutation was
changed.

## Source-To-Decision

- Source: live `krn source search` answer package and heartbeat preview output.
- Mechanism: a source-search answer package with `missingEvidence` can produce
  candidate-only acquisition work without carrying `linkedDocumentEvidence`.
- KRN implication: missing-evidence-only acquisition escalation should start at
  `source_search_review`, not `linked_document_review`.
- Decision: accept the missing-evidence-only escalation output; no repair.
- Rejection: do not add autonomous acquisition, crawler, worker, API/MCP,
  ranking, schema, source truth, or Memory Core mutation.
- Consumer: heartbeat acquisition review and future knowledge acquisition
  dogfood.
- Falsifier: a future source-search acquisition candidate without
  `linkedDocumentEvidence` starts at `linked_document_review`, hides the
  low-to-high cost order, or requires raw JSON inspection to choose the next
  review step.

Source usefulness:

- `Towards Autonomous Memory Agents`: helped as a retained mechanism only.
- Why: it constrained this review to active acquisition as candidate-only,
  cost-aware escalation.
- Does not prove: benchmark transfer, autonomous learning quality, source
  truth, or product readiness.

## Live Candidate Review

Input readback:

```txt
command: krn source search --query "source-to-decision local falsifier" --json
supportingClaims: 5
supportingDocuments: 0
sourceClaimDocumentLinks: 5
missingEvidence: included SearchDocument evidence for this combined query
```

Important caveat: the live source-search answer package still reported
artifact-linked `sourceClaimDocumentLinks`. This dogfood verifies the
`source_search` acquisition path specifically: it does not convert those links
into `linkedDocumentEvidence`, so the heartbeat candidate is
missing-evidence-only from the acquisition candidate perspective.

Candidate:

```txt
id: knowledge-acquisition-heartbeat:readback-source-search-source-to-decision-local-falsifier:missing_evidence
source: source_search
reviewability: ready
linkedDocumentEvidence: none
mutation: none
```

Escalation:

```txt
1. source_search_review | low
2. bounded_external_research | medium
3. human_review | high
```

Manual review result:

```txt
decision: accept_for_manual_followup
nextAction: capture_review_evidence
reason: missing-evidence-only source-search readback starts escalation at
  source_search_review and remains candidate-only; no repair needed for this
  branch
```

## Review Burden Delta

Before IMR-20: missing-evidence-only escalation was covered by tests but did not
have live dogfood evidence.

After IMR-20: a live source-search readback proves the operator can see the
missing-evidence-only branch start at `source_search_review` and avoid
unnecessary linked-document review when the candidate lacks
`linkedDocumentEvidence`.

Delta: reduced. No repair is needed from this evidence.

## Next Bounded Action

No repair for this branch.

The next product-facing step should move out of the current acquisition
micro-loop and select the next highest-ROI shared-brain task from Beads/root
state. A good candidate is retaining the now-validated low-to-high acquisition
escalation rule as reusable brain knowledge only if source inspection confirms
it is not already represented.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd update mise-en-palace-ich --claim` | passed | Durable task was claimed before review. | Does not prove the candidate behavior. |
| `rtk pnpm db:ready` | passed | Current-shell Postgres is reachable with migrations and pgvector. | Does not prove remote DB state. |
| `rtk pnpm --filter @krn/cli krn source search --query "source-to-decision local falsifier" --limit 5 --max-inclusions 5 --json` | passed | Live DB-backed source-search readback produced missing evidence with 5 claims, 0 included documents, and 5 artifact-linked refs. | Does not prove source truth or ranking quality. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-ich-source-search.json --max-candidates 1 --json` | passed | Heartbeat source-search acquisition candidate had no `linkedDocumentEvidence`, started at `source_search_review`, and had `mutation: none`. | Does not prove acquisition success or autonomous execution safety. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview ... --review-decision accept_for_manual_followup --json` | passed | Manual review result can accept the candidate for follow-up without mutation. | Does not prove source truth, promotion readiness, or Memory Core usefulness. |
| `rtk jq ... /tmp/krn-ich-heartbeat-preview.json` | passed | Readback confirmed first escalation source was `source_search_review` and `linkedDocumentEvidence` was absent. | Does not prove future candidates all behave the same way. |
| `rtk bash -lc ... jq ...` | failed | The generated JSON files existed, but the final summary `jq` expression was malformed. | Does not invalidate the underlying source-search, heartbeat preview, or heartbeat review commands, which were read back separately. |

## Proof Boundary

Proves:

- one live source-search missing-evidence readback can drive a heartbeat
  acquisition candidate;
- the resulting candidate has no `linkedDocumentEvidence`;
- missing-evidence-only escalation starts at `source_search_review`;
- the path remains candidate-only and mutation-free;
- no repair is needed for this branch from current evidence.

Does not prove:

- source truth;
- ranking quality;
- acquisition success;
- autonomous worker safety;
- Memory Core usefulness;
- product readiness.
