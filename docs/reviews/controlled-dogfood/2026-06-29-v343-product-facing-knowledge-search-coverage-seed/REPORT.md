# V343 Product-Facing Knowledge Search Coverage Seed

Status: complete.
Date: 2026-06-29.

## Executive Verdict

V343 seeded four compact knowledge artifacts through the existing
`krn source artifact preview --persist` path. The weak V342 queries improved at
the governed `SourceClaim` layer: heartbeat, consensus, source-to-decision, and
search-usefulness claims now appear in included candidates. This proves bounded
coverage can be improved without UI, API, MCP, crawler, schema, ranking rewrite,
embeddings, graph runtime, worker daemon, or Memory Core mutation. It also
exposed the next bottleneck: the seeded `SearchDocument` rows had hash readback
hits, but `krn source search` still reported `searchResults: 0` for the natural
language query terms.

## Source-to-Decision

source:
`docs/reviews/controlled-dogfood/2026-06-29-v342-product-facing-knowledge-search-usefulness-closure/REPORT.md`

mechanism:
V342 showed exact persisted markers and graph claims were useful, while
heartbeat, consensus, and pattern queries were mostly coverage misses.

KRN implication:
Before changing ranking or adding product surfaces, KRN should seed a tiny
bounded set of recent knowledge artifacts through existing ingest/readback paths
and rerun the same weak queries.

decision:
Persist four compact artifacts for heartbeat/staleness, consensus/dissent,
source-to-decision, and search-usefulness coverage.

consumer:
V344 Source Search Document Retrieval Alignment.

falsifier:
After persistence, weak V342 queries still fail to retrieve the seeded governed
claims or continue returning only generic guardrails.

doesNotProve:
Product search quality, broad corpus coverage, SearchDocument natural-language
retrieval quality, embeddings, graph retrieval, crawler readiness, UI/API/MCP
readiness, or Memory Core mutation.

## Persisted Coverage Artifacts

| Artifact | SourceArtifact | SearchDocument | SourceClaim |
| --- | --- | --- | --- |
| heartbeat/staleness | `6777ff3c-350d-44a7-95bc-b0f0b563a1b8` | `e0cbc2e9-fdef-41e9-aacc-2262c64ae152` | `04b097d5-7338-4b78-be55-e85d0cbb7aff` |
| consensus/dissent | `538ab636-537e-4edb-8006-e4f5dd94e3e3` | `3eb44f5a-bc41-4630-ab82-cfbf552c270d` | `55e3d7ea-b97d-4495-bec2-1154a8a10b09` |
| source-to-decision | `2e94fe41-c087-4516-a1f5-35b1f98f9c60` | `64d78b2b-bb04-4039-a4ad-c72ecf2f6d47` | `125366b1-8bd9-4092-92d8-1aa1d2ed46ae` |
| search usefulness | `c4cf4523-0e7b-404f-b08b-0d6bc34936ec` | `e4028fde-2a3b-418c-a429-62cd2c697079` | `5b1e25a1-c01e-44d8-849b-1e1ec233a835` |

Each artifact had `lexicalReadback: hit` during artifact preview persistence.
Memory mutation: none.

## Query Rerun Delta

| Query | V342 result | V343 result | Verdict |
| --- | --- | --- | --- |
| `memory staleness heartbeat candidate MemoryRecord` | missing specific heartbeat coverage | `04b097d5...` included as top SourceClaim | improved |
| `consensus candidate dissent decision options` | missing V339 consensus coverage | `55e3d7ea...` included | improved |
| `source-to-decision retention gate consumer falsifier` | generic source claims; pattern catalog helped separately | `125366b1...` included | improved |
| `product-facing knowledge search usefulness coverage seed` | not applicable | `5b1e25a1...` included | established |

Observed limitation:

```txt
searchResults: 0
```

for the natural-language rerun queries, despite SearchDocument rows existing and
hash readback passing at artifact persistence time.

## Persisted Plan

| Item | ID |
| --- | --- |
| executionRun | `7f22c16e-bddf-4b1b-8e49-b2f68dc0f76b` |
| taskContract | `a1704dad-cb73-41b9-a76d-9139fa49b62b` |
| contextAssembly | `da81ab34-2b62-4cbe-bbb0-85bcd1d75385` |
| evidenceBundle | `053c223b-9bdc-480d-b746-55af15f6a2d9` |
| reviewAssessment | `fa0abf4a-d636-4971-a302-9dcbf4ab0a05` |
| feedbackDelta | `241af2b2-ee73-487e-afd1-310899e2ec18` |
| observationGroup | `0a4c03e0-ed93-4093-80b7-7e211795e2c9` |
| reflectionRecord | `4989c29a-0b31-4881-8a97-d64c25fbf5c9` |
| MemoryRecord created | `no` |

The V343 plan selected the newly seeded heartbeat, consensus,
source-to-decision, and search-usefulness SourceClaims, which confirms the seed
is usable by DB-backed activation.

## Command Evidence

| Command | Result | What it proves | What it does not prove |
| --- | --- | --- | --- |
| `krn source artifact preview --persist` x4 | passed | artifacts, chunks, SearchDocuments, and SourceClaims persisted/read back | source truth, search quality, embeddings, graph retrieval |
| `krn source search` reruns x4 | passed | weak V342 queries now retrieve specific SourceClaims | SearchDocument natural-language retrieval quality |
| `krn plan --persist` | passed | DB-backed activation can select the seeded SourceClaims | selected context sufficiency |

## What This Proves

- Bounded corpus coverage can be improved with existing ingest/readback paths.
- SourceClaim search/readback now covers the weak heartbeat, consensus, pattern,
  and usefulness queries.
- No product surface or autonomous runtime was needed.

## What This Does Not Prove

- Product search quality.
- Broad corpus coverage.
- SearchDocument natural-language retrieval quality.
- Ranking quality.
- Embeddings or graph retrieval.
- UI/API/MCP readiness.
- Crawler/worker readiness.
- Memory Core mutation quality.

## Next Recommended Task

V344 Source Search Document Retrieval Alignment.

Inspect why natural-language `krn source search` reruns return the seeded
SourceClaims but `searchResults: 0` for the same artifact query terms, even
though artifact preview produced SearchDocument rows with hash readback hits.
Repair only if source inspection shows a bounded owner-file issue. Do not build
UI/API/MCP, crawler, ranking rewrite, schema, embeddings, graph runtime, or
worker daemon.
