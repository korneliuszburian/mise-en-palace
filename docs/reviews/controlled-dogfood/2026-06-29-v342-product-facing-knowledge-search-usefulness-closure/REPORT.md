# V342 Product-Facing Knowledge Search Usefulness Closure

Status: complete.
Date: 2026-06-29.

## Executive Verdict

`krn source search` is useful when the target knowledge is already persisted as
`SourceClaim` or `SearchDocument`, but it is not yet useful enough as a broad
product search surface. Exact marker and graph-relation questions reduced
rereads. Heartbeat, consensus, and source-to-decision questions mostly returned
generic ingest/source guardrails because the recent reports are not yet covered
as persisted searchable knowledge. The next move should be a bounded coverage
seed through the existing ingest/readback path, not UI, API, MCP, crawler,
ranking rewrite, graph runtime, or autonomous memory mutation.

## Source-to-Decision

source:
`docs/reviews/controlled-dogfood/2026-06-29-v341-product-facing-knowledge-search-readback-preview/REPORT.md`

mechanism:
V341 proved the CLI can read persisted source/search candidates, but did not
prove the current corpus has enough coverage for real operator questions.

KRN implication:
Before building product surfaces, KRN must show that the readback helps real
questions and identify whether misses are ranking problems or corpus-coverage
problems.

decision:
Run five real KRN knowledge queries through `krn source search`, classify
helped/neutral/noise/missing, and choose a bounded next product move.

consumer:
V343 Product-Facing Knowledge Search Coverage Seed.

falsifier:
Real KRN questions do not retrieve useful persisted candidates or reduce rereads
compared with manual report search.

doesNotProve:
Source truth, ranking quality, embeddings, graph retrieval, product UI/API/MCP
readiness, broad corpus ingest, crawler readiness, or Memory Core mutation.

## Queries

| # | Query | Result | Usefulness |
| --- | --- | --- | --- |
| 1 | `krn-source-artifact-preview 991034dc0684e887` | 7 source claims, 1 search result, V340 claim and document included | helped |
| 2 | `SourceClaimEdge temporal relation graph brain` | 7 source claims, graph relation claims included | helped |
| 3 | `memory staleness heartbeat candidate MemoryRecord` | generic source claims plus activation owner-file hint | mixed / missing |
| 4 | `consensus candidate dissent decision options` | generic ingest/source claims, no V339 consensus report hit | weak / missing |
| 5 | `source-to-decision retention gate consumer falsifier` | generic ingest/source claims; retained pattern search separately found source-to-decision pattern | mixed |

## Findings

| Area | Verdict | Evidence | Implication |
| --- | --- | --- | --- |
| Exact persisted artifact recall | strong | query 1 returned V340 `SourceClaim` and `SearchDocument` | V341 readback works for persisted marker knowledge |
| Graph/source relation recall | useful | query 2 returned SourceClaimEdge-related claims | source graph claims are searchable enough for operator readback |
| Recent heartbeat/consensus coverage | weak | queries 3 and 4 missed the relevant reports | missing corpus coverage is the bottleneck |
| Pattern/source-to-decision recall | mixed | `source search` was generic; `knowledge cards --text source-to-decision` returned 3 retained patterns | pattern catalog and source search are still split surfaces |
| Review burden | mixed positive | output exposes candidates, exclusions, and proof boundaries; misses are explainable | reduces rereads only where persisted coverage exists |

## Pattern Gate

| Pattern query | Result | Use |
| --- | --- | --- |
| `source-to-decision retention gate knowledge search usefulness` | 0 results | too broad; useful no-match guidance |
| `source-to-decision` | 3 results | helped confirm retained pattern catalog still carries the source-to-decision gate |

Selected retained patterns:

- `source-to-decision-retention-gate`: helped.
- `evidence-proof-non-proof-boundary`: helped.
- `codex-skill-progressive-disclosure-routing`: neutral for this slice.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `git fetch --prune` | passed | remote refs refreshed | CI status |
| `git status --short --branch` | passed | worktree started clean | future cleanliness |
| `git log --oneline -n 8` | passed | latest local context identified | semantic state |
| `pnpm db:ready` | passed | current shell DB reachable, 14/14 migrations, pgvector available | remote/CI DB state |
| five `krn source search --query ...` commands | passed | readback can answer real queries over current persisted source/search substrate | ranking quality or corpus completeness |
| two `krn knowledge cards --text ...` commands | passed | retained pattern readback works separately from DB source search | DB-backed product search quality |
| `krn plan --persist` | passed | V342 execution run persisted and selected context | selected context sufficiency |

## Persisted Run

| Item | ID |
| --- | --- |
| executionRun | `fe155700-02e3-4aa3-8739-fb733fa8066c` |
| taskContract | `7f95570a-a4e0-4a9b-a22c-a173bc281c54` |
| contextAssembly | `c92ddafa-ee2a-45f2-87d9-8eb1f809a343` |
| evidenceBundle | `570c1eb5-b567-404e-bbb5-195dcc6866aa` |
| reviewAssessment | `264483c9-2447-42ef-bfbb-3c50393c71a5` |
| feedbackDelta | `61ccd09a-54f3-4b85-919c-294bde3c725f` |
| observationGroup | `e2ee9266-be60-4858-b9a2-68923dcd102e` |
| reflectionRecord | `03470ad0-31bb-4270-8a6d-32be41f6ba45` |
| MemoryRecord created | `no` |

## What This Proves

- The source search preview reduces rereads for exact persisted markers and
  graph/source relation questions.
- The output makes weak/missing coverage visible instead of hiding it.
- The current limitation is mostly corpus coverage, not evidence capture or DB
  runtime availability.

## What This Does Not Prove

- Product search quality.
- Broad corpus coverage.
- Ranking quality.
- Embedding or graph retrieval quality.
- UI/API/MCP readiness.
- Crawler or worker readiness.
- Memory Core mutation quality.
- Second-operator usability.

## Next Recommended Task

V343 Product-Facing Knowledge Search Coverage Seed.

Use the existing local artifact/source preview path to persist 3-5 compact,
bounded knowledge artifacts for recent heartbeat, consensus, pattern, and search
usefulness reports. Then rerun the same weak queries and require concrete
improvement. Do not add crawler, UI/API/MCP, DB schema, ranking rewrite,
embeddings, graph runtime, worker daemon, or autonomous truth runtime.
