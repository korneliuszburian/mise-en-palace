# IMR-08 Missing-Evidence Acquisition Bridge Dogfood

Status: DB-backed dogfood/readback slice.

Date: 2026-06-30

## Executive Verdict

The IMR-07 bridge works on live current-shell DB readback. A DB-backed source
search and DB-backed brain search both emitted `missingEvidence`; passing either
JSON file into `krn heartbeat preview --acquisition-readback-file` produced a
`knowledge_acquisition_candidate` with `reviewability: ready`,
`mutation: none`, and explicit forbidden writes.

The next repair should not be source-search missing-evidence quality. The
observed friction is heartbeat review focus: the acquisition candidate is ready,
but the global heartbeat closure remains `needs_more_evidence` when an unrelated
source-relation candidate is present. The next bounded issue is:

```txt
mise-en-palace-xe2: Focus heartbeat preview by candidate kind.
```

## Scope

Beads issue:

```txt
mise-en-palace-r5y: Dogfood missing-evidence acquisition bridge with live readback.
```

No package source was changed. Local scratch outputs were written under:

```txt
.local-lab/imr-08-missing-evidence-bridge/
```

Those files are intentionally untracked.

## Source-To-Decision

```yaml
source: IMR-07 bridge behavior and live DB-backed source/brain search readbacks
mechanism: >
  Explicit missingEvidence from source/brain search can become a reviewable
  acquisition candidate, but heartbeat's aggregate closure can still be driven
  by unrelated candidate lanes.
krn_implication: >
  The bridge is useful; the next reduction in review burden is focused heartbeat
  lane readback, not a crawler, ranking rewrite, DB schema change, or memory
  mutation.
decision: >
  Accept the bridge dogfood and queue focused heartbeat candidate-kind readback.
consumer: heartbeat/dreaming candidate runtime and operator review workflow
falsifier: >
  A focused heartbeat preview cannot isolate knowledge_acquisition candidates,
  or isolation changes mutation/review-gate behavior.
does_not_prove: >
  Source truth, missingEvidence correctness, acquisition quality, product
  readiness, worker daemon readiness, ranking quality, or Memory Core mutation.
```

## Observed Readback

Query:

```txt
imr-r5y-missing-evidence-cuvs-vision-graph-260630
```

Source search and brain search both produced:

```txt
missingEvidence:
- included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist
```

Heartbeat preview from brain-search readback:

```txt
candidateCounts:
  memoryStaleness: 0
  sourceRelation: 1
  knowledgeAcquisition: 1
reviewEvalClosure: needs_more_evidence -> improve_candidate_evidence
runtimeLoop: needs_candidate_evidence -> improve_candidate_evidence
knowledge acquisition candidate:
  source: brain_search
  reviewability: ready
  mutation: none
```

Heartbeat preview from source-search readback:

```txt
candidateCounts:
  memoryStaleness: 0
  sourceRelation: 1
  knowledgeAcquisition: 1
knowledge acquisition candidate:
  source: source_search
  reviewability: ready
  mutation: none
```

Manual review of the brain-search acquisition candidate produced:

```txt
candidateFound: true
decision: accept_for_manual_followup
nextAction: capture_review_evidence
candidateReviewability: ready
mutation: none
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
|---|---|---|---|
| `rtk pnpm db:ready` | passed | Current-shell Postgres, migrations, and pgvector are ready. | Production DB state, source truth, or product readiness. |
| `rtk pnpm --silent --filter @krn/cli krn source search ... --json` without `KRN_DATABASE_URL` | failed with expected boundary | Source search requires explicit DB runtime configuration. | The actual readback bridge behavior. |
| `rtk env KRN_DATABASE_URL=... pnpm --silent --filter @krn/cli krn source search ... --json` | passed | DB-backed source search can emit answer-package `missingEvidence`. | Missing evidence correctness, ranking quality, or source truth. |
| `rtk env KRN_DATABASE_URL=... pnpm --silent --filter @krn/cli krn brain search ... --store-only --json` | passed | DB-backed brain search can replay source-search missingEvidence through brain-search JSON. | Full pattern coverage, ranking quality, or product readiness. |
| `rtk node -e ...` JSON summary | passed | Scratch JSON files are parseable and contain non-empty missingEvidence. | CLI behavior by itself. |
| `rtk env KRN_DATABASE_URL=... pnpm --silent --filter @krn/cli krn heartbeat preview --memory-limit 0 --source-claim-limit 0 ...` | failed with expected parser boundary | Heartbeat limits currently require positive integers. | Bridge failure; rerun with positive limits passed. |
| `rtk env KRN_DATABASE_URL=... pnpm --silent --filter @krn/cli krn heartbeat preview --acquisition-readback-file <brain-search-json> --json` | passed | Brain-search missingEvidence routes into `knowledge_acquisition_candidate`. | Acquisition quality, source truth, or Memory Core mutation. |
| `rtk env KRN_DATABASE_URL=... pnpm --silent --filter @krn/cli krn heartbeat preview --acquisition-readback-file <source-search-json> --json` | passed | Source-search missingEvidence routes into `knowledge_acquisition_candidate`. | Acquisition quality, source truth, or Memory Core mutation. |
| `rtk env KRN_DATABASE_URL=... pnpm --silent --filter @krn/cli krn heartbeat preview --review-candidate-id <acquisition-candidate> ... --json` | passed | Manual review can target the acquisition candidate and preserve `mutation: none`. | Promotion readiness or source/eval/memory mutation. |

## Brain Usefulness

Verdict: positive.

The brain loop now does something product-relevant:

```txt
source/brain search gap
-> missingEvidence readback
-> heartbeat acquisition candidate
-> manual review result
-> next repair selected from observed friction
```

This is still not autonomous acquisition. That boundary is correct.

## Next Repair

```txt
mise-en-palace-xe2: Focus heartbeat preview by candidate kind.
```

Why:

```txt
The acquisition candidate was ready, but global heartbeat closure stayed
needs_more_evidence because another lane emitted a weaker source-relation
candidate. Focused candidate-kind readback should reduce review burden without
changing mutation authority.
```
