# IMR-12 Diagnostic Acquisition Evidence Follow-Up

Status: complete.
Date: 2026-07-01.
Issue: `mise-en-palace-e8s`.

## Executive Verdict

The diagnostic-bearing acquisition candidate reduced review burden enough to
choose a bounded follow-up without reopening raw source-search internals. The
follow-up showed that SearchDocuments exist and can be retrieved by
path/evidence-shaped queries, while claim-text queries still report zero
supporting SearchDocuments. DB readback shows the selected SourceClaims have
artifact-level SearchDocuments, but no direct `search_documents.source_claim_id`
links. The next repair should expose artifact-linked documents or an explicit
linkage caveat in source-search answer packages. This is a readback/linkage
repair, not crawler, schema, ranking, worker, API/MCP, or Memory Core work.

## Selected Candidate

Input:

```txt
.local-lab/imr-11-acquisition-diagnostics/heartbeat-source-readback-diagnostics.json
```

Candidate:

```txt
knowledge-acquisition-heartbeat:readback-source-search-imr-r5y-missing-evidence-cuvs-vision-graph-260630:missing_evidence
```

Candidate fields used:

```txt
missingEvidence:
  included SearchDocument evidence for this combined query; topic-specific
  SearchDocuments may still exist

queryShapeDiagnostics:
  likely over-constrained query shape: SourceClaims matched, but lexical
  SearchDocument retrieval returned zero results; try a narrower topic-specific
  query before changing ranking or coverage.

recommendedFollowUp:
  Use the supporting claims cautiously and split broad queries into narrower
  topic-specific source searches before changing retrieval.
```

## Follow-Up Performed

Two bounded source-search readbacks were run from the diagnostic guidance.

| Query | Supporting SourceClaims | Supporting SearchDocuments | Verdict |
| --- | ---: | ---: | --- |
| `Local artifact preview can carry governed source claims` | 5 | 0 | claim-text query still misses documents |
| `docs/reviews/controlled-dogfood/2026-06-30-v371-ingest-v0v1-bounded-input-loop/SOURCE.md` | 4 | 1 | path/evidence-shaped query can retrieve documents |

DB linkage readback for selected claims:

| SourceClaim | Direct SearchDocuments | Artifact-linked SearchDocuments |
| --- | ---: | ---: |
| `3363383c-02d0-4e5a-9674-132c1bc41b51` | 0 | 1 |
| `3afb4c95-eaad-4df1-aa72-e8c739f385dd` | 0 | 1 |
| `b055fffe-de70-49e4-86b0-a806a2f12e86` | 0 | 1 |

This rejects a broad "SearchDocument coverage is empty" conclusion. The store
has artifact-level documents; the operator-facing answer package does not expose
those linked documents for supporting claims.

## Source-To-Decision

```txt
source:
  IMR-11 diagnostic candidate output, live source-search readbacks, and current
  DB linkage readback.

mechanism:
  diagnostics changed the follow-up from guessing about ranking/coverage to a
  targeted split: claim-text query vs path/evidence query vs artifact linkage.

KRN implication:
  source-search answer packages should distinguish "no lexical document hit" from
  "supporting claims have artifact-linked document evidence".

decision:
  queue a bounded source-search/readback repair that exposes artifact-linked
  documents or an explicit linkage caveat for supporting SourceClaims.

rejection:
  do not add crawler, DB schema, ranking rewrite, worker daemon, API/MCP, or
  Memory Core/source truth mutation from this evidence.

consumer:
  source-search answer packages, brain-search readbacks, acquisition candidates,
  and operator review workflow.

falsifier:
  a supporting SourceClaim has linked artifact/chunk SearchDocument evidence but
  the answer package still only reports zero supporting documents without a
  linked-document readback or caveat.
```

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `pnpm db:ready` | passed | current shell can reach Postgres, migrations are applied, pgvector is available | product readiness or CI DB state |
| `krn source search --query "Local artifact preview can carry governed source claims" --json` | passed; 5 claims, 0 docs | claim-text query still misses SearchDocuments | that no documents exist |
| `krn source search --query "docs/reviews/controlled-dogfood/2026-06-30-v371-ingest-v0v1-bounded-input-loop/SOURCE.md" --json` | passed; 4 claims, 1 doc | path/evidence-shaped query can retrieve SearchDocuments | general ranking quality |
| DB claim/document linkage readback | passed; 0 direct docs, 1 artifact-linked doc for each inspected claim | selected SourceClaims have artifact-level document evidence | that source truth is correct or complete |

## Brain Usefulness

| Area | Verdict | Evidence |
| --- | --- | --- |
| Diagnostic-bearing candidate | helped | query diagnostic selected narrower search before ranking/coverage changes |
| Review burden | reduced | next action was source-search split + linkage readback, not manual raw JSON hunting |
| Source search | mixed | path query finds docs, claim-text query does not expose linked docs |
| Next repair clarity | good | evidence points to source claim/document readback linkage |
| Mutation safety | good | no source truth, Memory Core, schema, crawler, ranking, worker, API/MCP mutation |

## Next Repair

```txt
mise-en-palace-d8u:
Expose artifact-linked documents for source claims.
```

Acceptance should stay narrow: source-search answer packages with supporting
SourceClaims should show artifact-linked SearchDocument refs/counts or an
explicit linkage caveat. Do not change schema, crawler, ranking, worker, API/MCP,
or Memory Core/source truth authority.

## What This Does Not Prove

- It does not prove source-search ranking quality.
- It does not prove SearchDocument coverage is complete.
- It does not prove artifact-linked documents should be promoted as source truth.
- It does not prove product readiness.
