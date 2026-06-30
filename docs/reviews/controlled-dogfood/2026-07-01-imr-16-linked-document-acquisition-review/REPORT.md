# IMR-16 Linked Document Acquisition Candidate Review

Status: complete.

Issue: `mise-en-palace-7zt`.

## Executive Verdict

One live linked-document acquisition candidate was reviewed. The candidate is
reviewable and `linkedDocumentEvidence` reduced review burden: the operator can
see that 5 artifact-linked SearchDocuments exist even though included lexical
SearchDocument evidence is still missing for the combined query.

Decision: defer source truth mutation and do not open ranking, schema, crawler,
worker, API/MCP, or Memory Core work. The next bounded action is a wording/readback
repair: candidates with linked documents should tell the operator to review
linked document evidence before opening new acquisition.

## Scope

Changed:

- this report;
- compact root plan/ledger state;
- Beads task graph.

No package source, DB schema, crawler, ranking, worker runtime, API/MCP, source
truth, or Memory Core mutation was changed.

## Source-To-Decision

- Source: IMR-15 report and live DB-backed brain-search/heartbeat review output.
- Mechanism: a candidate can simultaneously have missing included lexical
  SearchDocument evidence and visible artifact-linked SearchDocuments.
- KRN implication: candidate review should distinguish "linked evidence exists"
  from "new acquisition required" before source truth or retrieval work is opened.
- Decision: defer the current candidate and create a bounded wording/readback
  repair for linked-document acquisition guidance.
- Rejection: no SearchDocument inclusion repair, ranking rewrite, schema,
  crawler, worker, API/MCP, source truth mutation, or Memory Core mutation.
- Consumer: heartbeat acquisition review/readback and next operator-facing
  acquisition guidance slice.
- Falsifier: a future linked-document acquisition candidate still makes the
  operator inspect raw JSON or infer manually whether linked document evidence
  should be reviewed before new acquisition.

Retained paper context:

- `Towards Autonomous Memory Agents` helped as background constraint only:
  active acquisition must remain candidate-only and review-gated in KRN.
- Does not prove: paper benchmark transfer, KRN product readiness, source truth,
  or that autonomous retrieval may bypass review gates.

## Live Candidate Review

Brain-search readback:

```txt
query: Local artifact preview can carry governed source claims
supportingClaims: 5
supportingDocuments: 0
sourceClaimDocumentLinks: 5
linkedSearchDocuments: 5
missingEvidence:
  included SearchDocument evidence for this combined query; artifact-linked
  SearchDocuments are visible but were not included by lexical retrieval
```

Heartbeat candidate:

```txt
id: knowledge-acquisition-heartbeat:readback-brain-search-local-artifact-preview-can-carry-governed-source-claims:missing_evidence
kind: knowledge_acquisition_candidate
reviewability: ready
linkedDocumentEvidence.sourceClaimDocumentLinks: 5
linkedDocumentEvidence.linkedSearchDocuments: 5
mutation: none
```

Review result:

```txt
decision: defer_pending_evidence
nextAction: request_more_candidate_evidence
reason: linkedDocumentEvidence reduced review burden and shows artifact-linked
  documents exist, but included lexical SearchDocument evidence is still missing
```

## Review Burden Delta

Before IMR-15: the candidate could imply "no document evidence exists."

After IMR-15 / this review: the candidate shows linked document evidence exists.

Remaining burden: the wording still begins from "Find or reject evidence for..."
and can make linked evidence look like another acquisition gap instead of a
review-before-acquisition step.

Delta: reduced, but not complete.

## Next Bounded Action

Created:

```txt
mise-en-palace-dad: Clarify linked-document acquisition review wording.
```

Acceptance: a linked-document acquisition candidate with missing included
lexical docs and linked SearchDocuments renders guidance that distinguishes
review-linked-evidence from new acquisition. Focused tests must cover the
wording/readback. No ranking, schema, crawler, worker, API/MCP, source truth, or
Memory Core mutation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---:|---|---|
| `rtk bd prime` | passed | Beads state was loaded after compaction/resume. | Does not prove task completion. |
| `rtk git fetch --prune && rtk git status --short --branch && rtk git log --oneline -n 8` | passed | Remote/local state was inspected before work. | Does not prove CI state for new changes. |
| `rtk bd update mise-en-palace-7zt --claim` | passed | The active issue was claimed before durable work. | Does not prove acceptance criteria. |
| `rtk pnpm db:ready` | passed | Local Postgres is reachable with 14/14 migrations and pgvector. | Does not prove remote DB state. |
| `rtk pnpm --filter @krn/cli krn brain search --query "Local artifact preview can carry governed source claims" --store-only --limit 5 --max-inclusions 5 --json` | passed | Live DB-backed brain search produced source-search missing evidence plus linked document evidence. | Does not prove ranking quality or source truth. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview --candidate-kind knowledge_acquisition --acquisition-readback-file /tmp/krn-7zt-brain-search.json --max-candidates 1 --json` | passed | Heartbeat preview produced one reviewable acquisition candidate with linkedDocumentEvidence. | Does not prove the candidate should be promoted or that acquisition should run. |
| `rtk pnpm --filter @krn/cli krn heartbeat preview ... --review-decision defer_pending_evidence --json` | passed | Manual review result can defer the candidate without mutation. | Does not prove source truth or product readiness. |

## Proof Boundary

Proves:

- linked-document acquisition evidence can be reviewed from live DB-backed
  readback;
- `linkedDocumentEvidence` reduces review burden;
- the next action is bounded wording/readback repair, not broad retrieval or
  source-truth work.

Does not prove:

- source truth;
- ranking quality;
- autonomous acquisition safety;
- Memory Core usefulness;
- product readiness;
- benchmark transfer from the Autonomous Memory Agents paper.
