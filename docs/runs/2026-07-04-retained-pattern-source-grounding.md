# Retained Pattern Source Grounding

Date: 2026-07-04
Beads: `mise-en-palace-fhku`

## Scope

Ground the retained brain patterns that influence planning with governed source
readback. This uses existing CLI paths only: source artifact preview,
SourceClaim adoption, SourceDecisionEdge link, and DB-backed brain/source search.

Target patterns:

- `krn-brain-layer-model-boundary`
- `source-to-decision-retention-gate`
- `ts-boundary-unknown-first-result-state`

Non-goals: no ranking rewrite, no new DB schema, no dashboard/API/MCP, no worker
executor, no broad benchmark.

## Setup

```sh
rtk docker compose up -d krn-postgres
rtk pnpm db:ready
```

Readiness result: Postgres reachable, migrations `16/16`, pgvector available,
brain store ready.

## First Attempt

`krn source claim add --persist` created accepted SourceClaims and
SourceDecisionEdges, but source-search could not see them in the done gate.

Evidence:

- `source claim add` wrote claims under project slug `mise-en-palace`.
- `source search` with current repo path resolved project slug
  `mise-en-palace-dd8e3b5b`.

Decision: do not count those rows for `fhku`. The follow-up
`mise-en-palace-1ex4` tracks project-resolution alignment for source claim add
vs source search.

## Accepted Path

Used `krn source artifact preview --persist --claim ... --json` because that
path passes `repoPathHint` and writes into the same connected project that
source/brain search reads.

Persisted connected-project rows:

| Pattern | SourceClaim | SearchDocument | SourceDecisionEdge |
| --- | --- | --- | --- |
| `krn-brain-layer-model-boundary` | `1ca09411-31e7-4d25-ba48-76970b1455c6` | `17717d02-4a5d-46cc-85a5-120e035f8f4c` | `b405e5e9-b12b-4da5-9d71-bd4d462c7dc2` |
| `source-to-decision-retention-gate` | `a6091d25-aa66-47c6-9b79-b21b0ced76cb` | `a6d725ae-a36d-48f9-a624-6cc64831dcef` | `ddecd298-5e7b-4e0f-8bb4-7149c96c0d77` |
| `ts-boundary-unknown-first-result-state` | `3338f14b-3b14-4c80-ab6a-ab3dfb8bdc34` | `d01ff835-cd46-48bd-b926-47037f1a76a3` | `34389761-9c28-4754-8670-19d8c5d8b4ad` |

Each SourceClaim was adopted with `krn source decision adopt --persist`; each
SourceDecisionEdge was created with `krn source decision link --persist` and
read back as `sourceDecisionEdgeReadback: hit`.

## Done Gate

Re-ran the same four-query `g1cg` spot-check after grounding.

| Query | Selected knowledge | Source answer usefulness | SourceClaims | SearchDocuments | SourceDecision support | Missing evidence |
| --- | ---: | --- | ---: | ---: | ---: | --- |
| `workers are not codex exec candidate maintenance contracts plnv` | 1 target-specific ready packet: `pattern:krn-brain-layer-model-boundary` | `partly_useful_missing_document` | 3 | 0 | 3 | included SearchDocument evidence missing; artifact-linked SearchDocuments visible but not lexically included |
| `naming standard no vanity rename helper extraction rule` | 1 target-specific ready packet: `pattern:krn-brain-layer-model-boundary` | `partly_useful_missing_document` | 3 | 0 | 3 | included SearchDocument evidence missing; artifact-linked SearchDocuments visible but not lexically included |
| `source-to-decision retention gate consumer falsifier` | 1 target-specific ready packet: `pattern:source-to-decision-retention-gate` | `useful` | 3 | 1 | 3 | none |
| `typescript unknown first result state JSON parse boundary` | 1 target-specific ready packet: `pattern:ts-boundary-unknown-first-result-state` | `partly_useful_missing_document` | 3 | 0 | 3 | included SearchDocument evidence missing; artifact-linked SearchDocuments visible but not lexically included |

Inline excerpt:

```json
{
  "workers": {
    "selectedKnowledge": "pattern:krn-brain-layer-model-boundary",
    "answerUsefulness": "partly_useful_missing_document",
    "supportingClaims": 3,
    "supportingDocuments": 0,
    "sourceDecisionSupport": 3
  },
  "sourceToDecision": {
    "selectedKnowledge": "pattern:source-to-decision-retention-gate",
    "answerUsefulness": "useful",
    "supportingClaims": 3,
    "supportingDocuments": 1,
    "sourceDecisionSupport": 3
  },
  "typescript": {
    "selectedKnowledge": "pattern:ts-boundary-unknown-first-result-state",
    "answerUsefulness": "partly_useful_missing_document",
    "supportingClaims": 3,
    "supportingDocuments": 0,
    "sourceDecisionSupport": 3
  }
}
```

## Decision

`fhku` is accepted: the target retained patterns now have governed SourceClaim
and SourceDecisionEdge support visible through current brain/source search.

Do not rewrite ranking next. The remaining gap is narrower:

- source claim add and source search project resolution disagree
  (`mise-en-palace-1ex4`);
- artifact-linked SearchDocuments can exist but not be included by lexical
  retrieval for broad combined queries.

## Proof Boundary

Proves:

- the existing source artifact preview path can persist retained pattern files
  into the connected repo project as SearchDocument and SourceClaim rows;
- accepted SourceClaims and SourceDecisionEdges can be read back by current
  brain/source search for the sampled queries;
- the four-query spot-check improved from `0` SourceClaims / `0`
  SourceDecision support to `3` SourceClaims / `3` SourceDecision support in
  every sampled source-search answer package.

Does not prove:

- source truth;
- ranking quality across broader corpora;
- that all retained patterns are grounded;
- that SearchDocuments are always lexically included;
- product readiness;
- worker runtime, scheduling, leases, retries, or Memory Core write
  enforcement.
