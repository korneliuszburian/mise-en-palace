# IMR-10 Focused Acquisition Source Evidence Follow-Up

Status: complete.
Date: 2026-06-30.
Issue: `mise-en-palace-3hq`.

## Executive Verdict

Focused knowledge-acquisition output was useful as a follow-up trigger, but not
sufficient as operator guidance. The candidate correctly pointed at missing
SearchDocument evidence, and bounded source-search follow-up proved the store has
SearchDocuments and the retrieval path can return them. The topic-specific
queries derived from the candidate still returned SourceClaims and relation
support, but no SearchDocuments. The next repair should preserve query-shape
diagnostics or recommended follow-up inside acquisition candidates so the
operator does not have to reopen source-search JSON to understand what to try
next.

## Selected Candidate

Source artifact:

```txt
.local-lab/imr-08-missing-evidence-bridge/heartbeat-focused-acquisition.json
```

Selected candidate:

```txt
knowledge-acquisition-heartbeat:readback-brain-search-imr-r5y-missing-evidence-cuvs-vision-graph-260630:missing_evidence
```

Candidate request:

```txt
Find or reject evidence for: included SearchDocument evidence for this combined
query; topic-specific SearchDocuments may still exist.
```

Reviewability:

```txt
ready
```

Mutation:

```txt
none
```

## Follow-Up Performed

The candidate was followed with live current-shell DB-backed source/brain
readbacks.

Original broad query:

```txt
imr-r5y-missing-evidence-cuvs-vision-graph-260630
```

Original source-search result:

| Signal | Result |
| --- | --- |
| SourceClaims | 3 |
| SearchDocuments | 0 |
| SourceClaimEdge relation support | 3 |
| Answer usefulness | `partly_useful_missing_document` |
| Query-shape diagnostic | likely over-constrained query shape; try narrower topic-specific query before changing ranking or coverage |
| Missing evidence | included SearchDocument evidence for this combined query; topic-specific SearchDocuments may still exist |

Narrow follow-up queries:

| Query | SourceClaims | SearchDocuments | Relation support | Verdict |
| --- | ---: | ---: | ---: | --- |
| `Graph brain v0 temporal source relations` | 5 | 0 | 5 | governed source evidence exists; no document support |
| `Local artifact preview governed source claims` | 5 | 0 | 4 | governed source evidence exists; no document support |
| `heartbeat knowledge acquisition missing evidence` | 5 | 0 | 3 | governed source evidence exists; no document support |

Sanity query:

| Query | SourceClaims | SearchDocuments | Missing evidence | Verdict |
| --- | ---: | ---: | --- | --- |
| `krn-source-artifact-preview` | 1 | 4 | none | SearchDocument retrieval works for matching document text |

DB readback:

| Check | Result |
| --- | --- |
| `pnpm db:ready` | passed |
| `search_documents` count | 15 |
| `search_documents.subject_type` | 15 `source_artifact` rows |

## Source-To-Decision

```txt
source:
  IMR-09 focused acquisition output and live IMR-10 source/brain readbacks

mechanism:
  missingEvidence can route a human/operator into bounded acquisition work, but
  the candidate currently preserves only the missing-evidence text, not the
  query-shape diagnostics that explain how to follow up efficiently.

KRN implication:
  acquisition candidates should carry bounded diagnostics or recommended
  follow-up from the source/brain readback that created them.

decision:
  open a bounded source repair to preserve query diagnostics in acquisition
  candidate output.

rejection:
  do not change search ranking, add a crawler, add schema, add worker daemon, or
  mutate Memory Core from this evidence.

consumer:
  heartbeat/dreaming acquisition preview and operator review workflow.

falsifier:
  diagnostic-bearing acquisition candidates still force operators to inspect raw
  source-search JSON before choosing a bounded follow-up, or they change
  mutation/review-gate authority.
```

## Brain Usefulness

| Area | Verdict | Evidence |
| --- | --- | --- |
| Acquisition candidate | helped | selected a concrete missing-evidence gap for follow-up |
| Source search | helped | showed governed SourceClaims and relation support are available |
| SearchDocument retrieval | mixed | sanity query found 4 documents, but topic queries found none |
| Review burden | mixed | candidate helped start the loop; missing diagnostics forced manual JSON inspection |
| Mutation safety | good | all readbacks stayed read-only; no Memory Core/source/eval mutation |

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `rtk pnpm db:ready` | passed | current shell can reach Postgres, migrations are applied, pgvector is available | product readiness, CI DB state, retrieval quality |
| `krn source search --query "Graph brain v0 temporal source relations" --json` | passed; 5 claims, 0 docs | topic query can retrieve governed source claims and relation support | SearchDocument coverage for the topic |
| `krn source search --query "Local artifact preview governed source claims" --json` | passed; 5 claims, 0 docs | topic query can retrieve governed source claims and relation support | SearchDocument coverage for the topic |
| `krn source search --query "heartbeat knowledge acquisition missing evidence" --json` | passed; 5 claims, 0 docs | topic query can retrieve governed source claims and relation support | SearchDocument coverage for the topic |
| `krn brain search --store-only --query "Graph brain v0 temporal source relations" --json` | passed; 5 selectedKnowledge packets | store-only brain search can read governed source/search packets | SearchDocument coverage or ranking quality |
| `krn source search --query "krn-source-artifact-preview" --json` | passed; 4 docs | SearchDocument retrieval can return documents for matching document text | that topic-specific SearchDocument evidence exists for the acquisition gap |
| `psql select count(*) from search_documents` | passed; 15 rows | current DB has SearchDocument rows | that rows cover graph/heartbeat/local-artifact topic language |

## Next Repair

```txt
mise-en-palace-294:
Carry query diagnostics into acquisition candidates.
```

Success for that repair should be narrow: acquisition candidates created from
source/brain search readbacks preserve query-shape diagnostics or recommended
follow-up when present, remain candidate-only, and do not change schema,
crawler, ranking, worker, API/MCP, or Memory Core mutation behavior.

## What This Does Not Prove

- It does not prove SearchDocument coverage is sufficient.
- It does not prove source-search ranking quality.
- It does not prove graph/heartbeat topic documents should be created
  automatically.
- It does not prove autonomous acquisition is safe.
- It does not prove product readiness.
